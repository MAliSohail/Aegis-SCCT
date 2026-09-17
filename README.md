# Aegis-SCCT — Software Component Compliance Tracker

A desktop-oriented dashboard for tracking third-party software components across
a project: license type, risk level, and compliance review status, with
filtering, summary metrics, and CSV export.

Built to practice a full-stack TypeScript/React + Python API workflow: a typed
REST backend, a React dashboard consuming it, and the state/loading/error
handling a real internal tool needs.

## Stack

- **Backend:** FastAPI, SQLAlchemy, SQLite
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Recharts, lucide-react

## Features

- CRUD on tracked components (name, version, owner, license, risk level, review status)
- Filter by risk level, review status, or license
- Compliance summary endpoint (totals, risk breakdown, pending/approved/needs-review counts)
- CSV export of the full component list
- Dashboard UI: overview page, readiness/attention cards, review-status breakdown,
  a trend chart, a filterable component table, and recent activity — with
  loading skeletons and error states rather than bare data dumps

## Running it locally

Requires Python 3.10+ and Node.js 18+.

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# optional: populate the database with sample components
python seed_data.py

uvicorn main:app --reload
```

The API is now running at `http://127.0.0.1:8000`. Interactive docs are at
`http://127.0.0.1:8000/docs`.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app is now running at `http://localhost:5173` and talks to the API at
`http://127.0.0.1:8000` (see `API_BASE_URL` in `src/App.tsx`).

### Building for production

```bash
cd frontend
npm run build    # outputs to frontend/dist
```

## API reference

| Method | Endpoint                              | Description                       |
|--------|----------------------------------------|-----------------------------------|
| GET    | `/`                                     | Health check                      |
| GET    | `/components`                           | List all components               |
| POST   | `/components`                           | Create a component                |
| GET    | `/components/{id}`                      | Get one component                 |
| PUT    | `/components/{id}`                      | Update a component                |
| DELETE | `/components/{id}`                      | Delete a component                |
| GET    | `/components/filter/risk/{risk_level}`  | Filter by risk level              |
| GET    | `/components/filter/status/{status}`    | Filter by review status           |
| GET    | `/components/filter/license/{license}`  | Filter by license                 |
| GET    | `/summary`                              | Compliance summary counts         |
| GET    | `/export/csv`                           | Download components as CSV        |

## Notes

This is a portfolio/prototype project — no auth layer, and SQLite is used for
simplicity rather than a production database.
