import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities.js';

const { sendEmailActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export interface ScheduleEmailInput {
  scheduleId: string;
  to: string;
  subject: string;
  emailData: any;
  scheduledFor: number; // timestamp in ms
}

export async function scheduleEmailWorkflow(input: ScheduleEmailInput): Promise<void> {
  const now = Date.now();
  const delayMs = input.scheduledFor - now;

  if (delayMs > 0) {
    await sleep(delayMs);
  }

  await sendEmailActivity({
    to: input.to,
    subject: input.subject,
    emailData: input.emailData,
    scheduleId: input.scheduleId,
  });
}
