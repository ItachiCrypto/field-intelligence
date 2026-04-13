// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { processReport } from '@/lib/crm/process-report';
import type { RawVisitReport } from '@/lib/crm/types';

export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get('x-cron-secret');
    const isCron =
      cronSecret && cronSecret === process.env.CRON_SECRET;

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

    // Fetch pending reports that haven't exceeded retry limit
    const { data: pendingReports, error: fetchError } = await serviceClient
      .from('raw_visit_reports' as any)
      .select("*")
      .eq('processing_status', 'pending')
      .lt('processing_attempts', 3)
      .limit(10) as { data: any[] | null; error: any };

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
    let errorCount = 0;

    for (const report of pendingReports) {
      try {
        const result = await processReport(report as RawVisitReport);
        if (result.success) {
          processedCount++;
        } else {
          console.error(`Failed to process report ${report.id}:`, result.error);
          errorCount++;
        }
      } catch (processError) {
        console.error(
          `Failed to process report ${report.id}:`,
          processError
        );
        errorCount++;
      }
    }

    return NextResponse.json({
      processed: processedCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error('Process error:', error);
    return NextResponse.json(
      {
        error: 'Processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET handler for Vercel Cron
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
