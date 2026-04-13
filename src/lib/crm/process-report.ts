// @ts-nocheck
import { createServiceClient } from '@/lib/supabase/server';
import { buildExtractionPrompt, parseExtractionResponse } from './extraction-prompt';
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

    // Fetch company context
    const { data: competitors } = await supabase
      .from('competitors' as any).select('name').eq('company_id', report.company_id);
    const { data: abbreviations } = await supabase
      .from('abbreviations' as any).select('short, "full"').eq('company_id', report.company_id);

    const prompt = buildExtractionPrompt(
      report.content_text,
      (competitors ?? []).map(c => c.name),
      (abbreviations ?? []).map(a => ({ short: a.short, full: a.full })),
    );

    // Call OpenAI API (GPT-4o)
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY!}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 2000,
        temperature: 0.1,
        messages: [
          { role: 'system', content: 'Vous etes un expert en analyse de comptes rendus de visite commerciale. Repondez uniquement en JSON valide, sans texte avant ou apres.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!openaiRes.ok) {
      throw new Error(`OpenAI API error: ${openaiRes.status} ${await openaiRes.text()}`);
    }

    const openaiData = await openaiRes.json();
    const responseText = openaiData.choices?.[0]?.message?.content ?? '';
    const extracted = parseExtractionResponse(responseText);

    if (!extracted) {
      throw new Error('Failed to parse OpenAI extraction response');
    }

    const tokensUsed = (openaiData.usage?.total_tokens ?? 0);
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
        region: '', // resolved later if commercial is matched
        treated: false,
        source_report_id: report.id,
      });
      signalsCreated++;
    }

    // Insert deals
    for (const deal of extracted.deals) {
      const table = deal.view === 'commercial' ? 'deals_commerciaux' : 'deals_marketing';
      if (table === 'deals_marketing') {
        await supabase.from('deals_marketing' as any).insert({
          company_id: report.company_id,
          motif_principal: deal.motif,
          resultat: deal.resultat,
          concurrent_nom: deal.concurrent_nom ?? null,
          commercial_name: report.commercial_name ?? '',
          client_name: report.client_name ?? '',
          region: '',
          verbatim: deal.verbatim,
          date: report.visit_date ?? new Date().toISOString().split('T')[0],
          source_report_id: report.id,
        });
      } else {
        await supabase.from('deals_commerciaux' as any).insert({
          company_id: report.company_id,
          motif: deal.motif,
          resultat: deal.resultat,
          concurrent_nom: deal.concurrent_nom ?? null,
          commercial_name: report.commercial_name ?? '',
          client_name: report.client_name ?? '',
          region: '',
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
        client_name: report.client_name ?? '',
        region: '',
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
        client_name: report.client_name ?? '',
        objectif_type: obj.type,
        resultat: obj.resultat,
        cause_echec: obj.cause_echec ?? null,
        facteur_reussite: obj.facteur_reussite ?? null,
        date: report.visit_date ?? new Date().toISOString().split('T')[0],
        region: '',
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

    // Log processing result
    await supabase.from('processing_results' as any).insert({
      raw_report_id: report.id,
      company_id: report.company_id,
      extracted_json: extracted,
      signals_created: signalsCreated,
      model_used: 'gpt-4o',
      tokens_used: tokensUsed,
      processing_time_ms: Date.now() - startTime,
    });

    // Mark as done
    await supabase.from('raw_visit_reports' as any)
      .update({ processing_status: 'done', processed_at: new Date().toISOString() })
      .eq('id', report.id);

    return { success: true };
  } catch (err: any) {
    await supabase.from('raw_visit_reports' as any)
      .update({ processing_status: 'error', processing_error: err.message })
      .eq('id', report.id);
    return { success: false, error: err.message };
  }
}
