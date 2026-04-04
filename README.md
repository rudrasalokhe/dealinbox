# BharatStack

Production-ready Flask SaaS starter for Indian SMB workflows.

## Setup
1. `python -m venv .venv && source .venv/bin/activate`
2. `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and fill values.
4. `flask --app run db upgrade` (or `python seed.py` for demo)
5. `python run.py`

## Environment variables
See `.env.example` for all required values.

## Deploy to Render
- Uses `render.yaml` with web service + PostgreSQL.
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn --bind 0.0.0.0:$PORT run:app`
- Runtime pinned to Python 3.11.9 via `runtime.txt`/`PYTHON_VERSION`.

## Demo credentials
- Email: `demo@bharatstack.in`
- Password: `demo1234`

## Render Root Directory
If your Render service is configured with **Root Directory = `dealinbox`**, this repo now includes a `dealinbox/` deployment folder containing the app files.
If Root Directory is blank, deploy from repository root.
