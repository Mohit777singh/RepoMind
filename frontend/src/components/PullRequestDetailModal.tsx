import React, { useState } from "react";
import { PullRequest } from "../types";
import {
  Calendar,
  Check,
  Copy,
  ExternalLink,
  FileCode,
  GitMerge,
  GitPullRequest,
  Tag,
  User,
  X,
} from "lucide-react";

interface PullRequestDetailModalProps {
  pr: PullRequest | null;
  onClose: () => void;
}

export const PullRequestDetailModal: React.FC<PullRequestDetailModalProps> = ({
  pr,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!pr) return null;

  const isMerged = pr.is_merged || pr.state.toLowerCase() === "merged";
  const isOpen = pr.state.toLowerCase() === "open";

  const handleCopyLink = () => {
    if (pr.html_url) {
      navigator.clipboard.writeText(pr.html_url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "800px",
          width: "95%",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{ alignItems: "flex-start", gap: "1rem", flexShrink: 0, paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              {isMerged ? (
                <span className="badge badge-merged">
                  <GitMerge size={13} />
                  <span>MERGED</span>
                </span>
              ) : isOpen ? (
                <span className="badge badge-open">
                  <GitPullRequest size={13} />
                  <span>OPEN</span>
                </span>
              ) : (
                <span className="badge badge-closed">
                  <GitPullRequest size={13} />
                  <span>CLOSED</span>
                </span>
              )}

              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                }}
              >
                #{pr.pr_number}
              </span>
            </div>

            <h2
              className="modal-title"
              style={{ fontSize: "1.25rem", lineHeight: 1.4, margin: 0 }}
            >
              {pr.title}
            </h2>
          </div>

          <button className="close-btn" onClick={onClose} title="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Metadata info bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1.25rem",
            padding: "0.85rem 0",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <User size={15} color="var(--text-muted)" />
            <span>Author:</span>
            <strong style={{ color: "var(--text-primary)" }}>
              {pr.author || "Unknown"}
            </strong>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Calendar size={15} color="var(--text-muted)" />
            <span>Created:</span>
            <span style={{ color: "var(--text-primary)" }}>
              {new Date(pr.created_at).toLocaleDateString()}
            </span>
          </div>

          {pr.merged_at && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <GitMerge size={15} color="#c084fc" />
              <span>Merged:</span>
              <span style={{ color: "#c084fc", fontWeight: 500 }}>
                {new Date(pr.merged_at).toLocaleDateString()}
              </span>
            </div>
          )}

          {pr.closed_at && !pr.merged_at && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>Closed:</span>
              <span style={{ color: "var(--text-muted)" }}>
                {new Date(pr.closed_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions & Links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.85rem 0",
            flexWrap: "wrap",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          {pr.html_url && (
            <a
              href={pr.html_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <ExternalLink size={14} />
              <span>Open on GitHub</span>
            </a>
          )}

          {pr.diff_url && (
            <a
              href={pr.diff_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", borderColor: "rgba(59, 130, 246, 0.4)", color: "#93c5fd" }}
            >
              <FileCode size={14} />
              <span>View Raw Diff (.diff)</span>
            </a>
          )}

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCopyLink}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            {copiedLink ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
            <span>{copiedLink ? "Copied!" : "Copy PR URL"}</span>
          </button>
        </div>

        {/* Labels */}
        {pr.labels && pr.labels.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 0",
              flexWrap: "wrap",
              borderBottom: "1px solid var(--border-color)",
            }}
          >
            <Tag size={14} color="var(--text-muted)" />
            {pr.labels.map((lbl, idx) => {
              const name = typeof lbl === "string" ? lbl : lbl.name;
              const color =
                typeof lbl === "string" ? "4b5563" : lbl.color || "4b5563";
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
        )}

        {/* Body / Description Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 0" }}>
          <h4
            style={{
              fontSize: "0.85rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-muted)",
              marginBottom: "0.75rem",
              fontWeight: 600,
            }}
          >
            Pull Request Description
          </h4>

          {pr.body && pr.body.trim() ? (
            <div
              style={{
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                padding: "1.25rem",
                color: "var(--text-primary)",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                fontFamily: "var(--font-sans)",
              }}
            >
              {pr.body}
            </div>
          ) : (
            <p
              style={{
                fontStyle: "italic",
                color: "var(--text-muted)",
                fontSize: "0.875rem",
              }}
            >
              No description provided for this pull request.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
