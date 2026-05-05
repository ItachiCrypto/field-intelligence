// @ts-nocheck
import { createServiceClient } from '@/lib/supabase/server';
import { buildExtractionPrompt, parseExtractionResponse } from './extraction-prompt';
import { buildCanonicalResolver, canonicalizeExtraction } from './canonicalize';
import { computeCRQualityScore, buildQualityReasonsPayload } from './quality-score';
import { computeCostUSD } from './pricing';
import type { RawVisitReport, ExtractedCRData } from './types';

export async function processReport(report: RawVisitReport): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const startTime = Date.now();

  try {
    // Mark as processing
    await supabase.from('raw_visit_reports' as any)
      .update({ processing_status: 'processing', processing_attempts: report.processing_attempts + 1 })
      .eq('id', report.id);

    if (!report.content_text || report.content_text.trim().length < 10) {
      await supabase.from('raw_visit_reports' as any)
        .update({ processing_status: 'skipped', processed_at: new Date().toISOString() })
        .eq('id', report.id);
      return { success: true };
    }

    // Cap the CR text we send to the LLM. 32k chars is well over typical
    // French visit-report length; anything longer is almost certainly a
    // pathological input (or an attempt to force an expensive prompt).
    const MAX_CR_BYTES = 32_000;
    const truncatedContent =
      report.content_text.length > MAX_CR_BYTES
        ? report.content_text.slice(0, MAX_CR_BYTES)
        : report.content_text;

    // Fetch company context
    const { data: competitors } = await supabase
      .from('competitors' as any).select('name').eq('company_id', report.company_id);
    const { data: abbreviations } = await supabase
      .from('abbreviations' as any).select('short, "full"').eq('company_id', report.company_id);
    // business_context is the free-text description the admin fills in at signup
    // (what the company does, sector, KPIs...). Inject it so the LLM has the
    // domain background while reading the CR.
    const { data: companyRow } = await supabase
      .from('companies' as any).select('business_context').eq('id', report.company_id).maybeSingle() as any;

    // Lookup the linked Account by client_name to surface its city/region/sector
    // to the prompt. Salesforce sync fills accounts.region from BillingState ??
    // BillingCity, so even if the CR text doesn't repeat the location, the AI
    // gets it from the CRM-linked account. Best-effort: missing match is fine.
    let accountCtx: { name?: string | null; city?: string | null; region?: string | null; sector?: string | null } | null = null;
    if (report.client_name?.trim()) {
      const { data: acc } = await supabase
        .from('accounts' as any)
        .select('name, region, sector')
        .eq('company_id', report.company_id)
        .ilike('name', report.client_name.trim())
        .maybeSingle() as any;
      if (acc) {
        accountCtx = {
          name: acc.name ?? null,
          city: null,
          region: acc.region ?? null,
          sector: acc.sector ?? null,
        };
      }
    }

    const prompt = buildExtractionPrompt(
      truncatedContent,
      (competitors ?? []).map(c => c.name),
      (abbreviations ?? []).map(a => ({ short: a.short, full: a.full })),
      companyRow?.business_context ?? null,
      accountCtx,
    );

    // Call AI API — try Anthropic first, fall back to OpenAI
    let responseText = '';
    let tokensUsedRaw = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let modelUsed = '';

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (anthropicKey && anthropicKey !== 'sk-xxx') {
      // Use Anthropic Claude. Sonnet 4.5 is the right cost/quality tier for
      // this French structured-extraction task — meaningfully better than the
      // older Sonnet 4 (May 2024) on instruction following and canonicalisation,
      // similar pricing (~3$/MTok input). Override via ANTHROPIC_MODEL env var.
      modelUsed = process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-5-20250929';
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: modelUsed,
          // Voir commentaire du path OpenAI : 4k tokens pour absorber un JSON
          // dense (plusieurs signals + deals + prix_signals + needs).
          max_tokens: 4000,
          temperature: 0.1,
          system: 'Vous etes un expert en analyse de comptes rendus de visite commerciale. Repondez uniquement en JSON valide, sans texte avant ou apres.',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!anthropicRes.ok) {
        // Do not include the provider's response body — it can contain
        // echoes of our key or quota detail. Status is enough for triage.
        throw new Error(`Anthropic API error: ${anthropicRes.status}`);
      }

      const anthropicData = await anthropicRes.json();
      responseText = anthropicData.content?.[0]?.text ?? '';
      inputTokens = anthropicData.usage?.input_tokens ?? 0;
      outputTokens = anthropicData.usage?.output_tokens ?? 0;
      tokensUsedRaw = inputTokens + outputTokens;
    } else if (openaiKey && !openaiKey.includes('xxx')) {
      // OpenAI path. gpt-4.1-mini est le bon tier cout/qualite pour cette
      // tache structuree FR (~$0.40/$1.60 par MTok, soit ~10x moins cher que
      // gpt-4o et bien meilleur que gpt-4o-mini sur l'instruction-following
      // requis par la canonicalisation et la capture des prix). Override via
      // OPENAI_MODEL (ex. "gpt-5-mini" ou "gpt-4.1") quand disponible.
      modelUsed = process.env.OPENAI_MODEL?.trim() || 'gpt-4.1-mini';
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: modelUsed,
          // Le prompt grossit (canonicalisation + table villes + bloc account)
          // et l'output JSON peut etre dense pour les CRs riches : 4k tokens
          // donne de la marge pour ne pas tronquer.
          max_tokens: 4000,
          temperature: 0.1,
          // Force OpenAI a renvoyer un JSON syntaxiquement valide. Notre
          // parser tolere du texte autour mais autant supprimer la classe
          // d'erreur "le modele a oublie une accolade".
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'Vous etes un expert en analyse de comptes rendus de visite commerciale. Repondez uniquement en JSON valide, sans texte avant ou apres.' },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (!openaiRes.ok) {
        throw new Error(`OpenAI API error: ${openaiRes.status}`);
      }

      const openaiData = await openaiRes.json();
      responseText = openaiData.choices?.[0]?.message?.content ?? '';
      inputTokens = openaiData.usage?.prompt_tokens ?? 0;
      outputTokens = openaiData.usage?.completion_tokens ?? 0;
      tokensUsedRaw = openaiData.usage?.total_tokens ?? inputTokens + outputTokens;
    } else {
      throw new Error('No AI API key configured (ANTHROPIC_API_KEY or OPENAI_API_KEY)');
    }

    const extracted = parseExtractionResponse(responseText);

    if (!extracted) {
      throw new Error('Failed to parse OpenAI extraction response');
    }

    // Server-side canonicalization (filet de securite). Le prompt demande deja
    // a l'IA d'utiliser des noms canoniques mais on s'assure que "OneTouch",
    // "Lifescan" et "LS" se resolvent au meme concurrent meme si l'IA echoue
    // a appliquer la regle. Sources : abbreviations table + alias-groups
    // detectes dans business_context + competitors deja en base.
    const canonResolver = buildCanonicalResolver({
      abbreviations: (abbreviations ?? []).map((a) => ({ short: a.short, full: a.full })),
      businessContext: companyRow?.business_context ?? null,
      knownCompetitors: (competitors ?? []).map((c) => c.name),
    });
    canonicalizeExtraction(extracted, canonResolver);

    const tokensUsed = tokensUsedRaw;
    let signalsCreated = 0;

    // Insert signals
    for (const sig of extracted.signals) {
      await supabase.from('signals' as any).insert({
        company_id: report.company_id,
        type: sig.type,
        severity: sig.severity,
        title: sig.title,
        content: sig.content,
        competitor_name: sig.competitor_name ?? null,
        price_delta: sig.price_delta ?? null,
        region: extracted.region ?? '',
        treated: false,
        source_report_id: report.id,
      });
      signalsCreated++;
    }

    // ── Auto-create competitors from signals (check before insert) ──────────
    // Gather unique competitor names from this report
    const competitorNames = new Set<string>();
    for (const sig of extracted.signals) {
      if (sig.competitor_name) competitorNames.add(sig.competitor_name);
    }
    for (const px of extracted.prix_signals) {
      if (px.concurrent_nom) competitorNames.add(px.concurrent_nom);
    }
    for (const compName of competitorNames) {
      // Check if already exists before inserting (avoids needing UNIQUE constraint)
      const { data: existingComp } = await supabase
        .from('competitors' as any)
        .select('id')
        .eq('company_id', report.company_id)
        .eq('name', compName)
        .maybeSingle() as any;
      if (!existingComp) {
        // Determine type and risk from signals mentioning this competitor
        const relatedSig = extracted.signals.find(s => s.competitor_name === compName);
        await supabase.from('competitors' as any).insert({
          company_id: report.company_id,
          name: compName,
          mention_type: relatedSig?.type ?? 'concurrence',
          risk: relatedSig?.severity === 'rouge' ? 'rouge' : relatedSig?.severity === 'orange' ? 'orange' : 'jaune',
        });
      }
    }

    // Résoudre client_name : priorité report.client_name, puis extraction IA
    const effectiveClientName = report.client_name?.trim() || (extracted as any).client_name?.trim() || null;

    // Si client_name était null dans raw_visit_reports, le mettre à jour
    // pour que les futurs enrichissements en bénéficient
    if (effectiveClientName && !report.client_name?.trim()) {
      await supabase.from('raw_visit_reports' as any)
        .update({ client_name: effectiveClientName })
        .eq('id', report.id);
    }

    // Insert deals
    const motifToCommercial: Record<string, string> = {
      prix: 'prix_non_competitif',
      produit: 'besoin_mal_identifie',
      offre: 'concurrent_mieux_positionne',
      timing: 'timing_rate',
      concurrent: 'concurrent_mieux_positionne',
      relation: 'relation_insuffisante',
      budget: 'prix_non_competitif',
      autre: 'suivi_insuffisant',
    };
    for (const deal of extracted.deals) {
      const table = deal.view === 'commercial' ? 'deals_commerciaux' : 'deals_marketing';
      if (table === 'deals_marketing') {
        await supabase.from('deals_marketing' as any).insert({
          company_id: report.company_id,
          motif_principal: deal.motif,
          resultat: deal.resultat,
          concurrent_nom: deal.concurrent_nom ?? null,
          commercial_name: report.commercial_name ?? '',
          client_name: effectiveClientName ?? '',
          region: extracted.region ?? '',
          verbatim: deal.verbatim,
          date: report.visit_date ?? new Date().toISOString().split('T')[0],
          source_report_id: report.id,
        });
      } else {
        const mappedMotif = motifToCommercial[deal.motif] || 'suivi_insuffisant';
        await supabase.from('deals_commerciaux' as any).insert({
          company_id: report.company_id,
          motif: mappedMotif,
          resultat: deal.resultat,
          concurrent_nom: deal.concurrent_nom ?? null,
          commercial_name: report.commercial_name ?? '',
          client_name: effectiveClientName ?? '',
          region: extracted.region ?? '',
          verbatim: deal.verbatim,
          date: report.visit_date ?? new Date().toISOString().split('T')[0],
          source_report_id: report.id,
        });
      }
      signalsCreated++;
    }

    // Insert prix signals
    for (const px of extracted.prix_signals) {
      await supabase.from('prix_signals' as any).insert({
        company_id: report.company_id,
        concurrent_nom: px.concurrent_nom,
        ecart_pct: px.ecart_pct,
        ecart_type: px.ecart_type,
        statut_deal: 'en_cours',
        commercial_name: report.commercial_name ?? '',
        client_name: effectiveClientName ?? '',
        region: extracted.region ?? '',
        verbatim: px.verbatim,
        date: report.visit_date ?? new Date().toISOString().split('T')[0],
        source_report_id: report.id,
      });
      signalsCreated++;
    }

    // Insert objectifs
    for (const obj of extracted.objectifs) {
      await supabase.from('cr_objectifs' as any).insert({
        company_id: report.company_id,
        commercial_name: report.commercial_name ?? '',
        client_name: effectiveClientName ?? '',
        objectif_type: obj.type,
        resultat: obj.resultat,
        cause_echec: obj.cause_echec ?? null,
        facteur_reussite: obj.facteur_reussite ?? null,
        date: report.visit_date ?? new Date().toISOString().split('T')[0],
        region: extracted.region ?? '',
        source_report_id: report.id,
      });
      signalsCreated++;
    }

    // Insert needs
    for (const need of extracted.needs) {
      await supabase.from('needs' as any).insert({
        company_id: report.company_id,
        label: need.label,
        mentions: 1,
        evolution: 0,
        trend: need.trend,
        source_report_id: report.id,
      });
    }

    // ── Auto-upsert commercial ──────────────────────────────────────────
    // N'incrémenter cr_total QUE sur la première tentative (processing_attempts === 0)
    // pour éviter de doubler le compteur si le report est retraité.
    if (report.commercial_name?.trim()) {
      const commName = report.commercial_name.trim();
      // Create if not exists
      await supabase.from('commercials' as any).upsert(
        {
          company_id: report.company_id,
          name: commName,
          region: extracted.region ?? '',
          quality_score: 50,
          quality_trend: 0,
          cr_total: 0,
          cr_week: 0,
        },
        { onConflict: 'company_id,name', ignoreDuplicates: true },
      );
      // Incrément uniquement sur la 1ère tentative
      if (report.processing_attempts === 0) {
        await supabase.rpc('increment_commercial_cr' as any, {
          p_company_id: report.company_id,
          p_name: commName,
        });
      }
    }

    // ── Auto-upsert account (client) ────────────────────────────────────
    if (effectiveClientName) {
      await supabase.from('accounts' as any).upsert(
        {
          company_id: report.company_id,
          name: effectiveClientName,
          sector: (extracted as any).secteur ?? 'Autre',
          region: extracted.region ?? '',
          last_rdv: report.visit_date ?? null,
          risk_score: 0,
          risk_trend: 0,
        },
        { onConflict: 'company_id,name', ignoreDuplicates: false },
      );
    }

    // ── Auto-create alerts for rouge/orange signals ─────────────────────
    for (const sig of extracted.signals) {
      if (sig.severity === 'rouge' || sig.severity === 'orange') {
        // Find the signal we just inserted to get its ID
        const { data: insertedSig } = await supabase
          .from('signals' as any)
          .select('id')
          .eq('company_id', report.company_id)
          .eq('source_report_id', report.id)
          .eq('title', sig.title)
          .maybeSingle() as any;

        if (insertedSig?.id) {
          await supabase.from('alerts' as any).insert({
            company_id: report.company_id,
            signal_id: insertedSig.id,
            severity: sig.severity,
            status: 'nouveau',
            source_report_id: report.id,
            content: sig.content ?? null,
            client_name: effectiveClientName ?? null,
          });
        }
      }
    }

    // Log processing result + cost.
    // cost_usd est calcule serveur a partir du modele utilise (les tarifs
    // input/output different par MTok). Valeur typique : ~$0.003/CR sur
    // gpt-4.1-mini, ~$0.020/CR sur Claude Sonnet 4.5.
    const costUsd = computeCostUSD(modelUsed, inputTokens, outputTokens);
    await supabase.from('processing_results' as any).insert({
      raw_report_id: report.id,
      company_id: report.company_id,
      extracted_json: extracted,
      signals_created: signalsCreated,
      model_used: modelUsed,
      tokens_used: tokensUsed,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: costUsd,
      processing_time_ms: Date.now() - startTime,
    });

    // ── CR quality score ─────────────────────────────────────────────────
    // Score deterministe 0-100 calcule a partir de la richesse de l'extraction.
    // Stocke sur raw_visit_reports.quality_score + quality_reasons (jsonb)
    // pour qu'on puisse afficher au commercial "voici ce qui te manque pour 80".
    const qualityResult = computeCRQualityScore({
      extracted,
      crText: report.content_text ?? '',
      hasClientName: !!effectiveClientName,
      hasCommercialName: !!report.commercial_name?.trim(),
      hasVisitDate: !!report.visit_date,
    });
    const qualityPayload = buildQualityReasonsPayload(qualityResult);

    // Mark as done + persist quality score
    await supabase.from('raw_visit_reports' as any)
      .update({
        processing_status: 'done',
        processed_at: new Date().toISOString(),
        quality_score: qualityResult.score,
        quality_reasons: qualityPayload,
      })
      .eq('id', report.id);

    // Refresh commercial moyenne quality_score (= avg de tous ses CRs scores).
    if (report.commercial_name?.trim()) {
      await supabase.rpc('refresh_commercial_quality_score' as any, {
        p_company_id: report.company_id,
        p_commercial_name: report.commercial_name.trim(),
      });
    }

    return { success: true };
  } catch (err: any) {
    await supabase.from('raw_visit_reports' as any)
      .update({ processing_status: 'error', processing_error: err.message })
      .eq('id', report.id);
    return { success: false, error: err.message };
  }
}
