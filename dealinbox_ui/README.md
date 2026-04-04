# DealInbox

Never lose a brand deal again. One link for your bio — brands submit structured briefs, everything lands in your dashboard.

## Stack
- **Backend**: Flask (Python)
- **Database**: MongoDB Atlas (free tier works)
- **Payments**: Razorpay (UPI, GPay, PhonePe, Paytm, cards)
- **Hosting**: Render

---

## Deploy to Render (10 minutes)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/dealinbox.git
git push -u origin main
```

### 2. Create Render Web Service
1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Render auto-detects the `render.yaml` — click **Deploy**

### 3. Set Environment Variables in Render Dashboard
Go to your service → Environment → Add these:

| Key | Value |
|-----|-------|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `SECRET_KEY` | Any long random string |
| `UPI_ID` | Your UPI ID e.g. `name@upi` |
| `RAZORPAY_KEY_ID` | From Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | From Razorpay dashboard |

### 4. MongoDB Atlas (free)
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Create free cluster
2. Database Access → Add user with password
3. Network Access → Allow `0.0.0.0/0` (all IPs, required for Render)
4. Connect → Drivers → Copy connection string
5. Replace `<password>` in the string and paste as `MONGO_URI` in Render

### 5. Razorpay
1. Sign up at [razorpay.com](https://razorpay.com)
2. Settings → API Keys → Generate Key
3. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to Render env vars
4. Use `rzp_test_` keys for testing, `rzp_live_` for production

---

## Run Locally

```bash
pip install -r requirements.txt
cp .env.example .env
# Fill in your values in .env
python app.py
```

Open http://127.0.0.1:5000

**Demo login**: demo@dealinbox.in / demo123  
**Demo page**: http://127.0.0.1:5000/@demo

---

## Admin Endpoints

Verify a manual UPI payment (activates Pro):
```bash
curl -X POST https://yourapp.onrender.com/admin/verify/<user_id> \
  -d "secret=YOUR_SECRET_KEY&months=1"
```

List pending UPI payments:
```bash
curl "https://yourapp.onrender.com/admin/pending?secret=YOUR_SECRET_KEY"
```

---

## Features

- Public enquiry page at `/@username`
- Deal dashboard with pipeline view
- Status tracking (New → Reviewing → Negotiating → Accepted → Closed)
- Brand tracking portal (brands track their own enquiry)
- Analytics dashboard (Pro)
- CSV export (Pro)
- AI quick reply templates
- Razorpay payments (UPI, GPay, PhonePe, Paytm, cards)
- Mobile responsive
