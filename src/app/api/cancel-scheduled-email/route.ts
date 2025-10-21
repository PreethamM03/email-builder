import { NextRequest, NextResponse } from 'next/server';
import { getTemporalClient } from '@/temporal/client';
import { updateScheduledEmail, getScheduledEmails } from '@/lib/scheduledEmailStorage';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { scheduleId } = await req.json();

    if (!scheduleId) {
      return NextResponse.json({ error: 'Missing required field: scheduleId' }, { status: 400 });
    }

    const scheduledEmails = await getScheduledEmails();
    const scheduledEmail = scheduledEmails.find((e) => e.scheduleId === scheduleId);

    if (!scheduledEmail) {
      return NextResponse.json({ error: 'Scheduled email not found' }, { status: 404 });
    }

    if (scheduledEmail.status !== 'scheduled') {
      return NextResponse.json(
        { error: `Cannot cancel email with status: ${scheduledEmail.status}` },
        { status: 400 }
      );
    }

    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(scheduledEmail.workflowId);
    await handle.cancel();

    await updateScheduledEmail(scheduleId, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Scheduled email cancelled successfully!' }, { status: 200 });
  } catch (error: any) {
    console.error('cancel-scheduled-email error:', error);
    return NextResponse.json(
      { error: `Failed to cancel scheduled email: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
