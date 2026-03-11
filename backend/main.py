from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from satellites import get_satellite_positions

app = FastAPI(title="Satellite Tracking API")

# Allow CORS so the frontend can communicate with the backend locally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/satellites")
def fetch_satellites():
    """API endpoint to get real-time satellite positions."""
    positions = get_satellite_positions()
    return {"status": "success", "count": len(positions), "data": positions}
