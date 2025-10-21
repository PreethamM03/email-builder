"use client";
import "@measured/puck/puck.css";


import React, { useEffect, useState } from "react";
import { Puck, type Data } from "@measured/puck";
import { config } from "@/lib/puckConfig";
import { sampleData } from "@/lib/sampleData";
import { EmailSendForm } from "@/components/email/EmailSendForm";
import { ScheduledEmailsModal } from "@/components/email/ScheduledEmailsModal";

const STORAGE_KEY = "email-builder:data:v1";

export default function Page() {
  const [data, setData] = useState<Data>({ root: { props: {} }, content: [] });
  const [puckKey, setPuckKey] = useState(0);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showScheduledEmails, setShowScheduledEmails] = useState(false);

  const loadSample = () =>{
    setPuckKey(prev => prev + 1);
    setData(sampleData);
  } 
  const clear = () => {
    setData({ root: { props: {} }, content: [] });
    setPuckKey(prev => prev + 1);
    console.log("Cleared"); 
  };

  useEffect(() => {
    loadSample();
  }, []);




  return (
    <div className="wrapper">
      {/* centered header */}
      <div className="container">
        <div className="topbar">
          <h1>Email Builder</h1>
          <span className="hint">Drag blocks → edit props → preview updates live</span>
          <div className="spacer" />
          <button
            className="btn"
            onClick={() => setShowEmailForm(true)}
            disabled={!data.content || data.content.length === 0}
            style={{
              opacity: (!data.content || data.content.length === 0) ? 0.5 : 1,
              cursor: (!data.content || data.content.length === 0) ? "not-allowed" : "pointer",
            }}
          >
            Send Test Email
          </button>
          <button 
            className="btn" 
            onClick={() => setShowScheduledEmails(true)}
            style={{
              backgroundColor: "#8b5cf6",
              borderColor: "#7c3aed",
            }}
          >
            📅 Scheduled Emails
          </button>
          <button className="btn" onClick={loadSample}>Load Sample</button>
          <button className="btn" onClick={clear}>Clear</button>
        </div>
      </div>
  
      <div className="container">
        {showEmailForm && (
          <div className="modal-overlay" onClick={() => setShowEmailForm(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-body">
                <EmailSendForm
                  emailData={data}
                  onClose={() => setShowEmailForm(false)}
                />
              </div>
            </div>
          </div>
        )}
        
        {showScheduledEmails && (
          <div className="modal-overlay" onClick={() => setShowScheduledEmails(false)}>
            <div 
              className="modal" 
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "900px" }}
            >
              <div className="modal-body">
                <ScheduledEmailsModal
                  onClose={() => setShowScheduledEmails(false)}
                />
              </div>
            </div>
          </div>
        )}
        <div className="puck-scope">
      <div className="container">
        <div className="layout">
          <div className="panel">
            <div className="panel-inner">
              <Puck
                key={puckKey}
                config={config}
                data={data}
                onChange={(d) => setData(d)}
                iframe={{ enabled: true }}
                viewports={[
                  { width: 768, height: 1024, label: "Medium", icon: "💻" },
                  { width: 390, height: 844, label: "Small", icon: "📱" },
                  { width: 1280, height: 720, label: "Large", icon: "🖥️" },
                ]}
                overrides={{
                  headerActions: () => <></>,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>

      </div>
  
      
    </div>
  );
  
}
