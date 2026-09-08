"""
Populate the database with a realistic demo project so the app can be shown
immediately after setup, without needing to call the AI live first.

Run with:  python seed_data.py
"""
import asyncio
from models.common import now_iso
from database import db, ping, create_indexes


DEMO_COMMUNICATIONS = [
    "Rahul, please update the electrical drawing by Friday. The client approved "
    "the new lighting layout, but we still need approval for the ceiling design.",
    "Priya (Architect) confirmed the revised floor plan for the second floor. "
    "Vendor quote for tiles is still pending — waiting on Amit to follow up by Monday.",
    "Client rejected the marble flooring proposal due to budget. Contractor to "
    "submit an alternative flooring option by next Wednesday.",
]

DEMO_SUMMARIES = [
    "Electrical drawing update assigned to Rahul; lighting layout approved, ceiling design pending.",
    "Second floor plan confirmed; tile vendor quote follow-up pending with Amit.",
    "Marble flooring rejected on budget grounds; contractor to propose an alternative.",
]

DEMO_TASKS = [
    [{"title": "Update electrical drawing", "responsible": "Rahul", "deadline": "Friday"}],
    [{"title": "Follow up on tile vendor quote", "responsible": "Amit", "deadline": "Monday"}],
    [{"title": "Submit alternative flooring option", "responsible": "Contractor", "deadline": "Wednesday"}],
]

DEMO_DECISIONS = [
    [{"description": "Lighting layout approved", "status": "approved"}],
    [{"description": "Second floor plan confirmed", "status": "approved"}],
    [{"description": "Marble flooring proposal rejected", "status": "rejected"}],
]

DEMO_PENDING = [
    [{"description": "Ceiling design approval"}],
    [],
    [],
]


async def seed():
    await ping()
    await create_indexes()

    project_doc = {
        "name": "Riverside Residence — Interior Fit-Out",
        "description": "Demo project: residential interior fit-out with client, architect, and contractor.",
        "client": "Mr. & Mrs. Sharma",
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    result = await db.projects.insert_one(project_doc)
    project_id = str(result.inserted_id)
    print(f"Created demo project: {project_id}")

    for i, text in enumerate(DEMO_COMMUNICATIONS):
        now = now_iso()
        comm_doc = {
            "projectId": project_id,
            "text": text,
            "source": "manual",
            "summary": DEMO_SUMMARIES[i],
            "analyzed": True,
            "createdAt": now,
        }
        comm_result = await db.communications.insert_one(comm_doc)
        comm_id = str(comm_result.inserted_id)

        for t in DEMO_TASKS[i]:
            await db.tasks.insert_one(
                {
                    "projectId": project_id,
                    "communicationId": comm_id,
                    "title": t["title"],
                    "responsible": t["responsible"],
                    "deadline": t["deadline"],
                    "status": "pending",
                    "createdAt": now,
                    "updatedAt": now,
                }
            )

        for d in DEMO_DECISIONS[i]:
            await db.decisions.insert_one(
                {
                    "projectId": project_id,
                    "communicationId": comm_id,
                    "description": d["description"],
                    "status": d["status"],
                    "createdAt": now,
                }
            )

        for p in DEMO_PENDING[i]:
            await db.decisions.insert_one(
                {
                    "projectId": project_id,
                    "communicationId": comm_id,
                    "description": p["description"],
                    "status": "pending",
                    "createdAt": now,
                }
            )

    print("Demo data seeded successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
