export interface User {
  id: number;
  email: string;
  username: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Repository {
  id: number;
  github_repo_id: number;
  full_name: string;
  name: string;
  owner: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  last_synced_at: string | null;
  created_at: string;
  stored_issues_count?: number;
}

export interface IssueLabel {
  name: string;
  color?: string;
  description?: string;
}

export interface Issue {
  id: number;
  repository_id: number;
  github_issue_id: number;
  issue_number: number;
  title: string;
  body: string | null;
  state: "open" | "closed" | string;
  author: string | null;
  labels: (IssueLabel | string)[];
  comments_count: number;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface PaginatedIssues {
  items: Issue[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface IngestionJob {
  id: number;
  repository_id: number | null;
  repository_name: string;
  status: "pending" | "running" | "completed" | "failed";
  total_issues_ingested: number;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface IngestAcceptedResponse {
  message: string;
  job_id: number;
  status: string;
  repository_name: string;
}
