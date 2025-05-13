import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dataurl = searchParams.get('dataurl');
  if (!dataurl) {
    return NextResponse.json({ error: 'Missing dataurl parameter' }, { status: 400 });
  }

  // Decode data URL to bytes
  function dataURLtoBytes(dataurl: string): { mime: string, bytes: Buffer } {
    const arr = dataurl.split(',');
    const match = arr[0].match(/:(.*?);/);
    if (!match) throw new Error('Invalid dataurl');
    const mime = match[1];
    const bstr = Buffer.from(arr[1], 'base64');
    return { mime, bytes: bstr };
  }

  try {
    const { mime, bytes } = dataURLtoBytes(dataurl);
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: { 'Content-Type': mime },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to decode dataurl' }, { status: 400 });
  }
} 