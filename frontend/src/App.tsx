import React, { useEffect, useState } from "react";
import {
  apiDeleteRepository,
  apiGetMe,
  apiListRepositories,
  apiSyncRepository,
  clearAuthToken,
  getAuthToken,
  getStoredUser,
} from "./api";
import { AddRepositoryModal } from "./components/AddRepositoryModal";
import { AuthModal } from "./components/AuthModal";
import { IssueDetailModal } from "./components/IssueDetailModal";
import { IssueExplorer } from "./components/IssueExplorer";
import { Navbar } from "./components/Navbar";
import { RepositoryList } from "./components/RepositoryList";
import { Issue, Repository, User } from "./types";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [addRepoModalOpen, setAddRepoModalOpen] = useState(false);

  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Check auth and load repositories
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      apiGetMe()
        .then((fetchedUser) => {
          setUser(fetchedUser);
          loadRepositories();
        })
        .catch(() => {
          clearAuthToken();
          setUser(null);
        });
    } else {
      // Auto open login dialog for immediate testing
      setAuthModalOpen(true);
    }

    const handleUnauthorized = () => {
      setUser(null);
      setAuthModalOpen(true);
      showNotification("error", "Session expired. Please log in.");
    };

    window.addEventListener("repomind_unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("repomind_unauthorized", handleUnauthorized);
    };
  }, []);

  const loadRepositories = async () => {
    setReposLoading(true);
    try {
      const data = await apiListRepositories();
      setRepositories(data);
    } catch (err: any) {
      console.warn("Failed to load repositories:", err);
    } finally {
      setReposLoading(false);
    }
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    showNotification("success", `Welcome back, ${authenticatedUser.username || authenticatedUser.email}!`);
    loadRepositories();
  };

  const handleLogout = () => {
    clearAuthToken();
    setUser(null);
    setSelectedRepo(null);
    setRepositories([]);
    showNotification("success", "You have been logged out.");
  };

  const handleSyncRepo = async (repo: Repository) => {
    try {
      await apiSyncRepository(repo.id);
      showNotification(
        "success",
        `Sync job started for ${repo.full_name}. Ingesting updates in background...`
      );
      // Refresh list after brief moment
      setTimeout(loadRepositories, 3000);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to trigger sync.");
    }
  };

  const handleDeleteRepo = async (repo: Repository) => {
    try {
      await apiDeleteRepository(repo.id);
      showNotification("success", `Repository ${repo.full_name} removed.`);
      if (selectedRepo?.id === repo.id) {
        setSelectedRepo(null);
      }
      loadRepositories();
    } catch (err: any) {
      showNotification("error", err.message || "Failed to delete repository.");
    }
  };

  return (
    <div className="app-container">
      <Navbar
        user={user}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenAddRepo={() => {
          if (!user) {
            setAuthMode("login");
            setAuthModalOpen(true);
          } else {
            setAddRepoModalOpen(true);
          }
        }}
        onGoHome={() => setSelectedRepo(null)}
      />

      <main className="main-content">
        {/* Global Notification Toast */}
        {notification && (
          <div
            className={`alert ${
              notification.type === "success" ? "alert-success" : "alert-danger"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            ) : (
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
            )}
            <div>{notification.message}</div>
          </div>
        )}

        {/* View Switcher: Repository List or Issue Explorer */}
        {selectedRepo ? (
          <IssueExplorer
            repository={selectedRepo}
            onBack={() => {
              setSelectedRepo(null);
              loadRepositories();
            }}
            onSelectIssue={(issue) => setSelectedIssue(issue)}
          />
        ) : (
          <RepositoryList
            repositories={repositories}
            loading={reposLoading}
            onSelectRepo={(repo) => setSelectedRepo(repo)}
            onDeleteRepo={handleDeleteRepo}
            onSyncRepo={handleSyncRepo}
            onOpenAddRepo={() => {
              if (!user) {
                setAuthMode("login");
                setAuthModalOpen(true);
              } else {
                setAddRepoModalOpen(true);
              }
            }}
          />
        )}
      </main>

      {/* Modals */}
      <AuthModal
        initialMode={authMode}
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <AddRepositoryModal
        isOpen={addRepoModalOpen}
        onClose={() => setAddRepoModalOpen(false)}
        onSuccess={() => {
          showNotification("success", "Repository successfully ingested!");
          loadRepositories();
        }}
      />

      <IssueDetailModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
      />
    </div>
  );
};
