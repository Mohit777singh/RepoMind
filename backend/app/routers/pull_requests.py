import math
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.models.user import User
from app.schemas.pull_request import PaginatedPullRequestsResponse, PullRequestResponse
from app.security import get_current_user

router = APIRouter(tags=["Pull Requests"])

@router.get("/repositories/{repo_id}/pulls", response_model=PaginatedPullRequestsResponse)
def get_repository_pull_requests(
    repo_id: int,
    page: int = Query(1, ge=1, description="Page number starting from 1"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    status_filter: str | None = Query(None, alias="status", description="Filter by status: open, closed, merged, or all"),
    title: str | None = Query(None, description="Search term for PR title"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository with ID {repo_id} not found",
        )

    query = db.query(PullRequest).filter(PullRequest.repository_id == repo_id)

    # Status filter
    if status_filter and status_filter.lower() != "all":
        st = status_filter.lower()
        if st == "merged":
            query = query.filter(PullRequest.is_merged.is_(True))
        elif st == "closed":
            query = query.filter(PullRequest.state == "closed", PullRequest.is_merged.is_(False))
        elif st == "open":
            query = query.filter(PullRequest.state == "open")

    # Title filter
    if title and title.strip():
        query = query.filter(PullRequest.title.ilike(f"%{title.strip()}%"))

    total = query.count()
    total_pages = math.ceil(total / per_page) if total > 0 else 1

    offset = (page - 1) * per_page
    prs = (
        query.order_by(PullRequest.created_at.desc(), PullRequest.pr_number.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    return PaginatedPullRequestsResponse(
        items=[PullRequestResponse.model_validate(p) for p in prs],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )

@router.get("/pulls/{pr_id}", response_model=PullRequestResponse)
def get_pull_request(
    pr_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pr = db.query(PullRequest).filter(PullRequest.id == pr_id).first()
    if not pr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pull Request with ID {pr_id} not found",
        )
    return PullRequestResponse.model_validate(pr)
