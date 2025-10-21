"use client";

import React, { useState, useEffect } from "react";

interface ScheduledEmail {
  scheduleId: string;
  workflowId: string;
  to: string;
  subject: string;
  scheduledFor: string;
  status: "scheduled" | "sent" | "cancelled";
  createdAt: string;
  sentAt?: string;
  cancelledAt?: string;
}

interface ScheduledEmailsModalProps {
  onClose: () => void;
}

export function ScheduledEmailsModal({ onClose }: ScheduledEmailsModalProps) {
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "scheduled" | "sent" | "cancelled">("all");

  useEffect(() => {
    loadScheduledEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadScheduledEmails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/scheduled-emails");
      const result = await response.json();

      if (response.ok && result.success) {
        setScheduledEmails(result.scheduledEmails);
      } else {
        showNotification("error", result.error || "Failed to load scheduled emails");
      }
    } catch (error) {
      console.error("Error loading scheduled emails:", error);
      showNotification("error", "Failed to load scheduled emails");
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: null, message: "" });
    }, 5000);
  };

  const handleCancel = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled email?")) {
      return;
    }

    setCancellingId(scheduleId);
    try {
      const response = await fetch("/api/cancel-scheduled-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ scheduleId }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showNotification("success", result.message || "Email cancelled successfully!");
        loadScheduledEmails(); 
      } else {
        showNotification("error", result.error || "Failed to cancel email");
      }
    } catch (error) {
      console.error("Error cancelling email:", error);
      showNotification("error", "Failed to cancel email");
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "sent":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredEmails = filterStatus === "all" 
    ? scheduledEmails 
    : scheduledEmails.filter(email => email.status === filterStatus);

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
      <div className="w-full max-w-4xl mx-4">
        <div className="relative text-center mb-6 p-6 pb-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Scheduled Emails</h3>
          <p className="text-gray-600">View and manage your scheduled email deliveries</p>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Notification */}
        {notification.type && (
          <div className={`mx-6 mb-4 p-4 rounded-lg border-l-4 ${
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

        {/* Filter Tabs */}
        <div className="px-6 mb-4">
          <div className="flex gap-2 p-1 bg-white rounded-lg shadow-sm">
            {["all", "scheduled", "sent", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-all ${
                  filterStatus === status
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== "all" && (
                  <span className="ml-2 text-xs">
                    ({scheduledEmails.filter(e => e.status === status).length})
                  </span>
                )}
                {status === "all" && (
                  <span className="ml-2 text-xs">
                    ({scheduledEmails.length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Email List */}
        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(80vh-250px)]">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-600 font-medium">No {filterStatus !== "all" ? filterStatus : ""} scheduled emails found</p>
              <p className="text-gray-500 text-sm mt-2">
                {filterStatus === "all" 
                  ? "Schedule your first email to get started" 
                  : `No emails with status "${filterStatus}"`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEmails.map((email) => (
                <div
                  key={email.scheduleId}
                  className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{email.subject}</h4>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                            email.status
                          )}`}
                        >
                          {email.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span>To: {email.to}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>
                            Scheduled for: <strong>{formatDate(email.scheduledFor)}</strong>
                          </span>
                        </div>
                        {email.status === "sent" && email.sentAt && (
                          <div className="flex items-center gap-2 text-green-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>Sent at: {formatDate(email.sentAt)}</span>
                          </div>
                        )}
                        {email.status === "cancelled" && email.cancelledAt && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>Cancelled at: {formatDate(email.cancelledAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {email.status === "scheduled" && (
                      <button
                        onClick={() => handleCancel(email.scheduleId)}
                        disabled={cancellingId === email.scheduleId}
                        className="ml-4 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {cancellingId === email.scheduleId ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

