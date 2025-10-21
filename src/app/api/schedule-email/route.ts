import { NextRequest, NextResponse } from 'next/server';
import { getTemporalClient } from '@/temporal/client';
import { addScheduledEmail } from '@/lib/scheduledEmailStorage';
import { v4 as uuidv4 } from 'uuid';
import type { ScheduleEmailInput } from '@/temporal/workflows';
import { scheduleEmailWorkflow } from '@/temporal/workflows';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { data, to, subject, scheduledFor } = await req.json();

    if (!to || !subject || !data || !scheduledFor) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, data, scheduledFor' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (!data?.content?.length) {
      return NextResponse.json(
        { error: 'No email content. Add blocks or click Load Sample.' },
        { status: 400 }
      );
    }

    const scheduledTime = new Date(scheduledFor).getTime();
    if (isNaN(scheduledTime) || scheduledTime <= Date.now()) {
      return NextResponse.json(
        { error: 'Invalid scheduled time. Must be in the future.' },
        { status: 400 }
      );
    }

    const scheduleId = uuidv4();
    const workflowId = `email-schedule-${scheduleId}`;

    const client = await getTemporalClient();
    const handle = await client.workflow.start(scheduleEmailWorkflow, {
      workflowId,
      taskQueue: 'email-scheduling',
      args: [
        {
          scheduleId,
          to,
          subject,
          emailData: data,
          scheduledFor: scheduledTime,
        } satisfies ScheduleEmailInput,
      ],
    });

    await addScheduledEmail({
      scheduleId,
      workflowId: handle.workflowId,
      to,
      subject,
      emailData: data,
      scheduledFor: new Date(scheduledTime).toISOString(),
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email scheduled successfully!',
        scheduleId,
        workflowId: handle.workflowId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('schedule-email error:', error);
    return NextResponse.json(
      { error: `Failed to schedule email: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
