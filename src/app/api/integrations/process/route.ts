// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { processReport } from '@/lib/crm/process-report';
import type { RawVisitReport } from '@/lib/crm/types';
import { verifyCronBearer, verifyCronHeader } from '@/lib/auth/cron';

export async function POST(request: NextRequest) {
  try {
    const isCron = verifyCronHeader(request.headers.get('x-cron-secret'));

    if (!isCron) {
      // Verify auth + admin role
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from('profiles' as any)
        .select('role')
        .eq('id', user.id)
        .single() as any;

      if (!profile || (profile as any).role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const serviceClient = createServiceClient();

    // Parse optional body: { retry_errors: true } to re-queue failed reports
    const body = await request.json().catch(() => ({}));
    const retryErrors = body?.retry_errors === true;

    if (retryErrors) {
      await serviceClient
        .from('raw_visit_reports' as any)
        .update({ processing_status: 'pending' })
        .eq('processing_status', 'error')
        .lt('processing_attempts', 3);
    }

    // Fetch pending reports that haven't exceeded retry limit
    const { data: pendingReports, error: fetchError } = await serviceClient
      .from('raw_visit_reports' as any)
      .select("*")
      .eq('processing_status', 'pending')
      .lt('processing_attempts', 3)
      .limit(50) as { data: any[] | null; error: any };

    if (fetchError) {
      console.error('Failed to fetch pending reports:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch pending reports' },
        { status: 500 }
      );
    }

    if (!pendingReports || pendingReports.length === 0) {
      return NextResponse.json({ processed: 0, errors: 0 });
    }

    let processedCount = 0;
    const errorDetails: { id: string; subject: string; error: string }[] = [];

    for (const report of pendingReports) {
      try {
        const result = await processReport(report as RawVisitReport);
        if (result.success) {
          processedCount++;
        } else {
          console.error(`Failed to process report ${report.id}:`, result.error);
          errorDetails.push({ id: report.id, subject: report.subject ?? '', error: result.error ?? 'unknown' });
        }
      } catch (processError: any) {
        const msg = processError?.message ?? String(processError);
        console.error(`Failed to process report ${report.id}:`, msg);
        errorDetails.push({ id: report.id, subject: report.subject ?? '', error: msg });
      }
    }

    return NextResponse.json({
      processed: processedCount,
      errors: errorDetails.length,
      error_details: errorDetails,
    });
  } catch (error) {
    // Log full detail server-side; return a generic message to the client to
    // avoid leaking DB error text, API-provider error bodies, stack traces.
    console.error('[process] error:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
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
    .limit(10);

  if (!pendingReports || pendingReports.length === 0) {
    return NextResponse.json({ processed: 0, errors: 0 });
  }

  let processedCount = 0;
  let errorCount = 0;

  for (const report of pendingReports) {
    try {
      const result = await processReport(report);
      if (result.success) {
        processedCount++;
      } else {
        errorCount++;
      }
    } catch {
      errorCount++;
    }
  }

  return NextResponse.json({ processed: processedCount, errors: errorCount });
}
