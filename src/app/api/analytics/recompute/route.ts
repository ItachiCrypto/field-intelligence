// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recomputeAnalytics } from '@/lib/analytics/recompute';

export const maxDuration = 120;

/**
 * POST /api/analytics/recompute
 * Recalcule toutes les tables d'analytics de la company de l'utilisateur.
 * Requiert un utilisateur authentifié (admin ou tout rôle).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles' as any)
      .select('company_id')
      .eq('id', user.id)
      .single() as any;

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const result = await recomputeAnalytics(profile.company_id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tables_updated: result.tables ?? [],
      message: `${result.tables?.length ?? 0} tables recalculees`,
    });
  } catch (err: any) {
    console.error('[analytics/recompute]', err?.message);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
