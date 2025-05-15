import { NextResponse } from 'next/server';
import { createCanvas, loadImage, registerFont } from 'canvas';

// Register the font (do this only once, at the top)
registerFont('public/fonts/NotoColorEmoji-Regular.ttf', { family: 'NotoColorEmoji' });
registerFont('public/fonts/Outfit-Regular.ttf', { family: 'Outfit' });

// Helper to convert emoji to Twemoji CDN URL
function emojiToTwemojiUrl(emoji: string, size: number = 72) {
  // Convert emoji to codepoint(s)
  const codePoint = Array.from(emoji)
    .map(char => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join('-');
  
  console.log(codePoint);
  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${codePoint.split('-')[0]}.png`;
}

type EmojiStyle = 'GOOGLE' | 'APPLE';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const emojiTxt = searchParams.get('emoji');
    const label = searchParams.get('label') || "";
    const size = parseInt(searchParams.get('size') || '20');
    const labelFont = searchParams.get('labelFont') || 'Outfit';
    const emojiStyle = (searchParams.get('emojiStyle') as EmojiStyle) || 'GOOGLE';

    if (!emojiTxt) {
      return NextResponse.json(
        { error: 'Missing required parameters: emoji' },
        { status: 400 }
      );
    }

    // Fetch emoji image from Twemoji
    const emojiUrl = emojiToTwemojiUrl(emojiTxt);
    let emojiImg;
    try {
      emojiImg = await loadImage(emojiUrl);
    } catch (e) {
      return NextResponse.json(
        { error: 'Could not load emoji image from Twemoji.' },
        { status: 500 }
      );
    }

    // Calculate canvas size
    let fontSize = size * 0.6;
    const tempCanvas = createCanvas(1, 1);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.font = `${fontSize}px ${labelFont}`;
    const labelMetrics = tempCtx.measureText(label);
    const textWidth = labelMetrics.width + 20;
    const emojiWidth = size;
    const canvasWidth = Math.max(emojiWidth, textWidth);
    const canvasHeight = size + fontSize + 28;

    // Create final canvas
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Fill background transparent (default)
    // Draw emoji image centered
    ctx.drawImage(emojiImg, (canvasWidth - size) / 2, 0, size, size);

    // Draw label
    ctx.font = `${fontSize}px CustomFont`;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.textBaseline = 'top';
    ctx.strokeText(label, 10, size + 8);
    ctx.fillStyle = 'black';
    ctx.fillText(label, 10, size + 8);

    const buffer = canvas.toBuffer('image/png');
    const uint8Array = new Uint8Array(buffer);
    const blob = new Blob([uint8Array], { type: 'image/png' });
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error generating marker:', error);
    return NextResponse.json(
      { error: 'Failed to generate marker image' },
      { status: 500 }
    );
  }
}
