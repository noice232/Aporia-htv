from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

_is_sqlite = settings.database_url.startswith("sqlite")

connect_args = {"check_same_thread": False} if _is_sqlite else {}

engine = create_engine(settings.database_url, connect_args=connect_args)


if _is_sqlite:

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


HYPERTABLES = [
    ("research_events", "occurred_at"),
    ("experiment_runs", "started_at"),
]


def _create_hypertables():
    """Convert time-series tables to Tiger Data hypertables and enable compression."""
    with engine.connect() as conn:
        for table, time_col in HYPERTABLES:
            try:
                conn.execute(text(
                    f"SELECT create_hypertable('{table}', '{time_col}', "
                    f"if_not_exists => TRUE, migrate_data => TRUE)"
                ))
                conn.commit()
            except Exception:
                conn.rollback()

        for table, _ in HYPERTABLES:
            try:
                conn.execute(text(
                    f"ALTER TABLE {table} SET ("
                    f"timescaledb.compress, "
                    f"timescaledb.compress_segmentby = 'project_id'"
                    f")"
                ))
                conn.execute(text(
                    f"SELECT add_compression_policy('{table}', "
                    f"INTERVAL '7 days', if_not_exists => TRUE)"
                ))
                conn.commit()
            except Exception:
                conn.rollback()


def init_db():
    Base.metadata.create_all(bind=engine)
    if not _is_sqlite:
        _create_hypertables()
