import { NextResponse } from 'next/server';

// Get these values from environment variables in production
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventName, eventData, pixelId, eventSourceUrl } = body;
    
    // Validate inputs
    if (!eventName) {
      return NextResponse.json({ error: 'Missing event name' }, { status: 400 });
    }

    // Use provided pixel ID or fallback to env var
    const fbPixelId = pixelId || PIXEL_ID;
    if (!fbPixelId) {
      return NextResponse.json({ error: 'Missing Pixel ID' }, { status: 400 });
    }

    // Generate a unique event ID
    const eventId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Get user data - in a real app you'd get this from auth or cookies
    // For now we'll use basic event data
    const userData = {
      client_ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      client_user_agent: request.headers.get('user-agent'),
      fbp: request.cookies.get('_fbp')?.value,
      fbc: request.cookies.get('_fbc')?.value,
    };

    // Construct payload for Conversions API
    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          event_source_url: eventSourceUrl,
          action_source: 'website',
          user_data: userData,
          custom_data: eventData,
        },
      ],
    };

    // Only proceed if we have an access token
    if (!ACCESS_TOKEN) {
      console.warn('Facebook access token not configured, skipping Conversions API call');
      return NextResponse.json({ success: true, clientOnly: true });
    }

    // Send to Facebook Conversions API
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${fbPixelId}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error sending event to Facebook Conversions API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
