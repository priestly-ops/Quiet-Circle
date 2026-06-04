import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const form = await req.formData();
  console.log('twilio status', {
    sid: String(form.get('MessageSid') || ''),
    status: String(form.get('MessageStatus') || '')
  });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, route: 'twilio-status' });
}
