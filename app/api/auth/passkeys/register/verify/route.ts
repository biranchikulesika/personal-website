import { NextResponse } from 'next/server';
import { verifyPasskeyRegistrationAction } from '@/app/admin/actions/passkeys.actions';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { response, name } = body;

    if (!response) {
      return NextResponse.json({ error: 'Missing registration response payload' }, { status: 400 });
    }

    const result = await verifyPasskeyRegistrationAction(response, name);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : 400;
    return NextResponse.json({ error: err.message || 'Passkey verification failed' }, { status });
  }
}
