# BharatStack

All-in-one operating system for Indian service businesses.

## Features
- Bookings calendar + list management
- Customer CRM and lifecycle history
- GST invoices with PDF export (WeasyPrint)
- Payments ledger and cash/UPI recording
- Analytics dashboard (Chart.js)
- Staff management, reviews, expenses
- Public booking page (`/book/<username>`)
- Twilio WhatsApp confirmations
- Razorpay-ready billing flow

## Tech
- Flask + PyMongo + sessions
- HTML/CSS/Vanilla JS
- WeasyPrint + Twilio + Razorpay

## Local setup
```bash
pip install -r requirements.txt
cp .env.example .env
# fill values
python app.py
```
Open: `http://127.0.0.1:5000`

## Required env vars
- `SECRET_KEY`
- `MONGO_URI`
- `DB_NAME`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `TWILIO_SID`
- `TWILIO_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `UPI_ID`
- `UPI_NAME`
- `BASE_URL`

## Render deploy
- `Procfile`: `web: gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
- `render.yaml` included.

## Demo account
- Email: `demo@bharatstack.in`
- Password: `demo123`
