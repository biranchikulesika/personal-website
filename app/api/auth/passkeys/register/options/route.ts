import { NextResponse } from 'next/server';
import { generatePasskeyRegistrationOptionsAction } from '@/app/admin/actions/passkeys.actions';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await generatePasskeyRegistrationOptionsAction();
    return NextResponse.json(result.options, { status: 200 });
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: err.message || 'Failed to generate registration options' }, { status });
  }
}
