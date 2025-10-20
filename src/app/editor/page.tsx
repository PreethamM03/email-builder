"use client";
import "@measured/puck/puck.css";


import React, { useEffect, useState } from "react";
import { Puck, Render, type Data } from "@measured/puck";
import { config } from "@/lib/puckConfig";
import { sampleData } from "@/lib/sampleData";
import { EmailFrame } from "@/components/email/EmailFrame";
// React Email rendering moved to server API to avoid multiple renderers error

const STORAGE_KEY = "email-builder:data:v1";

export default function Page() {
  const [data, setData] = useState<Data>({ root: { props: {} }, content: [] });
  const [puckKey, setPuckKey] = useState(0);

  // Load saved state on mount
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      try {
        setData(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }, []);

  // Persist edits
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  // Produce HTML for preview (React Email) via server to avoid multiple renderers
  const [html, setHtml] = useState("");
  useEffect(() => {
    // Don't render if content is empty
    if (!data.content || data.content.length === 0) {
      setHtml("");
      return;
    }
    
    void (async () => {
      try {
        const res = await fetch("/api/render-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        });
        const out = await res.text();
        setHtml(out);
      } catch {
        setHtml("<html><body><p>Failed to render email.</p></body></html>");
      }
    })();
  }, [data]);

  const loadSample = () =>{
    setPuckKey(prev => prev + 1);
    setData(sampleData);
  } 
  const clear = () => {
    setData({ root: { props: {} }, content: [] });
    setHtml("");
    setPuckKey(prev => prev + 1);
    console.log("Cleared"); 
  };


  return (
    <div className="wrapper">
      <div className="topbar">
        <h1>Email Builder</h1>
        <span className="hint">Drag blocks → edit props → preview updates live</span>
        <div className="spacer" />
        <button className="btn" onClick={loadSample}>Load Sample</button>
        <button className="btn" onClick={clear}>Clear</button>
      </div>

      <div className="layout">
        <div className="panel">
          <div className="panel-inner">
            <Puck
              key={puckKey}
              config={config}
              data={data}
              onChange={(d) => setData(d)}
            />
          </div>
        </div>
        <div className="panel preview">
          <EmailFrame html={html} />
        </div>
        <div style={{ position: "absolute", right: 8, bottom: 8, fontSize: 11, opacity: 0.6 }}>
  {html ? `preview: ${html.length} chars` : "no preview yet"}
</div>
      </div>
    </div>
  );
}
