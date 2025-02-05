import { NextResponse } from 'next/server';
import supabase from '@/utils/supabase/specialClient';

export async function POST(request: Request) {
    const { token } = await request.json();
    supabase.realtime.setAuth(token)
    const channel = supabase.channel('realtime:public:messages')
    try {
        channel.on('postgres_changes', { event: '*', schema: 'public', table: 'Message'
        }, (payload: any) => {
        console.log('New message:', payload.new)
        }).subscribe()

        console.log(channel)
        return new NextResponse(
          JSON.stringify({ message: 'Subscribed to realtime chat' + channel, }),
          {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
          }
        );
  } catch (error) {
    console.error('Error in POST /api/realtime-events/realtime-chat:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    supabase.removeChannel(channel)
  }
}
