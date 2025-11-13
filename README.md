# War & Blackjack Arcade

A small full‑stack playground that recreates two classic card games—**War** and a simplified **Blackjack deal**—using a FastAPI backend and a React + Vite frontend. The backend owns the game rules, shuffles, and round resolution; the frontend focuses on the visuals, state transitions, and player interactions.

---

## Features
- **Two games, one API**: War rounds with WAR resolution plus a Blackjack flow that deals from a double deck.
- **Shared card assets**: Each card served from the backend already includes an image path so the UI can simply render whatever it receives.
- **Stateful gameplay helpers**: Custom React hooks (`useGameHelpers`) handle sequencing, WAR bonuses, and log messages.
- **Hot‑reload dev experience**: FastAPI with Uvicorn reloading on the backend and Vite’s dev server with proxying on the frontend.
- **Type safety front to back**: Pydantic models validate payloads on the server; TypeScript mirrors the same shapes on the client.

---

## Repository Layout
| Path | Description |
| --- | --- |
| `backend/` | FastAPI service that exposes War and Blackjack endpoints (`app.py`) and core game logic (`war.py`). |
| `frontend/` | React + TypeScript app bootstrapped with Vite. Contains UI components, hooks, assets, and API helpers. |
| `README.md` | You are here. High-level documentation for contributors. |

Backend requirements live in `backend/requirements.txt`; frontend dependencies are managed through `frontend/package.json`.

---

## Backend (FastAPI)
- **Entry point**: `backend/app.py` wires up the FastAPI app, CORS for the Vite dev server, and the REST endpoints listed below.
- **Game logic**: `backend/war.py` defines deck creation, shuffling, War round resolution, WAR (tie) handling, and Blackjack dealing.
- **Key endpoints**:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET /game/start` | Split a shuffled deck into player A/B piles for War. |
| `POST /game/round` | Play a normal War round; returns updated decks, winner, and optional bonus pile. |
| `POST /game/war` | Resolve a WAR (tie) scenario by drawing three cards; may recurse on additional ties. |
| `GET /game/black-jack-start` | Build and shuffle a double deck for Blackjack. |
| `POST /game/black-jack-round` | Deal two cards each to player and dealer, returning the trimmed deck. |

The service expects JSON payloads that match the Pydantic models (`DeckState` and `BJDeckState`) so it can validate incoming decks before simulating the next step.

---

## Frontend (React + Vite)
- **Entry**: `frontend/src/App.tsx` lets players toggle between War and Blackjack while sharing common controls.
- **Components**:
  - `components/War.tsx` – orchestrates the War board, round controls, bonus pile display, and leverages `useGameHelpers`.
  - `components/BlackJack.tsx` – handles the Blackjack layout and per-round dealing experience.
  - `components/CardView.tsx`, `GameButtons.tsx` – reusable presentation pieces for card piles and CTA buttons.
- **API layer**: `frontend/src/api.ts` wraps Axios calls pointed at `/api`, which Vite proxies to `http://127.0.0.1:8000`. That keeps fetch logic centralized and typed.
- **Styling & assets**: `/src/App.css` plus the `/src/assets` directory provide the poker-table look, button sprites, and card faces referenced directly from backend responses.

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+ (or a version supported by Vite) and npm

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # On Windows use .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```
This exposes the REST API locally on port 8000 with auto-reload.

### 2. Frontend (Vite React)
```bash
cd frontend
npm install
npm run dev
```
The Vite dev server runs on `http://localhost:5173` and transparently proxies `/api` requests to the FastAPI service via `vite.config.ts`.

---

## Useful Scripts
- **Backend**: run `uvicorn app:app --reload` for hot reloading during development.
- **Frontend**:
  - `npm run dev` – start the Vite dev server
  - `npm run build` – type-check and produce a production build
  - `npm run lint` – run ESLint with the repo’s config

---

## Contributing & Next Steps
- Keep shared card data shapes in sync between `war.py` and `src/api.ts`.
- Add tests around `war.py` if you plan to tweak game rules (e.g., multiple WAR stacks, Blackjack scoring).
- Consider a deployment setup (Docker or render) if you want to host both services; the proxy path can be adjusted in `frontend/vite.config.ts`.

Enjoy hacking on new card mechanics or polishing the UI without having to recompute all the core game math—this repo already has the deck handling and round sequencing ready to build on.
