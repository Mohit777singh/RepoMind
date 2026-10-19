import logging
from collections.abc import Generator
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

def get_database_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql"):
        try:
            pg_engine = create_engine(db_url, pool_pre_ping=True)
            with pg_engine.connect():
                pass
            return pg_engine
        except Exception as e:
            sqlite_file = Path(__file__).resolve().parent.parent.parent / "repomind.db"
            print(f"⚠️ PostgreSQL is unreachable at {db_url} ({e}).")
            print(f"💡 Automatically using local SQLite database at {sqlite_file}...")
            return create_engine(
                f"sqlite:///{sqlite_file}",
                connect_args={"check_same_thread": False},
                pool_pre_ping=True,
            )

    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    return create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True,
    )

engine = get_database_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
