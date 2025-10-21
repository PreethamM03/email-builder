"use client";

import React, { useState } from "react";
import type { Data } from "@measured/puck";

interface EmailSendFormProps {
  emailData: Data;
  onClose: () => void;
}

interface NotificationState {
  type: "success" | "error" | null;
  message: string;
}

export function EmailSendForm({ emailData, onClose }: EmailSendFormProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ type: null, message: "" });
  const [sendType, setSendType] = useState<"now" | "scheduled">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: null, message: "" });
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!to.trim()) {
      showNotification("error", "Please enter a recipient email address");
      return;
    }
    
    if (!validateEmail(to)) {
      showNotification("error", "Please enter a valid email address");
      return;
    }
    
    if (!subject.trim()) {
      showNotification("error", "Please enter an email subject");
      return;
    }

    if (!emailData.content || emailData.content.length === 0) {
      showNotification("error", "Please add some content to your email before sending");
      return;
    }

    // Validate scheduling if scheduled send
    if (sendType === "scheduled") {
      if (!scheduledDate || !scheduledTime) {
        showNotification("error", "Please select a date and time for scheduled delivery");
        return;
      }

      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (scheduledDateTime <= new Date()) {
        showNotification("error", "Scheduled time must be in the future");
        return;
      }
    }

    setIsLoading(true);
    
    try {
      if (sendType === "now") {
        // Send immediately
        const response = await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: emailData,
            to: to.trim(),
            subject: subject.trim(),
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showNotification("success", result.message || "Email sent successfully!");
          setTimeout(() => {
            setTo("");
            setSubject("");
            onClose();
          }, 2000);
        } else {
          showNotification("error", result.error || "Failed to send email");
        }
      } else {
        // Schedule for later
        const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
        const response = await fetch("/api/schedule-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: emailData,
            to: to.trim(),
            subject: subject.trim(),
            scheduledFor,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showNotification("success", result.message || "Email scheduled successfully!");
          setTimeout(() => {
            setTo("");
            setSubject("");
            setScheduledDate("");
            setScheduledTime("");
            onClose();
          }, 2000);
        } else {
          showNotification("error", result.error || "Failed to schedule email");
        }
      }
    } catch (error) {
      console.error("Email sending error:", error);
      showNotification("error", "Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-2xl p-6">
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Send Test Email</h3>
          <p className="text-gray-600">Send your email design to test recipients</p>
          <button
            onClick={onClose}
            className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Notification */}
        {notification.type && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            notification.type === "success" 
              ? "bg-green-50 border-green-400 text-green-800" 
              : "bg-red-50 border-red-400 text-red-800"
          }`}>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-3 ${
                notification.type === "success" ? "bg-green-400" : "bg-red-400"
              }`}></div>
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-8 shadow-2xl border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Send Type Toggle */}
            <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setSendType("now")}
                className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all ${
                  sendType === "now"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                disabled={isLoading}
              >
                Send Now
              </button>
              <button
                type="button"
                onClick={() => setSendType("scheduled")}
                className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all ${
                  sendType === "scheduled"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                disabled={isLoading}
              >
                Schedule Send
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="to" className="block text-sm font-semibold text-gray-700 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  id="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Scheduling Options */}
            {sendType === "scheduled" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <label htmlFor="scheduledDate" className="block text-sm font-semibold text-gray-700 mb-2">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    id="scheduledDate"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="scheduledTime" className="block text-sm font-semibold text-gray-700 mb-2">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    id="scheduledTime"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !to.trim() || !subject.trim()}
                className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {sendType === "now" ? "Sending..." : "Scheduling..."}
                  </div>
                ) : (
                  sendType === "now" ? "Send Test Email" : "Schedule Email"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
