import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render as renderEmail } from "@react-email/render";
import { Html, Head, Preview, Tailwind, Body } from "@react-email/components";
import { serverConfig } from "@/lib/serverConfig";

type Node = { type: string; props: Record<string, unknown>; children?: Node[] };
type SendEmailPayload = {
  data: { root?: { props?: Record<string, unknown> }; content: Node[] };
  to: string;
  subject: string;
};

function renderNode(node: Node): React.ReactNode {
  const components = ((serverConfig as any)?.components ?? {}) as Record<string, { render?: (props: Record<string, unknown>) => React.ReactNode; fields?: Record<string, unknown> }>;
  const def = components[node.type];
  if (!def || typeof def.render !== "function") return null;

  const rawChildren =
    node.children ??
    (node.props as Record<string, unknown>)?.children ??
    (node.props as Record<string, unknown>)?.content ??
    [];

  const childNodes: Node[] = Array.isArray(rawChildren) ? rawChildren : [];
  const childEls = childNodes.map((c, i) => (
    <React.Fragment key={i}>{renderNode(c)}</React.Fragment>
  ));

  const cleanProps: Record<string, unknown> = { ...(node.props || {}) };
  if ("id" in cleanProps) delete cleanProps.id;
  if (Array.isArray(cleanProps.content)) delete cleanProps.content; 
  if (cleanProps.children) delete cleanProps.children; 

  const hasContentSlot =
    def.fields && 
    (def.fields as Record<string, Record<string, unknown>>).content && 
    (def.fields as Record<string, Record<string, unknown>>).content.type === "slot";

  if (hasContentSlot) {
    return def.render({ ...cleanProps, content: childEls });
  }
  return def.render({ ...cleanProps, children: childEls });
}

export async function POST(req: NextRequest) {
  try {
    const { data, to, subject }: SendEmailPayload = await req.json();

    if (!to || !subject || !data) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, data" },
        { status: 400 }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
    }
    if (!data?.content?.length) {
      return NextResponse.json(
        { error: "No email content. Add blocks or click Load Sample." },
        { status: 400 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const doc = (
      <Html>
        <Head />
        <Preview>{subject || " "}</Preview>
        <Body style={{ backgroundColor: "#f6f9fc", margin: 0, padding: 0 }}>
          <Tailwind>
            {(data.content || []).map((n, i) => (
              <React.Fragment key={i}>{renderNode(n)}</React.Fragment>
            ))}
          </Tailwind>
        </Body>
      </Html>
    );

    const html = "<!doctype html>\n" + await renderEmail(doc, { pretty: true });
    const text = await renderEmail(doc, { plainText: true });

    const result = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
      text,
    });

    if ('error' in result && result.error) {
      const errorMsg = typeof result.error === 'object' && result.error && 'message' in result.error 
        ? (result.error as { message: string }).message 
        : "Resend send failed";
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      );
    }
    
    const messageId =
      ('data' in result && result.data && typeof result.data === 'object' && 'id' in result.data ? result.data.id : null) ??
      ('id' in result ? result.id : null) ?? undefined;

    return NextResponse.json(
      { success: true, message: "Email sent!", id: messageId },
      { status: 200 }
    );
  } catch (error) {
    console.error("send-email error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to send email: ${errorMessage}` },
      { status: 500 }
    );
  }
}
