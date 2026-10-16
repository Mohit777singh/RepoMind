import React, { useEffect, useState } from "react";
import {
  apiGetRepositoryIssues,
  apiGetRepositoryLabels,
  apiGetRepositoryPullRequests,
  apiTriageAllRepoIssues,
} from "../api";
import { Issue, PaginatedIssues, Repository } from "../types";
import { PullRequestExplorer } from "./PullRequestExplorer";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  ExternalLink,
  Filter,
  GitPullRequest,
  Loader2,
  MessageSquare,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";

interface IssueExplorerProps {
  repository: Repository;
  onBack: () => void;
  onSelectIssue: (issue: Issue) => void;
  onSyncRepo?: () => void;
}

export const IssueExplorer: React.FC<IssueExplorerProps> = ({
  repository,
  onBack,
  onSelectIssue,
  onSyncRepo,
}) => {
  const [activeTab, setActiveTab] = useState<"issues" | "pulls">("issues");
  const [prCount, setPrCount] = useState<number | null>(null);
  const [issuesData, setIssuesData] = useState<PaginatedIssues>({
    items: [],
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 1,
  });
  const [labels, setLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triagingAll, setTriagingAll] = useState(false);
  const [triageMessage, setTriageMessage] = useState<string | null>(null);

  // Filters state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLabel, setSelectedLabel] = useState<string>("all");
  const [titleSearch, setTitleSearch] = useState<string>("");

  const handleBatchTriage = async () => {
    setTriagingAll(true);
    setTriageMessage(null);
    try {
      const res = await apiTriageAllRepoIssues(repository.id);
      setTriageMessage(res.message);
      setTimeout(() => setTriageMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to batch triage repository issues.");
    } finally {
      setTriagingAll(false);
    }
  };

  // Load repository labels on mount
  useEffect(() => {
    async function loadLabels() {
      try {
        const repoLabels = await apiGetRepositoryLabels(repository.id);
        setLabels(repoLabels);
      } catch (err) {
        console.warn("Could not load repo labels:", err);
      }
    }
    loadLabels();
  }, [repository.id]);

  // Load repository PR count on mount
  useEffect(() => {
    async function loadPrCount() {
      try {
        const prs = await apiGetRepositoryPullRequests(repository.id, { page: 1, per_page: 1 });
        setPrCount(prs.total);
      } catch (err) {
        console.warn("Could not load repo PR count:", err);
      }
    }
    loadPrCount();
  }, [repository.id]);

  // Load issues whenever filter/pagination changes
  useEffect(() => {
    let isCancelled = false;

    async function loadIssues() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGetRepositoryIssues(repository.id, {
          page,
          per_page: perPage,
          status: statusFilter,
          label: selectedLabel,
          title: titleSearch,
        });
        if (!isCancelled) {
          setIssuesData(data);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Failed to load issues.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadIssues();
    return () => {
      isCancelled = true;
    };
  }, [repository.id, page, perPage, statusFilter, selectedLabel, titleSearch]);

  const handleResetFilters = () => {
    setStatusFilter("all");
    setSelectedLabel("all");
    setTitleSearch("");
    setPage(1);
  };

  const hasActiveFilters =
    statusFilter !== "all" || selectedLabel !== "all" || titleSearch.trim() !== "";

  return (
    <div>
      {/* Top Navigation & Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={15} />
          <span>Back to Repositories</span>
        </button>
        <span style={{ color: "var(--text-muted)" }}>/</span>
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{repository.full_name}</span>
      </div>

      {/* Repository Summary Banner */}
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
          padding: "1rem 1.5rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 700 }}>{repository.full_name}</h1>
            <a
              href={repository.html_url}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}
              title="Open GitHub"
            >
              <ExternalLink size={16} />
            </a>
          </div>
          {repository.description && (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              {repository.description}
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.85rem", flexWrap: "wrap" }}>
          <span style={{ color: "var(--text-secondary)" }}>
            Total Stored: <strong style={{ color: "var(--text-primary)" }}>{issuesData.total}</strong>
          </span>
          {repository.language && (
            <span className="badge badge-label" style={{ backgroundColor: "var(--bg-card)" }}>
              {repository.language}
            </span>
          )}

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleBatchTriage}
            disabled={triagingAll || issuesData.total === 0}
            style={{
              borderColor: "rgba(59, 130, 246, 0.5)",
              color: "#93c5fd",
            }}
          >
            {triagingAll ? (
              <>
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                <span>Triaging Repo...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} color="#a78bfa" />
                <span>Run Batch AI Triage</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* View Tabs: Issues vs Pull Requests */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === "issues" ? "active" : ""}`}
          onClick={() => setActiveTab("issues")}
        >
          <CircleDot size={16} />
          <span>Issues</span>
          <span
            className="badge badge-label"
            style={{
              marginLeft: "0.35rem",
              fontSize: "0.7rem",
              backgroundColor:
                activeTab === "issues"
                  ? "rgba(59, 130, 246, 0.2)"
                  : "var(--bg-card)",
              color:
                activeTab === "issues" ? "#93c5fd" : "var(--text-secondary)",
            }}
          >
            {issuesData.total}
          </span>
        </button>

        <button
          className={`tab-btn ${activeTab === "pulls" ? "active" : ""}`}
          onClick={() => setActiveTab("pulls")}
        >
          <GitPullRequest size={16} />
          <span>Pull Requests</span>
          {prCount !== null && (
            <span
              className="badge badge-label"
              style={{
                marginLeft: "0.35rem",
                fontSize: "0.7rem",
                backgroundColor:
                  activeTab === "pulls"
                    ? "rgba(168, 85, 247, 0.2)"
                    : "var(--bg-card)",
                color:
                  activeTab === "pulls" ? "#c084fc" : "var(--text-secondary)",
              }}
            >
              {prCount}
            </span>
          )}
        </button>
      </div>

      {/* Pull Requests Explorer Tab */}
      {activeTab === "pulls" && (
        <PullRequestExplorer
          repository={repository}
          onSyncRepo={onSyncRepo}
          onSelectIssue={onSelectIssue}
        />
      )}

      {/* Issues Explorer Tab */}
      {activeTab === "issues" && (
        <>
          {/* Filter and Search Bar */}
          <div
            className="card"
        style={{
          marginBottom: "1.5rem",
          padding: "1rem 1.25rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "1rem",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", flex: 1 }}>
          {/* Title Search */}
          <div style={{ position: "relative", minWidth: "240px", flex: 1, maxWidth: "340px" }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: "2.25rem", paddingRight: "2rem" }}
              placeholder="Search issues by title..."
              value={titleSearch}
              onChange={(e) => {
                setTitleSearch(e.target.value);
                setPage(1);
              }}
            />
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            {titleSearch && (
              <button
                onClick={() => setTitleSearch("")}
                style={{
                  position: "absolute",
                  right: "0.5rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              className="form-select"
              style={{ width: "auto" }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All States</option>
              <option value="open">Open Only</option>
              <option value="closed">Closed Only</option>
            </select>
          </div>

          {/* Label Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Tag size={15} color="var(--text-muted)" />
            <select
              className="form-select"
              style={{ width: "auto", maxWidth: "200px" }}
              value={selectedLabel}
              onChange={(e) => {
                setSelectedLabel(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Labels</option>
              {labels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleResetFilters}
              style={{ fontSize: "0.75rem" }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Page size selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Per page:</span>
          <select
            className="form-select"
            style={{ width: "auto" }}
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Triage feedback message */}
      {triageMessage && (
        <div className="alert alert-success">
          <Sparkles size={18} style={{ flexShrink: 0 }} />
          <div>{triageMessage}</div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 1rem auto" }} />
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Retrieving issues...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && issuesData.items.length === 0 && (
        <div className="empty-state">
          <Filter size={40} className="empty-state-icon" />
          <h3 className="empty-state-title">No Issues Found</h3>
          <p className="empty-state-desc">
            {hasActiveFilters
              ? "No issues match your current filters. Try resetting the filters or searching for different keywords."
              : "This repository has no stored issues yet. Try triggering a sync."}
          </p>
          {hasActiveFilters && (
            <button className="btn btn-primary btn-sm" onClick={handleResetFilters}>
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Issues Table / List */}
      {!loading && issuesData.items.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                    backgroundColor: "rgba(31, 41, 55, 0.4)",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  <th style={{ padding: "0.85rem 1.25rem", width: "80px" }}>#</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Title & Labels</th>
                  <th style={{ padding: "0.85rem 1rem", width: "100px" }}>Status</th>
                  <th style={{ padding: "0.85rem 1rem", width: "140px" }}>Author</th>
                  <th style={{ padding: "0.85rem 1rem", width: "100px", textAlign: "center" }}>Comments</th>
                  <th style={{ padding: "0.85rem 1.25rem", width: "120px", textAlign: "right" }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {issuesData.items.map((issue) => (
                  <tr
                    key={issue.id}
                    onClick={() => onSelectIssue(issue)}
                    style={{
                      borderBottom: "1px solid var(--border-color)",
                      cursor: "pointer",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "rgba(55, 65, 81, 0.35)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      #{issue.issue_number}
                    </td>

                    <td style={{ padding: "1rem 1rem" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
                        {issue.title}
                      </div>

                      {/* Labels */}
                      {issue.labels && issue.labels.length > 0 && (
                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
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
                      )}
                    </td>

                    <td style={{ padding: "1rem 1rem" }}>
                      <span
                        className={`badge ${
                          issue.state.toLowerCase() === "open" ? "badge-open" : "badge-closed"
                        }`}
                      >
                        {issue.state.toUpperCase()}
                      </span>
                    </td>

                    <td style={{ padding: "1rem 1rem", color: "var(--text-secondary)" }}>
                      {issue.author || "Unknown"}
                    </td>

                    <td style={{ padding: "1rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <MessageSquare size={13} />
                        {issue.comments_count}
                      </span>
                    </td>

                    <td style={{ padding: "1rem 1.25rem", textAlign: "right", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      {new Date(issue.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          <div
            style={{
              padding: "0.875rem 1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid var(--border-color)",
              backgroundColor: "rgba(17, 24, 39, 0.5)",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Showing {issuesData.items.length > 0 ? (page - 1) * perPage + 1 : 0} to{" "}
              {Math.min(page * perPage, issuesData.total)} of {issuesData.total} issues
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginRight: "0.5rem" }}>
                Page {issuesData.page} of {issuesData.total_pages}
              </span>

              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>

              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= issuesData.total_pages}
                onClick={() => setPage((prev) => Math.min(issuesData.total_pages, prev + 1))}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
