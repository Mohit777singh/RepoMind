import React, { useState } from "react";
import { Repository } from "../types";
import {
  ExternalLink,
  GitFork,
  Layers,
  PlusCircle,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";

interface RepositoryListProps {
  repositories: Repository[];
  loading: boolean;
  onSelectRepo: (repo: Repository) => void;
  onDeleteRepo: (repo: Repository) => void;
  onSyncRepo: (repo: Repository) => void;
  onOpenAddRepo: () => void;
}

export const RepositoryList: React.FC<RepositoryListProps> = ({
  repositories,
  loading,
  onSelectRepo,
  onDeleteRepo,
  onSyncRepo,
  onOpenAddRepo,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const filteredRepos = repositories.filter(
    (r) =>
      r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.language && r.language.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSync = async (repo: Repository, e: React.MouseEvent) => {
    e.stopPropagation();
    setSyncingId(repo.id);
    try {
      await onSyncRepo(repo);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = (repo: Repository, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove "${repo.full_name}" from RepoMind? All stored issues will be removed.`)) {
      onDeleteRepo(repo);
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>
            Repositories
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Explore synchronized GitHub projects and analyze issues
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Search repos */}
          <div style={{ position: "relative", minWidth: "240px" }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: "2.25rem", paddingRight: "0.75rem" }}
              placeholder="Filter repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
          </div>

          <button className="btn btn-primary" onClick={onOpenAddRepo}>
            <PlusCircle size={16} />
            <span>Add Repository</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="card" style={{ height: "180px", opacity: 0.6 }}>
              <div className="spinner" style={{ margin: "3rem auto" }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && repositories.length === 0 && (
        <div className="empty-state">
          <Layers size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">No Repositories Synchronized Yet</h3>
          <p className="empty-state-desc">
            Add a public GitHub repository (e.g. <code>pallets/flask</code>) to ingest its issues, view metadata, and test filtering and pagination.
          </p>
          <button className="btn btn-primary" onClick={onOpenAddRepo}>
            <PlusCircle size={16} />
            <span>Add Your First Repository</span>
          </button>
        </div>
      )}

      {/* No search results */}
      {!loading && repositories.length > 0 && filteredRepos.length === 0 && (
        <div className="empty-state">
          <Search size={40} className="empty-state-icon" />
          <h3 className="empty-state-title">No Repositories Found</h3>
          <p className="empty-state-desc">
            No repositories match your filter query "<strong>{searchTerm}</strong>".
          </p>
          <button className="btn btn-secondary btn-sm" onClick={() => setSearchTerm("")}>
            Clear Filter
          </button>
        </div>
      )}

      {/* Grid of Repositories */}
      {!loading && filteredRepos.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              className="card card-hover"
              onClick={() => onSelectRepo(repo)}
              style={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                {/* Title & External Link */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "var(--accent-primary)",
                      wordBreak: "break-word",
                    }}
                  >
                    {repo.full_name}
                  </h3>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="View on GitHub"
                    style={{ color: "var(--text-muted)", padding: "2px" }}
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>

                {/* Description */}
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                    margin: "0.6rem 0 1rem 0",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    minHeight: "2.5rem",
                  }}
                >
                  {repo.description || "No description provided."}
                </p>

                {/* Stats Tags */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {repo.language && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "#3b82f6",
                          display: "inline-block",
                        }}
                      />
                      {repo.language}
                    </span>
                  )}
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Star size={13} color="#f59e0b" />
                    {repo.stargazers_count.toLocaleString()}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <GitFork size={13} />
                    {repo.forks_count.toLocaleString()}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span className="badge badge-open" style={{ padding: "1px 6px", fontSize: "0.7rem" }}>
                      {repo.stored_issues_count ?? repo.open_issues_count} issues
                    </span>
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "1.25rem",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid var(--border-color)",
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {repo.last_synced_at
                    ? `Synced ${new Date(repo.last_synced_at).toLocaleDateString()}`
                    : "Not yet synced"}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    title="Re-sync repository issues"
                    disabled={syncingId === repo.id}
                    onClick={(e) => handleSync(repo, e)}
                  >
                    <RefreshCw
                      size={13}
                      style={{
                        animation: syncingId === repo.id ? "spin 1s linear infinite" : "none",
                      }}
                    />
                    <span>Sync</span>
                  </button>

                  <button
                    className="btn btn-danger btn-sm"
                    title="Delete repository"
                    onClick={(e) => handleDelete(repo, e)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
