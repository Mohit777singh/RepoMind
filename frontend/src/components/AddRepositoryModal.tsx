import React, { useEffect, useRef, useState } from "react";
import { apiAddRepository, apiGetJobStatus } from "../api";
import { IngestionJob } from "../types";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  GitBranch,
  Loader2,
  X,
} from "lucide-react";

interface AddRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddRepositoryModal: React.FC<AddRepositoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [repoInput, setRepoInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeJob, setActiveJob] = useState<IngestionJob | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const startPolling = (jobId: number) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = window.setInterval(async () => {
      try {
        const job = await apiGetJobStatus(jobId);
        setActiveJob(job);

        if (job.status === "completed") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setIsSubmitting(false);
          // Let user see completed state briefly before closing
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 1500);
        } else if (job.status === "failed") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setIsSubmitting(false);
          setError(job.error_message || "Ingestion failed unexpectedly.");
        }
      } catch (err: any) {
        console.error("Polling error:", err);
      }
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    setError(null);
    setIsSubmitting(true);
    setActiveJob(null);

    try {
      const res = await apiAddRepository(repoInput.trim());
      setActiveJob({
        id: res.job_id,
        repository_id: null,
        repository_name: res.repository_name,
        status: "pending",
        total_issues_ingested: 0,
        started_at: new Date().toISOString(),
        completed_at: null,
        error_message: null,
      });
      startPolling(res.job_id);
    } catch (err: any) {
      setError(err.message || "Failed to initiate repository ingestion.");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setRepoInput("");
    setError(null);
    setIsSubmitting(false);
    setActiveJob(null);
    onClose();
  };

  const selectExample = (example: string) => {
    setRepoInput(example);
    setError(null);
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "520px" }}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <GitBranch size={22} color="#3b82f6" />
            <h2 className="modal-title">Add GitHub Repository</h2>
          </div>
          <button className="close-btn" onClick={handleClose} disabled={isSubmitting && activeJob?.status === "running"}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {/* Live Ingestion Job Progress Status */}
        {activeJob && (
          <div
            style={{
              padding: "1rem",
              borderRadius: "8px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                Job #{activeJob.id}: {activeJob.repository_name}
              </span>
              <span
                className={`badge ${
                  activeJob.status === "completed"
                    ? "badge-open"
                    : activeJob.status === "failed"
                    ? "badge-closed"
                    : "badge-label"
                }`}
              >
                {activeJob.status.toUpperCase()}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.875rem" }}>
              {activeJob.status === "pending" && (
                <>
                  <Clock size={16} color="#f59e0b" />
                  <span>Job queued in background task runner...</span>
                </>
              )}
              {activeJob.status === "running" && (
                <>
                  <Loader2 size={16} className="spinner-sm" color="#3b82f6" style={{ animation: "spin 1s linear infinite" }} />
                  <span>Connecting to GitHub API & retrieving issues...</span>
                </>
              )}
              {activeJob.status === "completed" && (
                <>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span style={{ color: "#34d399", fontWeight: 500 }}>
                    Successfully ingested {activeJob.total_issues_ingested} issues!
                  </span>
                </>
              )}
              {activeJob.status === "failed" && (
                <>
                  <AlertCircle size={16} color="#ef4444" />
                  <span style={{ color: "#f87171" }}>
                    Ingestion failed: {activeJob.error_message}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Repository Name or URL</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. pallets/flask or https://github.com/pallets/flask"
              value={repoInput}
              disabled={isSubmitting}
              onChange={(e) => setRepoInput(e.target.value)}
            />
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
              Accepts <code>owner/repo</code> or full GitHub repository URLs.
            </p>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginRight: "0.5rem" }}>
              Try examples:
            </span>
            <div style={{ display: "inline-flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.35rem" }}>
              {["pallets/flask", "psf/requests", "tiangolo/fastapi"].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => selectExample(ex)}
                  disabled={isSubmitting}
                  style={{
                    fontSize: "0.75rem",
                    padding: "2px 8px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    color: "var(--accent-primary)",
                    cursor: "pointer",
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !repoInput.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Ingesting...</span>
                </>
              ) : (
                "Start Ingestion"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
