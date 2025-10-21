import fs from 'fs/promises';
import path from 'path';

export interface ScheduledEmail {
  scheduleId: string;
  workflowId: string;
  to: string;
  subject: string;
  emailData: any;
  scheduledFor: string; // ISO date string
  status: 'scheduled' | 'sent' | 'cancelled';
  createdAt: string;
  sentAt?: string;
  cancelledAt?: string;
}

const STORAGE_FILE = path.join(process.cwd(), 'scheduled-emails.json');

async function ensureStorageFile(): Promise<void> {
  try {
    await fs.access(STORAGE_FILE);
  } catch {
    await fs.writeFile(STORAGE_FILE, JSON.stringify([], null, 2));
  }
}

export async function getScheduledEmails(): Promise<ScheduledEmail[]> {
  await ensureStorageFile();
  const data = await fs.readFile(STORAGE_FILE, 'utf-8');
  return JSON.parse(data);
}

export async function addScheduledEmail(email: ScheduledEmail): Promise<void> {
  await ensureStorageFile();
  const emails = await getScheduledEmails();
  emails.push(email);
  await fs.writeFile(STORAGE_FILE, JSON.stringify(emails, null, 2));
}

export async function updateScheduledEmail(
  scheduleId: string,
  updates: Partial<ScheduledEmail>
): Promise<void> {
  await ensureStorageFile();
  const emails = await getScheduledEmails();
  const index = emails.findIndex((e) => e.scheduleId === scheduleId);
  
  if (index !== -1) {
    emails[index] = { ...emails[index], ...updates };
    await fs.writeFile(STORAGE_FILE, JSON.stringify(emails, null, 2));
  }
}

export async function getScheduledEmailsByStatus(
  status: 'scheduled' | 'sent' | 'cancelled'
): Promise<ScheduledEmail[]> {
  const emails = await getScheduledEmails();
  return emails.filter((e) => e.status === status);
}

