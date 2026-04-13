// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    // Get profile to retrieve company_id
    const { data: profile } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', user.id)
      .single() as any;

    if (!profile?.company_id) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    const serviceClient = createServiceClient();

    // Check for existing Salesforce connection
    const { data: connection, error: connError } = await serviceClient
      .from('crm_connections' as any)
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('provider', 'salesforce')
      .single() as any;

    if (connError || !connection || connection.status !== 'connected') {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    // Count raw visit reports for sync stats
    const { count: totalSynced } = await serviceClient
      .from('raw_visit_reports' as any)
      .select('*', { count: 'exact', head: true })
      .eq('company_id', profile.company_id) as any;

    const { count: totalProcessed } = await serviceClient
      .from('raw_visit_reports' as any)
      .select('*', { count: 'exact', head: true })
      .eq('company_id', profile.company_id)
      .eq('processing_status', 'done') as any;

    const { count: totalPending } = await serviceClient
      .from('raw_visit_reports' as any)
      .select('*', { count: 'exact', head: true })
      .eq('company_id', profile.company_id)
      .in('processing_status', ['pending', 'processing']) as any;

    return NextResponse.json({
      connected: true,
      instance_url: connection.instance_url || null,
      last_sync: connection.last_sync_at || null,
      records_synced: totalSynced || 0,
      records_processed: totalProcessed || 0,
      records_pending: totalPending || 0,
      error: connection.last_sync_error || null,
    });
  } catch (error) {
    console.error('Salesforce status error:', error);
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}
