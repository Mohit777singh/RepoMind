import React, { useEffect, useState } from "react";
import { apiGetRepositoryPullRequests } from "../api";
import { PaginatedPullRequests, PullRequest, Repository } from "../types";
import { PullRequestDetailModal } from "./PullRequestDetailModal";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCode,
  Filter,
  GitMerge,
  GitPullRequest,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

interface PullRequestExplorerProps {
  repository: Repository;
  onSyncRepo?: () => void;
}

export const PullRequestExplorer: React.FC<PullRequestExplorerProps> = ({
  repository,
  onSyncRepo,
}) => {
  const [prsData, setPrsData] = useState<PaginatedPullRequests>({
    items: [],
    total: 0,
    page: 1,
    per_page: 10,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPr, setSelectedPr] = useState<PullRequest | null>(null);

  // Filters state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [titleSearch, setTitleSearch] = useState<string>("");

  useEffect(() => {
    let isCancelled = false;

    async function loadPullRequests() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGetRepositoryPullRequests(repository.id, {
          page,
          per_page: perPage,
          status: statusFilter,
          title: titleSearch,
        });
        if (!isCancelled) {
          setPrsData(data);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Failed to load pull requests.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadPullRequests();
    return () => {
      isCancelled = true;
    };
  }, [repository.id, page, perPage, statusFilter, titleSearch]);

  const handleResetFilters = () => {
    setStatusFilter("all");
    setTitleSearch("");
    setPage(1);
  };

  const hasActiveFilters =
    statusFilter !== "all" || titleSearch.trim() !== "";

  return (
    <div>
      {/* Search and Filters Bar */}
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
            flex: 1,
          }}
        >
          {/* Title Search */}
          <div
            style={{
              position: "relative",
              minWidth: "240px",
              flex: 1,
              maxWidth: "340px",
            }}
          >
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: "2.25rem", paddingRight: "2rem" }}
              placeholder="Search pull requests..."
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
              <option value="all">All Pull Requests</option>
              <option value="open">Open Only</option>
              <option value="merged">Merged Only</option>
              <option value="closed">Closed (Unmerged) Only</option>
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

        {/* Page size selector & Sync trigger */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {onSyncRepo && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onSyncRepo}
              title="Sync repository with GitHub to ingest latest PRs"
            >
              <RefreshCw size={13} />
              <span>Sync PRs</span>
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Per page:
            </span>
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
      </div>

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
            Retrieving pull requests...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && prsData.items.length === 0 && (
        <div className="empty-state">
          <GitPullRequest size={42} className="empty-state-icon" />
          <h3 className="empty-state-title">No Pull Requests Found</h3>
          <p className="empty-state-desc">
            {hasActiveFilters
              ? "No pull requests match your search criteria. Try adjusting or clearing filters."
              : "No pull requests have been stored for this repository yet. If this repository was ingested earlier, trigger a sync to pull PRs."}
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
            {hasActiveFilters && (
              <button className="btn btn-secondary btn-sm" onClick={handleResetFilters}>
                Reset Filters
              </button>
            )}
            {onSyncRepo && !hasActiveFilters && (
              <button className="btn btn-primary btn-sm" onClick={onSyncRepo}>
                <RefreshCw size={14} />
                <span>Sync Repository from GitHub</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* PR Table / List */}
      {!loading && prsData.items.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.875rem",
              }}
            >
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
                  <th style={{ padding: "0.85rem 1rem", width: "120px" }}>Status</th>
                  <th style={{ padding: "0.85rem 1rem", width: "140px" }}>Author</th>
                  <th style={{ padding: "0.85rem 1rem", width: "130px", textAlign: "right" }}>
                    Date
                  </th>
                  <th style={{ padding: "0.85rem 1.25rem", width: "140px", textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {prsData.items.map((pr) => {
                  const isMerged = pr.is_merged || pr.state.toLowerCase() === "merged";
                  const isOpen = pr.state.toLowerCase() === "open";

                  return (
                    <tr
                      key={pr.id}
                      onClick={() => setSelectedPr(pr)}
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
                      <td
                        style={{
                          padding: "1rem 1.25rem",
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        #{pr.pr_number}
                      </td>

                      <td style={{ padding: "1rem 1rem" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            marginBottom: "0.35rem",
                          }}
                        >
                          {pr.title}
                        </div>

                        {/* Labels */}
                        {pr.labels && pr.labels.length > 0 && (
                          <div
                            style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}
                          >
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
                      </td>

                      <td style={{ padding: "1rem 1rem" }}>
                        {isMerged ? (
                          <span className="badge badge-merged">
                            <GitMerge size={12} />
                            <span>MERGED</span>
                          </span>
                        ) : isOpen ? (
                          <span className="badge badge-open">
                            <GitPullRequest size={12} />
                            <span>OPEN</span>
                          </span>
                        ) : (
                          <span className="badge badge-closed">
                            <GitPullRequest size={12} />
                            <span>CLOSED</span>
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "1rem 1rem", color: "var(--text-secondary)" }}>
                        {pr.author || "Unknown"}
                      </td>

                      <td
                        style={{
                          padding: "1rem 1rem",
                          textAlign: "right",
                          color: "var(--text-muted)",
                          fontSize: "0.8rem",
                        }}
                      >
                        {isMerged && pr.merged_at
                          ? `Merged ${new Date(pr.merged_at).toLocaleDateString()}`
                          : new Date(pr.created_at).toLocaleDateString()}
                      </td>

                      <td
                        style={{
                          padding: "1rem 1.25rem",
                          textAlign: "right",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                          }}
                        >
                          {pr.diff_url && (
                            <a
                              href={pr.diff_url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{
                                padding: "3px 6px",
                                fontSize: "0.75rem",
                                color: "#93c5fd",
                              }}
                              title="View GitHub raw diff"
                            >
                              <FileCode size={13} />
                              <span>Diff</span>
                            </a>
                          )}

                          {pr.html_url && (
                            <a
                              href={pr.html_url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "3px 6px", fontSize: "0.75rem" }}
                              title="Open in GitHub"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
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
              Showing {prsData.items.length > 0 ? (page - 1) * perPage + 1 : 0} to{" "}
              {Math.min(page * perPage, prsData.total)} of {prsData.total} pull requests
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  marginRight: "0.5rem",
                }}
              >
                Page {prsData.page} of {prsData.total_pages}
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
                disabled={page >= prsData.total_pages}
                onClick={() =>
                  setPage((prev) => Math.min(prsData.total_pages, prev + 1))
                }
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PR Detail Modal */}
      <PullRequestDetailModal
        pr={selectedPr}
        onClose={() => setSelectedPr(null)}
      />
    </div>
  );
};
