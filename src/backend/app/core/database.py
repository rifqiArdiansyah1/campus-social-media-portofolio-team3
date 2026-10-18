from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Create SQLAlchemy engine connected to Supabase PostgreSQL
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    FastAPI dependency that provides a transactional database session per request.
    Closes the session automatically when request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
