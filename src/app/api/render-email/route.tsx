import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { Html, Head, Preview, Tailwind } from "@react-email/components";
import { render as renderEmail } from "@react-email/render";
import { config } from "@/lib/puckConfig";

type Node = { type: string; props: Record<string, any>; children?: Node[] };
type Payload = { data: { root: { props: Record<string, any> }; content: Node[] } };

function renderNode(node: Node): React.ReactNode {
  const def = (config as any).components?.[node.type];
  if (!def || typeof def.render !== "function") return null;

  const children = (node.children || []).map((c, i) => (
    <React.Fragment key={i}>{renderNode(c)}</React.Fragment>
  ));
  return def.render({ ...(node.props || {}), children });
}

export async function POST(req: NextRequest) {
  try {
    const { data } = (await req.json()) as Payload;
    const tree = (
      <Html>
        <Head />
        <Preview>Preview text of your email…</Preview>
        <Tailwind>{(data.content || []).map((n, i) => <React.Fragment key={i}>{renderNode(n)}</React.Fragment>)}</Tailwind>
      </Html>
    );
    const html = await renderEmail(tree, { pretty: true });
    return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "render_failed" }, { status: 500 });
  }
}
