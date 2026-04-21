// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { processReport } from '@/lib/crm/process-report';
import type { RawVisitReport } from '@/lib/crm/types';
import { verifyCronBearer, verifyCronHeader } from '@/lib/auth/cron';

// Vercel max duration (Pro = 300s, Hobby = 60s)
export const maxDuration = 300;

const CONCURRENCY = 5; // 5 CRs en parallèle

async function runWithConcurrency<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  concurrency: number,
) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item !== undefined) await fn(item);
    }
  });
  await Promise.all(workers);
}

export async function POST(request: NextRequest) {
  try {
    const isCron = verifyCronHeader(request.headers.get('x-cron-secret'));

    let companyFilter: string | null = null;

    if (isCron) {
      // Cron: traite tous les pending de toutes les companies
    } else {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const { data: profile } = await supabase
        .from('profiles' as any).select('company_id, role').eq('id', user.id).single() as any;

      if (!profile || profile.role !== 'admin')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      companyFilter = profile.company_id;
    }

    const serviceClient = createServiceClient();

    // Optionnel : re-queuer les erreurs
    const body = await request.json().catch(() => ({}));
    const retryErrors = body?.retry_errors === true;

    if (retryErrors) {
      const q = serviceClient
        .from('raw_visit_reports' as any)
        .update({ processing_status: 'pending' })
        .eq('processing_status', 'error')
        .lt('processing_attempts', 3);
      if (companyFilter) q.eq('company_id', companyFilter);
      await q;
    }

    // Récupérer TOUS les pending sans limite — filtres AVANT order/limit
    let q = serviceClient
      .from('raw_visit_reports' as any)
      .select('*')
      .eq('processing_status', 'pending')
      .lt('processing_attempts', 3);
    if (companyFilter) q = q.eq('company_id', companyFilter);
    const { data: pendingReports, error: fetchError } = await q
      .order('synced_at', { ascending: true })
      .limit(500) as { data: any[] | null; error: any };

    if (fetchError) {
      console.error('[process] fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch pending reports', detail: fetchError?.message ?? JSON.stringify(fetchError) }, { status: 500 });
    }

    if (!pendingReports || pendingReports.length === 0) {
      return NextResponse.json({ processed: 0, errors: 0, error_details: [] });
    }

    let processedCount = 0;
    const errorDetails: { id: string; subject: string; error: string }[] = [];

    // Traitement concurrent (5 à la fois)
    await runWithConcurrency(
      pendingReports as RawVisitReport[],
      async (report) => {
        try {
          const result = await processReport(report);
          if (result.success) {
            processedCount++;
          } else {
            const msg = result.error ?? 'unknown';
            console.error(`[process] report ${report.id}:`, msg);
            errorDetails.push({ id: report.id, subject: (report as any).subject ?? '', error: msg });
          }
        } catch (e: any) {
          const msg = e?.message ?? String(e);
          console.error(`[process] report ${report.id}:`, msg);
          errorDetails.push({ id: report.id, subject: (report as any).subject ?? '', error: msg });
        }
      },
      CONCURRENCY,
    );

    return NextResponse.json({
      processed: processedCount,
      errors: errorDetails.length,
      total: pendingReports.length,
      error_details: errorDetails,
    });

  } catch (error: any) {
    const msg = error?.message ?? String(error);
    console.error('[process] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET handler for Vercel Cron
export async function GET(request: NextRequest) {
  if (!verifyCronBearer(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceClient = createServiceClient();
  const { data: pendingReports } = await serviceClient
    .from('raw_visit_reports')
    .select('*')
    .eq('processing_status', 'pending')
    .lt('processing_attempts', 3)
    .limit(200);

  if (!pendingReports || pendingReports.length === 0)
    return NextResponse.json({ processed: 0, errors: 0 });

  let processedCount = 0;
  let errorCount = 0;

  await runWithConcurrency(pendingReports, async (report) => {
    try {
      const result = await processReport(report);
      if (result.success) processedCount++;
      else errorCount++;
    } catch { errorCount++; }
  }, CONCURRENCY);

  return NextResponse.json({ processed: processedCount, errors: errorCount });
}
