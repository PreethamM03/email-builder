import { Resend } from 'resend';
import React from 'react';
import { render } from '@react-email/render';
import { Html, Head, Preview, Body, Tailwind } from '@react-email/components';
import { serverConfig } from '@/lib/serverConfig';

interface SendEmailActivityInput {
  to: string;
  subject: string;
  emailData: any;
  scheduleId: string;
}

function renderNode(node: any): React.ReactNode {
  const def = (serverConfig as any)?.components?.[node?.type];
  if (!def || typeof def.render !== 'function') {
    console.warn(`Unknown component type: ${node?.type}`);
    return null;
  }

  const rawChildren =
    node?.children ??
    node?.props?.children ??
    node?.props?.content ??
    [];

  const childNodes: any[] = Array.isArray(rawChildren) ? rawChildren : [];
  const children = childNodes.map((c, i) => <React.Fragment key={i}>{renderNode(c)}</React.Fragment>);

  const cleanProps: Record<string, any> = { ...(node?.props || {}) };
  if ('id' in cleanProps) delete cleanProps.id;
  if (Array.isArray(cleanProps.content)) delete cleanProps.content;
  if (cleanProps.children) delete cleanProps.children;

  const hasContentSlot =
    (def as any).fields && (def as any).fields.content && (def as any).fields.content.type === 'slot';

  return hasContentSlot
    ? def.render({ ...cleanProps, content: children })
    : def.render({ ...cleanProps, children });
}

export async function sendEmailActivity(input: SendEmailActivityInput): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  const doc = (
    <Html>
      <Head />
      <Preview>{input.subject || ' '}</Preview>
      <Body style={{ backgroundColor: '#f6f9fc', margin: 0, padding: 0 }}>
        <Tailwind>
          {(input.emailData?.content || []).map((n: any, i: number) => (
            <React.Fragment key={i}>{renderNode(n)}</React.Fragment>
          ))}
        </Tailwind>
      </Body>
    </Html>
  );

  const html = '<!doctype html>\n' + (await render(doc, { pretty: true }));
  const text = await render(doc, { plainText: true });

  const result = await resend.emails.send({
    from: fromEmail,
    to: [input.to],
    subject: input.subject,
    html,
    text,
  });

  if ((result as any)?.error) {
    throw new Error((result as any).error.message || 'Failed to send email');
  }

  // update local JSON storage
  const fs = await import('fs/promises');
  const path = await import('path');
  const storageFile = path.join(process.cwd(), 'scheduled-emails.json');

  try {
    const data = await fs.readFile(storageFile, 'utf-8');
    const scheduledEmails = JSON.parse(data);
    const idx = scheduledEmails.findIndex((e: any) => e.scheduleId === input.scheduleId);
    if (idx !== -1) {
      scheduledEmails[idx].status = 'sent';
      scheduledEmails[idx].sentAt = new Date().toISOString();
      await fs.writeFile(storageFile, JSON.stringify(scheduledEmails, null, 2));
    }
  } catch (err) {
    console.error('Error updating scheduled email status:', err);
  }

  console.log(`Email sent successfully: ${input.scheduleId}`);
}
