// components/email/EmailFrame.tsx
"use client";
import React from "react";

export function EmailFrame({ html }: { html: string }) {
    console.log("html", html);
  return (
    <iframe
      key={html ? `content-${html.length}` : 'empty'}   // force remount on change
      title="email-preview"
      srcDoc={html || "<!doctype html><html><body style='display:flex;align-items:center;justify-content:center;height:100vh;color:#666;font-family:sans-serif;'><p>No email content</p></body></html>"}
      sandbox=""                        // loosen while testing; tighten later
      style={{ width: "100%", height: "100%", border: 0, background: "#fff" }}
    />
  );
}
