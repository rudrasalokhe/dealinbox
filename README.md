# BharatStack (MongoDB backend)

## Setup
1. Create venv and install deps: `pip install -r requirements.txt`
2. Copy `.env.example` to `.env` and fill values.
3. Run app: `gunicorn --bind 0.0.0.0:5000 run:app`

## Environment variables
- SECRET_KEY
- MONGO_URI
- DB_NAME
- BASE_URL
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_SMS_NUMBER
- TWILIO_WHATSAPP_NUMBER
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- RAZORPAY_WEBHOOK_SECRET

## Deploy to Render
- Root Directory: `dealinbox`
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn --bind 0.0.0.0:$PORT run:app`

## Seed data
- Run: `python seed.py`
- Demo login: `demo@bharatstack.in` / `demo1234`
