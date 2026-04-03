"""
DealInbox — Never lose a brand deal again.
Run: pip install flask pymongo werkzeug python-dotenv razorpay && python app.py
"""
from flask import (Flask, render_template, request, redirect,
                   session, flash, url_for, jsonify, make_response, Response, stream_with_context)
from pymongo import MongoClient, DESCENDING
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone, timedelta
from functools import wraps
from dotenv import load_dotenv
import os, re, csv, io, json, logging, uuid
import requests
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv()
app = Flask(__name__,
            template_folder=os.path.join(BASE_DIR, "templates"),
            static_folder=os.path.join(BASE_DIR, "static"))
app.secret_key = os.getenv("SECRET_KEY", "fallback-secret")
logging.basicConfig(level=logging.INFO)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
DB_NAME   = os.getenv("DB_NAME", "dealinbox")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "alerts@dealsinbox.in")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
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
rate_limits_col = db["rate_limits"]
reply_drafts_col = db["reply_drafts"]
brands_col = db["brands"]
contracts_col = db["contracts"]
invoices_col = db["invoices"]
media_kits_col = db["media_kits"]
notifications_col = db["notifications"]
automation_rules_col = db["automation_rules"]
reviews_col = db["reviews"]
community_posts_col = db["community_posts"]
brand_intel_col = db["brand_intel"]
brand_profiles_col = db["brand_profiles"]
relationships_col = db["relationships"]
campaigns_col = db["campaigns"]
creator_scores_col = db["creator_scores"]
integrations_col = db["integrations"]
integration_logs_col = db["integration_logs"]
gmail_threads_col = db["gmail_threads"]
whatsapp_messages_col = db["whatsapp_messages"]
notion_pages_col = db["notion_pages"]
sheets_config_col = db["sheets_config"]
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

def json_body():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}

def require_valid_oid(raw_id):
    object_id = oid(raw_id)
    if not object_id:
        return None
    return object_id
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

def log_integration(uid, provider, event, detail=""):
    try:
        integration_logs_col.insert_one({
            "user_id": uid,
            "provider": (provider or "").strip().lower(),
            "event": (event or "").strip().lower(),
            "detail": (detail or "").strip()[:500],
            "created_at": now(),
        })
    except Exception:
        pass

def mask_secret(value):
    raw = (value or "").strip()
    if not raw:
        return ""
    if len(raw) <= 6:
        return "*" * len(raw)
    return f"{raw[:2]}{'*' * (len(raw) - 4)}{raw[-2:]}"
def is_pro(user):
    if not user: return False
    if user.get("plan") == "pro": return True
    joined = user.get("created_at")
    if joined:
        delta = now() - to_naive(joined)
        if delta.days < 60:
            return True
    return False

def profile_completion(user):
    if not user:
        return 0
    fields = [
        bool((user.get("name") or "").strip()),
        bool((user.get("bio") or "").strip()),
        bool((user.get("platform") or "").strip()),
        bool((user.get("niche") or "").strip()),
        bool((user.get("followers") or "").strip()),
        bool((user.get("collab_email") or "").strip()),
        bool((user.get("min_budget") or "").strip()),
        bool((user.get("response_time") or "").strip()),
    ]
    return int(round((sum(fields) / len(fields)) * 100))


def safe_count(collection, query=None, fallback=0):
    try:
        return collection.count_documents(query or {})
    except Exception:
        return fallback

def api_ok(data=None, status=200):
    return jsonify({"success": True, "data": data or {}}), status

def api_error(message, status=400):
    return jsonify({"success": False, "error": message}), status

def parse_budget_num(text):
    if not text:
        return 0
    cleaned = text.replace(",", "").lower()
    m = re.search(r"(₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(lakh|lac|cr|crore|k)?", cleaned)
    if not m:
        return 0
    val = float(m.group(2))
    suffix = (m.group(3) or "").strip()
    if suffix in {"k"}:
        val *= 1000
    elif suffix in {"lakh", "lac"}:
        val *= 100000
    elif suffix in {"cr", "crore"}:
        val *= 10000000
    return int(val)

def slugify(text):
    text = (text or "").strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "brand"

def ensure_brand_profile(brand_name, category="", source="enquiry"):
    slug = slugify(brand_name)
    profile = brand_profiles_col.find_one({"slug": slug})
    if profile:
        update = {"updated_at": now()}
        if category and not profile.get("industry"):
            update["industry"] = category
        brand_profiles_col.update_one({"_id": profile["_id"]}, {"$set": update})
        return profile
    doc = {
        "name": brand_name or "Unknown Brand",
        "slug": slug,
        "industry": category or "General",
        "logo": "",
        "bio": "",
        "claimed": False,
        "avg_deal_size": 0,
        "avg_response_days": 0,
        "rating": 0,
        "source": source,
        "created_at": now(),
        "updated_at": now(),
    }
    inserted = brand_profiles_col.insert_one(doc)
    doc["_id"] = inserted.inserted_id
    return doc

def claude_parse_email(raw_text, subject="", from_email=""):
    """
    Parse inbound brand email into normalized enquiry fields.
    Returns a dict with brand_name, contact_name, contact_email, budget, platform, timeline, brief, deliverables.
    """
    fallback = {
        "brand_name": (subject.split(" ")[0] if subject else "Unknown Brand"),
        "contact_name": "",
        "contact_email": from_email or "",
        "budget": "",
        "platform": "",
        "timeline": "",
        "brief": (raw_text or "")[:1500],
        "deliverables": ""
    }
    if not ANTHROPIC_API_KEY:
        return fallback
    prompt = (
        "Extract structured brand deal enquiry data from this email.\n"
        "Return strict JSON only with keys: brand_name, contact_name, contact_email, budget, platform, timeline, brief, deliverables.\n"
        "If missing, use empty strings. Keep brief concise (max 500 chars).\n\n"
        f"Subject: {subject}\n"
        f"From: {from_email}\n"
        f"Body:\n{raw_text[:6000]}"
    )
    try:
        r = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-6",
                "max_tokens": 500,
                "temperature": 0,
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=30
        )
        if r.status_code >= 300:
            app.logger.error("Claude parse failed: %s %s", r.status_code, r.text[:500])
            return fallback
        payload = r.json()
        text = ""
        for blk in payload.get("content", []):
            if blk.get("type") == "text":
                text += blk.get("text", "")
        text = text.strip()
        if text.startswith("```"):
            text = text.strip("`")
            text = text.replace("json", "", 1).strip()
        parsed = json.loads(text)
        out = {**fallback, **{k: (parsed.get(k) or "") for k in fallback.keys()}}
        return out
    except Exception as exc:
        app.logger.exception("Claude parse exception: %s", exc)
        return fallback

def sendgrid_send(to_email, subject, body):
    if not SENDGRID_API_KEY or not to_email:
        return False
    try:
        res = requests.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={"Authorization": f"Bearer {SENDGRID_API_KEY}", "Content-Type": "application/json"},
            json={
                "personalizations": [{"to": [{"email": to_email}]}],
                "from": {"email": SENDGRID_FROM_EMAIL},
                "subject": subject,
                "content": [{"type": "text/plain", "value": body}]
            },
            timeout=20
        )
        return 200 <= res.status_code < 300
    except Exception as exc:
        app.logger.exception("SendGrid error: %s", exc)
        return False

def openai_generate_reply_variants(deal_type="", budget="", deliverables="", niche="", brand_name="", brief=""):
    fallback = {
        "accepting": (
            f"Hi {brand_name or 'team'},\\n\\nThanks for sharing the brief."
            f" This looks aligned with my {niche or 'content'} audience. "
            "Happy to move forward — please share final deliverables, usage rights, and payment terms.\\n\\nBest regards"
        ),
        "countering": (
            f"Hi {brand_name or 'team'},\\n\\nThanks for the opportunity."
            f" Based on scope ({deliverables or 'deliverables'}) and market rates in {niche or 'my niche'}, "
            f"I'd be comfortable proceeding at a revised budget above {budget or 'the shared range'}. "
            "If that works, I can share timelines immediately.\\n\\nBest regards"
        ),
        "declining": (
            f"Hi {brand_name or 'team'},\\n\\nThank you for reaching out."
            " I’ll have to pass on this collaboration for now, but I appreciate the interest and would be glad to explore future campaigns.\\n\\nBest regards"
        ),
    }
    if not OPENAI_API_KEY:
        return fallback
    prompt = (
        "You are writing professional creator-brand negotiation emails.\n"
        "Return strict JSON with keys: accepting, countering, declining.\n"
        "Each reply should be polished, concise, and ready to send.\n"
        f"Deal type: {deal_type}\nBudget: {budget}\nDeliverables: {deliverables}\n"
        f"Creator niche: {niche}\nBrand: {brand_name}\nBrief: {brief[:1200]}"
    )
    try:
        res = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "gpt-4o",
                "temperature": 0.5,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": "Return only valid JSON."},
                    {"role": "user", "content": prompt},
                ],
            },
            timeout=30
        )
        if res.status_code >= 300:
            return fallback
        content = res.json().get("choices", [{}])[0].get("message", {}).get("content", "{}")
        parsed = json.loads(content)
        return {
            "accepting": parsed.get("accepting") or fallback["accepting"],
            "countering": parsed.get("countering") or fallback["countering"],
            "declining": parsed.get("declining") or fallback["declining"],
        }
    except Exception:
        return fallback
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
        try:
            return users_col.find_one({"_id": oid(session["uid"])})
        except Exception:
            return None
    def new_enquiry_count():
        if "uid" not in session:
            return 0
        try:
            return enquiries.count_documents({"user_id": session["uid"], "status": "new"})
        except Exception:
            return 0
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
@app.route("/render/ping")
@app.route("/healthz")
def ping():
    return "pong", 200

@app.route("/health")
def health():
    try:
        client.admin.command("ping")
        return api_ok({"status": "ok", "db": "connected"})
    except Exception as exc:
        app.logger.exception("Health check failed: %s", exc)
        return api_error("database_unavailable", 503)

@app.route("/api/inbound-email", methods=["POST"])
def inbound_email():
    """
    SendGrid inbound parse webhook endpoint.
    Expected fields include: from, to, subject, text, html.

    curl example:
    curl -X POST http://localhost:5000/api/inbound-email \
      -F 'from=brand@agency.com' \
      -F 'to=creator@example.com' \
      -F 'subject=Collab with Myntra' \
      -F 'text=Hi, we want 1 reel + 2 stories. Budget INR 45000.'
    """
    try:
        from_email = (request.form.get("from") or request.headers.get("X-From") or "").strip()
        to_field = (request.form.get("to") or request.headers.get("X-To") or "").strip().lower()
        subject = (request.form.get("subject") or "").strip()
        raw_text = (request.form.get("text") or request.form.get("html") or "").strip()

        if not to_field or not raw_text:
            return api_error("missing_inbound_fields", 400)

        creator = users_col.find_one({
            "$or": [
                {"email": {"$regex": re.escape(to_field), "$options": "i"}},
                {"collab_email": {"$regex": re.escape(to_field), "$options": "i"}}
            ]
        })
        if not creator:
            return api_error("creator_not_found_for_recipient", 404)

        parsed = claude_parse_email(raw_text=raw_text, subject=subject, from_email=from_email)
        budget_label = parsed.get("budget", "")
        budget_num = parse_budget_num(budget_label)

        profile = ensure_brand_profile(parsed.get("brand_name") or "Unknown Brand", source="inbound_email")
        enq_doc = {
            "user_id": str(creator["_id"]),
            "brand_name": parsed.get("brand_name") or "Unknown Brand",
            "brand_profile_id": str(profile.get("_id")) if profile else None,
            "contact_name": parsed.get("contact_name", ""),
            "email": parsed.get("contact_email") or from_email,
            "platform": parsed.get("platform", ""),
            "budget": budget_label,
            "budget_num": budget_num,
            "timeline": parsed.get("timeline", ""),
            "brief": parsed.get("brief") or raw_text[:1500],
            "deliverables": parsed.get("deliverables", ""),
            "status": "new",
            "note": "",
            "tracking_token": str(uuid.uuid4()),
            "source": "sendgrid_inbound",
            "subject": subject,
            "created_at": now(),
            "updated_at": now(),
            "events": [{
                "timestamp": now(),
                "from_status": None,
                "to_status": "new",
                "note": "Created from inbound email",
                "changed_by": "system"
            }]
        }
        inserted = enquiries.insert_one(enq_doc)

        creator_name = creator.get("name", "Creator")
        sendgrid_send(
            to_email=creator.get("email", ""),
            subject=f"New collab request from {enq_doc['brand_name']}",
            body=(
                f"Hi {creator_name},\n\n"
                f"You received a new collab request from {enq_doc['brand_name']}.\n"
                f"Budget: {budget_label or 'Not specified'}\n"
                f"Platform: {enq_doc.get('platform') or 'Not specified'}\n\n"
                "Open DealInbox to review and respond."
            )
        )

        return api_ok({
            "enquiry_id": str(inserted.inserted_id),
            "brand_name": enq_doc["brand_name"],
            "status": "new"
        }, 201)
    except Exception as exc:
        app.logger.exception("Inbound email processing failed: %s", exc)
        return api_error("failed_to_process_inbound_email", 500)

@app.route("/api/instagram-sync", methods=["POST"])
@login_required
def instagram_sync():
    uid  = session["uid"]
    data = json_body()
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
    try:
        total = users_col.count_documents({})
    except Exception:
        total = 0
    try:
        enq_total = enquiries.count_documents({})
    except Exception:
        enq_total = 0
    landing_state = {
        "total": total,
        "enq_total": enq_total,
        "urls": {
            "signup": url_for("signup"),
            "login": url_for("login"),
        }
    }
    return render_template("index.html", total=total, enq_total=enq_total, landing_state=landing_state)
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
                           creator_count=users_col.count_documents({}),
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
    new_count = sum(1 for e in all_enq if e.get("status") == "new")
    accepted  = sum(1 for e in all_enq if e.get("status") in ["accepted","closed"])
    total_val = sum(e.get("budget_num", 0) for e in all_enq if e.get("status") in ["accepted","closed","negotiating"])
    recent    = all_enq[:6]
    activity  = list(activity_col.find({"user_id": uid}).sort("created_at", DESCENDING).limit(8))
    pipeline  = {s: sum(1 for e in all_enq if e.get("status") == s) for s in STATUSES}

    month_start = now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    enq_this_month = enquiries.count_documents({"user_id": uid, "created_at": {"$gte": month_start}})
    pending_tasks = list(enquiries.find({
        "user_id": uid,
        "reminder_due": {"$lte": now() + timedelta(days=7)},
        "reminder_done": {"$ne": True}
    }).sort("reminder_due", 1).limit(5))

    completion = profile_completion(user)
    checklist = [
        {"title": "Build your creator profile", "done": completion >= 80, "link": url_for("settings")},
        {"title": "Publish your collaboration intake page", "done": len(all_enq) > 0, "link": url_for("public_page", username=session.get("username", ""))},
        {"title": "Sign your first collaboration", "done": accepted > 0, "link": url_for("enquiries_page")},
    ]

    conversion = round((accepted / len(all_enq)) * 100, 1) if all_enq else 0
    avg_value = round(total_val / accepted) if accepted else 0
    response_samples = []
    for e in all_enq:
        c_at = to_naive(e.get("created_at"))
        u_at = to_naive(e.get("updated_at"))
        if c_at and u_at and u_at > c_at:
            response_samples.append((u_at - c_at).total_seconds() / 3600)
    avg_response_hours = round(sum(response_samples) / len(response_samples), 1) if response_samples else None

    notifications = []
    if new_count:
        notifications.append({"type": "new", "text": f"{new_count} new enquiry{'ies' if new_count != 1 else ''} needs your attention."})
    if pending_tasks:
        notifications.append({"type": "reminder", "text": f"{len(pending_tasks)} reminder{'s are' if len(pending_tasks) != 1 else ' is'} due within 7 days."})
    if not is_pro(user) and enq_this_month >= max(1, int(FREE_ENQUIRY_LIMIT * 0.8)):
        notifications.append({"type": "usage", "text": f"You've used {enq_this_month}/{FREE_ENQUIRY_LIMIT} free enquiries this month."})
    top_platforms = {}
    for e in all_enq:
        p = (e.get("platform") or "Unknown").strip()
        top_platforms[p] = top_platforms.get(p, 0) + 1
    top_platform_rows = sorted(top_platforms.items(), key=lambda x: x[1], reverse=True)[:4]
    actionable_insights = []
    if conversion < 20 and len(all_enq) >= 5:
        actionable_insights.append("Win rate is below 20% — tighten intake qualification for better-fit brand opportunities.")
    if avg_response_hours and avg_response_hours > 24:
        actionable_insights.append("Average response is above 24h — faster replies improve creator close rates.")
    if not actionable_insights:
        actionable_insights.append("Deal pipeline is stable — keep a daily review rhythm for consistent signed collaborations.")

    dashboard_state = {
        "name": (session.get("name") or "Creator"),
        "username": session.get("username", ""),
        "stats": {
            "total_val": total_val,
            "conversion": conversion,
            "new_count": new_count,
            "profile_completion_pct": completion,
            "accepted": accepted,
            "total": len(all_enq),
            "avg_value": avg_value,
        },
        "pipeline": [{"key": s, "label": info["label"], "color": info["color"], "count": pipeline.get(s, 0)} for s, info in STATUSES.items()],
        "recent": [{
            "id": str(e.get("_id")),
            "brand_name": e.get("brand_name", ""),
            "platform": e.get("platform") or "Platform TBD",
            "budget": e.get("budget") or "Budget TBD",
            "status": e.get("status", "new"),
            "status_label": STATUSES.get(e.get("status", "new"), {}).get("label", e.get("status", "new")),
            "created_at_fmt": fmt_dt(e.get("created_at")),
        } for e in recent],
        "activity": [{
            "action": a.get("action", ""),
            "detail": a.get("detail", ""),
            "created_at_fmt": fmt_dt(a.get("created_at")),
        } for a in activity],
        "checklist": checklist,
        "pending_tasks": [{
            "id": str(r.get("_id")),
            "brand_name": r.get("brand_name", ""),
            "reminder_due_fmt": fmt_date(r.get("reminder_due")) if r.get("reminder_due") else "Soon",
        } for r in pending_tasks],
        "notifications": notifications,
        "top_platforms": [{"name": k, "count": v} for k, v in top_platform_rows],
        "avg_response_hours": avg_response_hours,
        "insights": actionable_insights,
        "is_pro_user": is_pro(user),
        "FREE_ENQUIRY_LIMIT": FREE_ENQUIRY_LIMIT,
        "enq_this_month": enq_this_month,
        "urls": {
            "public_page": url_for("public_page", username=session.get("username", "")),
            "enquiries": url_for("enquiries_page"),
            "settings": url_for("settings"),
            "analytics_or_upgrade": url_for("analytics") if is_pro(user) else url_for("upgrade"),
            "upgrade": url_for("upgrade"),
            "status_base": "/enquiries/",
        }
    }
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
                           is_pro_user=is_pro(user),
                           profile_completion_pct=completion,
                           checklist=checklist,
                           pending_tasks=pending_tasks,
                           conversion=conversion,
                           avg_value=avg_value,
                           notifications=notifications,
                           dashboard_state=dashboard_state)
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
    enquiries_state = {
        "status_f": status_f,
        "counts": counts,
        "statuses": [{"key": s, "label": info["label"], "color": info["color"]} for s, info in STATUSES.items()],
        "enquiries": [{
            "id": str(e.get("_id")),
            "brand_name": e.get("brand_name", ""),
            "contact_name": e.get("contact_name", ""),
            "email": e.get("email", ""),
            "platform": e.get("platform") or "—",
            "budget": e.get("budget") or "—",
            "budget_num": e.get("budget_num", 0) or 0,
            "status": e.get("status", "new"),
            "status_label": STATUSES.get(e.get("status", "new"), {}).get("label", e.get("status", "new")),
            "created_at_fmt": fmt_dt(e.get("created_at")),
            "search_blob": f"{e.get('brand_name','')} {e.get('contact_name','')} {e.get('email','')} {e.get('brief','')}".lower(),
        } for e in enqs],
        "saved_views": {
            "high": sum(1 for e in enqs if (e.get("budget_num", 0) or 0) >= 25000),
            "new": sum(1 for e in enqs if e.get("status") in ["new", "reviewing"]),
            "closing": sum(1 for e in enqs if e.get("status") in ["negotiating", "accepted"]),
        },
        "recent_activity": [{
            "action": a.get("action", ""),
            "detail": a.get("detail", ""),
            "created_at_fmt": fmt_dt(a.get("created_at")),
        } for a in activity_col.find({"user_id": uid}).sort("created_at", DESCENDING).limit(6)],
        "urls": {
            "base": url_for("enquiries_page"),
            "detail_prefix": "/enquiries/",
            "api_status_prefix": "/api/enquiry/",
            "public_page": url_for("public_page", username=session.get("username", "")),
        }
    }
    return render_template("enquiries.html",
                           enqs=enqs, counts=counts,
                           status_f=status_f, STATUSES=STATUSES,
                           fmt_dt=fmt_dt,
                           enquiries_state=enquiries_state)
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
    enquiry_id = require_valid_oid(eid)
    if not enquiry_id:
        flash("Invalid enquiry id.","error")
        return redirect(url_for("enquiries_page"))
    enq = enquiries.find_one({"_id": enquiry_id, "user_id": uid})
    if not enq:
        flash("Enquiry not found.","error"); return redirect(url_for("enquiries_page"))
    if enq["status"] == "new":
        enquiries.update_one({"_id": enquiry_id}, {"$set": {"status": "reviewing"}})
        enq["status"] = "reviewing"
        log(uid, "Opened enquiry", f"From {enq.get('brand_name','')}")
    return render_template("enquiry_detail.html",
                           enq=enq, STATUSES=STATUSES,
                           fmt_dt=fmt_dt, fmt_date=fmt_date)
@app.route("/enquiries/<eid>/status", methods=["POST"])
@login_required
def update_status(eid):
    uid    = session["uid"]
    enquiry_id = require_valid_oid(eid)
    if not enquiry_id:
        flash("Invalid enquiry id.","error")
        return redirect(url_for("enquiries_page"))
    status = request.form.get("status","")
    note   = request.form.get("note","").strip()
    if status not in STATUSES:
        flash("Invalid status.","error"); return redirect(url_for("enquiry_detail", eid=eid))
    update = {"status": status, "updated_at": now()}
    if note: update["note"] = note
    enquiries.update_one({"_id": enquiry_id, "user_id": uid}, {"$set": update})
    enq = enquiries.find_one({"_id": enquiry_id})
    log(uid, f"Status changed to {STATUSES[status]['label']}", f"Enquiry from {enq.get('brand_name','') if enq else ''}")
    flash(f"Status updated to {STATUSES[status]['label']}.","success")
    return redirect(url_for("enquiry_detail", eid=eid))
@app.route("/enquiries/<eid>/delete", methods=["POST"])
@login_required
def delete_enquiry(eid):
    enquiry_id = require_valid_oid(eid)
    if not enquiry_id:
        flash("Invalid enquiry id.","error")
        return redirect(url_for("enquiries_page"))
    enquiries.delete_one({"_id": enquiry_id, "user_id": session["uid"]})
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
    return render_template("settings.html", user=user, platforms=PLATFORMS, budgets=BUDGETS, profile_completion_pct=profile_completion(user))
@app.route("/settings/anonymous", methods=["POST"])
@login_required
def toggle_anonymous():
    uid  = session["uid"]
    data = json_body()
    enabled      = bool(data.get("enabled", False))
    reveal_after = data.get("reveal_after", "serious")
    users_col.update_one({"_id": oid(uid)}, {"$set": {
        "anonymous_mode":    enabled,
        "anon_reveal_after": reveal_after,
        "updated_at":        now()
    }})
    log(uid, "Anonymous mode " + ("enabled" if enabled else "disabled"))
    return jsonify({"ok": True, "enabled": enabled})

@app.route("/dashboard/integrations")
@login_required
def integrations_hub():
    uid = session["uid"]
    integrations = list(integrations_col.find({"user_id": uid}).sort("provider", 1))
    statuses = {}
    for item in integrations:
        provider = (item.get("provider") or "").strip().lower()
        if provider:
            statuses[provider] = item
    providers = [
        {"key": "gmail", "label": "Gmail", "desc": "Ingest inbound brand threads and detect new deal opportunities."},
        {"key": "sheets", "label": "Google Sheets", "desc": "Sync deal pipeline rows into your custom sheet format."},
        {"key": "notion", "label": "Notion", "desc": "Mirror accepted deals and campaign notes to Notion pages."},
        {"key": "whatsapp", "label": "WhatsApp", "desc": "Log inbound WhatsApp conversations into your deal timeline."},
    ]
    recent_logs = list(integration_logs_col.find({"user_id": uid}).sort("created_at", DESCENDING).limit(20))
    return render_template(
        "integrations.html",
        providers=providers,
        statuses=statuses,
        recent_logs=recent_logs,
        fmt_dt=fmt_dt,
    )

@app.route("/api/integrations/status")
@login_required
def integrations_status():
    uid = session["uid"]
    items = list(integrations_col.find({"user_id": uid}))
    out = {}
    for row in items:
        key = (row.get("provider") or "").strip().lower()
        if not key:
            continue
        out[key] = {
            "status": row.get("status", "disconnected"),
            "connected_at": fmt_dt(row.get("connected_at")),
            "last_sync_at": fmt_dt(row.get("last_sync_at")),
            "updated_at": fmt_dt(row.get("updated_at")),
        }
    return jsonify({"ok": True, "integrations": out})

@app.route("/api/integrations/logs")
@login_required
def integrations_logs():
    uid = session["uid"]
    provider = (request.args.get("provider") or "").strip().lower()
    q = {"user_id": uid}
    if provider:
        q["provider"] = provider
    rows = list(integration_logs_col.find(q).sort("created_at", DESCENDING).limit(100))
    clean = []
    for r in rows:
        clean.append({
            "provider": r.get("provider", ""),
            "event": r.get("event", ""),
            "detail": r.get("detail", ""),
            "created_at": fmt_dt(r.get("created_at")),
        })
    return jsonify({"ok": True, "logs": clean})

@app.route("/api/integrations/connect", methods=["POST"])
@login_required
def integrations_connect():
    uid = session["uid"]
    data = json_body()
    provider = (data.get("provider") or "").strip().lower()
    if provider not in {"gmail", "sheets", "notion", "whatsapp"}:
        return api_error("invalid_provider", 400)
    token = (data.get("token") or "").strip()
    config = data.get("config") if isinstance(data.get("config"), dict) else {}
    now_ts = now()
    update_doc = {
        "user_id": uid,
        "provider": provider,
        "status": "connected",
        "token": token,
        "token_masked": mask_secret(token),
        "config": config,
        "connected_at": now_ts,
        "updated_at": now_ts,
    }
    integrations_col.update_one(
        {"user_id": uid, "provider": provider},
        {"$set": update_doc, "$setOnInsert": {"created_at": now_ts}},
        upsert=True
    )
    log_integration(uid, provider, "connected", f"{provider} integration connected")
    return api_ok({"provider": provider, "status": "connected"})

@app.route("/api/integrations/<provider>/disconnect", methods=["POST"])
@login_required
def integrations_disconnect(provider):
    uid = session["uid"]
    provider = (provider or "").strip().lower()
    if provider not in {"gmail", "sheets", "notion", "whatsapp"}:
        return api_error("invalid_provider", 400)
    integrations_col.update_one(
        {"user_id": uid, "provider": provider},
        {"$set": {"status": "disconnected", "token": "", "token_masked": "", "updated_at": now()}},
        upsert=True
    )
    log_integration(uid, provider, "disconnected", f"{provider} integration disconnected")
    return api_ok({"provider": provider, "status": "disconnected"})
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
    profile = ensure_brand_profile(brand_name, source="public_submit")
    enquiries.insert_one({
        "user_id":        str(user["_id"]),
        "brand_name":     brand_name,
        "brand_profile_id": str(profile.get("_id")) if profile else None,
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
    token = json_body().get("token", "")
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
    data = json_body()
    try:
        months = int(data.get("months", 1))
    except Exception:
        months = 1
    months = max(1, min(months, 12))
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
    data       = json_body()
    order_id   = data.get("razorpay_order_id","")
    payment_id = data.get("razorpay_payment_id","")
    signature  = data.get("razorpay_signature","")
    if not all([order_id, payment_id, signature]):
        return jsonify({"ok": False, "error": "Missing payment fields"}), 400
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

@app.errorhandler(500)
def internal_error(e):
    try:
        return render_template("500.html"), 500
    except Exception:
        return "Service temporarily unavailable", 500
# ═══════════════════════════════════════════════════════════════════════════════
# ENQUIRY EXTRAS — notes, reminders, bulk, search, star, snooze
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/enquiries/<eid>/notes", methods=["POST"])
@login_required
def add_note(eid):
    uid  = session["uid"]
    text = json_body().get("text", "").strip()
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
    data     = json_body()
    due_str  = data.get("due", "")
    note_txt = data.get("note", "")
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
    data   = json_body()
    ids    = data.get("ids", [])
    action = data.get("action", "")
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
    val = json_body().get("value", 0)
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
    data         = json_body()
    try:
        days = int(data.get("days", 3))
    except Exception:
        days = 3
    days = max(1, min(days, 30))
    snooze_until = now() + timedelta(days=days)
    enquiries.update_one({"_id": oid(eid), "user_id": uid},
                         {"$set": {"snoozed_until": snooze_until}})
    return jsonify({"ok": True, "until": snooze_until.strftime("%b %d")})
@app.route("/api/enquiry/<eid>/status", methods=["POST"])
@login_required
def api_status(eid):
    uid    = session["uid"]
    status = json_body().get("status","")
    if status not in STATUSES:
        return jsonify({"ok": False}), 400
    enquiries.update_one({"_id": oid(eid), "user_id": uid},
                         {"$set": {"status": status, "updated_at": now()}})
    log(uid, f"Quick status changed to {STATUSES[status]['label']}")
    return jsonify({"ok": True, "label": STATUSES[status]["label"],
                    "color": STATUSES[status]["color"]})

@app.route("/api/enquiry/<eid>/ai-replies", methods=["POST"])
@login_required
def ai_reply_variants(eid):
    uid = session["uid"]
    enquiry_id = require_valid_oid(eid)
    if not enquiry_id:
        return jsonify({"ok": False, "error": "invalid_enquiry_id"}), 400
    enq = enquiries.find_one({"_id": enquiry_id, "user_id": uid})
    if not enq:
        return jsonify({"ok": False, "error": "not_found"}), 404
    user = users_col.find_one({"_id": oid(uid)}) or {}
    payload = json_body()
    variants = openai_generate_reply_variants(
        deal_type=payload.get("deal_type", "") or enq.get("platform", ""),
        budget=payload.get("budget", "") or enq.get("budget", ""),
        deliverables=payload.get("deliverables", "") or enq.get("deliverables", ""),
        niche=payload.get("niche", "") or user.get("niche", ""),
        brand_name=enq.get("brand_name", ""),
        brief=enq.get("brief", ""),
    )
    doc = {
        "user_id": uid,
        "enquiry_id": str(enquiry_id),
        "accepting": variants["accepting"],
        "countering": variants["countering"],
        "declining": variants["declining"],
        "updated_at": now(),
        "created_at": now(),
    }
    reply_drafts_col.update_one(
        {"user_id": uid, "enquiry_id": str(enquiry_id)},
        {"$set": doc, "$setOnInsert": {"created_at": now()}},
        upsert=True
    )
    return jsonify({"ok": True, "variants": variants})

@app.route("/api/enquiry/<eid>/reply-draft", methods=["POST"])
@login_required
def save_reply_draft(eid):
    uid = session["uid"]
    enquiry_id = require_valid_oid(eid)
    if not enquiry_id:
        return jsonify({"ok": False, "error": "invalid_enquiry_id"}), 400
    enq = enquiries.find_one({"_id": enquiry_id, "user_id": uid})
    if not enq:
        return jsonify({"ok": False, "error": "not_found"}), 404
    data = json_body()
    key = (data.get("key") or "").strip().lower()
    text = (data.get("text") or "").strip()
    if key not in {"accepting", "countering", "declining"}:
        return jsonify({"ok": False, "error": "invalid_variant_key"}), 400
    if not text:
        return jsonify({"ok": False, "error": "empty_text"}), 400
    reply_drafts_col.update_one(
        {"user_id": uid, "enquiry_id": str(enquiry_id)},
        {"$set": {key: text, "updated_at": now()}, "$setOnInsert": {"created_at": now()}},
        upsert=True
    )
    return jsonify({"ok": True})
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
# COMMUNITY + BRAND RELATIONSHIP LAYER
# ═══════════════════════════════════════════════════════════════════════════════
@app.route("/community")
@login_required
def community_feed_page():
    uid = session["uid"]
    niche = (request.args.get("niche") or "").strip()
    platform = (request.args.get("platform") or "").strip()
    tier = (request.args.get("tier") or "").strip()
    q = {}
    if niche: q["niche"] = niche
    if platform: q["platform"] = platform
    if tier: q["follower_tier"] = tier
    posts = list(community_posts_col.find(q).sort("created_at", DESCENDING).limit(60))
    trending = list(community_posts_col.find({}).sort("upvotes", DESCENDING).limit(6))
    return render_template("community.html", posts=posts, trending=trending, niche=niche, platform=platform, tier=tier, fmt_dt=fmt_dt)

@app.route("/api/community/posts", methods=["GET", "POST"])
@login_required
def community_posts_api():
    uid = session["uid"]
    if request.method == "GET":
        posts = list(community_posts_col.find({}).sort("created_at", DESCENDING).limit(100))
        cleaned = []
        for p in posts:
            p["_id"] = str(p.get("_id"))
            cleaned.append(p)
        return jsonify({"ok": True, "posts": cleaned})
    data = json_body()
    post_type = (data.get("type") or "advice").strip().lower()
    if post_type not in {"deal_win", "rate_card", "advice", "collab_request", "red_flag"}:
        return jsonify({"ok": False, "error": "invalid_type"}), 400
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"ok": False, "error": "content_required"}), 400
    user = users_col.find_one({"_id": oid(uid)}) or {}
    doc = {
        "creator_id": uid,
        "type": post_type,
        "content": content[:2000],
        "anonymous": bool(data.get("anonymous", False)),
        "niche": (data.get("niche") or user.get("niche") or "").strip(),
        "platform": (data.get("platform") or user.get("platform") or "").strip(),
        "follower_tier": (data.get("follower_tier") or "").strip(),
        "upvotes": 0,
        "saves": 0,
        "comments": [],
        "created_at": now(),
        "updated_at": now(),
    }
    inserted = community_posts_col.insert_one(doc)
    return jsonify({"ok": True, "id": str(inserted.inserted_id)})

@app.route("/api/community/posts/<pid>/upvote", methods=["POST"])
@login_required
def upvote_community_post(pid):
    post_id = require_valid_oid(pid)
    if not post_id:
        return jsonify({"ok": False}), 400
    community_posts_col.update_one({"_id": post_id}, {"$inc": {"upvotes": 1}, "$set": {"updated_at": now()}})
    p = community_posts_col.find_one({"_id": post_id}, {"upvotes": 1})
    return jsonify({"ok": True, "upvotes": int((p or {}).get("upvotes", 0))})

@app.route("/intel")
@login_required
def deal_intel_page():
    rows = list(brand_intel_col.find({}).sort("upvotes", DESCENDING).limit(120))
    return render_template("deal_intel.html", intel=rows, fmt_dt=fmt_dt)

@app.route("/api/brand-intel", methods=["POST"])
@login_required
def add_brand_intel():
    uid = session["uid"]
    data = json_body()
    brand_name = (data.get("brand_name") or "").strip()
    if not brand_name:
        return jsonify({"ok": False, "error": "brand_name_required"}), 400
    experience = (data.get("experience") or "good").strip().lower()
    if experience not in {"good", "bad", "ugly"}:
        return jsonify({"ok": False, "error": "invalid_experience"}), 400
    profile = ensure_brand_profile(brand_name, category=(data.get("category") or "").strip(), source="intel")
    hashed_creator = generate_password_hash(uid)[:32]
    doc = {
        "brand_name": brand_name,
        "brand_profile_id": str(profile.get("_id")) if profile else None,
        "category": (data.get("category") or "").strip(),
        "deal_type": (data.get("deal_type") or "").strip(),
        "amount_range": (data.get("amount_range") or "").strip(),
        "experience": experience,
        "notes": (data.get("notes") or "").strip()[:1500],
        "creator_id_hash": hashed_creator,
        "upvotes": 0,
        "verified": False,
        "created_at": now(),
    }
    inserted = brand_intel_col.insert_one(doc)
    return jsonify({"ok": True, "id": str(inserted.inserted_id)})

@app.route("/brand/<slug>")
def brand_profile_page(slug):
    profile = brand_profiles_col.find_one({"slug": slug})
    if not profile:
        return render_template("404.html"), 404
    intel_rows = list(brand_intel_col.find({"brand_name": profile.get("name")}).sort("created_at", DESCENDING).limit(50))
    good = sum(1 for r in intel_rows if r.get("experience") == "good")
    bad = sum(1 for r in intel_rows if r.get("experience") == "bad")
    ugly = sum(1 for r in intel_rows if r.get("experience") == "ugly")
    total = max(1, good + bad + ugly)
    reputation_score = round(((good * 1.0) + (bad * 0.4) + (ugly * 0.1)) / total * 100)
    badge = "✅ Fast Payer" if reputation_score >= 70 else "⚠️ Slow Payer" if reputation_score >= 40 else "🚩 Ghosted Creators"
    return render_template("brand_profile.html", profile=profile, intel_rows=intel_rows, reputation_score=reputation_score, badge=badge, fmt_dt=fmt_dt)

@app.route("/api/relationships/recompute", methods=["POST"])
@login_required
def recompute_relationship_scores():
    uid = session["uid"]
    user_enqs = list(enquiries.find({"user_id": uid}))
    grouped = {}
    for e in user_enqs:
        brand = (e.get("brand_name") or "").strip()
        if not brand:
            continue
        grouped.setdefault(brand, []).append(e)
    updated = 0
    for brand, items in grouped.items():
        deal_count = len(items)
        total_earned = sum((i.get("budget_num") or 0) for i in items if i.get("status") in {"accepted", "closed", "paid"})
        closed = sum(1 for i in items if i.get("status") in {"accepted", "closed", "paid"})
        paid = sum(1 for i in items if i.get("payment_status") == "paid" or i.get("status") == "paid")
        repeat_bonus = min(20, max(0, (deal_count - 1) * 5))
        close_rate = (closed / deal_count) * 35
        payment_rate = (paid / max(1, closed)) * 30
        score = int(min(100, repeat_bonus + close_rate + payment_rate + 15))
        relationships_col.update_one(
            {"creator_id": uid, "brand_name": brand},
            {"$set": {
                "creator_id": uid,
                "brand_name": brand,
                "score": score,
                "deal_count": deal_count,
                "total_earned": total_earned,
                "status": "ongoing" if deal_count > 1 else "one_off",
                "last_deal_at": max((to_naive(i.get("created_at")) for i in items if i.get("created_at")), default=now()),
                "updated_at": now(),
            }},
            upsert=True
        )
        updated += 1
    return jsonify({"ok": True, "updated": updated})
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
