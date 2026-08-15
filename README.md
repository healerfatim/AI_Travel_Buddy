# AI Travel Buddy

AI Travel Buddy is a full-stack travel recommendation project that helps users discover destinations in Pakistan based on budget, region, trip style, and natural-language search queries.

## Purpose

- Provide personalized travel suggestions using simple NLP + ranking logic
- Help users estimate trip cost and view destination details quickly
- Allow users to save trips and manage preferences
- Provide a basic admin area for destination/data management

## Project Description

The project includes:

- **Backend (Flask API)** for search, NLP parsing, recommendation scoring, and admin endpoints
- **Frontend (React app)** for UI, search experience, saved trips, profile/preferences, and admin screens
- **JSON dataset** storing destination details (cost, weather, activities, tags, region, image)

## Tech Stack

### Backend
- **Python 3**
- **Flask** (`flask`)
- **Flask-CORS** (`flask-cors`)
- **Werkzeug**
- **JSON** file storage (`destinations.json`)
- **Regex** (`re`) for NLP-style query extraction

### ML / Recommendation Utilities
- **scikit-learn**
  - `TfidfVectorizer`
  - `cosine_similarity`

### Frontend
- **React 19**
- **React DOM**
- **react-scripts** (Create React App toolchain)
- **AJV / AJV Formats**
- **Testing Library** (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@testing-library/dom`)
- **web-vitals**
- **CSS3**

### Development & Tooling
- **npm** / **package-lock.json** for frontend dependency management
- **pip** / `requirements.txt` for backend dependency management

## Files and Folders (with Description)

### Root Directory

- **`app.py`**  
  Main Flask backend application. Exposes API endpoints for search and admin features.

- **`nlp_utils.py`**  
  Parses natural language query text to extract budget, days, and region intent.

- **`ml_engine.py`**  
  Optional ML recommendation utility using TF-IDF + cosine similarity over destination metadata.

- **`destinations.json`**  
  Core destination dataset used by the recommendation/search logic.

- **`requirements.txt`**  
  Python backend dependencies.

- **`test data.py`**  
  Simple script to verify destination JSON loading and print travel records.

- **`.gitignore`**  
  Git ignore rules for project-level artifacts.

### Frontend (`frontend/`)

- **`frontend/package.json`**  
  Frontend dependencies, scripts, and proxy configuration.

- **`frontend/package-lock.json`**  
  Locked frontend dependency tree.

- **`frontend/src/App.js`**  
  Main React component containing UI states, search flow, auth/profile/admin views, and API integration.

- **`frontend/src/App.css`**  
  Main styling for all screens and components.

- **`frontend/src/index.js`**  
  React entry point.

- **`frontend/src/App.test.js`**, **`frontend/src/setupTests.js`**  
  Frontend testing setup/files.

- **`frontend/public/`**  
  Static assets and app metadata:
  - `index.html`, `manifest.json`, `robots.txt`
  - destination images in `public/images/`

- **`frontend/README.md`**  
  Default Create React App documentation file.

## API Overview

- **`GET /api/search?q=<query>&style=<style>`**  
  Returns parsed query info and ranked/filtered destination results.

- **`GET /api/admin/stats`**  
  Returns admin dashboard statistics (mock data).

- **`POST /api/admin/update-destination`**  
  Adds or updates a destination in `destinations.json`.

## How to Run Locally

### 1) Backend

```bash
cd /home/runner/work/AI_Travel_Buddy/AI_Travel_Buddy
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Backend runs at: `http://127.0.0.1:5000`

### 2) Frontend

```bash
cd /home/runner/work/AI_Travel_Buddy/AI_Travel_Buddy/frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000` and proxies API calls to `http://127.0.0.1:5000`.

## Current Scope

This project is currently a prototype with local JSON storage and a simple rule/scoring based recommendation flow, designed for learning and demonstration.
