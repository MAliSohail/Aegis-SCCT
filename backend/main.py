from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import csv
import io

import models
import schemas
from database import engine, SessionLocal


# Create database tables
models.Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Software Component Compliance Tracker API",
    description="A small API for tracking software components, licenses, risk levels, and compliance review status.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {
        "message": "Software Component Compliance Tracker API is running"
    }


# -----------------------------
# CREATE COMPONENT
# -----------------------------
@app.post("/components", response_model=schemas.ComponentResponse)
def create_component(component: schemas.ComponentCreate, db: Session = Depends(get_db)):
    new_component = models.Component(
        name=component.name,
        version=component.version,
        owner=component.owner,
        license=component.license,
        risk_level=component.risk_level,
        review_status=component.review_status,
        last_updated=component.last_updated,
        notes=component.notes
    )

    db.add(new_component)
    db.commit()
    db.refresh(new_component)

    return new_component


# -----------------------------
# GET ALL COMPONENTS
# -----------------------------
@app.get("/components", response_model=list[schemas.ComponentResponse])
def get_components(db: Session = Depends(get_db)):
    components = db.query(models.Component).all()
    return components


# -----------------------------
# GET ONE COMPONENT BY ID
# -----------------------------
@app.get("/components/{component_id}", response_model=schemas.ComponentResponse)
def get_component(component_id: int, db: Session = Depends(get_db)):
    component = db.query(models.Component).filter(models.Component.id == component_id).first()

    if component is None:
        raise HTTPException(status_code=404, detail="Component not found")

    return component


# -----------------------------
# UPDATE COMPONENT
# -----------------------------
@app.put("/components/{component_id}", response_model=schemas.ComponentResponse)
def update_component(
    component_id: int,
    updated_component: schemas.ComponentUpdate,
    db: Session = Depends(get_db)
):
    component = db.query(models.Component).filter(models.Component.id == component_id).first()

    if component is None:
        raise HTTPException(status_code=404, detail="Component not found")

    component.name = updated_component.name
    component.version = updated_component.version
    component.owner = updated_component.owner
    component.license = updated_component.license
    component.risk_level = updated_component.risk_level
    component.review_status = updated_component.review_status
    component.last_updated = updated_component.last_updated
    component.notes = updated_component.notes

    db.commit()
    db.refresh(component)

    return component


# -----------------------------
# DELETE COMPONENT
# -----------------------------
@app.delete("/components/{component_id}")
def delete_component(component_id: int, db: Session = Depends(get_db)):
    component = db.query(models.Component).filter(models.Component.id == component_id).first()

    if component is None:
        raise HTTPException(status_code=404, detail="Component not found")

    db.delete(component)
    db.commit()

    return {
        "message": f"Component with ID {component_id} deleted successfully"
    }


# -----------------------------
# FILTER BY RISK LEVEL
# -----------------------------
@app.get("/components/filter/risk/{risk_level}", response_model=list[schemas.ComponentResponse])
def filter_by_risk(risk_level: str, db: Session = Depends(get_db)):
    components = db.query(models.Component).filter(models.Component.risk_level == risk_level).all()
    return components


# -----------------------------
# FILTER BY REVIEW STATUS
# -----------------------------
@app.get("/components/filter/status/{review_status}", response_model=list[schemas.ComponentResponse])
def filter_by_status(review_status: str, db: Session = Depends(get_db)):
    components = db.query(models.Component).filter(models.Component.review_status == review_status).all()
    return components


# -----------------------------
# FILTER BY LICENSE
# -----------------------------
@app.get("/components/filter/license/{license_name}", response_model=list[schemas.ComponentResponse])
def filter_by_license(license_name: str, db: Session = Depends(get_db)):
    components = db.query(models.Component).filter(models.Component.license == license_name).all()
    return components


# -----------------------------
# COMPLIANCE SUMMARY
# -----------------------------
@app.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    total_components = db.query(models.Component).count()

    high_risk_components = db.query(models.Component).filter(
        models.Component.risk_level == "High"
    ).count()

    medium_risk_components = db.query(models.Component).filter(
        models.Component.risk_level == "Medium"
    ).count()

    low_risk_components = db.query(models.Component).filter(
        models.Component.risk_level == "Low"
    ).count()

    pending_reviews = db.query(models.Component).filter(
        models.Component.review_status == "Pending"
    ).count()

    approved_components = db.query(models.Component).filter(
        models.Component.review_status == "Approved"
    ).count()

    needs_review = db.query(models.Component).filter(
        models.Component.review_status == "Needs Review"
    ).count()

    return {
        "total_components": total_components,
        "high_risk_components": high_risk_components,
        "medium_risk_components": medium_risk_components,
        "low_risk_components": low_risk_components,
        "pending_reviews": pending_reviews,
        "approved_components": approved_components,
        "needs_review": needs_review
    }


# -----------------------------
# EXPORT CSV
# -----------------------------
@app.get("/export/csv")
def export_components_csv(db: Session = Depends(get_db)):
    components = db.query(models.Component).all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "ID",
        "Name",
        "Version",
        "Owner",
        "License",
        "Risk Level",
        "Review Status",
        "Last Updated",
        "Notes"
    ])

    for component in components:
        writer.writerow([
            component.id,
            component.name,
            component.version,
            component.owner,
            component.license,
            component.risk_level,
            component.review_status,
            component.last_updated,
            component.notes
        ])

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=components_compliance_report.csv"
        }
    )