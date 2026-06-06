from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# This is the name of our SQLite database file.
# It will be created automatically inside the backend folder.
DATABASE_URL = "sqlite:///./components.db"

# The engine is the connection between SQLAlchemy and the SQLite database.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# SessionLocal will be used whenever we want to talk to the database.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base is used by our database models.
# Our tables will inherit from this Base class.
Base = declarative_base()