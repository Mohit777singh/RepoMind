import React from "react";
import { Issue } from "../types";
import {
  Calendar,
  ExternalLink,
  MessageSquare,
  Tag,
  User,
  X,
} from "lucide-react";

interface IssueDetailModalProps {
  issue: Issue | null;
  onClose: () => void;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issue,
  onClose,
}) => {
  if (!issue) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "720px", width: "95%" }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
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
            </div>
            <h2 className="modal-title" style={{ fontSize: "1.35rem", lineHeight: 1.3 }}>
              {issue.title}
            </h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

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

        {/* Close button footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
