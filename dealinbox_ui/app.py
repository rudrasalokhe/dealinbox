"""
DealInbox — Never lose a brand deal again.
Run: pip install flask pymongo werkzeug python-dotenv razorpay && python app.py
"""
from flask import (Flask, render_template, request, redirect,
                   session, flash, url_for, jsonify, make_response)
from pymongo import MongoClient, DESCENDING
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone, timedelta
from functools import wraps
from dotenv import load_dotenv
import os, re, csv, io, json
load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "fallback-secret")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
DB_NAME   = os.getenv("DB_NAME", "dealinbox")
# ── Razorpay config ───────────────────────────────────────────────────────────
RAZORPAY_KEY_ID     = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
def get_razorpay_client():
    if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
        try:
            import razorpay
            return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        except ImportError:
            return None
    return None
def build_client():
    try:
        primary = MongoClient(
            MONGO_URI,
            maxPoolSize=50,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000,
            connect=False
        )
        primary.admin.command("ping")
        print(f"Connected to MongoDB using MONGO_URI")
        return primary
    except Exception as exc:
        fallback_uri = "mongodb://127.0.0.1:27017"
        print(f"Primary MongoDB connection failed: {exc}")
        print(f"Trying fallback MongoDB at {fallback_uri}")
        fallback = MongoClient(
            fallback_uri,
            maxPoolSize=50,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000,
            connect=False
        )
        return fallback
client = build_client()
db     = client[DB_NAME]
users_col    = db["users"]
enquiries    = db["enquiries"]
activity_col = db["activity"]
payments_col = db["payments"]
def setup_db():
    try:
        client.admin.command("ping")
        for idx_name in ["email_1", "username_1", "upi_1"]:
            try:
                users_col.drop_index(idx_name)
            except Exception:
                pass
        users_col.create_index("email", unique=True, sparse=True)
        users_col.create_index("username", unique=True, sparse=True)
        enquiries.create_index([("user_id", 1), ("created_at", -1)])
        activity_col.create_index([("user_id", 1), ("created_at", -1)])
        payments_col.create_index([("user_id", 1), ("created_at", -1)])
        print(f"DB ready ({DB_NAME})")
    except Exception as e:
        print(f"DB setup failed: {e}")
setup_db()
# ── Helpers ───────────────────────────────────────────────────────────────────
def now():
    return datetime.utcnow()
def to_naive(dt):
    if dt is None: return None
    return dt.replace(tzinfo=None) if getattr(dt, "tzinfo", None) else dt
def oid(v):
    try:    return ObjectId(v)
    except: return None
def fmt_dt(dt):
    if not dt: return ""
    dt = to_naive(dt)
    return dt.strftime("%b %d, %Y . %I:%M %p") if hasattr(dt, 'strftime') else str(dt)
def fmt_date(dt):
    if not dt: return ""
    dt = to_naive(dt)
    return dt.strftime("%b %d, %Y") if hasattr(dt, 'strftime') else str(dt)
def log(uid, action, detail=""):
    try:
        activity_col.insert_one({"user_id": uid, "action": action,
                                  "detail": detail, "created_at": now()})
    except: pass
def is_pro(user):
    if not user: return False
    if user.get("plan") == "pro": return True
    joined = user.get("created_at")
    if joined:
        delta = now() - to_naive(joined)
        if delta.days < 60:
            return True
    return False
STATUSES = {
    "new":        {"label": "New",        "color": "#6366f1"},
    "reviewing":  {"label": "Reviewing",  "color": "#f59e0b"},
    "accepted":   {"label": "Accepted",   "color": "#10b981"},
    "negotiating":{"label": "Negotiating","color": "#3b82f6"},
    "closed":     {"label": "Closed",     "color": "#22c55e"},
    "declined":   {"label": "Declined",   "color": "#ef4444"},
}
PLATFORMS = ["Instagram","YouTube","TikTok","Twitter/X","LinkedIn","Podcast","Blog","Multiple"]
BUDGETS   = ["Under Rs.5,000","Rs.5,000-Rs.10,000","Rs.10,000-Rs.25,000",
             "Rs.25,000-Rs.50,000","Rs.50,000-Rs.1,00,000","Rs.1,00,000+","Open to discuss"]
FREE_ENQUIRY_LIMIT = 20
PRO_PRICE_INR      = 199
UPI_ID   = os.getenv("UPI_ID",   "dealinbox@upi")
UPI_NAME = os.getenv("UPI_NAME", "DealInbox")
@app.context_processor
def inject_globals():
    def get_user():
        if "uid" not in session: return None
        return users_col.find_one({"_id": oid(session["uid"])})
    def new_enquiry_count():
        if "uid" not in session: return 0
        return enquiries.count_documents({"user_id": session["uid"], "status": "new"})
    return dict(
        new_enquiry_count=new_enquiry_count,
        get_user=get_user,
        STATUSES=STATUSES,
        fmt_date=fmt_date,
        fmt_dt=fmt_dt,
        razorpay_key=RAZORPAY_KEY_ID,
    )
# ── Auth decorators ───────────────────────────────────────────────────────────
def login_required(f):
    @wraps(f)
    def dec(*a, **kw):
        if "uid" not in session:
            flash("Please log in.", "error")
            return redirect(url_for("login"))
        return f(*a, **kw)
    return dec
def pro_required(f):
    @wraps(f)
    def dec(*a, **kw):
        if "uid" not in session:
            flash("Please log in.", "error")
            return redirect(url_for("login"))
        user = users_col.find_one({"_id": oid(session["uid"])})
        if not is_pro(user):
            flash("This feature requires a Pro plan.", "error")
            return redirect(url_for("upgrade"))
        return f(*a, **kw)
    return dec
# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK (keeps Render from cold-starting)
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/ping")
def ping():
    return "pong", 200
  @app.route("/ping")
def ping():
    return "pong", 200

@app.route("/api/instagram-sync", methods=["POST"])
@login_required
def instagram_sync():
    uid  = session["uid"]
    data = request.json
    users_col.update_one({"_id": oid(uid)}, {"$set": {
        "instagram":    data.get("username", ""),
        "followers":    data.get("followers", ""),
        "bio":          data.get("bio", ""),
        "ig_posts":     data.get("posts", ""),
        "ig_following": data.get("following", ""),
        "ig_synced_at": now()
    }})
    log(uid, "Instagram synced via extension", data.get("username",""))
    return jsonify({"ok": True})

# ═══════════════════════════════════════════════════════════════════════════════
# LANDING
# ═══════════════════════════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════════════════════════
# LANDING
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/")
def index():
    total     = users_col.count_documents({})
    enq_total = enquiries.count_documents({})
    return render_template("index.html", total=total, enq_total=enq_total)
# ═══════════════════════════════════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/signup", methods=["GET","POST"])
def signup():
    if request.method == "POST":
        name     = request.form.get("name","").strip()
        email    = request.form.get("email","").strip().lower()
        username = re.sub(r'[^a-z0-9_]','', request.form.get("username","").strip().lower())
        password = request.form.get("password","")
        niche    = request.form.get("niche","").strip()
        platform = request.form.get("platform","")
        if not all([name, email, username, password]):
            flash("All fields are required.","error"); return redirect(url_for("signup"))
        if len(username) < 3:
            flash("Username must be at least 3 characters.","error"); return redirect(url_for("signup"))
        if len(password) < 6:
            flash("Password must be at least 6 characters.","error"); return redirect(url_for("signup"))
        if users_col.find_one({"email": email}):
            flash("Email already registered.","error"); return redirect(url_for("signup"))
        if users_col.find_one({"username": username}):
            flash("Username taken. Try another.","error"); return redirect(url_for("signup"))
        uid = users_col.insert_one({
            "name": name, "email": email, "username": username,
            "password_hash": generate_password_hash(password),
            "niche": niche, "platform": platform,
            "bio": "", "collab_email": email,
            "min_budget": "", "response_time": "48 hours",
            "plan": "free", "created_at": now()
        }).inserted_id
        session.update({"uid": str(uid), "email": email,
                        "username": username, "name": name, "plan": "free"})
        log(str(uid), "Signed up", "Welcome to DealInbox!")
        flash(f"Welcome, {name}! Your DealInbox is ready.","success")
        return redirect(url_for("dashboard"))
    return render_template("signup.html",
                           platforms=PLATFORMS,
                           niches=["Beauty","Fashion","Fitness","Food","Tech",
                                   "Gaming","Travel","Finance","Lifestyle","Comedy","Other"])
@app.route("/login", methods=["GET","POST"])
def login():
    if request.method == "POST":
        email    = request.form.get("email","").strip().lower()
        password = request.form.get("password","")
        user     = users_col.find_one({"email": email})
        if not user or not check_password_hash(user["password_hash"], password):
            flash("Invalid email or password.","error"); return redirect(url_for("login"))
        session.update({"uid": str(user["_id"]), "email": user["email"],
                        "username": user["username"], "name": user.get("name",""), "plan": user.get("plan","free")})
        flash(f"Welcome back, {user.get('name','')}!","success")
        return redirect(url_for("dashboard"))
    return render_template("login.html")
@app.route("/logout")
def logout():
    session.clear()
    flash("Logged out.","success")
    return redirect(url_for("index"))
# ═══════════════════════════════════════════════════════════════════════════════
# DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/dashboard")
@login_required
def dashboard():
    uid  = session["uid"]
    user = users_col.find_one({"_id": oid(uid)})
    plan = user.get("plan","free") if user else "free"
    all_enq   = list(enquiries.find({"user_id": uid}).sort("created_at", DESCENDING))
    new_count = sum(1 for e in all_enq if e["status"] == "new")
    accepted  = sum(1 for e in all_enq if e["status"] in ["accepted","closed"])
    total_val = sum(e.get("budget_num", 0) for e in all_enq if e["status"] in ["accepted","closed","negotiating"])
    recent    = all_enq[:5]
    activity  = list(activity_col.find({"user_id": uid}).sort("created_at", DESCENDING).limit(6))
    pipeline  = {s: sum(1 for e in all_enq if e["status"] == s) for s in STATUSES}
    enq_this_month = 0
    if plan == "free" and not is_pro(user):
        month_start = now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        enq_this_month = enquiries.count_documents({
            "user_id": uid,
            "created_at": {"$gte": month_start}
        })
    return render_template("dashboard.html",
                           new_count=new_count,
                           accepted=accepted,
                           total_val=total_val,
                           total=len(all_enq),
                           recent=recent,
                           activity=activity,
                           pipeline=pipeline,
                           STATUSES=STATUSES,
                           fmt_dt=fmt_dt,
                           plan=plan,
                           enq_this_month=enq_this_month,
                           FREE_ENQUIRY_LIMIT=FREE_ENQUIRY_LIMIT,
                           is_pro_user=is_pro(user))
# ═══════════════════════════════════════════════════════════════════════════════
# ENQUIRIES
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/enquiries")
@login_required
def enquiries_page():
    uid      = session["uid"]
    status_f = request.args.get("status","")
    q = {"user_id": uid}
    if status_f: q["status"] = status_f
    enqs   = list(enquiries.find(q).sort("created_at", DESCENDING))
    counts = {s: enquiries.count_documents({"user_id": uid, "status": s}) for s in STATUSES}
    counts["all"] = enquiries.count_documents({"user_id": uid})
    return render_template("enquiries.html",
                           enqs=enqs, counts=counts,
                           status_f=status_f, STATUSES=STATUSES,
                           fmt_dt=fmt_dt)
@app.route("/enquiries/export")
@login_required
@pro_required
def export_enquiries():
    uid  = session["uid"]
    enqs = list(enquiries.find({"user_id": uid}).sort("created_at", DESCENDING))
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date","Brand","Contact","Email","Platform","Budget","Status","Timeline","Brief","Note"])
    for e in enqs:
        writer.writerow([
            fmt_dt(e.get("created_at")),
            e.get("brand_name",""),
            e.get("contact_name",""),
            e.get("email",""),
            e.get("platform",""),
            e.get("budget",""),
            STATUSES.get(e.get("status",""),{}).get("label", e.get("status","")),
            e.get("timeline",""),
            e.get("brief",""),
            e.get("note",""),
        ])
    response = make_response(output.getvalue())
    response.headers["Content-Disposition"] = "attachment; filename=enquiries.csv"
    response.headers["Content-Type"] = "text/csv; charset=utf-8"
    return response
@app.route("/enquiries/<eid>")
@login_required
def enquiry_detail(eid):
    uid = session["uid"]
    enq = enquiries.find_one({"_id": oid(eid), "user_id": uid})
    if not enq:
        flash("Enquiry not found.","error"); return redirect(url_for("enquiries_page"))
    if enq["status"] == "new":
        enquiries.update_one({"_id": oid(eid)}, {"$set": {"status": "reviewing"}})
        enq["status"] = "reviewing"
        log(uid, "Opened enquiry", f"From {enq.get('brand_name','')}")
    return render_template("enquiry_detail.html",
                           enq=enq, STATUSES=STATUSES,
                           fmt_dt=fmt_dt, fmt_date=fmt_date)
@app.route("/enquiries/<eid>/status", methods=["POST"])
@login_required
def update_status(eid):
    uid    = session["uid"]
    status = request.form.get("status","")
    note   = request.form.get("note","").strip()
    if status not in STATUSES:
        flash("Invalid status.","error"); return redirect(url_for("enquiry_detail", eid=eid))
    update = {"status": status, "updated_at": now()}
    if note: update["note"] = note
    enquiries.update_one({"_id": oid(eid), "user_id": uid}, {"$set": update})
    enq = enquiries.find_one({"_id": oid(eid)})
    log(uid, f"Status changed to {STATUSES[status]['label']}", f"Enquiry from {enq.get('brand_name','') if enq else ''}")
    flash(f"Status updated to {STATUSES[status]['label']}.","success")
    return redirect(url_for("enquiry_detail", eid=eid))
@app.route("/enquiries/<eid>/delete", methods=["POST"])
@login_required
def delete_enquiry(eid):
    enquiries.delete_one({"_id": oid(eid), "user_id": session["uid"]})
    flash("Enquiry deleted.","success")
    return redirect(url_for("enquiries_page"))
# ═══════════════════════════════════════════════════════════════════════════════
# SETTINGS
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/settings", methods=["GET","POST"])
@login_required
def settings():
    uid  = session["uid"]
    user = users_col.find_one({"_id": oid(uid)})
    if request.method == "POST":
        users_col.update_one({"_id": oid(uid)}, {"$set": {
            "name":          request.form.get("name","").strip(),
            "bio":           request.form.get("bio","").strip(),
            "niche":         request.form.get("niche","").strip(),
            "platform":      request.form.get("platform",""),
            "collab_email":  request.form.get("collab_email","").strip(),
            "min_budget":    request.form.get("min_budget","").strip(),
            "response_time": request.form.get("response_time","").strip(),
            "instagram":     request.form.get("instagram","").strip(),
            "youtube":       request.form.get("youtube","").strip(),
            "followers":     request.form.get("followers","").strip(),
            "updated_at":    now()
        }})
        session["name"] = request.form.get("name","").strip()
        _u = users_col.find_one({"_id": oid(session["uid"])})
        if _u: session["plan"] = _u.get("plan","free")
        flash("Profile saved!","success")
        return redirect(url_for("settings"))
    return render_template("settings.html", user=user, platforms=PLATFORMS, budgets=BUDGETS)
@app.route("/settings/anonymous", methods=["POST"])
@login_required
def toggle_anonymous():
    uid  = session["uid"]
    data = request.json
    enabled      = data.get("enabled", False)
    reveal_after = data.get("reveal_after", "serious")
    users_col.update_one({"_id": oid(uid)}, {"$set": {
        "anonymous_mode":    enabled,
        "anon_reveal_after": reveal_after,
        "updated_at":        now()
    }})
    log(uid, "Anonymous mode " + ("enabled" if enabled else "disabled"))
    return jsonify({"ok": True, "enabled": enabled})
# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIC ENQUIRY PAGE
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/@<username>")
def public_page(username):
    user = users_col.find_one({"username": username})
    if not user:
        return render_template("404.html"), 404
    return render_template("public_page.html",
                           user=user, platforms=PLATFORMS, budgets=BUDGETS)
@app.route("/@<username>/submit", methods=["POST"])
def submit_enquiry(username):
    user = users_col.find_one({"username": username})
    if not user:
        return render_template("404.html"), 404
    if not is_pro(user):
        month_start = now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        count_this_month = enquiries.count_documents({
            "user_id": str(user["_id"]),
            "created_at": {"$gte": month_start}
        })
        if count_this_month >= FREE_ENQUIRY_LIMIT:
            return render_template("public_page.html", user=user,
                                   platforms=PLATFORMS, budgets=BUDGETS,
                                   inbox_full=True)
    brand_name   = request.form.get("brand_name","").strip()
    contact_name = request.form.get("contact_name","").strip()
    email        = request.form.get("email","").strip()
    platform     = request.form.get("platform","")
    budget       = request.form.get("budget","")
    timeline     = request.form.get("timeline","").strip()
    brief        = request.form.get("brief","").strip()
    deliverables = request.form.get("deliverables","").strip()
    if not all([brand_name, email, brief]):
        flash("Brand name, email and brief are required.","error")
        return redirect(url_for("public_page", username=username))
    budget_map = {"Under Rs.5,000":2500,"Rs.5,000-Rs.10,000":7500,
                  "Rs.10,000-Rs.25,000":17500,"Rs.25,000-Rs.50,000":37500,
                  "Rs.50,000-Rs.1,00,000":75000,"Rs.1,00,000+":100000}
    budget_num = budget_map.get(budget, 0)
    import secrets
    tracking_token = secrets.token_urlsafe(24)
    enquiries.insert_one({
        "user_id":        str(user["_id"]),
        "brand_name":     brand_name,
        "contact_name":   contact_name,
        "email":          email,
        "platform":       platform,
        "budget":         budget,
        "budget_num":     budget_num,
        "timeline":       timeline,
        "brief":          brief,
        "deliverables":   deliverables,
        "status":         "new",
        "note":           "",
        "tracking_token": tracking_token,
        "created_at":     now(),
        "updated_at":     now()
    })
    log(str(user["_id"]), "New enquiry received", f"From {brand_name}")
    try:
        tracking_url = url_for("brand_portal", token=tracking_token, _external=True)
    except Exception:
        tracking_url = request.host_url.rstrip("/") + "/track/" + tracking_token
    return render_template("success.html", username=username, brand_name=brand_name,
                           tracking_url=tracking_url, creator_name=user.get("name",""),
                           resp_time=user.get("response_time","48 hours"))
@app.route("/@<username>/reveal", methods=["POST"])
def reveal_identity(username):
    token = request.json.get("token", "")
    enq   = enquiries.find_one({"tracking_token": token})
    if not enq:
        return jsonify({"ok": False}), 404
    user = users_col.find_one({"username": username})
    if not user:
        return jsonify({"ok": False}), 404
    if enq.get("status") in ["reviewing", "negotiating", "accepted", "closed"]:
        return jsonify({
            "ok": True, "revealed": True,
            "name":      user.get("name", ""),
            "bio":       user.get("bio", ""),
            "instagram": user.get("instagram", ""),
            "youtube":   user.get("youtube", ""),
            "followers": user.get("followers", ""),
        })
    return jsonify({"ok": True, "revealed": False,
                    "message": "Creator identity revealed after review."})
# ═══════════════════════════════════════════════════════════════════════════════
# ANALYTICS (Pro)
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/analytics")
@login_required
@pro_required
def analytics():
    uid  = session["uid"]
    enqs = list(enquiries.find({"user_id": uid}))
    total       = len(enqs)
    new_count   = sum(1 for e in enqs if e["status"] == "new")
    accepted    = sum(1 for e in enqs if e["status"] in ["accepted","closed"])
    total_value = sum(e.get("budget_num",0) for e in enqs if e["status"] in ["accepted","closed","negotiating"])
    conversion  = round(accepted/total*100, 1) if total else 0
    plat_counts = {}
    for e in enqs:
        p = e.get("platform","Unknown") or "Unknown"
        plat_counts[p] = plat_counts.get(p, 0) + 1
    status_counts = {s: sum(1 for e in enqs if e["status"]==s) for s in STATUSES}
    months = []
    for i in range(5,-1,-1):
        d = now() - timedelta(days=30*i)
        start = d.replace(day=1,hour=0,minute=0,second=0,microsecond=0)
        if d.month==12: end = d.replace(year=d.year+1,month=1,day=1)
        else:           end = d.replace(month=d.month+1,day=1)
        count = sum(1 for e in enqs if e.get("created_at") and start <= to_naive(e["created_at"]) < end)
        months.append({"month": d.strftime("%b"), "count": count})
    brand_counts = {}
    for e in enqs:
        b = e.get("brand_name","")
        if b: brand_counts[b] = brand_counts.get(b,0) + 1
    top_brands = sorted(brand_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    return render_template("analytics.html",
                           total=total, new_count=new_count,
                           accepted=accepted, total_value=total_value,
                           conversion=conversion, plat_counts=plat_counts,
                           status_counts=status_counts, months=months,
                           top_brands=top_brands, STATUSES=STATUSES)
# ═══════════════════════════════════════════════════════════════════════════════
# BRAND PORTAL
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/track/<token>")
def brand_portal(token):
    enq = enquiries.find_one({"tracking_token": token})
    if not enq:
        return render_template("404.html"), 404
    creator = users_col.find_one({"_id": oid(enq["user_id"])})
    if not creator:
        return render_template("404.html"), 404
    BRAND_STEPS = [
        {"key":"submitted","title":"Enquiry submitted","sub":"Your enquiry is in their inbox.",
         "statuses":["new","reviewing","negotiating","accepted","closed","declined"]},
        {"key":"reviewing","title":"Under review","sub":f"{(creator.get('name') or 'Creator').split()[0]} is looking at your brief.",
         "statuses":["reviewing","negotiating","accepted","closed","declined"]},
        {"key":"negotiating","title":"In discussion","sub":"Details are being worked out.",
         "statuses":["negotiating","accepted","closed"]},
        {"key":"accepted","title":"Deal accepted","sub":"The collaboration is confirmed.",
         "statuses":["accepted","closed"]},
        {"key":"closed","title":"Deal closed","sub":"All done - great collaboration!",
         "statuses":["closed"]},
    ]
    return render_template("brand_portal.html",
                           enq=enq, creator=creator,
                           brand_steps=BRAND_STEPS,
                           current_status=enq.get("status","new"),
                           STATUSES=STATUSES, fmt_dt=fmt_dt)
# ═══════════════════════════════════════════════════════════════════════════════
# UPGRADE & PAYMENTS
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/upgrade")
@login_required
def upgrade():
    uid  = session["uid"]
    user = users_col.find_one({"_id": oid(uid)})
    on_free_window = False
    joined = user.get("created_at") if user else None
    if joined:
        delta = now() - to_naive(joined)
        on_free_window = delta.days < 60
    use_razorpay = bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)
    return render_template("upgrade.html", user=user,
                           upi_id=UPI_ID, upi_name=UPI_NAME,
                           pro_price=PRO_PRICE_INR,
                           on_free_window=on_free_window,
                           use_razorpay=use_razorpay)
@app.route("/upgrade/create-order", methods=["POST"])
@login_required
def create_razorpay_order():
    rz = get_razorpay_client()
    if not rz:
        return jsonify({"error": "Razorpay not configured"}), 400
    uid    = session["uid"]
    months = int(request.json.get("months", 1))
    amount = PRO_PRICE_INR * months * 100
    try:
        order = rz.order.create({
            "amount":   amount,
            "currency": "INR",
            "notes":    {"user_id": uid, "months": str(months)},
        })
        payments_col.insert_one({
            "user_id":    uid,
            "order_id":   order["id"],
            "amount":     amount,
            "months":     months,
            "status":     "created",
            "created_at": now(),
        })
        return jsonify({
            "order_id": order["id"],
            "amount":   amount,
            "currency": "INR",
            "key":      RAZORPAY_KEY_ID,
            "name":     "DealInbox",
            "months":   months,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route("/upgrade/verify", methods=["POST"])
@login_required
def verify_razorpay_payment():
    rz = get_razorpay_client()
    if not rz:
        return jsonify({"error": "Razorpay not configured"}), 400
    uid        = session["uid"]
    order_id   = request.json.get("razorpay_order_id","")
    payment_id = request.json.get("razorpay_payment_id","")
    signature  = request.json.get("razorpay_signature","")
    try:
        import razorpay
        rz.utility.verify_payment_signature({
            "razorpay_order_id":   order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature":  signature,
        })
    except Exception:
        return jsonify({"ok": False, "error": "Signature verification failed"}), 400
    pay_rec = payments_col.find_one({"order_id": order_id})
    months  = int(pay_rec["months"]) if pay_rec else 1
    users_col.update_one({"_id": oid(uid)}, {"$set": {
        "plan":        "pro",
        "pro_since":   now(),
        "pro_expires": now() + timedelta(days=30 * months),
        "payment_pending": False,
    }})
    payments_col.update_one({"order_id": order_id}, {"$set": {
        "status":     "paid",
        "payment_id": payment_id,
        "paid_at":    now(),
    }})
    session["plan"] = "pro"
    log(uid, "Upgraded to Pro via Razorpay", f"{months} month(s) - {payment_id}")
    return jsonify({"ok": True, "months": months})
@app.route("/upgrade/submit", methods=["POST"])
@login_required
def upgrade_submit():
    uid   = session["uid"]
    txn   = request.form.get("txn_id","").strip()
    month = request.form.get("months","1")
    if not txn:
        flash("Please enter your UPI transaction ID.", "error")
        return redirect(url_for("upgrade"))
    users_col.update_one({"_id": oid(uid)}, {"$set": {
        "payment_pending": True,
        "payment_txn":     txn,
        "payment_months":  month,
        "payment_date":    now(),
    }})
    payments_col.insert_one({
        "user_id":    uid,
        "txn_id":     txn,
        "months":     month,
        "status":     "pending_upi",
        "created_at": now(),
    })
    log(uid, "Payment submitted (UPI)", f"TXN: {txn} - {month} month(s)")
    flash("Payment submitted! We will verify and activate Pro within 1 hour.", "success")
    return redirect(url_for("dashboard"))
# ── Admin endpoints ───────────────────────────────────────────────────────────
@app.route("/admin/verify/<uid_str>", methods=["POST"])
def admin_verify(uid_str):
    secret = request.form.get("secret","")
    if secret != app.secret_key:
        return jsonify({"error": "Unauthorized"}), 403
    months = int(request.form.get("months", 1))
    users_col.update_one({"_id": oid(uid_str)}, {"$set": {
        "plan":            "pro",
        "pro_since":       now(),
        "pro_expires":     now() + timedelta(days=30*months),
        "payment_pending": False,
    }})
    log(uid_str, "Upgraded to Pro (admin)", f"{months} month(s) activated")
    return jsonify({"ok": True, "message": f"Pro activated for {months} months"})
@app.route("/admin/pending")
def admin_pending():
    secret = request.args.get("secret","")
    if secret != app.secret_key:
        return jsonify({"error": "Unauthorized"}), 403
    pending = list(users_col.find({"payment_pending": True}, {"password_hash": 0}))
    for p in pending:
        p["_id"] = str(p["_id"])
        for k in ["created_at","payment_date"]:
            if p.get(k): p[k] = str(p[k])
    return jsonify(pending)
@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404
# ═══════════════════════════════════════════════════════════════════════════════
# ENQUIRY EXTRAS — notes, reminders, bulk, search, star, snooze
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/enquiries/<eid>/notes", methods=["POST"])
@login_required
def add_note(eid):
    uid  = session["uid"]
    text = request.json.get("text", "").strip()
    if not text:
        return jsonify({"ok": False, "error": "Empty note"}), 400
    note = {"text": text, "created_at": now().isoformat(), "author": session.get("name", "You")}
    enquiries.update_one({"_id": oid(eid), "user_id": uid},
                         {"$push": {"notes_thread": note}})
    log(uid, "Added note", f"On enquiry {eid[:8]}")
    return jsonify({"ok": True, "note": note})
@app.route("/enquiries/<eid>/notes", methods=["GET"])
@login_required
def get_notes(eid):
    uid = session["uid"]
    enq = enquiries.find_one({"_id": oid(eid), "user_id": uid}, {"notes_thread": 1})
    if not enq:
        return jsonify({"notes": []})
    return jsonify({"notes": enq.get("notes_thread", [])})
@app.route("/enquiries/<eid>/reminder", methods=["POST"])
@login_required
def set_reminder(eid):
    uid      = session["uid"]
    due_str  = request.json.get("due", "")
    note_txt = request.json.get("note", "")
    try:
        due_dt = datetime.strptime(due_str, "%Y-%m-%d")
    except Exception:
        return jsonify({"ok": False, "error": "Invalid date"}), 400
    enquiries.update_one({"_id": oid(eid), "user_id": uid},
                         {"$set": {"reminder_due": due_dt, "reminder_note": note_txt,
                                   "reminder_done": False}})
    log(uid, "Set reminder", f"Due {due_str}")
    return jsonify({"ok": True, "due": due_str})
@app.route("/enquiries/<eid>/reminder/done", methods=["POST"])
@login_required
def reminder_done(eid):
    uid = session["uid"]
    enquiries.update_one({"_id": oid(eid), "user_id": uid},
                         {"$set": {"reminder_done": True}})
    return jsonify({"ok": True})
@app.route("/api/reminders")
@login_required
def get_reminders():
    uid = session["uid"]
    enqs = list(enquiries.find({
        "user_id": uid,
        "reminder_due": {"$lte": now() + timedelta(days=3)},
        "reminder_done": {"$ne": True}
    }, {"brand_name": 1, "reminder_due": 1, "reminder_note": 1, "status": 1}))
    result = []
    for e in enqs:
        result.append({
            "id":    str(e["_id"]),
            "brand": e.get("brand_name", ""),
            "due":   e["reminder_due"].strftime("%b %d") if e.get("reminder_due") else "",
            "note":  e.get("reminder_note", ""),
            "status": e.get("status", "new"),
        })
    return jsonify({"reminders": result})
@app.route("/enquiries/bulk", methods=["POST"])
@login_required
def bulk_action():
    uid    = session["uid"]
    ids    = request.json.get("ids", [])
    action = request.json.get("action", "")
    if not ids or not action:
        return jsonify({"ok": False}), 400
    obj_ids = [oid(i) for i in ids if oid(i)]
    if action == "delete":
        enquiries.delete_many({"_id": {"$in": obj_ids}, "user_id": uid})
        log(uid, f"Bulk deleted {len(ids)} enquiries")
    elif action in STATUSES:
        enquiries.update_many({"_id": {"$in": obj_ids}, "user_id": uid},
                              {"$set": {"status": action, "updated_at": now()}})
        log(uid, f"Bulk status → {STATUSES[action]['label']}", f"{len(ids)} enquiries")
    elif action == "archive":
        enquiries.update_many({"_id": {"$in": obj_ids}, "user_id": uid},
                              {"$set": {"archived": True, "updated_at": now()}})
        log(uid, f"Bulk archived {len(ids)} enquiries")
    return jsonify({"ok": True})
@app.route("/api/search")
@login_required
def search():
    uid = session["uid"]
    q   = request.args.get("q", "").strip()
    if not q or len(q) < 2:
        return jsonify({"results": []})
    rx = {"$regex": q, "$options": "i"}
    results = list(enquiries.find({
        "user_id": uid,
        "$or": [{"brand_name": rx}, {"contact_name": rx}, {"email": rx}, {"brief": rx}]
    }, {"brand_name": 1, "status": 1, "budget": 1, "created_at": 1}).limit(8))
    out = []
    for r in results:
        out.append({
            "id":    str(r["_id"]),
            "brand": r.get("brand_name", ""),
            "status": r.get("status", ""),
            "budget": r.get("budget", ""),
            "date":  fmt_date(r.get("created_at")),
        })
    return jsonify({"results": out})
EMAIL_TEMPLATES = {
    "follow_up": {
        "label": "Follow-up",
        "subject": "Following up — {brand} × {creator}",
        "body": "Hi {contact},\n\nJust following up on my last message about the {brand} campaign.\n\nAre you still exploring creators for this campaign? I'd love to connect and discuss the details.\n\nLooking forward to hearing from you!\n\n{creator}"
    },
    "counter": {
        "label": "Counter-offer",
        "subject": "Re: Collab — {brand} × {creator}",
        "body": "Hi {contact},\n\nThank you for reaching out! I'm excited about this collaboration.\n\nWhile I reviewed the brief, my rate for {platform} content is slightly above the mentioned budget. My standard rate is ₹[YOUR RATE] which includes [DELIVERABLES].\n\nI'd love to make this work — is there flexibility on the budget?\n\nBest,\n{creator}"
    },
    "acceptance": {
        "label": "Deal accepted",
        "subject": "Deal confirmed — {brand} × {creator} 🎉",
        "body": "Hi {contact},\n\nExcited to confirm that I'm on board for the {brand} campaign!\n\nHere's a quick summary of what we agreed on:\n• Platform: {platform}\n• Budget: {budget}\n\nI'll share a content draft within [TIMELINE]. Please send over the product/brief when ready.\n\nLooking forward to creating great content together!\n\n{creator}"
    },
    "delay": {
        "label": "Delay notice",
        "subject": "Update on our collaboration — {brand}",
        "body": "Hi {contact},\n\nI wanted to give you a heads-up that I'll need a few more days to finalize the content. I want to make sure everything is perfect for the {brand} campaign.\n\nNew delivery date: [DATE]\n\nApologies for any inconvenience. Thank you for your patience!\n\nBest,\n{creator}"
    }
}
@app.route("/api/email-templates")
@login_required
def get_email_templates():
    return jsonify({"templates": EMAIL_TEMPLATES})
@app.route("/enquiries/<eid>/star", methods=["POST"])
@login_required
def toggle_star(eid):
    uid = session["uid"]
    enq = enquiries.find_one({"_id": oid(eid), "user_id": uid}, {"starred": 1})
    if not enq:
        return jsonify({"ok": False}), 404
    new_val = not enq.get("starred", False)
    enquiries.update_one({"_id": oid(eid)}, {"$set": {"starred": new_val}})
    return jsonify({"ok": True, "starred": new_val})
@app.route("/enquiries/<eid>/value", methods=["POST"])
@login_required
def set_deal_value(eid):
    uid = session["uid"]
    val = request.json.get("value", 0)
    try:
        val = int(val)
    except:
        return jsonify({"ok": False}), 400
    enquiries.update_one({"_id": oid(eid), "user_id": uid},
                         {"$set": {"deal_value": val, "budget_num": val}})
    return jsonify({"ok": True, "value": val})
@app.route("/api/stats")
@login_required
def api_stats():
    uid  = session["uid"]
    enqs = list(enquiries.find({"user_id": uid}))
    total         = len(enqs)
    this_month    = sum(1 for e in enqs if e.get("created_at") and
                        to_naive(e["created_at"]) >= now().replace(day=1,hour=0,minute=0,second=0,microsecond=0))
    starred       = sum(1 for e in enqs if e.get("starred"))
    pending_reply = sum(1 for e in enqs if e.get("status") in ["new","reviewing"])
    return jsonify({"total": total, "this_month": this_month,
                    "starred": starred, "pending_reply": pending_reply})
@app.route("/api/media-kit")
@login_required
def media_kit():
    uid  = session["uid"]
    user = users_col.find_one({"_id": oid(uid)})
    enqs = list(enquiries.find({"user_id": uid}))
    total      = len(enqs)
    closed     = sum(1 for e in enqs if e["status"] in ["accepted","closed"])
    total_val  = sum(e.get("budget_num", 0) for e in enqs if e["status"] in ["accepted","closed"])
    avg_deal   = round(total_val / closed) if closed else 0
    conversion = round(closed/total*100, 1) if total else 0
    brand_map  = {}
    for e in enqs:
        b = e.get("brand_name", "")
        if b: brand_map[b] = brand_map.get(b, 0) + 1
    top_brands = sorted(brand_map.items(), key=lambda x: x[1], reverse=True)[:3]
    return jsonify({
        "name": user.get("name",""), "username": user.get("username",""),
        "niche": user.get("niche",""), "platform": user.get("platform",""),
        "followers": user.get("followers",""), "bio": user.get("bio",""),
        "total_deals": total, "closed_deals": closed,
        "total_value": total_val, "avg_deal": avg_deal,
        "conversion": conversion, "top_brands": [b for b,_ in top_brands],
        "min_budget": user.get("min_budget",""), "response_time": user.get("response_time",""),
    })
@app.route("/enquiries/<eid>/snooze", methods=["POST"])
@login_required
def snooze_enquiry(eid):
    uid          = session["uid"]
    days         = int(request.json.get("days", 3))
    snooze_until = now() + timedelta(days=days)
    enquiries.update_one({"_id": oid(eid), "user_id": uid},
                         {"$set": {"snoozed_until": snooze_until}})
    return jsonify({"ok": True, "until": snooze_until.strftime("%b %d")})
@app.route("/api/enquiry/<eid>/status", methods=["POST"])
@login_required
def api_status(eid):
    uid    = session["uid"]
    status = request.json.get("status","")
    if status not in STATUSES:
        return jsonify({"ok": False}), 400
    enquiries.update_one({"_id": oid(eid), "user_id": uid},
                         {"$set": {"status": status, "updated_at": now()}})
    log(uid, f"Quick status changed to {STATUSES[status]['label']}")
    return jsonify({"ok": True, "label": STATUSES[status]["label"],
                    "color": STATUSES[status]["color"]})
# ═══════════════════════════════════════════════════════════════════════════════
# NEGOTIATION REPLAY
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/enquiries/<eid>/replay")
@login_required
def negotiation_replay(eid):
    uid = session["uid"]
    enq = enquiries.find_one({"_id": oid(eid), "user_id": uid})
    if not enq:
        flash("Enquiry not found.", "error")
        return redirect(url_for("enquiries_page"))
    user = users_col.find_one({"_id": oid(uid)})
    return render_template("negotiation_replay.html", enq=enq,
                           STATUSES=STATUSES, fmt_dt=fmt_dt, fmt_date=fmt_date,
                           is_pro_user=is_pro(user))
@app.route("/api/enquiries/<eid>/replay-analysis")
@login_required
def replay_analysis(eid):
    uid = session["uid"]
    enq = enquiries.find_one({"_id": oid(eid), "user_id": uid})
    if not enq:
        return jsonify({"error": "Not found"}), 404
    insights = []
    score = 0
    budget_num     = enq.get("budget_num", 0) or 0
    status         = enq.get("status", "new")
    created        = to_naive(enq.get("created_at", now()))
    updated        = to_naive(enq.get("updated_at", now()))
    response_hours = round((updated - created).total_seconds() / 3600, 1) if updated > created else 0
    notes_count    = len(enq.get("notes_thread", []))
    brief_len      = len(enq.get("brief", "") or "")
    budget_label   = enq.get("budget", "")
    if budget_num > 0:
        if status in ["accepted", "closed"] and response_hours < 2:
            insights.append({"type":"warning","icon":"💡","title":"Brand accepted very fast",
                "detail":f"Accepted in under {int(response_hours*60)} min — often signals underpricing. You could charge ₹{budget_num//4:,} more next time.",
                "impact":"high"})
            score -= 15
        if budget_num < 10000 and status in ["accepted", "closed"]:
            insights.append({"type":"warning","icon":"📉","title":"Deal closed below market rate",
                "detail":f"This deal closed at {budget_label}. You may be undervaluing your reach by 20–40%.",
                "impact":"high"})
            score -= 10
        if budget_num >= 50000:
            insights.append({"type":"success","icon":"🔥","title":"Premium deal territory",
                "detail":f"At {budget_label}, this is a high-value deal. Document it for your media kit.",
                "impact":"low"})
            score += 20
    if response_hours > 48:
        insights.append({"type":"warning","icon":"⏰","title":"Slow response may have cost urgency",
            "detail":f"You responded {int(response_hours)}h after receiving this. Brands with tight timelines lose interest after 24h.",
            "impact":"medium"})
        score -= 10
    elif 0 < response_hours <= 4:
        insights.append({"type":"success","icon":"⚡","title":"Lightning-fast response",
            "detail":f"You responded within {int(response_hours*60)} minutes — builds trust and urgency in your favour.",
            "impact":"low"})
        score += 15
    if brief_len < 100:
        insights.append({"type":"tip","icon":"📝","title":"Thin brief — harder to negotiate",
            "detail":"Short briefs give less context. Ask brands to fill the full brief before committing.",
            "impact":"medium"})
    elif brief_len > 400:
        insights.append({"type":"success","icon":"📋","title":"Detailed brief received",
            "detail":"Detailed briefs signal serious brands. You had strong info to negotiate from.",
            "impact":"low"})
        score += 10
    if notes_count == 0 and status in ["accepted", "closed"]:
        insights.append({"type":"tip","icon":"🗒️","title":"No negotiation notes recorded",
            "detail":"Add notes during negotiations to track what was discussed and countered.",
            "impact":"medium"})
    elif notes_count >= 3:
        insights.append({"type":"success","icon":"💬","title":"Active negotiation logged",
            "detail":f"You kept {notes_count} notes on this deal — great for learning your patterns.",
            "impact":"low"})
        score += 10
    if status == "declined":
        insights.append({"type":"tip","icon":"🚪","title":"Deal declined — revisit why",
            "detail":"Track why you declined to spot patterns. Use notes to log the reason.",
            "impact":"medium"})
    if status == "new":
        insights.append({"type":"warning","icon":"🕐","title":"Deal still untouched",
            "detail":"This enquiry hasn't been actioned. Every hour counts with time-sensitive campaigns.",
            "impact":"high"})
        score -= 20
    final_score = max(0, min(100, 60 + score))
    return jsonify({"insights": insights, "score": final_score,
                    "response_hours": response_hours, "deal_value": budget_num,
                    "notes_count": notes_count, "status": status})
# ═══════════════════════════════════════════════════════════════════════════════
# POSITIONING
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/positioning")
@login_required
def positioning():
    uid  = session["uid"]
    user = users_col.find_one({"_id": oid(uid)})
    enqs = list(enquiries.find({"user_id": uid}))
    return render_template("positioning.html", user=user, enq_count=len(enqs),
                           is_pro_user=is_pro(user))
@app.route("/api/positioning-analysis")
@login_required
def positioning_analysis():
    uid  = session["uid"]
    user = users_col.find_one({"_id": oid(uid)})
    enqs = list(enquiries.find({"user_id": uid}))
    if not enqs:
        return jsonify({"ready": False, "message": "Need at least 1 enquiry to analyse."})
    total      = len(enqs)
    closed     = [e for e in enqs if e["status"] in ["accepted", "closed"]]
    avg_budget = sum(e.get("budget_num", 0) for e in enqs) / total if total else 0
    low_budget = sum(1 for e in enqs if (e.get("budget_num") or 0) < 10000)
    pct_low    = round(low_budget / total * 100) if total else 0
    plat_counts = {}
    for e in enqs:
        p = e.get("platform") or "Unknown"
        plat_counts[p] = plat_counts.get(p, 0) + 1
    top_platform = max(plat_counts, key=plat_counts.get) if plat_counts else "Unknown"
    suggestions = []
    if pct_low > 60:
        suggestions.append({"area":"Pricing Signal","icon":"💰","severity":"high",
            "problem":f"{pct_low}% of enquiries are below ₹10,000 — your page is attracting budget brands.",
            "fix":"Add a minimum budget line to your public page. Phrases like 'Brand partnerships from ₹15,000' filter out lowballers.",
            "bio_tweak":"Add to bio: 'Open to brand collabs — min. ₹15,000'"})
    if not user.get("bio") or len(user.get("bio", "")) < 40:
        suggestions.append({"area":"Bio Clarity","icon":"✍️","severity":"high",
            "problem":"Your bio is too short or missing. Brands read bios to decide if you're a fit.",
            "fix":"Write 2–3 sentences covering: your niche, audience demographic, and brand types you work with.",
            "bio_tweak":f"Example: 'Lifestyle & beauty creator for {user.get('platform','Instagram')}, 25–34 female audience in Tier 1 cities.'"})
    if not user.get("followers"):
        suggestions.append({"area":"Social Proof","icon":"👥","severity":"medium",
            "problem":"You haven't added your follower count. Brands use this to quickly assess reach.",
            "fix":"Add your follower count in Settings — even approximate (e.g. '45K+') increases enquiry quality.",
            "bio_tweak": None})
    if total >= 5 and len(closed) / total < 0.2:
        suggestions.append({"area":"Conversion Rate","icon":"📊","severity":"medium",
            "problem":f"You're closing only {round(len(closed)/total*100)}% of deals. Enquiries may not be the right fit.",
            "fix":"Tighten your niche on the public page — be more specific about campaign types you accept.",
            "bio_tweak": None})
    if user.get("response_time", "48 hours") in ["48 hours", "72 hours", ""]:
        suggestions.append({"area":"Response Speed Signal","icon":"⚡","severity":"low",
            "problem":"Your response time is 48+ hours, which can signal low availability to premium brands.",
            "fix":"If you check DealInbox regularly, change your response time to '24 hours' in Settings.",
            "bio_tweak": None})
    positioning_score = max(0, 100
        - len([s for s in suggestions if s["severity"] == "high"]) * 25
        - len([s for s in suggestions if s["severity"] == "medium"]) * 12
        - len([s for s in suggestions if s["severity"] == "low"]) * 5)
    return jsonify({"ready": True, "score": positioning_score,
                    "avg_budget": round(avg_budget), "pct_low": pct_low,
                    "top_platform": top_platform, "total_enqs": total,
                    "suggestions": suggestions,
                    "user": {"bio": user.get("bio",""), "niche": user.get("niche",""),
                             "platform": user.get("platform",""), "min_budget": user.get("min_budget","")}})
# ═══════════════════════════════════════════════════════════════════════════════
# SMART DEAL ROUTING
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/api/enquiries/<eid>/routing")
@login_required
def smart_routing(eid):
    uid = session["uid"]
    enq = enquiries.find_one({"_id": oid(eid), "user_id": uid})
    if not enq:
        return jsonify({"error": "Not found"}), 404
    user         = users_col.find_one({"_id": oid(uid)})
    brief        = (enq.get("brief") or "").lower()
    platform     = (enq.get("platform") or "").lower()
    budget_num   = enq.get("budget_num", 0) or 0
    deliverables = (enq.get("deliverables") or "").lower()
    timeline     = (enq.get("timeline") or "").lower()
    routing = {}
    if "reel" in brief or "short" in brief or "instagram" in platform:
        routing["best_platform"] = "Instagram Reels"
        routing["platform_reason"] = "Brief mentions short-form content — Reels offer highest engagement."
    elif "youtube" in brief or "long" in brief or "review" in brief or "unboxing" in brief:
        routing["best_platform"] = "YouTube"
        routing["platform_reason"] = "Brief suggests long-form storytelling — YouTube drives deeper brand trust."
    elif "podcast" in brief or "audio" in platform:
        routing["best_platform"] = "Podcast"
        routing["platform_reason"] = "Audio-first content works best for this campaign type."
    else:
        routing["best_platform"] = user.get("platform", "Instagram")
        routing["platform_reason"] = "Defaulting to your primary platform."
    strategies = []
    if budget_num > 50000:
        strategies.append("Bundle play: offer 1 hero Reel + 3 Stories as a package — justifies premium pricing.")
    elif budget_num > 20000:
        strategies.append("Single strong deliverable: 1 dedicated Reel performs better than multiple weak ones.")
    else:
        strategies.append("Lead with value: offer 1 Reel but upsell Story mentions as add-ons.")
    if "launch" in brief or "new" in brief:
        strategies.append("Product launch timing: suggest posting on launch day for max relevance.")
    if "discount" in brief or "code" in brief or "promo" in brief:
        strategies.append("Add a custom promo code — trackable for the brand and negotiable for higher fee.")
    routing["deliverable_strategies"] = strategies
    bp = routing["best_platform"]
    if "instagram" in bp.lower() or "reel" in bp.lower():
        routing["pricing_guide"] = {"base":"1 Reel: ₹15,000–₹50,000","bundle":"1 Reel + 3 Stories: +₹5,000–₹8,000","exclusivity":"Category exclusivity: +₹10,000–₹20,000"}
    elif "youtube" in bp.lower():
        routing["pricing_guide"] = {"base":"Dedicated video: ₹30,000–₹1,50,000","integration":"60-sec integration: ₹15,000–₹40,000","exclusivity":"6-month exclusivity: 2–3× base rate"}
    else:
        routing["pricing_guide"] = {"base":"Single post: ₹10,000–₹30,000","bundle":"Multi-post package: +20%","exclusivity":"Category exclusivity: +50%"}
    urgent_words = ["asap","urgent","this week","immediately","quick","fast","rush"]
    is_urgent = any(w in brief or w in timeline for w in urgent_words)
    if is_urgent:
        routing["urgency_tag"] = "🔴 Urgent — brand needs quick turnaround. Charge a rush premium of 15–25%."
    elif "next month" in timeline or "q" in timeline:
        routing["urgency_tag"] = "🟡 Moderate — planned campaign with some flexibility."
    else:
        routing["urgency_tag"] = "🟢 Relaxed timeline — you have negotiating room."
    return jsonify(routing)
# ═══════════════════════════════════════════════════════════════════════════════
# DEAL URGENCY HEATMAP
# ═══════════════════════════════════════════════════════════════════════════════
def compute_urgency(enq):
    score   = 0
    reasons = []
    brief    = (enq.get("brief") or "").lower()
    timeline = (enq.get("timeline") or "").lower()
    budget   = enq.get("budget_num", 0) or 0
    created  = to_naive(enq.get("created_at", now()))
    age_hours = (now() - created).total_seconds() / 3600
    urgent_words  = ["asap","urgent","this week","2 days","3 days","immediately","rush","quick","fast","monday","tomorrow"]
    relaxed_words = ["next month","q3","q4","next quarter","whenever","flexible","no rush"]
    if any(w in timeline or w in brief for w in urgent_words):
        score += 40; reasons.append("Urgent language detected in brief/timeline")
    if any(w in timeline for w in relaxed_words):
        score -= 20; reasons.append("Brand indicated flexible timeline")
    if "this month" in timeline or "end of month" in timeline:
        score += 20; reasons.append("End-of-month deadline")
    if budget >= 50000:
        score += 15; reasons.append("High-budget deal — brand is serious")
    elif budget >= 20000:
        score += 8
    if age_hours > 48 and enq.get("status") in ["new", "reviewing"]:
        score += 25; reasons.append(f"Enquiry is {int(age_hours)}h old and still unactioned")
    elif age_hours < 4:
        score += 10; reasons.append("Very fresh enquiry — brand is in active mode")
    if "launch" in brief or "go live" in brief:
        score += 15; reasons.append("Product launch — date-dependent")
    if any(w in brief for w in ["festival","sale","diwali","holi"]):
        score += 20; reasons.append("Festival/sale campaign — extremely time-sensitive")
    score = max(0, min(100, score))
    level = "high" if score >= 65 else "medium" if score >= 35 else "low"
    return {"score": score, "level": level, "reasons": reasons}
@app.route("/api/urgency-heatmap")
@login_required
def urgency_heatmap():
    uid  = session["uid"]
    enqs = list(enquiries.find({
        "user_id": uid,
        "status": {"$in": ["new", "reviewing", "negotiating"]}
    }).sort("created_at", DESCENDING).limit(20))
    result = []
    for e in enqs:
        u = compute_urgency(e)
        result.append({"id": str(e["_id"]), "brand": e.get("brand_name",""),
                        "budget": e.get("budget",""), "status": e.get("status",""),
                        "platform": e.get("platform",""), "urgency": u,
                        "created": fmt_date(e.get("created_at"))})
    result.sort(key=lambda x: x["urgency"]["score"], reverse=True)
    return jsonify({"deals": result})
@app.route("/heatmap")
@login_required
def heatmap_page():
    uid  = session["uid"]
    user = users_col.find_one({"_id": oid(uid)})
    return render_template("heatmap.html", is_pro_user=is_pro(user))
# ═══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    if not users_col.find_one({"username": "demo"}):
        try:
            users_col.insert_one({
                "name": "Demo Creator", "email": "demo@dealinbox.in",
                "username": "demo",
                "password_hash": generate_password_hash("demo123"),
                "niche": "Beauty", "platform": "Instagram",
                "bio": "Beauty & lifestyle creator. Open to brand collabs!",
                "collab_email": "demo@dealinbox.in",
                "min_budget": "Rs.10,000-Rs.25,000",
                "response_time": "24 hours",
                "followers": "45,000",
                "plan": "free", "created_at": now()
            })
            print("Demo user: demo@dealinbox.in / demo123")
            print("Demo page: http://127.0.0.1:5000/@demo")
        except Exception as e:
            print(f"Demo user skipped: {e}")
    port  = int(os.getenv("PORT", "5000"))
    debug = os.getenv("DEBUG", "False") == "True"
    print(f"Starting DealInbox on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
