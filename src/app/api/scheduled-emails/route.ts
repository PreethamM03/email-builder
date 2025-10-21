import { NextResponse } from 'next/server';
import { getScheduledEmails } from '@/lib/scheduledEmailStorage';

export async function GET() {
  try {
    const scheduledEmails = await getScheduledEmails();
    
    const sorted = scheduledEmails.sort((a, b) => 
      new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime()
    );

    return NextResponse.json({ success: true, scheduledEmails: sorted }, { status: 200 });
  } catch (error) {
    console.error('get-scheduled-emails error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to get scheduled emails: ${errorMessage}` },
      { status: 500 }
    );
  }
}

