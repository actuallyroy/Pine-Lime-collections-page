import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  // Manually grab the raw `?dataurl=` value so that `+` isn't turned into a space
  const rawQs = request.url.split('?')[1] || '';
  const matchParam = rawQs.match(/(?:^|&)dataurl=([^&]+)/);
  if (!matchParam) {
    return NextResponse.json({ error: 'Missing dataurl parameter' }, { status: 400 });
  }

  // decodeURIComponent will fix any %XX escapes; pluses will remain as '+'
  let dataurl = decodeURIComponent(matchParam[1]);

  // Now split off the meta and the actual base64 payload
  const [meta, b64] = dataurl.split(',');
  if (!meta || !b64) {
    return NextResponse.json({ error: 'Invalid dataurl format' }, { status: 400 });
  }

  const mimeMatch = meta.match(/^data:(.*?);base64$/);
  if (!mimeMatch) {
    return NextResponse.json({ error: 'Invalid dataurl format' }, { status: 400 });
  }
  const mime = mimeMatch[1];

  // Restore any spaces back to '+' in the payload (in case some got mangled)
  const safeB64 = b64.replace(/ /g, '+');

  // Decode to bytes (handles both Node.js and Edge-runtime)
  let bytes: Uint8Array;
  if (typeof Buffer !== 'undefined') {
    bytes = Buffer.from(safeB64, 'base64');
  } else {
    // edge runtime: use atob
    const bin = atob(safeB64);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
  }

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': mime,
    },
  });
}
