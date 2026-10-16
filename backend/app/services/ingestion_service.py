from datetime import datetime, timezone
import logging
from typing import Any
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.ingestion_job import IngestionJob
from app.models.issue import Issue
from app.models.repository import Repository
from app.services.github_client import (
    GitHubAPIError,
    GitHubClient,
    GitHubNotFoundError,
    GitHubRateLimitError,
)

logger = logging.getLogger(__name__)

def parse_iso_datetime(dt_str: str | None) -> datetime | None:
    if not dt_str:
        return None
    try:
        # Replace 'Z' with UTC offset
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except Exception:
        return None

class IngestionService:
    def __init__(self, github_client: GitHubClient | None = None):
        self.github_client = github_client or GitHubClient()

    async def run_ingestion_job(self, job_id: int):
        """
        Background task to run repository and issue ingestion.
        Uses its own database session to avoid thread/async issues.
        """
        db: Session = SessionLocal()
        try:
            job = db.query(IngestionJob).filter(IngestionJob.id == job_id).first()
            if not job:
                logger.error(f"Ingestion job {job_id} not found.")
                return

            # Mark as running
            job.status = "running"
            db.commit()

            repo_name = job.repository_name
            parts = repo_name.split("/")
            if len(parts) != 2:
                raise ValueError(f"Invalid repository full name format: {repo_name}")
            owner, repo = parts[0], parts[1]

            # 1. Fetch Repository Metadata
            repo_data = await self.github_client.get_repository(owner, repo)

            # Insert or update repository record
            repository = (
                db.query(Repository)
                .filter(Repository.full_name == repo_data["full_name"])
                .first()
            )
            now_utc = datetime.now(timezone.utc)
            if not repository:
                repository = Repository(
                    github_repo_id=repo_data["id"],
                    full_name=repo_data["full_name"],
                    name=repo_data["name"],
                    owner=repo_data["owner"]["login"],
                    description=repo_data.get("description"),
                    html_url=repo_data["html_url"],
                    language=repo_data.get("language"),
                    stargazers_count=repo_data.get("stargazers_count", 0),
                    forks_count=repo_data.get("forks_count", 0),
                    open_issues_count=repo_data.get("open_issues_count", 0),
                    last_synced_at=now_utc,
                )
                db.add(repository)
                db.flush()  # get repository.id
            else:
                repository.name = repo_data["name"]
                repository.owner = repo_data["owner"]["login"]
                repository.description = repo_data.get("description")
                repository.html_url = repo_data["html_url"]
                repository.language = repo_data.get("language")
                repository.stargazers_count = repo_data.get("stargazers_count", 0)
                repository.forks_count = repo_data.get("forks_count", 0)
                repository.open_issues_count = repo_data.get("open_issues_count", 0)
                repository.last_synced_at = now_utc

            # Link job to repository
            job.repository_id = repository.id
            db.commit()

            # 2. Fetch Issues (up to 3 pages, excluding PRs)
            raw_issues = await self.github_client.get_issues(owner, repo, max_pages=3, per_page=100)

            # Upsert issues
            ingested_count = 0
            for item in raw_issues:
                github_issue_id = item["id"]
                existing_issue = (
                    db.query(Issue)
                    .filter(
                        Issue.repository_id == repository.id,
                        Issue.github_issue_id == github_issue_id,
                    )
                    .first()
                )

                # Format labels as list of dicts
                labels_formatted = []
                for label in item.get("labels", []):
                    if isinstance(label, dict):
                        labels_formatted.append({
                            "name": label.get("name"),
                            "color": label.get("color"),
                            "description": label.get("description"),
                        })
                    elif isinstance(label, str):
                        labels_formatted.append({"name": label, "color": "6e7681"})

                author_login = item.get("user", {}).get("login") if item.get("user") else None
                created_at = parse_iso_datetime(item.get("created_at")) or now_utc
                updated_at = parse_iso_datetime(item.get("updated_at")) or now_utc
                closed_at = parse_iso_datetime(item.get("closed_at"))

                if existing_issue:
                    existing_issue.title = item.get("title", "")
                    existing_issue.body = item.get("body")
                    existing_issue.state = item.get("state", "open")
                    existing_issue.author = author_login
                    existing_issue.labels = labels_formatted
                    existing_issue.comments_count = item.get("comments", 0)
                    existing_issue.html_url = item.get("html_url", "")
                    existing_issue.updated_at = updated_at
                    existing_issue.closed_at = closed_at
                else:
                    new_issue = Issue(
                        repository_id=repository.id,
                        github_issue_id=github_issue_id,
                        issue_number=item.get("number", 0),
                        title=item.get("title", ""),
                        body=item.get("body"),
                        state=item.get("state", "open"),
                        author=author_login,
                        labels=labels_formatted,
                        comments_count=item.get("comments", 0),
                        html_url=item.get("html_url", ""),
                        created_at=created_at,
                        updated_at=updated_at,
                        closed_at=closed_at,
                    )
                    db.add(new_issue)
                ingested_count += 1

            # Update job record to completed
            job.status = "completed"
            job.total_issues_ingested = ingested_count
            job.completed_at = datetime.now(timezone.utc)
            db.commit()
            logger.info(f"Ingestion job {job_id} completed successfully with {ingested_count} issues.")

        except (GitHubNotFoundError, GitHubRateLimitError, GitHubAPIError) as e:
            db.rollback()
            job = db.query(IngestionJob).filter(IngestionJob.id == job_id).first()
            if job:
                job.status = "failed"
                job.error_message = e.message
                job.completed_at = datetime.now(timezone.utc)
                db.commit()
            logger.error(f"GitHub error in ingestion job {job_id}: {e.message}")
        except Exception as e:
            db.rollback()
            job = db.query(IngestionJob).filter(IngestionJob.id == job_id).first()
            if job:
                job.status = "failed"
                job.error_message = f"Ingestion error: {str(e)}"
                job.completed_at = datetime.now(timezone.utc)
                db.commit()
            logger.exception(f"Unexpected error in ingestion job {job_id}: {e}")
        finally:
            db.close()
