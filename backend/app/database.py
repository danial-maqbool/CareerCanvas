from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


def build_engine(url: str):
    if url.startswith('sqlite:///') and ':memory:' not in url:
        Path(url.removeprefix('sqlite:///')).parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(url, connect_args={'check_same_thread': False} if url.startswith('sqlite') else {})
    if url.startswith('sqlite'):
        @event.listens_for(engine, 'connect')
        def sqlite_constraints(connection, _):
            connection.execute('PRAGMA foreign_keys=ON')
            connection.execute('PRAGMA busy_timeout=5000')
    return engine


def session_factory(engine):
    return sessionmaker(bind=engine, expire_on_commit=False)
