import React, { useEffect, useState } from "react";
import { apiDiagnoseIssue, apiGetIssueAnalysis } from "../api";
import { Issue, IssueAnalysis } from "../types";
import {
  AlertCircle,
  AlertTriangle,
  Bug,
  Calendar,
  CheckCircle,
  Code2,
  Cpu,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  Loader2,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Tag,
  User,
  X,
  Zap,
} from "lucide-react";

interface IssueDetailModalProps {
  issue: Issue | null;
  onClose: () => void;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issue,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "diagnosis">("details");
  const [analysis, setAnalysis] = useState<IssueAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (!issue) {
      setAnalysis(null);
      setActiveTab("details");
      setAnalysisError(null);
      return;
    }

    // Auto-fetch existing analysis when issue opens
    let isCancelled = false;
    setLoadingAnalysis(true);
    setAnalysisError(null);

    apiGetIssueAnalysis(issue.id)
      .then((data) => {
        if (!isCancelled) setAnalysis(data);
      })
      .catch((err) => {
        if (!isCancelled) setAnalysisError(err.message);
      })
      .finally(() => {
        if (!isCancelled) setLoadingAnalysis(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [issue]);

  if (!issue) return null;

  const handleRunDiagnosis = async () => {
    setLoadingAnalysis(true);
    setAnalysisError(null);
    try {
      const result = await apiDiagnoseIssue(issue.id);
      setAnalysis(result);
    } catch (err: any) {
      setAnalysisError(err.message || "Failed to run diagnosis.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const getPriorityStyle = (priority?: string) => {
    switch (priority) {
      case "P0_CRITICAL":
        return { backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#f87171", borderColor: "#ef4444" };
      case "P1_HIGH":
        return { backgroundColor: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", borderColor: "#f59e0b" };
      case "P2_MEDIUM":
        return { backgroundColor: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", borderColor: "#3b82f6" };
      default:
        return { backgroundColor: "rgba(107, 114, 128, 0.2)", color: "#9ca3af", borderColor: "#6b7280" };
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "840px", width: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ alignItems: "flex-start", gap: "1rem", flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
              <span
                className={`badge ${
                  issue.state.toLowerCase() === "open" ? "badge-open" : "badge-closed"
                }`}
              >
                {issue.state.toUpperCase()}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                }}
              >
                #{issue.issue_number}
              </span>

              {/* Triage Badges if analyzed */}
              {analysis && (
                <>
                  <span
                    className="badge"
                    style={{
                      background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))",
                      color: "#93c5fd",
                      border: "1px solid rgba(139, 92, 246, 0.4)",
                      textTransform: "capitalize",
                    }}
                  >
                    <Sparkles size={12} color="#a78bfa" />
                    {analysis.category.replace("_", " ")} ({Math.round(analysis.confidence * 100)}%)
                  </span>
                  <span
                    className="badge"
                    style={getPriorityStyle(analysis.priority)}
                  >
                    {analysis.priority}
                  </span>
                </>
              )}
            </div>

            <h2 className="modal-title" style={{ fontSize: "1.35rem", lineHeight: 1.3 }}>
              {issue.title}
            </h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: "0.5rem",
            marginBottom: "1.25rem",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setActiveTab("details")}
            style={{
              padding: "0.5rem 1rem",
              background: activeTab === "details" ? "var(--bg-card)" : "transparent",
              color: activeTab === "details" ? "var(--text-primary)" : "var(--text-secondary)",
              border: activeTab === "details" ? "1px solid var(--border-color)" : "1px solid transparent",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span>Issue Details</span>
          </button>

          <button
            onClick={() => setActiveTab("diagnosis")}
            style={{
              padding: "0.5rem 1rem",
              background: activeTab === "diagnosis" ? "linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(139, 92, 246, 0.25))" : "transparent",
              color: activeTab === "diagnosis" ? "#ffffff" : "var(--text-secondary)",
              border: activeTab === "diagnosis" ? "1px solid #3b82f6" : "1px solid transparent",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <Cpu size={15} color="#3b82f6" />
            <span>AI Debug & Diagnostic Inspector</span>
            {analysis && (
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "1px 5px",
                  borderRadius: "10px",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                }}
              >
                Ready
              </span>
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "0.25rem" }}>
          {activeTab === "details" ? (
            <>
              {/* Metadata Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1.25rem",
                  flexWrap: "wrap",
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--bg-card)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-color)",
                  marginBottom: "1.25rem",
                  fontSize: "0.825rem",
                  color: "var(--text-secondary)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <User size={14} color="var(--accent-primary)" />
                  <span>Author: <strong style={{ color: "var(--text-primary)" }}>{issue.author || "Unknown"}</strong></span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <Calendar size={14} />
                  <span>Created: {new Date(issue.created_at).toLocaleString()}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <MessageSquare size={14} />
                  <span>{issue.comments_count} Comments</span>
                </div>

                <a
                  href={issue.html_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    color: "var(--accent-primary)",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  <span>GitHub</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              {/* Labels Section */}
              {issue.labels && issue.labels.length > 0 && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    <Tag size={13} />
                    <span>LABELS</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {issue.labels.map((lbl, idx) => {
                      const name = typeof lbl === "string" ? lbl : lbl.name;
                      const color = typeof lbl === "string" ? "4b5563" : lbl.color || "4b5563";
                      return (
                        <span
                          key={idx}
                          className="badge badge-label"
                          style={{
                            backgroundColor: `#${color}25`,
                            color: `#${color}`,
                            borderColor: `#${color}60`,
                          }}
                        >
                          {name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Issue Body */}
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 600 }}>
                  DESCRIPTION
                </div>
                <div
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    padding: "1.25rem",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                    color: "var(--text-primary)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: "380px",
                    overflowY: "auto",
                    fontFamily: "inherit",
                  }}
                >
                  {issue.body ? issue.body : <em style={{ color: "var(--text-muted)" }}>No description provided for this issue.</em>}
                </div>
              </div>
            </>
          ) : (
            /* AI DEBUGGER & DIAGNOSTIC TAB */
            <div>
              {/* Header Action */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Zap size={18} color="#f59e0b" />
                    <span>Automated Root Cause Diagnosis & Triage</span>
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                    Analyzes failure patterns, exception signatures, reproduction steps, and suggests resolution steps.
                  </p>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleRunDiagnosis}
                  disabled={loadingAnalysis}
                >
                  {loadingAnalysis ? (
                    <Loader2 size={14} className="spinner-sm" style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  <span>{analysis ? "Re-Analyze" : "Run Diagnosis"}</span>
                </button>
              </div>

              {analysisError && (
                <div className="alert alert-danger">
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <div>{analysisError}</div>
                </div>
              )}

              {loadingAnalysis && !analysis && (
                <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
                  <div className="spinner" style={{ margin: "0 auto 1rem auto" }} />
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    Running RepoMind heuristic & ML diagnostic engine...
                  </p>
                </div>
              )}

              {analysis && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Category & Priority Summary Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                    {/* Category Card */}
                    <div
                      className="card"
                      style={{
                        padding: "1rem",
                        backgroundColor: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.35rem", textTransform: "uppercase" }}>
                        Detected Category
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {analysis.category === "bug" && <Bug size={18} color="#ef4444" />}
                        {analysis.category === "feature_request" && <Zap size={18} color="#3b82f6" />}
                        {analysis.category === "question" && <HelpCircle size={18} color="#10b981" />}
                        <span style={{ textTransform: "capitalize" }}>{analysis.category.replace("_", " ")}</span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>
                        Confidence: <strong>{Math.round(analysis.confidence * 100)}%</strong>
                      </div>
                    </div>

                    {/* Priority Card */}
                    <div
                      className="card"
                      style={{
                        padding: "1rem",
                        backgroundColor: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.35rem", textTransform: "uppercase" }}>
                        Assigned Priority
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          className="badge"
                          style={{
                            ...getPriorityStyle(analysis.priority),
                            fontSize: "0.95rem",
                            padding: "4px 10px",
                          }}
                        >
                          {analysis.priority}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>
                        Model: <code>{analysis.model_version}</code>
                      </div>
                    </div>

                    {/* Reproduction Check Card */}
                    <div
                      className="card"
                      style={{
                        padding: "1rem",
                        backgroundColor: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.35rem", textTransform: "uppercase" }}>
                        Reproduction Steps
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.95rem", fontWeight: 600 }}>
                        {analysis.reproduction_steps_detected ? (
                          <>
                            <CheckCircle size={16} color="#10b981" />
                            <span style={{ color: "#34d399" }}>Present in issue</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={16} color="#f59e0b" />
                            <span style={{ color: "#fbbf24" }}>Missing sample snippet</span>
                          </>
                        )}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.35rem" }}>
                        Stack Trace: {analysis.stack_trace_detected ? "Detected" : "None"}
                      </div>
                    </div>
                  </div>

                  {/* Root Cause Hypothesis Box */}
                  <div
                    style={{
                      padding: "1.25rem",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))",
                      border: "1px solid #3b82f6",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <Lightbulb size={18} color="#3b82f6" />
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#93c5fd" }}>
                        Root Cause Hypothesis & Diagnosis Summary
                      </h4>
                    </div>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-primary)" }}>
                      {analysis.root_cause_hypothesis}
                    </p>
                    {analysis.error_type && (
                      <div style={{ marginTop: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "3px 8px", backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "4px", fontSize: "0.8rem", color: "#f87171", fontFamily: "var(--font-mono)" }}>
                        <Bug size={12} />
                        <span>Exception: {analysis.error_type}</span>
                      </div>
                    )}
                  </div>

                  {/* Extracted Stack Trace (if present) */}
                  {analysis.extracted_stack_trace && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                        <Code2 size={14} color="#f59e0b" />
                        <span>EXTRACTED STACK TRACE & ERROR CONTEXT</span>
                      </div>
                      <pre
                        style={{
                          backgroundColor: "#050811",
                          border: "1px solid var(--border-color)",
                          borderRadius: "6px",
                          padding: "1rem",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.8rem",
                          color: "#fca5a5",
                          overflowX: "auto",
                          maxHeight: "220px",
                          lineHeight: 1.5,
                        }}
                      >
                        {analysis.extracted_stack_trace}
                      </pre>
                    </div>
                  )}

                  {/* Affected Components & Files */}
                  {analysis.affected_components && analysis.affected_components.length > 0 && (
                    <div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", fontWeight: 600 }}>
                        AFFECTED FILES & MODULE SIGNATURES
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        {analysis.affected_components.map((comp, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.75rem",
                              backgroundColor: "var(--bg-card)",
                              border: "1px solid var(--border-color)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              color: "#60a5fa",
                            }}
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Recommendations */}
                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.6rem", fontWeight: 600 }}>
                        SUGGESTED NEXT ENGINEERING ACTIONS
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        {analysis.recommendations.map((rec) => (
                          <div
                            key={rec.id}
                            style={{
                              padding: "0.875rem 1rem",
                              backgroundColor: "var(--bg-card)",
                              borderRadius: "6px",
                              borderLeft: `4px solid ${
                                rec.severity === "critical"
                                  ? "#ef4444"
                                  : rec.severity === "warning"
                                  ? "#f59e0b"
                                  : "#3b82f6"
                              }`,
                              borderTop: "1px solid var(--border-color)",
                              borderRight: "1px solid var(--border-color)",
                              borderBottom: "1px solid var(--border-color)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                              <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>
                                {rec.action_title}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  textTransform: "uppercase",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  backgroundColor:
                                    rec.severity === "critical"
                                      ? "rgba(239, 68, 68, 0.2)"
                                      : rec.severity === "warning"
                                      ? "rgba(245, 158, 11, 0.2)"
                                      : "rgba(59, 130, 246, 0.2)",
                                  color:
                                    rec.severity === "critical"
                                      ? "#f87171"
                                      : rec.severity === "warning"
                                      ? "#fbbf24"
                                      : "#60a5fa",
                                }}
                              >
                                {rec.severity}
                              </span>
                            </div>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                              {rec.rationale}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Close button footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-color)", flexShrink: 0 }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
