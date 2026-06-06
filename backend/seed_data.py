from database import SessionLocal, engine
import models


models.Base.metadata.create_all(bind=engine)


sample_components = [
    {
        "name": "FastAPI",
        "version": "0.115.0",
        "owner": "Backend Team",
        "license": "MIT",
        "risk_level": "Low",
        "review_status": "Approved",
        "last_updated": "2026-05-31",
        "notes": "Used for backend API development"
    },
    {
        "name": "React",
        "version": "18.2.0",
        "owner": "Frontend Team",
        "license": "MIT",
        "risk_level": "Low",
        "review_status": "Approved",
        "last_updated": "2026-04-15",
        "notes": "Used for frontend user interface development"
    },
    {
        "name": "TypeScript",
        "version": "5.4.0",
        "owner": "Frontend Team",
        "license": "Apache-2.0",
        "risk_level": "Low",
        "review_status": "Approved",
        "last_updated": "2026-03-20",
        "notes": "Used for type-safe frontend development"
    },
    {
        "name": "SQLite",
        "version": "3.45.0",
        "owner": "Data Tools Team",
        "license": "Public Domain",
        "risk_level": "Low",
        "review_status": "Approved",
        "last_updated": "2026-01-10",
        "notes": "Used as lightweight database for prototype development"
    },
    {
        "name": "Pandas",
        "version": "2.2.0",
        "owner": "Data Analysis Team",
        "license": "BSD-3-Clause",
        "risk_level": "Low",
        "review_status": "Approved",
        "last_updated": "2026-02-05",
        "notes": "Used for structured data processing and CSV handling"
    },
    {
        "name": "OpenSSL",
        "version": "1.1.1",
        "owner": "Security Team",
        "license": "Apache-style",
        "risk_level": "Medium",
        "review_status": "Pending",
        "last_updated": "2024-11-18",
        "notes": "Used for cryptographic functions and requires regular security review"
    },
    {
        "name": "Log4j",
        "version": "2.14.1",
        "owner": "Platform Team",
        "license": "Apache-2.0",
        "risk_level": "High",
        "review_status": "Needs Review",
        "last_updated": "2024-01-10",
        "notes": "Older logging library version added as example high-risk component"
    },
    {
        "name": "Internal Reporting Tool",
        "version": "0.1.0",
        "owner": "Architecture Team",
        "license": "Unknown",
        "risk_level": "High",
        "review_status": "Pending",
        "last_updated": "2025-07-01",
        "notes": "Example internal tool with incomplete license information"
    }
]


def seed_database():
    db = SessionLocal()

    existing_components = db.query(models.Component).count()

    if existing_components > 0:
        print("Database already contains data. Seed cancelled.")
        db.close()
        return

    for component_data in sample_components:
        component = models.Component(**component_data)
        db.add(component)

    db.commit()
    db.close()

    print("Sample data added successfully.")


if __name__ == "__main__":
    seed_database()