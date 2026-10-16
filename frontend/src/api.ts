import {
  AuthResponse,
  IngestAcceptedResponse,
  IngestionJob,
  Issue,
  IssueAnalysis,
  PaginatedIssues,
  PaginatedPullRequests,
  PullRequest,
  Repository,
  User,
} from "./types";

const API_BASE = "/api";

export function getAuthToken(): string | null {
  return localStorage.getItem("repomind_token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("repomind_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("repomind_token");
  localStorage.removeItem("repomind_user");
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem("repomind_user");
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  localStorage.setItem("repomind_user", JSON.stringify(user));
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Auth expired
    clearAuthToken();
    window.dispatchEvent(new Event("repomind_unauthorized"));
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.detail || `Error (${response.status}): ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// Authentication
export async function apiRegister(email: string, password: string, username?: string): Promise<User> {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, username }),
  });
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(res.access_token);
  setStoredUser(res.user);
  return res;
}

export async function apiGetMe(): Promise<User> {
  return request<User>("/auth/me");
}

// Repositories
export async function apiListRepositories(): Promise<Repository[]> {
  return request<Repository[]>("/repositories");
}

export async function apiGetRepository(id: number): Promise<Repository> {
  return request<Repository>(`/repositories/${id}`);
}

export async function apiAddRepository(repoUrlOrName: string): Promise<IngestAcceptedResponse> {
  return request<IngestAcceptedResponse>("/repositories", {
    method: "POST",
    body: JSON.stringify({ repo_url_or_name: repoUrlOrName }),
  });
}

export async function apiDeleteRepository(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/repositories/${id}`, {
    method: "DELETE",
  });
}

export async function apiSyncRepository(id: number): Promise<IngestAcceptedResponse> {
  return request<IngestAcceptedResponse>(`/repositories/${id}/sync`, {
    method: "POST",
  });
}

// Ingestion Jobs
export async function apiGetJobStatus(jobId: number): Promise<IngestionJob> {
  return request<IngestionJob>(`/jobs/${jobId}`);
}

// Issues
export async function apiGetRepositoryIssues(
  repoId: number,
  params: {
    page?: number;
    per_page?: number;
    status?: string;
    label?: string;
    title?: string;
  }
): Promise<PaginatedIssues> {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.per_page) query.append("per_page", params.per_page.toString());
  if (params.status && params.status !== "all") query.append("status", params.status);
  if (params.label && params.label !== "all") query.append("label", params.label);
  if (params.title && params.title.trim()) query.append("title", params.title.trim());

  return request<PaginatedIssues>(`/repositories/${repoId}/issues?${query.toString()}`);
}

export async function apiGetRepositoryLabels(repoId: number): Promise<string[]> {
  return request<string[]>(`/repositories/${repoId}/labels`);
}

export async function apiGetIssueDetails(issueId: number): Promise<Issue> {
  return request<Issue>(`/issues/${issueId}`);
}

// Issue Intelligence & Debugging (Evaluation 2)
export async function apiDiagnoseIssue(issueId: number): Promise<IssueAnalysis> {
  return request<IssueAnalysis>(`/issues/${issueId}/diagnose`, {
    method: "POST",
  });
}

export async function apiGetIssueAnalysis(issueId: number): Promise<IssueAnalysis> {
  return request<IssueAnalysis>(`/issues/${issueId}/analysis`);
}

export async function apiTriageAllRepoIssues(
  repoId: number
): Promise<{ message: string; total_analyzed: number }> {
  return request<{ message: string; total_analyzed: number }>(
    `/repositories/${repoId}/triage-all`,
    {
      method: "POST",
    }
  );
}

// Pull Requests (Evaluation 2 Extended Ingestion)
export async function apiGetRepositoryPullRequests(
  repoId: number,
  params: {
    page?: number;
    per_page?: number;
    status?: string;
    title?: string;
  }
): Promise<PaginatedPullRequests> {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.per_page) query.append("per_page", params.per_page.toString());
  if (params.status && params.status !== "all") query.append("status", params.status);
  if (params.title && params.title.trim()) query.append("title", params.title.trim());

  return request<PaginatedPullRequests>(`/repositories/${repoId}/pulls?${query.toString()}`);
}

export async function apiGetPullRequestDetails(prId: number): Promise<PullRequest> {
  return request<PullRequest>(`/pulls/${prId}`);
}


