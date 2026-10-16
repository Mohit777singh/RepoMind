import React, { useEffect, useState } from "react";
import { apiGetPullRequestChanges, apiSyncPullRequestDiffs } from "../api";
import { CodeDiff, PullRequest, PullRequestChanges } from "../types";
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  ExternalLink,
  FileCode,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Loader2,
  RefreshCw,
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
  const [activeTab, setActiveTab] = useState<"overview" | "commits" | "diffs">("overview");
  const [changes, setChanges] = useState<PullRequestChanges | null>(null);
  const [loadingChanges, setLoadingChanges] = useState(false);
  const [syncingChanges, setSyncingChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!pr) {
      setChanges(null);
      setActiveTab("overview");
      setError(null);
      setExpandedFiles({});
      return;
    }

    let isCancelled = false;
    setLoadingChanges(true);
    setError(null);

    apiGetPullRequestChanges(pr.id, true)
      .then((data) => {
        if (!isCancelled) {
          setChanges(data);
          // By default expand first 5 files
          const initialExpanded: Record<number, boolean> = {};
          data.files.slice(0, 5).forEach((f) => {
            initialExpanded[f.id] = true;
          });
          setExpandedFiles(initialExpanded);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || "Failed to load commits and diffs.");
        }
      })
      .finally(() => {
        if (!isCancelled) setLoadingChanges(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [pr]);

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

  const handleForceSyncDiffs = async () => {
    setSyncingChanges(true);
    setError(null);
    try {
      const data = await apiSyncPullRequestDiffs(pr.id);
      setChanges(data);
      const initialExpanded: Record<number, boolean> = {};
      data.files.slice(0, 5).forEach((f) => {
        initialExpanded[f.id] = true;
      });
      setExpandedFiles(initialExpanded);
    } catch (err: any) {
      setError(err.message || "Failed to sync diffs from GitHub.");
    } finally {
      setSyncingChanges(false);
    }
  };

  const toggleFileExpansion = (fileId: number) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [fileId]: !prev[fileId],
    }));
  };

  const renderDiffLine = (line: string, idx: number) => {
    let bg = "transparent";
    let color = "var(--text-secondary)";

    if (line.startsWith("+") && !line.startsWith("+++")) {
      color = "#34d399";
      bg = "rgba(16, 185, 129, 0.15)";
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      color = "#f87171";
      bg = "rgba(239, 68, 68, 0.15)";
    } else if (line.startsWith("@@")) {
      color = "#60a5fa";
      bg = "rgba(59, 130, 246, 0.12)";
    } else if (line.startsWith("---") || line.startsWith("+++")) {
      color = "#a78bfa";
      bg = "rgba(139, 92, 246, 0.1)";
    }

    return (
      <div
        key={idx}
        style={{
          padding: "2px 8px",
          backgroundColor: bg,
          color: color,
          fontFamily: "var(--font-mono)",
          fontSize: "0.82rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          lineHeight: 1.5,
        }}
      >
        {line}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "added":
        return (
          <span
            className="badge"
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}
          >
            ADDED
          </span>
        );
      case "removed":
        return (
          <span
            className="badge"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            REMOVED
          </span>
        );
      case "renamed":
        return (
          <span
            className="badge"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.15)",
              color: "#fbbf24",
              border: "1px solid rgba(245, 158, 11, 0.3)",
            }}
          >
            RENAMED
          </span>
        );
      default:
        return (
          <span
            className="badge"
            style={{
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              color: "#60a5fa",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            }}
          >
            MODIFIED
          </span>
        );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "880px",
          width: "95%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            alignItems: "flex-start",
            gap: "1rem",
            flexShrink: 0,
            paddingBottom: "1rem",
            borderBottom: "1px solid var(--border-color)",
          }}
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

              {changes && (
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    marginLeft: "0.5rem",
                  }}
                >
                  <strong style={{ color: "#34d399" }}>+{changes.total_additions}</strong>{" "}
                  <strong style={{ color: "#f87171" }}>-{changes.total_deletions}</strong> in{" "}
                  {changes.total_files_changed} file{changes.total_files_changed === 1 ? "" : "s"}
                </span>
              )}
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

        {/* Navigation Sub-Tabs */}
        <div
          className="tabs-nav"
          style={{
            margin: "0",
            padding: "0.5rem 0",
            borderBottom: "1px solid var(--border-color)",
            flexShrink: 0,
          }}
        >
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <GitPullRequest size={15} />
            <span>Overview</span>
          </button>

          <button
            className={`tab-btn ${activeTab === "commits" ? "active" : ""}`}
            onClick={() => setActiveTab("commits")}
          >
            <GitCommit size={15} />
            <span>Commits</span>
            <span
              className="badge badge-label"
              style={{
                marginLeft: "0.35rem",
                fontSize: "0.7rem",
                backgroundColor:
                  activeTab === "commits"
                    ? "rgba(59, 130, 246, 0.2)"
                    : "var(--bg-card)",
              }}
            >
              {changes ? changes.total_commits : "..."}
            </span>
          </button>

          <button
            className={`tab-btn ${activeTab === "diffs" ? "active" : ""}`}
            onClick={() => setActiveTab("diffs")}
          >
            <Code2 size={15} />
            <span>Changed Files & Diffs</span>
            <span
              className="badge badge-label"
              style={{
                marginLeft: "0.35rem",
                fontSize: "0.7rem",
                backgroundColor:
                  activeTab === "diffs"
                    ? "rgba(168, 85, 247, 0.2)"
                    : "var(--bg-card)",
              }}
            >
              {changes ? changes.total_files_changed : "..."}
            </span>
          </button>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleForceSyncDiffs}
              disabled={syncingChanges || loadingChanges}
              title="Force re-sync commits and code diffs from GitHub"
              style={{ fontSize: "0.75rem", padding: "3px 8px" }}
            >
              {syncingChanges ? (
                <>
                  <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={12} />
                  <span>Sync Diffs</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="alert alert-danger" style={{ margin: "1rem 0" }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 0" }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div>
              {/* Metadata row */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1.25rem",
                  paddingBottom: "1rem",
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

              {/* Action buttons */}
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
                    style={{
                      borderColor: "rgba(59, 130, 246, 0.4)",
                      color: "#93c5fd",
                    }}
                  >
                    <FileCode size={14} />
                    <span>View Raw Diff (.diff)</span>
                  </a>
                )}

                <button className="btn btn-secondary btn-sm" onClick={handleCopyLink}>
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

              {/* Description Body */}
              <div style={{ marginTop: "1rem" }}>
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
          )}

          {/* TAB 2: COMMITS */}
          {activeTab === "commits" && (
            <div>
              {loadingChanges ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <div className="spinner" style={{ margin: "0 auto 1rem auto" }} />
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    Loading pull request commits...
                  </p>
                </div>
              ) : changes && changes.commits.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {changes.commits.map((c) => (
                    <div
                      key={c.id}
                      className="card"
                      style={{
                        padding: "0.85rem 1.15rem",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "1rem",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.35rem",
                          }}
                        >
                          <GitCommit size={15} color="var(--accent-primary)" />
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: "0.9rem",
                              color: "var(--text-primary)",
                            }}
                          >
                            {c.message.split("\n")[0]}
                          </span>
                        </div>

                        {c.message.includes("\n") && (
                          <p
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-secondary)",
                              marginBottom: "0.35rem",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {c.message.split("\n").slice(1).join("\n").trim()}
                          </p>
                        )}

                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                            display: "flex",
                            gap: "0.85rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <span>By: <strong style={{ color: "var(--text-secondary)" }}>{c.author_name || "Unknown"}</strong></span>
                          {c.committed_at && (
                            <span>{new Date(c.committed_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.78rem",
                            backgroundColor: "var(--bg-primary)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid var(--border-color)",
                            color: "#93c5fd",
                          }}
                        >
                          {c.sha.slice(0, 7)}
                        </span>
                        {c.html_url && (
                          <a
                            href={c.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "2px 6px" }}
                            title="Open commit on GitHub"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: "2.5rem 1rem" }}>
                  <GitCommit size={36} className="empty-state-icon" />
                  <h4 className="empty-state-title">No Commits Ingested Yet</h4>
                  <p className="empty-state-desc">
                    Click "Sync Diffs" in the top bar to pull commit history directly from GitHub.
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={handleForceSyncDiffs}>
                    <RefreshCw size={13} />
                    <span>Sync Commits Now</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHANGED FILES & DIFFS */}
          {activeTab === "diffs" && (
            <div>
              {loadingChanges ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <div className="spinner" style={{ margin: "0 auto 1rem auto" }} />
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    Loading changed files and code diffs...
                  </p>
                </div>
              ) : changes && changes.files.length > 0 ? (
                <div>
                  {/* Summary bar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "var(--bg-primary)",
                      padding: "0.75rem 1rem",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-color)",
                      marginBottom: "1rem",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>
                      Showing{" "}
                      <strong style={{ color: "var(--text-primary)" }}>
                        {changes.total_files_changed}
                      </strong>{" "}
                      changed file{changes.total_files_changed === 1 ? "" : "s"}
                    </span>

                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <span style={{ color: "#34d399", fontWeight: 600 }}>
                        +{changes.total_additions} lines
                      </span>
                      <span style={{ color: "#f87171", fontWeight: 600 }}>
                        -{changes.total_deletions} lines
                      </span>
                    </div>
                  </div>

                  {/* List of files with diff accordions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {changes.files.map((file: CodeDiff) => {
                      const isExpanded = !!expandedFiles[file.id];
                      return (
                        <div
                          key={file.id}
                          className="card"
                          style={{
                            padding: 0,
                            overflow: "hidden",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {/* File Header */}
                          <div
                            onClick={() => toggleFileExpansion(file.id)}
                            style={{
                              padding: "0.75rem 1rem",
                              backgroundColor: "rgba(31, 41, 55, 0.4)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              cursor: "pointer",
                              userSelect: "none",
                              borderBottom: isExpanded ? "1px solid var(--border-color)" : "none",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              {getStatusBadge(file.status)}
                              <span
                                style={{
                                  fontFamily: "var(--font-mono)",
                                  fontWeight: 600,
                                  fontSize: "0.85rem",
                                  color: "var(--text-primary)",
                                }}
                              >
                                {file.filename}
                              </span>
                              {file.previous_filename && (
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--text-muted)",
                                    fontStyle: "italic",
                                  }}
                                >
                                  (from {file.previous_filename})
                                </span>
                              )}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                <strong style={{ color: "#34d399" }}>+{file.additions}</strong>{" "}
                                <strong style={{ color: "#f87171" }}>-{file.deletions}</strong>
                              </span>

                              {file.raw_url && (
                                <a
                                  href={file.raw_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: "2px 6px" }}
                                  title="View raw file on GitHub"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* File Diff Content */}
                          {isExpanded && (
                            <div
                              style={{
                                backgroundColor: "var(--bg-primary)",
                                maxHeight: "400px",
                                overflowY: "auto",
                                padding: "0.5rem 0",
                              }}
                            >
                              {file.diff_content ? (
                                file.diff_content
                                  .split("\n")
                                  .map((line, lIdx) => renderDiffLine(line, lIdx))
                              ) : (
                                <div
                                  style={{
                                    padding: "1rem",
                                    color: "var(--text-muted)",
                                    fontStyle: "italic",
                                    fontSize: "0.825rem",
                                    textAlign: "center",
                                  }}
                                >
                                  Binary file or diff not available in patch.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: "2.5rem 1rem" }}>
                  <Code2 size={36} className="empty-state-icon" />
                  <h4 className="empty-state-title">No Code Diffs Ingested Yet</h4>
                  <p className="empty-state-desc">
                    Click "Sync Diffs" in the top bar to fetch the changed files and unified diff patches from GitHub.
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={handleForceSyncDiffs}>
                    <RefreshCw size={13} />
                    <span>Sync Code Diffs Now</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
