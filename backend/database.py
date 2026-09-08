"""
MongoDB connection layer using Motor (async driver).
Import `db` anywhere you need collection access.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_uri)
    return _client


def get_db():
    return get_client()[settings.mongodb_db_name]


class Collections:
    """Central place to reference collection names / handles."""

    @property
    def projects(self):
        return get_db()["projects"]

    @property
    def communications(self):
        return get_db()["communications"]

    @property
    def tasks(self):
        return get_db()["tasks"]

    @property
    def decisions(self):
        return get_db()["decisions"]


db = Collections()


async def ping():
    """Quick connectivity check used at startup."""
    await get_client().admin.command("ping")


async def create_indexes():
    """Indexes that make search/list operations fast."""
    await db.projects.create_index("createdAt")
    await db.communications.create_index("projectId")
    await db.communications.create_index([("text", "text"), ("summary", "text")])
    await db.tasks.create_index("projectId")
    await db.tasks.create_index("status")
    await db.decisions.create_index("projectId")
