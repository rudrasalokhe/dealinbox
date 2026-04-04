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
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_OAUTH_REDIRECT_URI = os.getenv("GOOGLE_OAUTH_REDIRECT_URI", "")
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
rate_cards_col = db["rate_cards"]
retainers_col = db["retainers"]
squads_col = db["squads"]
marketplace_slots_col = db["marketplace_slots"]
content_drafts_col = db["content_drafts"]
disputes_col = db["disputes"]
achievements_col = db["achievements"]
referrals_col = db["referrals"]
brand_contacts_col = db["brand_contacts"]
influencer_profiles_col = db["influencer_profiles"]
outreach_log_col = db["outreach_log"]
followup_reminders_col = db["followup_reminders"]
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
        users_col.create_index([("role", 1)])
        users_col.create_index([("creator_profile.niche", 1)])
        users_col.create_index([("creator_profile.instagram_followers", 1)])
        enquiries.create_index([("user_id", 1), ("created_at", -1)])
        enquiries.create_index([("tracking_token", 1)])
        activity_col.create_index([("user_id", 1), ("created_at", -1)])
        payments_col.create_index([("user_id", 1), ("created_at", -1)])
        rate_cards_col.create_index([("creator_id", 1), ("format", 1)], unique=True)
        content_drafts_col.create_index([("deal_id", 1), ("version", -1)])
        marketplace_slots_col.create_index([("creator_id", 1), ("status", 1)])
        referrals_col.create_index([("referrer_id", 1), ("created_at", -1)])
        brand_contacts_col.create_index([("uid", 1), ("created_at", -1)])
        brand_contacts_col.create_index([("uid", 1), ("relationship_status", 1)])
        influencer_profiles_col.create_index([("uid", 1), ("niche", 1), ("tier", 1), ("location", 1)])
        notifications_col.create_index([("uid", 1), ("read", 1), ("created_at", -1)])
        followup_reminders_col.create_index([("uid", 1), ("reminder_date", 1), ("status", 1)])
        campaigns_col.create_index([("uid", 1), ("status", 1)])
        payments_col.create_index([("brand_uid", 1), ("status", 1)])
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

def google_oauth_scopes(provider):
    base = [
        "openid",
        "email",
        "profile",
    ]
    if provider == "gmail":
        return base + [
            "https://www.googleapis.com/auth/gmail.readonly",
        ]
    if provider == "sheets":
        return base + [
            "https://www.googleapis.com/auth/spreadsheets",
        ]
    return base
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
    "content_approved":{"label": "Content Approved","color": "#14b8a6"},
    "closed":     {"label": "Closed",     "color": "#22c55e"},
    "declined":   {"label": "Declined",   "color": "#ef4444"},
}
PLATFORMS = ["Instagram","YouTube","TikTok","Twitter/X","LinkedIn","Podcast","Blog","Multiple"]
BUDGETS   = ["Under Rs.5,000","Rs.5,000-Rs.10,000","Rs.10,000-Rs.25,000",
             "Rs.25,000-Rs.50,000","Rs.50,000-Rs.1,00,000","Rs.1,00,000+","Open to discuss"]
FREE_ENQUIRY_LIMIT = 20
PRO_PRICE_INR      = 199
CONTENT_FORMATS = [
    "YouTube Integration",
    "Reel",
    "Story",
    "LinkedIn Post",
    "Podcast Mention",
    "Newsletter",
    "Live Stream",
]
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
require_login = login_required
def role_required(*roles):
    def wrap(f):
        @wraps(f)
        def dec(*a, **kw):
            if "uid" not in session:
                flash("Please log in.", "error")
                return redirect(url_for("login"))
            user = users_col.find_one({"_id": oid(session["uid"])}) or {}
            role = (user.get("role") or "creator").lower()
            if role not in roles:
                if role in {"brand", "agency"}:
                    return redirect(url_for("brand_dashboard"))
                return redirect(url_for("dashboard"))
            return f(*a, **kw)
        return dec
    return wrap

def is_brand_side():
    if "uid" not in session:
        return False
    u = users_col.find_one({"_id": oid(session["uid"])}) or {}
    return (u.get("role") or "creator") in {"brand", "agency"}
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

@app.before_request
def role_based_guardrails():
    if "uid" not in session:
        return None
    if request.path.startswith("/static") or request.path.startswith("/api/") or request.path.startswith("/ping"):
        return None
    user = users_col.find_one({"_id": oid(session["uid"])}) or {}
    role = (user.get("role") or "creator").lower()
    if request.path.startswith("/brand") and role not in {"brand", "agency"}:
        return redirect(url_for("dashboard"))
    if request.path == "/dashboard" and role in {"brand", "agency"}:
        return redirect(url_for("brand_dashboard"))
    return None
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
@app.route("/signup")
def signup():
    return render_template("signup_choice.html")


@app.route("/signup/creator", methods=["GET","POST"])
def signup_creator():
    if request.method == "POST":
        name = request.form.get("name","").strip()
        email = request.form.get("email","").strip().lower()
        username = re.sub(r'[^a-z0-9_]','', request.form.get("username","").strip().lower())
        password = request.form.get("password","")
        niche = request.form.get("niche","").strip()
        platform = request.form.get("platform","").strip()
        if not all([name, email, username, password]):
            flash("All fields are required.","error"); return redirect(url_for("signup_creator"))
        if len(username) < 3:
            flash("Username must be at least 3 characters.","error"); return redirect(url_for("signup_creator"))
        if len(password) < 6:
            flash("Password must be at least 6 characters.","error"); return redirect(url_for("signup_creator"))
        if users_col.find_one({"email": email}):
            flash("Email already registered.","error"); return redirect(url_for("signup_creator"))
        if users_col.find_one({"username": username}):
            flash("Username taken. Try another.","error"); return redirect(url_for("signup_creator"))
        creator_profile = {
            "bio": "",
            "niche": niche,
            "instagram_handle": "",
            "youtube_handle": "",
            "instagram_followers": 0,
            "youtube_subscribers": 0,
            "instagram_engagement_rate": 0,
            "youtube_avg_views": 0,
            "base_rate_reel": 0,
            "base_rate_post": 0,
            "base_rate_story": 0,
            "languages": [],
            "location": "",
            "notable_brands": [],
            "verified": False,
            "profile_complete": False,
        }
        uid = users_col.insert_one({
            "name": name, "email": email, "username": username,
            "password_hash": generate_password_hash(password),
            "niche": niche, "platform": platform,
            "bio": "", "collab_email": email,
            "min_budget": "", "response_time": "48 hours",
            "role": "creator",
            "plan": "free",
            "creator_profile": creator_profile,
            "brand_profile": {},
            "created_at": now(),
            "last_active_at": now(),
        }).inserted_id
        session.update({"uid": str(uid), "email": email, "username": username, "name": name, "plan": "free", "role": "creator"})
        return redirect(url_for("dashboard"))
    return render_template("signup.html",
                           platforms=PLATFORMS,
                           creator_count=users_col.count_documents({}),
                           niches=["Beauty","Fashion","Fitness","Food","Tech",
                                   "Gaming","Travel","Finance","Lifestyle","Comedy","Other"])


@app.route("/signup/brand", methods=["GET","POST"])
def signup_brand():
    if request.method == "POST":
        company_name = request.form.get("company_name", "").strip()
        email = request.form.get("email","").strip().lower()
        password = request.form.get("password","")
        industry = request.form.get("industry", "").strip()
        company_size = request.form.get("company_size", "startup").strip()
        if not all([company_name, email, password]):
            flash("All fields are required.", "error")
            return redirect(url_for("signup_brand"))
        if len(password) < 6:
            flash("Password must be at least 6 characters.","error")
            return redirect(url_for("signup_brand"))
        if users_col.find_one({"email": email}):
            flash("Email already registered.","error")
            return redirect(url_for("signup_brand"))
        generated_username = re.sub(r'[^a-z0-9_]', '', company_name.lower().replace(" ", "_"))[:24] or f"brand_{uuid.uuid4().hex[:6]}"
        while users_col.find_one({"username": generated_username}):
            generated_username = f"{generated_username[:18]}{uuid.uuid4().hex[:4]}"
        brand_profile = {
            "company_name": company_name,
            "industry": industry,
            "website": "",
            "logo_url": "",
            "company_size": company_size,
            "description": "",
            "target_niches": [],
            "target_tier": [],
            "target_locations": [],
            "monthly_budget": 0,
            "gst_number": "",
            "verified": False,
        }
        uid = users_col.insert_one({
            "name": company_name,
            "email": email,
            "username": generated_username,
            "password_hash": generate_password_hash(password),
            "role": "brand",
            "plan": "free",
            "creator_profile": {},
            "brand_profile": brand_profile,
            "created_at": now(),
            "last_active_at": now(),
        }).inserted_id
        session.update({"uid": str(uid), "email": email, "username": generated_username, "name": company_name, "plan": "free", "role": "brand"})
        return redirect(url_for("brand_dashboard"))
    return render_template("signup_brand.html")
@app.route("/login", methods=["GET","POST"])
def login():
    if request.method == "POST":
        email    = request.form.get("email","").strip().lower()
        password = request.form.get("password","")
        user     = users_col.find_one({"email": email})
        if not user or not check_password_hash(user["password_hash"], password):
            flash("Invalid email or password.","error"); return redirect(url_for("login"))
        role = (user.get("role") or "creator").lower()
        session.update({"uid": str(user["_id"]), "email": user["email"],
                        "username": user["username"], "name": user.get("name",""), "plan": user.get("plan","free"), "role": role})
        flash(f"Welcome back, {user.get('name','')}!","success")
        users_col.update_one({"_id": user["_id"]}, {"$set": {"last_active_at": now()}})
        if role in {"brand", "agency"}:
            return redirect(url_for("brand_dashboard"))
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
@role_required("creator")
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
    crm_warm_brands = []
    crm_prospects = []
    crm_overdue_count = 0
    crm_pitches_week = 0
    try:
        crm_warm_brands = list(brand_contacts_col.find({
            "uid": uid,
            "relationship_status": {"$in": ["warm", "active"]},
            "deleted_at": {"$exists": False}
        }).sort("last_contacted_at", DESCENDING).limit(3))
        crm_prospects = list(influencer_profiles_col.find({
            "uid": uid,
            "relationship_status": {"$in": ["prospect", "negotiating"]},
            "deleted_at": {"$exists": False}
        }).sort("updated_at", DESCENDING).limit(3))
        crm_overdue_count = followup_reminders_col.count_documents({
            "uid": uid, "status": {"$in": ["pending", "snoozed"]}, "reminder_date": {"$lt": now()}
        })
        crm_pitches_week = outreach_log_col.count_documents({
            "uid": uid, "direction": "outbound", "sent_at": {"$gte": now() - timedelta(days=7)}
        })
    except Exception:
        pass

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
        },
        "crm_pulse": {
            "brands": [{"id": str(b.get("_id")), "name": b.get("brand_name", ""), "last_contacted": fmt_date(b.get("last_contacted_at")) or "Never"} for b in crm_warm_brands],
            "prospects": [{"id": str(p.get("_id")), "name": p.get("creator_name", ""), "tier": p.get("tier", "nano"), "status": p.get("relationship_status", "prospect")} for p in crm_prospects],
            "overdue": crm_overdue_count,
            "pitches_week": crm_pitches_week,
        },
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

def suggested_rate_for_creator(user, content_format):
    followers_raw = (user or {}).get("followers", "")
    followers = parse_budget_num(str(followers_raw))
    if followers <= 0:
        digits = re.sub(r"[^0-9]", "", str(followers_raw or ""))
        followers = int(digits or 0)
    niche = ((user or {}).get("niche") or "").strip().lower()
    niche_multiplier = {
        "finance": 1.25,
        "tech": 1.2,
        "business": 1.2,
        "beauty": 1.05,
        "fashion": 1.05,
        "gaming": 1.15,
    }.get(niche, 1.0)
    base_per_10k = {
        "YouTube Integration": 7000,
        "Reel": 3500,
        "Story": 1800,
        "LinkedIn Post": 2800,
        "Podcast Mention": 4500,
        "Newsletter": 3000,
        "Live Stream": 8500,
    }.get(content_format, 3000)
    followers_units = max(1, followers / 10000)
    suggestion = int(base_per_10k * followers_units * niche_multiplier)
    return max(2500, suggestion)

@app.route("/rate-card")
@login_required
def rate_card_page():
    uid = session["uid"]
    user = users_col.find_one({"_id": oid(uid)}) or {}
    rates = list(rate_cards_col.find({"creator_id": uid}))
    by_format = {r.get("format"): r for r in rates}
    return render_template("rate_card.html", content_formats=CONTENT_FORMATS, by_format=by_format, user=user)

@app.route("/api/rate-card/suggested")
@login_required
def rate_card_suggested():
    uid = session["uid"]
    user = users_col.find_one({"_id": oid(uid)}) or {}
    out = {}
    for content_format in CONTENT_FORMATS:
        out[content_format] = suggested_rate_for_creator(user, content_format)
    return jsonify({"ok": True, "suggested": out})

@app.route("/api/rate-card", methods=["POST"])
@login_required
def save_rate_card():
    uid = session["uid"]
    data = json_body()
    content_format = (data.get("format") or "").strip()
    if content_format not in CONTENT_FORMATS:
        return jsonify({"ok": False, "error": "invalid_format"}), 400
    try:
        base_rate = int(data.get("base_rate", 0))
    except Exception:
        return jsonify({"ok": False, "error": "invalid_base_rate"}), 400
    variables = data.get("variables_json") if isinstance(data.get("variables_json"), dict) else {}
    defaults = {"usage_rights_pct": 20, "exclusivity_pct": 30, "rush_fee_pct": 15, "raw_footage_pct": 10}
    for key, val in defaults.items():
        try:
            defaults[key] = int(variables.get(key, val))
        except Exception:
            pass
    rate_cards_col.update_one(
        {"creator_id": uid, "format": content_format},
        {"$set": {
            "creator_id": uid,
            "format": content_format,
            "base_rate": max(0, base_rate),
            "variables_json": defaults,
            "updated_at": now(),
        }, "$setOnInsert": {"created_at": now()}},
        upsert=True
    )
    return jsonify({"ok": True})

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
    if provider in {"gmail", "sheets"}:
        return api_error("use_google_oauth_start", 400)
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

@app.route("/integrations/google/start")
@login_required
def integrations_google_start():
    uid = session["uid"]
    provider = (request.args.get("provider") or "").strip().lower()
    if provider not in {"gmail", "sheets"}:
        flash("Invalid Google integration provider.", "error")
        return redirect(url_for("integrations_hub"))
    if not GOOGLE_CLIENT_ID:
        flash("Google OAuth is not configured yet (missing GOOGLE_CLIENT_ID).", "error")
        return redirect(url_for("integrations_hub"))
    state = str(uuid.uuid4())
    session[f"google_oauth_state_{provider}"] = state
    redirect_uri = GOOGLE_OAUTH_REDIRECT_URI or url_for("integrations_google_callback", _external=True)
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(google_oauth_scopes(provider)),
        "access_type": "offline",
        "include_granted_scopes": "true",
        "prompt": "consent",
        "state": f"{provider}:{state}",
    }
    query = "&".join([f"{k}={requests.utils.quote(str(v), safe='')}" for k, v in params.items()])
    return redirect(f"https://accounts.google.com/o/oauth2/v2/auth?{query}")

@app.route("/integrations/google/callback")
@login_required
def integrations_google_callback():
    uid = session["uid"]
    code = (request.args.get("code") or "").strip()
    state_raw = (request.args.get("state") or "").strip()
    if ":" not in state_raw:
        flash("Invalid OAuth state.", "error")
        return redirect(url_for("integrations_hub"))
    provider, state = state_raw.split(":", 1)
    provider = provider.strip().lower()
    if provider not in {"gmail", "sheets"}:
        flash("Invalid OAuth provider.", "error")
        return redirect(url_for("integrations_hub"))
    expected = session.pop(f"google_oauth_state_{provider}", "")
    if not expected or expected != state:
        flash("OAuth state mismatch. Please try connecting again.", "error")
        return redirect(url_for("integrations_hub"))
    if not code:
        flash("Missing OAuth authorization code.", "error")
        return redirect(url_for("integrations_hub"))
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        flash("Google OAuth credentials are incomplete on the server.", "error")
        return redirect(url_for("integrations_hub"))
    redirect_uri = GOOGLE_OAUTH_REDIRECT_URI or url_for("integrations_google_callback", _external=True)
    token_res = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=30,
    )
    if token_res.status_code >= 300:
        app.logger.error("Google token exchange failed: %s", token_res.text[:500])
        flash("Google OAuth exchange failed. Please try again.", "error")
        log_integration(uid, provider, "oauth_failed", "token_exchange_failed")
        return redirect(url_for("integrations_hub"))
    payload = token_res.json()
    access_token = (payload.get("access_token") or "").strip()
    refresh_token = (payload.get("refresh_token") or "").strip()
    if not access_token:
        flash("Google OAuth did not return an access token.", "error")
        log_integration(uid, provider, "oauth_failed", "missing_access_token")
        return redirect(url_for("integrations_hub"))
    now_ts = now()
    integrations_col.update_one(
        {"user_id": uid, "provider": provider},
        {"$set": {
            "user_id": uid,
            "provider": provider,
            "status": "connected",
            "oauth_provider": "google",
            "token": access_token,
            "token_masked": mask_secret(access_token),
            "refresh_token": refresh_token,
            "refresh_token_masked": mask_secret(refresh_token),
            "scope": payload.get("scope", ""),
            "token_type": payload.get("token_type", ""),
            "expires_in": payload.get("expires_in", 0),
            "connected_at": now_ts,
            "updated_at": now_ts,
        }, "$setOnInsert": {"created_at": now_ts}},
        upsert=True
    )
    log_integration(uid, provider, "connected", f"{provider} connected via Google OAuth")
    flash(f"{provider.title()} connected successfully via Google.", "success")
    return redirect(url_for("integrations_hub"))

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

@app.route("/u/<username>")
def creator_portfolio_page(username):
    user = users_col.find_one({"username": username})
    if not user:
        return render_template("404.html"), 404
    uid = str(user.get("_id"))
    rates = list(rate_cards_col.find({"creator_id": uid}).sort("format", 1))
    wins = enquiries.count_documents({"user_id": uid, "status": {"$in": ["accepted", "closed", "content_approved"]}})
    total = enquiries.count_documents({"user_id": uid})
    badges = list(achievements_col.find({"creator_id": uid}).sort("unlocked_at", DESCENDING).limit(6))
    meta_title = f"{user.get('name') or username} | {user.get('niche') or 'Creator'} Creator Portfolio"
    meta_desc = f"Book {user.get('name') or username} for brand collaborations. Platform: {user.get('platform') or 'Creator'}."
    return render_template(
        "portfolio.html",
        user=user,
        rates=rates,
        wins=wins,
        total=total,
        badges=badges,
        meta_title=meta_title,
        meta_desc=meta_desc,
    )

@app.route("/marketplace")
def marketplace_page():
    niche = (request.args.get("niche") or "").strip()
    content_format = (request.args.get("format") or "").strip()
    q = {"status": "open"}
    if niche:
        q["niche"] = niche
    if content_format:
        q["format"] = content_format
    slots = list(marketplace_slots_col.find(q).sort("available_from", 1).limit(200))
    creator_ids = [s.get("creator_id") for s in slots if s.get("creator_id")]
    creators = {}
    if creator_ids:
        for u in users_col.find({"_id": {"$in": [oid(cid) for cid in creator_ids if oid(cid)]}}, {"name": 1, "username": 1, "platform": 1, "followers": 1}):
            creators[str(u.get("_id"))] = u
    return render_template("marketplace.html", slots=slots, creators=creators, niche=niche, content_format=content_format)

@app.route("/marketplace/manage")
@login_required
def marketplace_manage_page():
    uid = session["uid"]
    rows = list(marketplace_slots_col.find({"creator_id": uid}).sort("created_at", DESCENDING))
    return render_template("marketplace_manage.html", rows=rows, content_formats=CONTENT_FORMATS, now=now)

@app.route("/api/marketplace/slots", methods=["GET", "POST"])
@login_required
def marketplace_slots_api():
    uid = session["uid"]
    if request.method == "GET":
        rows = list(marketplace_slots_col.find({"creator_id": uid}).sort("created_at", DESCENDING))
        clean = []
        for r in rows:
            clean.append({
                "id": str(r.get("_id")),
                "format": r.get("format", ""),
                "price": int(r.get("price", 0) or 0),
                "niche": r.get("niche", ""),
                "available_from": fmt_date(r.get("available_from")),
                "status": r.get("status", "open"),
            })
        return jsonify({"ok": True, "slots": clean})
    data = json_body()
    content_format = (data.get("format") or "").strip()
    if content_format not in CONTENT_FORMATS:
        return jsonify({"ok": False, "error": "invalid_format"}), 400
    try:
        price = int(data.get("price", 0))
    except Exception:
        return jsonify({"ok": False, "error": "invalid_price"}), 400
    available_from_raw = (data.get("available_from") or "").strip()
    available_from = now()
    if available_from_raw:
        try:
            available_from = datetime.strptime(available_from_raw, "%Y-%m-%d")
        except Exception:
            pass
    doc = {
        "creator_id": uid,
        "format": content_format,
        "price": max(0, price),
        "niche": (data.get("niche") or "").strip(),
        "slot_limit": max(1, int(data.get("slot_limit", 1) or 1)),
        "min_budget": max(0, int(data.get("min_budget", 0) or 0)),
        "available_from": available_from,
        "booked_by": None,
        "status": "open",
        "created_at": now(),
        "updated_at": now(),
    }
    inserted = marketplace_slots_col.insert_one(doc)
    return jsonify({"ok": True, "id": str(inserted.inserted_id)})

@app.route("/api/marketplace/slots/<slot_id>/book", methods=["POST"])
def book_marketplace_slot(slot_id):
    slot_oid = require_valid_oid(slot_id)
    if not slot_oid:
        return jsonify({"ok": False, "error": "invalid_slot_id"}), 400
    slot = marketplace_slots_col.find_one({"_id": slot_oid, "status": "open"})
    if not slot:
        return jsonify({"ok": False, "error": "slot_unavailable"}), 404
    data = json_body()
    brand_name = (data.get("brand_name") or "").strip()
    contact_name = (data.get("contact_name") or "").strip()
    email = (data.get("email") or "").strip()
    brief = (data.get("brief") or "").strip()
    if not all([brand_name, email, brief]):
        return jsonify({"ok": False, "error": "missing_required_fields"}), 400
    import secrets
    tracking_token = secrets.token_urlsafe(24)
    creator_id = slot.get("creator_id")
    enquiry_doc = {
        "user_id": creator_id,
        "brand_name": brand_name,
        "contact_name": contact_name,
        "email": email,
        "platform": slot.get("format", ""),
        "budget": f"₹{int(slot.get('price', 0) or 0):,}",
        "budget_num": int(slot.get("price", 0) or 0),
        "timeline": "",
        "brief": brief,
        "deliverables": slot.get("format", ""),
        "status": "new",
        "note": "",
        "tracking_token": tracking_token,
        "source": "marketplace_booking",
        "created_at": now(),
        "updated_at": now(),
    }
    inserted = enquiries.insert_one(enquiry_doc)
    marketplace_slots_col.update_one(
        {"_id": slot_oid},
        {"$set": {"status": "booked", "booked_by": {"brand_name": brand_name, "email": email}, "booked_deal_id": str(inserted.inserted_id), "updated_at": now()}}
    )
    campaign_id_raw = (data.get("campaign_id") or "").strip()
    campaign_oid = require_valid_oid(campaign_id_raw)
    if campaign_oid:
        campaigns_col.update_one(
            {"_id": campaign_oid},
            {"$push": {"applicants": {
                "creator_id": creator_id,
                "creator_username": ((users_col.find_one({"_id": oid(creator_id)}) or {}).get("username", "")),
                "status": "applied",
                "source": "marketplace",
                "slot_id": str(slot_oid),
                "deal_id": str(inserted.inserted_id),
                "applied_at": now(),
            }}, "$set": {"updated_at": now()}}
        )
    return jsonify({"ok": True, "deal_id": str(inserted.inserted_id)})

@app.route("/brand", methods=["GET", "POST"])
def brand_campaigns_page():
    if request.method == "POST":
        data = request.form
        brand_name = (data.get("brand_name") or "").strip()
        brand_email = (data.get("brand_email") or "").strip().lower()
        if not brand_name or not brand_email:
            flash("Brand name and email are required.", "error")
            return redirect(url_for("brand_campaigns_page"))
        session["brand_name"] = brand_name
        session["brand_email"] = brand_email
        doc = {
            "brand_name": brand_name,
            "brand_email": brand_email,
            "title": (data.get("title") or "").strip(),
            "brief": (data.get("brief") or "").strip(),
            "budget_min": int(data.get("budget_min") or 0),
            "budget_max": int(data.get("budget_max") or 0),
            "timeline": (data.get("timeline") or "").strip(),
            "creator_criteria_json": {
                "platform": (data.get("platform") or "").strip(),
                "niche": (data.get("niche") or "").strip(),
                "location": (data.get("location") or "").strip(),
            },
            "status": "open",
            "applicants": [],
            "created_at": now(),
            "updated_at": now(),
        }
        campaigns_col.insert_one(doc)
        flash("Campaign created.", "success")
        return redirect(url_for("brand_campaigns_page"))
    brand_email = (session.get("brand_email") or "").strip().lower()
    campaigns = list(campaigns_col.find({"brand_email": brand_email}).sort("created_at", DESCENDING)) if brand_email else []
    return render_template("brand_campaigns.html", campaigns=campaigns, brand_email=brand_email, brand_name=session.get("brand_name", ""))

@app.route("/brand/campaign/<cid>")
def brand_campaign_detail(cid):
    campaign_oid = require_valid_oid(cid)
    if not campaign_oid:
        return render_template("404.html"), 404
    campaign = campaigns_col.find_one({"_id": campaign_oid})
    if not campaign:
        return render_template("404.html"), 404
    brand_email = (session.get("brand_email") or "").strip().lower()
    if not brand_email or brand_email != (campaign.get("brand_email") or "").strip().lower():
        flash("Please use the campaign brand email session to access this campaign.", "error")
        return redirect(url_for("brand_campaigns_page"))
    applicants = campaign.get("applicants", []) or []
    return render_template("brand_campaign_detail.html", campaign=campaign, applicants=applicants)

@app.route("/api/brand/campaign/<cid>/applicants/<idx>/status", methods=["POST"])
def update_campaign_applicant_status(cid, idx):
    campaign_oid = require_valid_oid(cid)
    if not campaign_oid:
        return jsonify({"ok": False, "error": "invalid_campaign_id"}), 400
    brand_email = (session.get("brand_email") or "").strip().lower()
    campaign = campaigns_col.find_one({"_id": campaign_oid})
    if not campaign:
        return jsonify({"ok": False, "error": "not_found"}), 404
    if not brand_email or brand_email != (campaign.get("brand_email") or "").strip().lower():
        return jsonify({"ok": False, "error": "unauthorized"}), 403
    try:
        index = int(idx)
    except Exception:
        return jsonify({"ok": False, "error": "invalid_index"}), 400
    applicants = campaign.get("applicants", []) or []
    if index < 0 or index >= len(applicants):
        return jsonify({"ok": False, "error": "index_out_of_range"}), 400
    data = json_body()
    status = (data.get("status") or "").strip().lower()
    if status not in {"applied", "shortlisted", "approved", "rejected"}:
        return jsonify({"ok": False, "error": "invalid_status"}), 400
    applicants[index]["status"] = status
    applicants[index]["updated_at"] = now()
    campaigns_col.update_one({"_id": campaign_oid}, {"$set": {"applicants": applicants, "updated_at": now()}})
    return jsonify({"ok": True})
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
         "statuses":["new","reviewing","negotiating","accepted","content_approved","closed","declined"]},
        {"key":"reviewing","title":"Under review","sub":f"{(creator.get('name') or 'Creator').split()[0]} is looking at your brief.",
         "statuses":["reviewing","negotiating","accepted","content_approved","closed","declined"]},
        {"key":"negotiating","title":"In discussion","sub":"Details are being worked out.",
         "statuses":["negotiating","accepted","content_approved","closed"]},
        {"key":"accepted","title":"Deal accepted","sub":"The collaboration is confirmed.",
         "statuses":["accepted","content_approved","closed"]},
        {"key":"content_approved","title":"Content approved","sub":"Draft approved by brand.",
         "statuses":["content_approved","closed"]},
        {"key":"closed","title":"Deal closed","sub":"All done - great collaboration!",
         "statuses":["closed"]},
    ]
    drafts = list(content_drafts_col.find({"deal_id": str(enq.get("_id"))}).sort("version", DESCENDING))
    return render_template("brand_portal.html",
                           enq=enq, creator=creator,
                           drafts=drafts,
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

@app.route("/api/enquiry/<eid>/content-drafts", methods=["GET", "POST"])
@login_required
def content_drafts_api(eid):
    uid = session["uid"]
    enquiry_id = require_valid_oid(eid)
    if not enquiry_id:
        return jsonify({"ok": False, "error": "invalid_enquiry_id"}), 400
    enq = enquiries.find_one({"_id": enquiry_id, "user_id": uid})
    if not enq:
        return jsonify({"ok": False, "error": "not_found"}), 404
    if request.method == "GET":
        rows = list(content_drafts_col.find({"deal_id": str(enquiry_id), "creator_id": uid}).sort("version", DESCENDING))
        clean = []
        for r in rows:
            clean.append({
                "id": str(r.get("_id")),
                "version": r.get("version", 1),
                "file_url": r.get("file_url", ""),
                "status": r.get("status", "submitted"),
                "feedback": r.get("feedback", []),
                "submitted_at": fmt_dt(r.get("submitted_at")),
            })
        return jsonify({"ok": True, "drafts": clean})
    data = json_body()
    file_url = (data.get("file_url") or "").strip()
    if not file_url:
        return jsonify({"ok": False, "error": "file_url_required"}), 400
    latest = content_drafts_col.find_one({"deal_id": str(enquiry_id), "creator_id": uid}, sort=[("version", -1)])
    next_ver = int((latest or {}).get("version", 0)) + 1
    doc = {
        "deal_id": str(enquiry_id),
        "creator_id": uid,
        "brand_token": enq.get("tracking_token", ""),
        "version": next_ver,
        "file_url": file_url,
        "status": "submitted",
        "feedback": [],
        "submitted_at": now(),
        "created_at": now(),
        "updated_at": now(),
    }
    inserted = content_drafts_col.insert_one(doc)
    enquiries.update_one({"_id": enquiry_id}, {"$set": {"updated_at": now(), "status": "negotiating"}})
    return jsonify({"ok": True, "id": str(inserted.inserted_id), "version": next_ver})

@app.route("/api/brand/content-drafts/<draft_id>/review", methods=["POST"])
def review_content_draft(draft_id):
    draft_oid = require_valid_oid(draft_id)
    if not draft_oid:
        return jsonify({"ok": False, "error": "invalid_draft_id"}), 400
    data = json_body()
    token = (data.get("token") or "").strip()
    action = (data.get("action") or "").strip().lower()
    comment = (data.get("comment") or "").strip()[:500]
    if action not in {"approve", "changes_requested", "reject"}:
        return jsonify({"ok": False, "error": "invalid_action"}), 400
    draft = content_drafts_col.find_one({"_id": draft_oid})
    if not draft:
        return jsonify({"ok": False, "error": "not_found"}), 404
    if not token or token != (draft.get("brand_token") or ""):
        return jsonify({"ok": False, "error": "invalid_token"}), 403
    feedback_item = {"action": action, "comment": comment, "at": now()}
    content_drafts_col.update_one(
        {"_id": draft_oid},
        {"$set": {"status": action, "updated_at": now()}, "$push": {"feedback": feedback_item}}
    )
    if action == "approve":
        enquiries.update_one({"_id": oid(draft.get("deal_id"))}, {"$set": {"status": "content_approved", "updated_at": now()}})
    return jsonify({"ok": True, "status": action})

def next_invoice_number():
    y = datetime.utcnow().year
    prefix = f"INV-{y}-"
    latest = invoices_col.find_one({"invoice_number": {"$regex": f"^{prefix}"}}, sort=[("invoice_number", -1)])
    if not latest:
        return f"{prefix}001"
    tail = str(latest.get("invoice_number", "")).replace(prefix, "")
    try:
        seq = int(tail) + 1
    except Exception:
        seq = 1
    return f"{prefix}{seq:03d}"

@app.route("/api/enquiry/<eid>/gst-invoice", methods=["POST"])
@login_required
def create_gst_invoice(eid):
    uid = session["uid"]
    enquiry_id = require_valid_oid(eid)
    if not enquiry_id:
        return jsonify({"ok": False, "error": "invalid_enquiry_id"}), 400
    enq = enquiries.find_one({"_id": enquiry_id, "user_id": uid})
    if not enq:
        return jsonify({"ok": False, "error": "not_found"}), 404
    data = json_body()
    try:
        base_amount = int(data.get("amount") or enq.get("budget_num") or 0)
    except Exception:
        return jsonify({"ok": False, "error": "invalid_amount"}), 400
    gst_rate = 18
    gst = int(round(base_amount * gst_rate / 100))
    total = base_amount + gst
    doc = {
        "creator_id": uid,
        "deal_id": str(enquiry_id),
        "invoice_number": next_invoice_number(),
        "gstin": (data.get("gstin") or "").strip(),
        "hsn": (data.get("hsn") or "998361").strip(),
        "service_description": (data.get("service_description") or f"Creator collaboration for {enq.get('brand_name', 'brand')}").strip(),
        "amount": base_amount,
        "gst": gst,
        "gst_rate": gst_rate,
        "total": total,
        "status": "generated",
        "created_at": now(),
        "updated_at": now(),
    }
    inserted = invoices_col.insert_one(doc)
    return jsonify({"ok": True, "invoice_id": str(inserted.inserted_id), "invoice_number": doc["invoice_number"], "total": total})

@app.route("/api/invoices")
@login_required
def list_invoices():
    uid = session["uid"]
    rows = list(invoices_col.find({"creator_id": uid}).sort("created_at", DESCENDING).limit(200))
    clean = []
    for r in rows:
        clean.append({
            "id": str(r.get("_id")),
            "invoice_number": r.get("invoice_number", ""),
            "deal_id": r.get("deal_id", ""),
            "amount": int(r.get("amount", 0) or 0),
            "gst": int(r.get("gst", 0) or 0),
            "total": int(r.get("total", 0) or 0),
            "status": r.get("status", ""),
            "created_at": fmt_dt(r.get("created_at")),
        })
    return jsonify({"ok": True, "invoices": clean})
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
# BRAND STUDIO (SIDE B)
# ═══════════════════════════════════════════════════════════════════════════════
team_members_col = db["team_members"]
lists_col = db["lists"]


def _brand_user(uid):
    return users_col.find_one({"_id": oid(uid), "role": {"$in": ["brand", "agency"]}}) or {}


def _creator_user(uid):
    return users_col.find_one({"_id": oid(uid), "role": {"$in": ["creator", None]}}) or {}


def _tier_from_followers(followers):
    f = int(followers or 0)
    if f < 10000:
        return "nano"
    if f < 100000:
        return "micro"
    if f < 1000000:
        return "macro"
    return "mega"


@app.route("/brand/dashboard")
@role_required("brand", "agency")
def brand_dashboard():
    uid = session["uid"]
    user = _brand_user(uid)
    campaigns = list(campaigns_col.find({"uid": uid}).sort("created_at", DESCENDING).limit(12))
    crm_rows = list(influencer_profiles_col.find({"uid": uid, "deleted_at": {"$exists": False}}).sort("instagram_engagement_rate", DESCENDING).limit(3))
    active = [c for c in campaigns if c.get("status") in {"active", "draft"}]
    total_reach = sum(int(c.get("total_reach", 0)) for c in campaigns)
    budget_spent = sum(int(c.get("spent_budget", 0)) for c in campaigns)
    contracted = sum(len(c.get("creators", [])) for c in campaigns)
    pending_actions = {
        "briefs": sum(1 for c in campaigns for cr in (c.get("creators") or []) if not cr.get("brief_sent_at")),
        "invoices": payments_col.count_documents({"brand_uid": uid, "status": {"$in": ["pending", "processing"]}}),
        "reminders": followup_reminders_col.count_documents({"uid": uid, "status": {"$in": ["pending", "snoozed"]}, "reminder_date": {"$lte": now()}}),
    }
    monthly_budget = int(((user.get("brand_profile") or {}).get("monthly_budget") or 0))
    projected = int((budget_spent / max(1, now().day)) * 30)
    return render_template("brand/dashboard.html", campaigns=campaigns, active_count=len(active), contracted=contracted, total_reach=total_reach, budget_spent=budget_spent, top_creators=crm_rows, pending_actions=pending_actions, monthly_budget=monthly_budget, projected=projected)


@app.route("/brand/discover")
@role_required("brand", "agency")
def brand_discover():
    return render_template("brand/discover.html")


@app.route("/brand/lists")
@role_required("brand", "agency")
def brand_lists():
    uid = session["uid"]
    rows = list(lists_col.find({"uid": uid}).sort("created_at", DESCENDING))
    return render_template("brand/lists.html", lists=rows)


@app.route("/brand/match")
@role_required("brand", "agency")
def brand_match():
    return render_template("brand/match.html")


@app.route("/api/brand/match", methods=["POST"])
@role_required("brand", "agency")
def api_brand_match():
    uid = session["uid"]
    body = json_body()
    brief_text = (body.get("brief_text") or "").strip()
    if not brief_text:
        return api_error("brief_text_required", 400)

    def stream_match():
        steps = ["Reading your brief...", "Identifying target audience...", "Scanning creators...", "Ranking by fit score..."]
        for step in steps:
            yield f"data: {json.dumps({'type': 'progress', 'message': step})}\n\n"
        lower = brief_text.lower()
        target_niche = "fitness" if "fitness" in lower or "gym" in lower else "lifestyle" if "lifestyle" in lower else "tech" if "tech" in lower else "beauty" if "beauty" in lower else ""
        target_location = "mumbai" if "mumbai" in lower else "delhi" if "delhi" in lower else ""
        q = {"role": {"$in": ["creator", None]}, "creator_profile.profile_complete": {"$ne": False}}
        if target_niche:
            q["creator_profile.niche"] = {"$regex": target_niche, "$options": "i"}
        if target_location:
            q["creator_profile.location"] = {"$regex": target_location, "$options": "i"}
        creators = list(users_col.find(q).limit(80))
        scored = []
        for u in creators:
            cp = u.get("creator_profile") or {}
            followers = int(cp.get("instagram_followers") or 0)
            tier = _tier_from_followers(followers)
            engagement = float(cp.get("instagram_engagement_rate") or 0)
            rate = int(cp.get("base_rate_reel") or 0)
            niche_match = 30 if target_niche and target_niche in (cp.get("niche", "").lower()) else 15
            tier_match = 14
            location_match = 15 if target_location and target_location in (cp.get("location", "").lower()) else 6
            rate_fit = 12 if rate and rate <= 100000 else 6
            engagement_quality = min(20, int(engagement * 2.5))
            fit = min(100, niche_match + tier_match + location_match + rate_fit + engagement_quality)
            reason = f"{u.get('name','Creator')} has {engagement}% engagement in {cp.get('niche','general')} content with audience overlap for this brief."
            scored.append({"name": u.get("name"), "username": u.get("username"), "niche": cp.get("niche", ""), "tier": tier, "followers": followers, "engagement": engagement, "rate": rate, "location": cp.get("location", ""), "fit_score": fit, "reason": reason})
        ranked = sorted(scored, key=lambda x: x["fit_score"], reverse=True)[:12]
        yield f"data: {json.dumps({'type':'results','items': ranked})}\n\n"
        yield "data: [DONE]\n\n"

    return Response(stream_with_context(stream_match()), mimetype="text/event-stream")


@app.route("/api/brand/discover")
@role_required("brand", "agency")
def api_brand_discover():
    uid = session["uid"]
    user = _brand_user(uid)
    prefs = user.get("brand_profile") or {}
    q = {"role": {"$in": ["creator", None]}}
    niche = request.args.get("niche") or ""
    if niche:
        q["creator_profile.niche"] = {"$regex": niche, "$options": "i"}
    min_eng = float(request.args.get("min_engagement") or 0)
    max_rate = int(request.args.get("max_rate") or prefs.get("monthly_budget") or 10**9)
    rows = []
    for u in users_col.find(q).limit(120):
        cp = u.get("creator_profile") or {}
        eng = float(cp.get("instagram_engagement_rate") or 0)
        if eng < min_eng:
            continue
        if int(cp.get("base_rate_reel") or 0) > max_rate:
            continue
        followers = int(cp.get("instagram_followers") or 0)
        rows.append({
            "name": u.get("name"),
            "username": u.get("username"),
            "niche": cp.get("niche", ""),
            "tier": _tier_from_followers(followers),
            "instagram_followers": followers,
            "youtube_subscribers": int(cp.get("youtube_subscribers") or 0),
            "engagement": eng,
            "base_rate_reel": int(cp.get("base_rate_reel") or 0),
            "base_rate_post": int(cp.get("base_rate_post") or 0),
            "base_rate_story": int(cp.get("base_rate_story") or 0),
            "location": cp.get("location", ""),
            "verified": bool(cp.get("verified")),
            "notable_brands": cp.get("notable_brands") or [],
        })
    rows.sort(key=lambda x: x["engagement"], reverse=True)
    return jsonify(rows[:60])


@app.route("/brand/campaigns")
@role_required("brand", "agency")
def brand_campaigns():
    uid = session["uid"]
    rows = list(campaigns_col.find({"uid": uid}).sort("created_at", DESCENDING))
    return render_template("brand/campaigns.html", campaigns=rows)


@app.route("/brand/campaigns/new", methods=["GET", "POST"])
@role_required("brand", "agency")
def brand_campaign_new():
    uid = session["uid"]
    user = _brand_user(uid)
    if request.method == "POST":
        if user.get("plan") == "free" and campaigns_col.count_documents({"uid": uid}) >= 3:
            return _plan_limit_response("brand_campaigns", 3)
        form = request.form
        doc = {
            "uid": uid,
            "name": (form.get("name") or "").strip(),
            "product_name": (form.get("product_name") or "").strip(),
            "product_description": (form.get("product_description") or "").strip(),
            "campaign_objective": (form.get("campaign_objective") or "awareness").strip(),
            "status": (form.get("status") or "draft").strip(),
            "start_date": form.get("start_date"),
            "end_date": form.get("end_date"),
            "total_budget": int(form.get("total_budget") or 0),
            "spent_budget": 0,
            "target_niche": (form.get("target_niche") or "").strip(),
            "target_tier": (form.get("target_tier") or "").strip(),
            "deliverables": [x.strip() for x in (form.get("deliverables") or "").split(",") if x.strip()],
            "creators": [],
            "brief_template": (form.get("brief_template") or "").strip(),
            "dos": (form.get("dos") or "").strip(),
            "donts": (form.get("donts") or "").strip(),
            "hashtags": [x.strip() for x in (form.get("hashtags") or "").split(",") if x.strip()],
            "created_at": now(),
            "updated_at": now(),
        }
        inserted = campaigns_col.insert_one(doc)
        return redirect(url_for("brand_campaign_detail", cid=str(inserted.inserted_id)))
    return render_template("brand/campaign_new.html")


@app.route("/brand/campaigns/<cid>")
@role_required("brand", "agency")
def brand_campaign_detail(cid):
    uid = session["uid"]
    campaign = campaigns_col.find_one({"_id": oid(cid), "uid": uid})
    if not campaign:
        return redirect(url_for("brand_campaigns"))
    return render_template("brand/campaign_detail.html", campaign=campaign)


@app.route("/brand/briefs/new", methods=["GET", "POST"])
@role_required("brand", "agency")
def brand_brief_new():
    uid = session["uid"]
    if request.method == "POST":
        form = request.form
        creator_username = (form.get("creator_username") or "").strip().lstrip("@")
        creator = users_col.find_one({"username": creator_username}) or {}
        if not creator:
            flash("Creator not found", "error")
            return redirect(url_for("brand_brief_new"))
        enq_doc = {
            "user_id": str(creator.get("_id")),
            "brand_name": (_brand_user(uid).get("brand_profile") or {}).get("company_name") or session.get("name"),
            "contact_name": session.get("name"),
            "email": session.get("email"),
            "platform": "Instagram",
            "budget": f"₹{int(form.get('budget_offered') or 0):,}",
            "budget_num": int(form.get("budget_offered") or 0),
            "brief": (form.get("brief") or "").strip(),
            "status": "new",
            "source": "brand_studio",
            "created_at": now(),
            "updated_at": now(),
        }
        enquiries.insert_one(enq_doc)
        campaign_name = (form.get("campaign_name") or "Quick Brief Campaign").strip()
        camp = campaigns_col.find_one({"uid": uid, "name": campaign_name})
        if not camp:
            camp_id = campaigns_col.insert_one({
                "uid": uid,
                "name": campaign_name,
                "status": "active",
                "total_budget": int(form.get("budget_offered") or 0),
                "spent_budget": 0,
                "creators": [{"influencer_id": str(creator.get("_id")), "status": "brief_sent", "brief_sent_at": now(), "rate_agreed": int(form.get("budget_offered") or 0)}],
                "created_at": now(),
                "updated_at": now(),
            }).inserted_id
            camp = {"_id": camp_id}
        notifications_col.insert_one({"uid": str(creator.get("_id")), "type": "deal_alert", "title": "New brief from DealInbox Brand Studio", "body": campaign_name, "link": "/enquiries", "read": False, "created_at": now()})
        flash("Brief sent to creator inbox.", "success")
        return redirect(url_for("brand_campaign_detail", cid=str(camp.get("_id"))))
    return render_template("brand/brief_new.html")


@app.route("/brand/crm")
@role_required("brand", "agency")
def brand_crm():
    return redirect(url_for("crm_influencers_page"))


@app.route("/brand/outreach")
@role_required("brand", "agency")
def brand_outreach():
    return redirect(url_for("crm_outreach_page"))


@app.route("/brand/reminders")
@role_required("brand", "agency")
def brand_reminders():
    return redirect(url_for("crm_reminders_page"))


@app.route("/brand/payments")
@role_required("brand", "agency")
def brand_payments():
    uid = session["uid"]
    rows = list(payments_col.find({"brand_uid": uid}).sort("created_at", DESCENDING))
    return render_template("brand/payments.html", payments=rows)


@app.route("/brand/payments/initiate", methods=["POST"])
@role_required("brand", "agency")
def brand_payments_initiate():
    uid = session["uid"]
    data = request.form
    payment_id = payments_col.insert_one({
        "campaign_id": data.get("campaign_id"),
        "brand_uid": uid,
        "creator_uid": data.get("creator_uid"),
        "amount": int(data.get("amount") or 0),
        "gst_amount": int((int(data.get("amount") or 0)) * 0.18),
        "total_amount": int((int(data.get("amount") or 0)) * 1.18),
        "status": "processing",
        "created_at": now(),
    }).inserted_id
    payments_col.update_one({"_id": payment_id}, {"$set": {"status": "completed", "paid_at": now(), "invoice_number": f"DI-{now().year}-{str(payment_id)[-6:].upper()}"}})
    try:
        campaigns_col.update_one({"_id": oid(data.get("campaign_id")), "uid": uid, "creators.influencer_id": data.get("creator_uid")}, {"$set": {"creators.$.paid_at": now(), "creators.$.status": "paid"}, "$inc": {"spent_budget": int(data.get("amount") or 0)}})
    except Exception:
        pass
    flash("Payment marked completed.", "success")
    return redirect(url_for("brand_payments"))


@app.route("/brand/invoices")
@role_required("brand", "agency")
def brand_invoices():
    uid = session["uid"]
    rows = list(payments_col.find({"brand_uid": uid, "invoice_number": {"$exists": True}}).sort("paid_at", DESCENDING))
    return render_template("brand/invoices.html", invoices=rows)


@app.route("/brand/analytics")
@role_required("brand", "agency")
def brand_analytics():
    uid = session["uid"]
    campaigns = list(campaigns_col.find({"uid": uid}))
    total_spent = sum(int(c.get("spent_budget") or 0) for c in campaigns)
    total_reach = sum(int(c.get("total_reach") or 0) for c in campaigns)
    creators_worked = set()
    for c in campaigns:
        for cr in c.get("creators", []):
            creators_worked.add(cr.get("influencer_id"))
    return render_template("brand/analytics.html", campaigns=campaigns, total_spent=total_spent, total_reach=total_reach, creators_count=len(creators_worked))


@app.route("/brand/team", methods=["GET", "POST"])
@role_required("brand", "agency")
def brand_team():
    uid = session["uid"]
    if request.method == "POST":
        team_members_col.insert_one({
            "brand_uid": uid,
            "email": (request.form.get("email") or "").strip().lower(),
            "name": (request.form.get("name") or "").strip(),
            "role": (request.form.get("role") or "viewer").strip(),
            "status": "invited",
            "invited_at": now(),
        })
        flash("Invitation queued.", "success")
    members = list(team_members_col.find({"brand_uid": uid}).sort("invited_at", DESCENDING))
    return render_template("brand/team.html", members=members)


@app.route("/brand/settings", methods=["GET", "POST"])
@role_required("brand", "agency")
def brand_settings():
    uid = session["uid"]
    user = _brand_user(uid)
    if request.method == "POST":
        bp = user.get("brand_profile") or {}
        bp.update({
            "company_name": request.form.get("company_name", bp.get("company_name", "")),
            "industry": request.form.get("industry", bp.get("industry", "")),
            "website": request.form.get("website", bp.get("website", "")),
            "description": request.form.get("description", bp.get("description", "")),
            "monthly_budget": int(request.form.get("monthly_budget") or bp.get("monthly_budget") or 0),
            "gst_number": request.form.get("gst_number", bp.get("gst_number", "")),
        })
        users_col.update_one({"_id": oid(uid)}, {"$set": {"brand_profile": bp, "updated_at": now()}})
        flash("Brand profile updated.", "success")
        return redirect(url_for("brand_settings"))
    return render_template("brand/settings.html", user=user)


@app.route("/brand/billing")
@role_required("brand", "agency")
def brand_billing():
    return render_template("brand/billing.html")


@app.route("/brand/notifications")
@role_required("brand", "agency")
def brand_notifications():
    uid = session["uid"]
    rows = list(notifications_col.find({"uid": uid}).sort("created_at", DESCENDING).limit(60))
    return render_template("brand/notifications.html", notifications=rows)


@app.route("/availability", methods=["GET", "POST"])
@role_required("creator")
def creator_availability():
    uid = session["uid"]
    user = _creator_user(uid)
    if request.method == "POST":
        cp = user.get("creator_profile") or {}
        cp["available_now"] = bool(request.form.get("available_now"))
        cp["available_from"] = request.form.get("available_from")
        cp["preferred_niches_month"] = [x.strip() for x in (request.form.get("preferred_niches_month") or "").split(",") if x.strip()]
        cp["blackout_dates"] = [x.strip() for x in (request.form.get("blackout_dates") or "").split(",") if x.strip()]
        users_col.update_one({"_id": oid(uid)}, {"$set": {"creator_profile": cp, "updated_at": now()}})
        flash("Availability updated.", "success")
        return redirect(url_for("creator_availability"))
    return render_template("availability.html", user=user)


@app.route("/media-kit")
@role_required("creator")
def creator_media_kit():
    uid = session["uid"]
    user = _creator_user(uid)
    return render_template("media_kit.html", creator=user)


@app.route("/@<username>/mediakit")
def public_media_kit(username):
    user = users_col.find_one({"username": username})
    if not user:
        return render_template("404.html"), 404
    return render_template("media_kit_public.html", creator=user)

# ═══════════════════════════════════════════════════════════════════════════════
# DEALINBOX CRM
# ═══════════════════════════════════════════════════════════════════════════════
FREE_CRM_LIMIT = 20
FREE_AI_DAILY_LIMIT = 5
FREE_DISCOVER_DAILY_LIMIT = 3


def _plan_limit_response(feature, limit):
    return jsonify({
        "error": "limit_reached",
        "feature": feature,
        "limit": limit,
        "upgrade_url": "/upgrade"
    }), 402


def _user_doc(uid):
    try:
        return users_col.find_one({"_id": oid(uid)}) or {}
    except Exception:
        return {}


def _enforce_plan_limit(uid, feature, limit, period="total"):
    user = _user_doc(uid)
    if is_pro(user):
        return None
    now_dt = now()
    scope = now_dt.strftime("%Y-%m-%d") if period == "day" else "all"
    try:
        doc = rate_limits_col.find_one({"uid": uid, "feature": feature, "scope": scope}) or {}
        if int(doc.get("count", 0)) >= limit:
            return _plan_limit_response(feature, limit)
        rate_limits_col.update_one(
            {"uid": uid, "feature": feature, "scope": scope},
            {"$setOnInsert": {"created_at": now_dt}, "$inc": {"count": 1}, "$set": {"updated_at": now_dt}},
            upsert=True,
        )
        return None
    except Exception:
        return None


def _brand_health_score(uid, contact):
    last_contacted = to_naive(contact.get("last_contacted_at"))
    if last_contacted:
        days = max(0, (now() - last_contacted).days)
        recency_score = 40 if days < 7 else max(0, int(40 * (90 - min(days, 90)) / 83))
    else:
        recency_score = 0
    try:
        activity_count = outreach_log_col.count_documents({
            "uid": uid,
            "target_type": "brand",
            "target_id": str(contact.get("_id")),
            "created_at": {"$gte": now() - timedelta(days=30)},
        })
    except Exception:
        activity_count = 0
    activity_score = min(30, activity_count * 6)
    deal_score = 0
    linked = contact.get("collab_history") or []
    if linked:
        deal_score += 10
    try:
        active = enquiries.count_documents({"user_id": uid, "brand_name": contact.get("brand_name"), "status": {"$in": ["accepted", "negotiating"]}})
        if active:
            deal_score += 20
    except Exception:
        pass
    return min(100, recency_score + activity_score + min(30, deal_score))


def _influencer_health_score(uid, profile):
    last_contacted = to_naive(profile.get("last_contacted_at"))
    if last_contacted:
        days = max(0, (now() - last_contacted).days)
        recency_score = 40 if days < 7 else max(0, int(40 * (90 - min(days, 90)) / 83))
    else:
        recency_score = 0
    try:
        activity_count = outreach_log_col.count_documents({
            "uid": uid,
            "target_type": "influencer",
            "target_id": str(profile.get("_id")),
            "created_at": {"$gte": now() - timedelta(days=30)},
        })
    except Exception:
        activity_count = 0
    activity_score = min(30, activity_count * 6)
    deal_score = 20 if (profile.get("relationship_status") in {"contracted", "negotiating"}) else 0
    if profile.get("collab_history"):
        deal_score += 10
    return min(100, recency_score + activity_score + min(30, deal_score))


def _status_bucket(kind, value):
    if kind == "brand":
        return value if value in {"cold", "warm", "active", "vip", "blacklist"} else "cold"
    return value if value in {"prospect", "outreached", "negotiating", "contracted", "blacklist"} else "prospect"


@app.route("/crm/brands")
@require_login
def crm_brands_page():
    uid = session["uid"]
    status = (request.args.get("status") or "").strip().lower()
    tag = (request.args.get("tag") or "").strip().lower()
    sort = (request.args.get("sort") or "last_contacted").strip()
    q = {"uid": uid, "deleted_at": {"$exists": False}}
    if status and status != "all":
        q["relationship_status"] = status
    if tag:
        q["tags"] = {"$in": [tag]}
    sort_map = {
        "last_contacted": ("last_contacted_at", DESCENDING),
        "deal_value": ("avg_deal_value", DESCENDING),
        "name": ("brand_name", 1),
        "date_added": ("created_at", DESCENDING),
    }
    s_key, s_order = sort_map.get(sort, ("last_contacted_at", DESCENDING))
    contacts = []
    counts = {"total": 0, "cold": 0, "warm": 0, "active": 0, "vip": 0, "blacklist": 0}
    total_pipeline_value = 0
    tags = set()
    try:
        raw = list(brand_contacts_col.find(q).sort(s_key, s_order))
        counts["total"] = brand_contacts_col.count_documents({"uid": uid, "deleted_at": {"$exists": False}})
        for key in ["cold", "warm", "active", "vip", "blacklist"]:
            counts[key] = brand_contacts_col.count_documents({"uid": uid, "deleted_at": {"$exists": False}, "relationship_status": key})
        for c in raw:
            c["id"] = str(c.get("_id"))
            c["health_score"] = _brand_health_score(uid, c)
            c["relationship_status"] = _status_bucket("brand", c.get("relationship_status"))
            total_pipeline_value += int(c.get("avg_deal_value") or 0)
            for t in (c.get("tags") or []):
                tags.add(str(t).lower())
            contacts.append(c)
    except Exception:
        pass
    return render_template("crm_brands.html", contacts=contacts, counts=counts, total_pipeline_value=total_pipeline_value, tag_options=sorted(tags))


@app.route("/crm/brands/new", methods=["GET", "POST"])
@require_login
def crm_brands_new():
    uid = session["uid"]
    if request.method == "GET":
        return render_template("crm_brand_form.html", contact={})
    gate = _enforce_plan_limit(uid, "brand_contacts", FREE_CRM_LIMIT, period="total")
    if gate:
        return gate
    form = request.form
    brand_name = (form.get("brand_name") or "").strip()
    if not brand_name:
        flash("Brand name is required.", "error")
        return render_template("crm_brand_form.html", contact=form), 400
    try:
        doc = {
            "uid": uid,
            "brand_name": brand_name,
            "industry": (form.get("industry") or "").strip(),
            "website": (form.get("website") or "").strip(),
            "instagram_handle": (form.get("instagram_handle") or "").strip(),
            "contact_name": (form.get("contact_name") or "").strip(),
            "contact_email": (form.get("contact_email") or "").strip(),
            "contact_designation": (form.get("contact_designation") or "").strip(),
            "contact_linkedin": (form.get("contact_linkedin") or "").strip(),
            "avg_deal_value": int(form.get("avg_deal_value") or 0),
            "total_paid": int(form.get("total_paid") or 0),
            "relationship_status": _status_bucket("brand", (form.get("relationship_status") or "cold").lower()),
            "tags": [t.strip().lower() for t in (form.get("tags") or "").split(",") if t.strip()],
            "notes": (form.get("notes") or "").strip(),
            "last_contacted_at": None,
            "next_followup_at": None,
            "followup_note": "",
            "collab_history": [],
            "wishlist": (form.get("wishlist") == "on"),
            "created_at": now(),
            "updated_at": now(),
        }
        inserted = brand_contacts_col.insert_one(doc)
        return redirect(url_for("crm_brand_detail", id=str(inserted.inserted_id)))
    except Exception:
        flash("Unable to create brand contact.", "error")
        return render_template("crm_brand_form.html", contact=form), 500


@app.route("/crm/brands/<id>")
@require_login
def crm_brand_detail(id):
    uid = session["uid"]
    obj_id = require_valid_oid(id)
    if not obj_id:
        return redirect(url_for("crm_brands_page"))
    try:
        contact = brand_contacts_col.find_one({"_id": obj_id, "uid": uid, "deleted_at": {"$exists": False}})
        if not contact:
            return redirect(url_for("crm_brands_page"))
        outreach = list(outreach_log_col.find({"uid": uid, "target_type": "brand", "target_id": id}).sort("sent_at", DESCENDING))
        reminders = list(followup_reminders_col.find({"uid": uid, "target_type": "brand", "target_id": id, "status": {"$ne": "done"}}).sort("reminder_date", 1))
        linked_deals = list(enquiries.find({"user_id": uid, "_id": {"$in": [oid(e) for e in (contact.get("collab_history") or []) if oid(e)]}}).sort("created_at", DESCENDING))
        contact["id"] = id
        contact["health_score"] = _brand_health_score(uid, contact)
        return render_template("crm_brand_detail.html", contact=contact, outreach=outreach, reminders=reminders, linked_deals=linked_deals)
    except Exception:
        flash("Unable to load brand.", "error")
        return redirect(url_for("crm_brands_page"))


@app.route("/crm/brands/<id>/edit", methods=["POST"])
@require_login
def crm_brand_edit(id):
    uid = session["uid"]
    obj_id = require_valid_oid(id)
    if not obj_id:
        return redirect(url_for("crm_brands_page"))
    try:
        form = request.form
        update = {
            "brand_name": (form.get("brand_name") or "").strip(),
            "industry": (form.get("industry") or "").strip(),
            "website": (form.get("website") or "").strip(),
            "instagram_handle": (form.get("instagram_handle") or "").strip(),
            "contact_name": (form.get("contact_name") or "").strip(),
            "contact_email": (form.get("contact_email") or "").strip(),
            "contact_designation": (form.get("contact_designation") or "").strip(),
            "contact_linkedin": (form.get("contact_linkedin") or "").strip(),
            "avg_deal_value": int(form.get("avg_deal_value") or 0),
            "total_paid": int(form.get("total_paid") or 0),
            "relationship_status": _status_bucket("brand", (form.get("relationship_status") or "cold").lower()),
            "tags": [t.strip().lower() for t in (form.get("tags") or "").split(",") if t.strip()],
            "notes": (form.get("notes") or "").strip(),
            "wishlist": form.get("wishlist") == "on",
            "updated_at": now(),
        }
        brand_contacts_col.update_one({"_id": obj_id, "uid": uid}, {"$set": update})
        return redirect(url_for("crm_brand_detail", id=id))
    except Exception:
        flash("Unable to update brand.", "error")
        return redirect(url_for("crm_brand_detail", id=id))


@app.route("/crm/brands/<id>/delete", methods=["POST"])
@require_login
def crm_brand_delete(id):
    uid = session["uid"]
    obj_id = require_valid_oid(id)
    if obj_id:
        try:
            brand_contacts_col.update_one({"_id": obj_id, "uid": uid}, {"$set": {"deleted_at": now(), "updated_at": now()}})
        except Exception:
            pass
    return redirect(url_for("crm_brands_page"))


@app.route("/crm/brands/<id>/log-outreach", methods=["POST"])
@require_login
def crm_brand_log_outreach(id):
    uid = session["uid"]
    obj_id = require_valid_oid(id)
    if not obj_id:
        return redirect(url_for("crm_brands_page"))
    try:
        contact = brand_contacts_col.find_one({"_id": obj_id, "uid": uid}) or {}
        form = request.form
        sent_at = now()
        outreach_log_col.insert_one({
            "uid": uid,
            "target_type": "brand",
            "target_id": id,
            "target_name": contact.get("brand_name", ""),
            "channel": (form.get("channel") or "email").strip(),
            "direction": (form.get("direction") or "outbound").strip(),
            "subject": (form.get("subject") or "").strip(),
            "body": (form.get("body") or "").strip(),
            "status": (form.get("status") or "sent").strip(),
            "sent_at": sent_at,
            "replied_at": None,
            "ai_generated": bool(form.get("ai_generated")),
            "template_used": (form.get("template_used") or "manual").strip(),
            "created_at": now(),
        })
        brand_contacts_col.update_one({"_id": obj_id, "uid": uid}, {"$set": {"last_contacted_at": sent_at, "updated_at": now()}})
    except Exception:
        pass
    return redirect(url_for("crm_brand_detail", id=id))


@app.route("/crm/brands/<id>/set-reminder", methods=["POST"])
@require_login
def crm_brand_set_reminder(id):
    uid = session["uid"]
    obj_id = require_valid_oid(id)
    if not obj_id:
        return redirect(url_for("crm_brands_page"))
    try:
        contact = brand_contacts_col.find_one({"_id": obj_id, "uid": uid}) or {}
        reminder_date = datetime.strptime((request.form.get("reminder_date") or ""), "%Y-%m-%d") if request.form.get("reminder_date") else now() + timedelta(days=3)
        note = (request.form.get("note") or "").strip()
        followup_reminders_col.insert_one({
            "uid": uid,
            "target_type": "brand",
            "target_id": id,
            "target_name": contact.get("brand_name", ""),
            "reminder_date": reminder_date,
            "note": note,
            "status": "pending",
            "created_at": now(),
        })
        brand_contacts_col.update_one({"_id": obj_id, "uid": uid}, {"$set": {"next_followup_at": reminder_date, "followup_note": note, "updated_at": now()}})
    except Exception:
        pass
    return redirect(url_for("crm_brand_detail", id=id))


@app.route("/api/crm/brands/search")
@require_login
def api_crm_brands_search():
    uid = session["uid"]
    q = (request.args.get("q") or "").strip()
    if len(q) < 1:
        return jsonify([])
    try:
        rows = list(brand_contacts_col.find({
            "uid": uid,
            "deleted_at": {"$exists": False},
            "$or": [
                {"brand_name": {"$regex": re.escape(q), "$options": "i"}},
                {"contact_name": {"$regex": re.escape(q), "$options": "i"}},
                {"tags": {"$elemMatch": {"$regex": re.escape(q), "$options": "i"}}},
            ],
        }).limit(25))
        return jsonify([{"id": str(r.get("_id")), "brand_name": r.get("brand_name"), "contact_name": r.get("contact_name"), "tags": r.get("tags", [])} for r in rows])
    except Exception:
        return jsonify([])


@app.route("/api/crm/brands/<id>/generate-pitch", methods=["POST"])
@require_login
def api_crm_brand_generate_pitch(id):
    uid = session["uid"]
    obj_id = require_valid_oid(id)
    if not obj_id:
        return api_error("invalid_brand", 400)
    gate = _enforce_plan_limit(uid, "ai_pitch_gen", FREE_AI_DAILY_LIMIT, period="day")
    if gate:
        return gate
    tone = (request.args.get("tone") or (json_body().get("tone") if request.is_json else request.form.get("tone")) or "formal").strip().lower()
    if tone not in {"formal", "casual", "bold"}:
        tone = "formal"
    brand = brand_contacts_col.find_one({"_id": obj_id, "uid": uid}) or {}
    user = _user_doc(uid)
    prompt = f"""You are a professional influencer marketing expert helping an Indian content creator write a cold outreach email to a brand they want to work with. Write in a tone that is {tone}. Be specific, concise, and compelling. Include: why this creator is the right fit, their key stats, one concrete content idea, and a clear CTA. Max 150 words. No fluff.

Creator profile:
  Name: {user.get('name','Creator')}
  Niche: {user.get('niche','')}
  Instagram: {user.get('followers','0')} followers, {user.get('engagement_rate','0')}% engagement
  YouTube: {user.get('youtube_subscribers','0')} subscribers
  Base rate (Reel): ₹{user.get('base_rate_reel','0')}
  Notable past brands: {', '.join(user.get('past_brands', [])) if isinstance(user.get('past_brands'), list) else user.get('past_brands','')}

Brand they're pitching:
  Brand: {brand.get('brand_name','')}
  Industry: {brand.get('industry','')}
  Contact: {brand.get('contact_name','')}, {brand.get('contact_designation','')}
  Notes: {brand.get('notes','')}
"""

    def generate():
        produced = ""
        if not ANTHROPIC_API_KEY:
            fallback = f"Subject: Collaboration Idea for {brand.get('brand_name','your brand')}\n\nHi {brand.get('contact_name') or 'Team'}, I'd love to collaborate with {brand.get('brand_name') or 'your brand'} with a high-converting short-form concept for your {brand.get('industry') or 'category'} audience. My audience aligns with this niche and consistently drives engaged discovery. If helpful, I can share a 2-post concept deck and pricing options this week. Are you open to a quick call?"
            produced = fallback
        else:
            try:
                res = requests.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": ANTHROPIC_API_KEY,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={"model": "claude-sonnet-4-6", "max_tokens": 260, "messages": [{"role": "user", "content": prompt}]},
                    timeout=40,
                )
                content = (((res.json() or {}).get("content") or [{}])[0] or {}).get("text", "")
                produced = content.strip() if content else "Could not generate pitch."
            except Exception:
                produced = "Could not generate pitch."
        for chunk in [produced[i:i+24] for i in range(0, len(produced), 24)]:
            yield f"data: {json.dumps({'chunk': chunk})}\\n\\n"
        yield "data: [DONE]\\n\\n"

    return Response(stream_with_context(generate()), mimetype="text/event-stream")


@app.route("/api/crm/brands/wishlist")
@require_login
def api_crm_wishlist():
    uid = session["uid"]
    try:
        rows = list(brand_contacts_col.find({"uid": uid, "wishlist": True, "deleted_at": {"$exists": False}}).sort("updated_at", DESCENDING))
        return jsonify([{"id": str(r.get("_id")), "brand_name": r.get("brand_name"), "industry": r.get("industry")} for r in rows])
    except Exception:
        return jsonify([])


@app.route("/crm/influencers")
@require_login
def crm_influencers_page():
    uid = session["uid"]
    tier = (request.args.get("tier") or "").lower().strip()
    niche = (request.args.get("niche") or "").strip()
    location = (request.args.get("location") or "").strip()
    q = {"uid": uid, "deleted_at": {"$exists": False}}
    if tier and tier != "all":
        q["tier"] = tier
    if niche and niche.lower() != "all":
        q["niche"] = {"$regex": f"^{re.escape(niche)}$", "$options": "i"}
    if location and location.lower() != "all":
        q["location"] = {"$regex": f"^{re.escape(location)}$", "$options": "i"}
    influencers = []
    tier_counts = {"nano": 0, "micro": 0, "macro": 0, "mega": 0}
    avg_engagement = 0
    try:
        rows = list(influencer_profiles_col.find(q).sort("created_at", DESCENDING))
        total_eng = 0
        for r in rows:
            r["id"] = str(r.get("_id"))
            r["health_score"] = _influencer_health_score(uid, r)
            total_eng += float(r.get("instagram_engagement_rate") or 0)
            t = (r.get("tier") or "").lower()
            if t in tier_counts:
                tier_counts[t] += 1
            influencers.append(r)
        avg_engagement = round(total_eng / max(1, len(rows)), 2)
    except Exception:
        pass
    return render_template("crm_influencers.html", influencers=influencers, tier_counts=tier_counts, avg_engagement=avg_engagement)


@app.route("/crm/influencers/new", methods=["GET", "POST"])
@require_login
def crm_influencers_new():
    uid = session["uid"]
    if request.method == "GET":
        prefill = request.args.to_dict()
        return render_template("crm_influencer_form.html", profile=prefill)
    gate = _enforce_plan_limit(uid, "influencer_profiles", FREE_CRM_LIMIT, period="total")
    if gate:
        return gate
    form = request.form
    creator_name = (form.get("creator_name") or "").strip()
    if not creator_name:
        flash("Creator name is required.", "error")
        return render_template("crm_influencer_form.html", profile=form), 400
    username = (form.get("username") or "").strip()
    linked_uid = None
    try:
        if username:
            linked = users_col.find_one({"username": username}) or {}
            linked_uid = str(linked.get("_id")) if linked.get("_id") else None
        doc = {
            "uid": uid,
            "creator_name": creator_name,
            "username": username,
            "linked_uid": linked_uid,
            "instagram_handle": (form.get("instagram_handle") or "").strip(),
            "youtube_handle": (form.get("youtube_handle") or "").strip(),
            "instagram_followers": int(form.get("instagram_followers") or 0),
            "youtube_subscribers": int(form.get("youtube_subscribers") or 0),
            "instagram_engagement_rate": float(form.get("instagram_engagement_rate") or 0),
            "youtube_avg_views": int(form.get("youtube_avg_views") or 0),
            "niche": (form.get("niche") or "").strip(),
            "tier": (form.get("tier") or "nano").strip().lower(),
            "location": (form.get("location") or "").strip(),
            "languages": [t.strip() for t in (form.get("languages") or "").split(",") if t.strip()],
            "avg_rate_reel": int(form.get("avg_rate_reel") or 0),
            "avg_rate_post": int(form.get("avg_rate_post") or 0),
            "avg_rate_story": int(form.get("avg_rate_story") or 0),
            "past_brands": [t.strip() for t in (form.get("past_brands") or "").split(",") if t.strip()],
            "content_quality_score": int(form.get("content_quality_score") or 0),
            "reliability_score": int(form.get("reliability_score") or 0),
            "relationship_status": _status_bucket("influencer", (form.get("relationship_status") or "prospect").lower()),
            "tags": [t.strip().lower() for t in (form.get("tags") or "").split(",") if t.strip()],
            "notes": (form.get("notes") or "").strip(),
            "last_contacted_at": None,
            "next_followup_at": None,
            "collab_history": [],
            "created_at": now(),
            "updated_at": now(),
        }
        inserted = influencer_profiles_col.insert_one(doc)
        return redirect(url_for("crm_influencer_detail", id=str(inserted.inserted_id)))
    except Exception:
        flash("Unable to create influencer profile.", "error")
        return render_template("crm_influencer_form.html", profile=form), 500


@app.route("/crm/influencers/<id>")
@require_login
def crm_influencer_detail(id):
    uid = session["uid"]
    obj_id = require_valid_oid(id)
    if not obj_id:
        return redirect(url_for("crm_influencers_page"))
    try:
        profile = influencer_profiles_col.find_one({"_id": obj_id, "uid": uid, "deleted_at": {"$exists": False}})
        if not profile:
            return redirect(url_for("crm_influencers_page"))
        outreach = list(outreach_log_col.find({"uid": uid, "target_type": "influencer", "target_id": id}).sort("sent_at", DESCENDING))
        reminders = list(followup_reminders_col.find({"uid": uid, "target_type": "influencer", "target_id": id, "status": {"$ne": "done"}}).sort("reminder_date", 1))
        profile["id"] = id
        profile["health_score"] = _influencer_health_score(uid, profile)
        return render_template("crm_influencer_detail.html", profile=profile, outreach=outreach, reminders=reminders)
    except Exception:
        flash("Unable to load influencer profile.", "error")
        return redirect(url_for("crm_influencers_page"))


@app.route("/crm/influencers/<id>/edit", methods=["POST"])
@require_login
def crm_influencer_edit(id):
    uid = session["uid"]
    obj_id = require_valid_oid(id)
    if not obj_id:
        return redirect(url_for("crm_influencers_page"))
    try:
        form = request.form
        influencer_profiles_col.update_one({"_id": obj_id, "uid": uid}, {"$set": {
            "creator_name": (form.get("creator_name") or "").strip(),
            "instagram_handle": (form.get("instagram_handle") or "").strip(),
            "youtube_handle": (form.get("youtube_handle") or "").strip(),
            "niche": (form.get("niche") or "").strip(),
            "tier": (form.get("tier") or "nano").strip().lower(),
            "location": (form.get("location") or "").strip(),
            "relationship_status": _status_bucket("influencer", (form.get("relationship_status") or "prospect").lower()),
            "notes": (form.get("notes") or "").strip(),
            "updated_at": now(),
        }})
    except Exception:
        pass
    return redirect(url_for("crm_influencer_detail", id=id))


@app.route("/crm/influencers/<id>/log-outreach", methods=["POST"])
@require_login
def crm_influencer_log_outreach(id):
    uid = session["uid"]
    obj_id = require_valid_oid(id)
    if not obj_id:
        return redirect(url_for("crm_influencers_page"))
    try:
        profile = influencer_profiles_col.find_one({"_id": obj_id, "uid": uid}) or {}
        form = request.form
        sent_at = now()
        outreach_log_col.insert_one({
            "uid": uid,
            "target_type": "influencer",
            "target_id": id,
            "target_name": profile.get("creator_name", ""),
            "channel": (form.get("channel") or "email").strip(),
            "direction": (form.get("direction") or "outbound").strip(),
            "subject": (form.get("subject") or "").strip(),
            "body": (form.get("body") or "").strip(),
            "status": (form.get("status") or "sent").strip(),
            "sent_at": sent_at,
            "replied_at": None,
            "ai_generated": bool(form.get("ai_generated")),
            "template_used": (form.get("template_used") or "manual").strip(),
            "created_at": now(),
        })
        influencer_profiles_col.update_one({"_id": obj_id, "uid": uid}, {"$set": {"last_contacted_at": sent_at, "updated_at": now()}})
    except Exception:
        pass
    return redirect(url_for("crm_influencer_detail", id=id))


@app.route("/crm/influencers/<id>/set-reminder", methods=["POST"])
@require_login
def crm_influencer_set_reminder(id):
    uid = session["uid"]
    obj_id = require_valid_oid(id)
    if not obj_id:
        return redirect(url_for("crm_influencers_page"))
    try:
        profile = influencer_profiles_col.find_one({"_id": obj_id, "uid": uid}) or {}
        reminder_date = datetime.strptime((request.form.get("reminder_date") or ""), "%Y-%m-%d") if request.form.get("reminder_date") else now() + timedelta(days=3)
        followup_reminders_col.insert_one({
            "uid": uid,
            "target_type": "influencer",
            "target_id": id,
            "target_name": profile.get("creator_name", ""),
            "reminder_date": reminder_date,
            "note": (request.form.get("note") or "").strip(),
            "status": "pending",
            "created_at": now(),
        })
        influencer_profiles_col.update_one({"_id": obj_id, "uid": uid}, {"$set": {"next_followup_at": reminder_date, "updated_at": now()}})
    except Exception:
        pass
    return redirect(url_for("crm_influencer_detail", id=id))


@app.route("/api/crm/influencers/search")
@require_login
def api_crm_influencers_search():
    uid = session["uid"]
    q_text = (request.args.get("q") or "").strip()
    tier = (request.args.get("tier") or "").strip().lower()
    niche = (request.args.get("niche") or "").strip()
    min_followers = int(request.args.get("min_followers") or 0)
    max_rate = int(request.args.get("max_rate") or 10**12)
    q = {"uid": uid, "deleted_at": {"$exists": False}, "instagram_followers": {"$gte": min_followers}, "avg_rate_reel": {"$lte": max_rate}}
    if tier:
        q["tier"] = tier
    if niche:
        q["niche"] = {"$regex": re.escape(niche), "$options": "i"}
    if q_text:
        q["$or"] = [{"creator_name": {"$regex": re.escape(q_text), "$options": "i"}}, {"instagram_handle": {"$regex": re.escape(q_text), "$options": "i"}}, {"tags": {"$elemMatch": {"$regex": re.escape(q_text), "$options": "i"}}}]
    try:
        rows = list(influencer_profiles_col.find(q).sort("instagram_engagement_rate", DESCENDING).limit(50))
        return jsonify([{"id": str(r.get("_id")), "creator_name": r.get("creator_name"), "tier": r.get("tier"), "niche": r.get("niche"), "instagram_followers": r.get("instagram_followers"), "avg_rate_reel": r.get("avg_rate_reel")} for r in rows])
    except Exception:
        return jsonify([])


@app.route("/api/crm/influencers/<id>/generate-brief", methods=["POST"])
@require_login
def api_crm_influencer_generate_brief(id):
    uid = session["uid"]
    obj_id = require_valid_oid(id)
    if not obj_id:
        return api_error("invalid_influencer", 400)
    gate = _enforce_plan_limit(uid, "ai_brief_gen", FREE_AI_DAILY_LIMIT, period="day")
    if gate:
        return gate
    profile = influencer_profiles_col.find_one({"_id": obj_id, "uid": uid}) or {}
    user = _user_doc(uid)
    body = json_body() if request.is_json else request.form
    deliverables = (body.get("deliverables") or "1 Reel + 3 Stories")
    prompt = f"""You are a brand marketing manager writing a campaign brief for an Indian influencer. Make it specific, professional and exciting for the creator to read. Include: campaign objective, key messages, content format, dos and don'ts, timeline, and budget range.

Brand info: {user.get('brand_name', user.get('name','Brand'))}, {user.get('industry','')}, {user.get('product_description','')}
Influencer: {profile.get('creator_name','')}, {profile.get('niche','')}, {profile.get('tier','')}, instagram, {profile.get('instagram_followers',0)} followers, {profile.get('instagram_engagement_rate',0)}% engagement
Deliverables requested: {deliverables}
"""

    def generate():
        produced = ""
        if not ANTHROPIC_API_KEY:
            produced = f"Campaign Objective: Launch awareness for {user.get('brand_name','our brand')} via creator storytelling.\nKey Message: Practical value + trust + CTA to shop now.\nContent Format: {deliverables}.\nDo: keep tone native and clear. Don't: over-script the voice.\nTimeline: 10 days from confirmation. Budget: aligned with your standard rate card."
        else:
            try:
                res = requests.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": ANTHROPIC_API_KEY,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={"model": "claude-sonnet-4-6", "max_tokens": 320, "messages": [{"role": "user", "content": prompt}]},
                    timeout=40,
                )
                produced = ((((res.json() or {}).get("content") or [{}])[0] or {}).get("text", "") or "Could not generate brief.").strip()
            except Exception:
                produced = "Could not generate brief."
        for chunk in [produced[i:i+24] for i in range(0, len(produced), 24)]:
            yield f"data: {json.dumps({'chunk': chunk})}\\n\\n"
        yield "data: [DONE]\\n\\n"

    return Response(stream_with_context(generate()), mimetype="text/event-stream")


@app.route("/api/crm/influencers/discover")
@require_login
def api_crm_influencer_discover():
    uid = session["uid"]
    gate = _enforce_plan_limit(uid, "discover_feature", FREE_DISCOVER_DAILY_LIMIT, period="day")
    if gate:
        return gate
    user = _user_doc(uid)
    prefs = user.get("brand_preferences") or {}
    niche = (request.args.get("niche") or prefs.get("niche") or "").strip()
    tier = (request.args.get("tier") or prefs.get("tier") or "").strip().lower()
    location = (request.args.get("location") or prefs.get("location") or "").strip()
    max_rate = int(request.args.get("max_rate") or prefs.get("max_rate") or 10**9)
    tier_ranges = {"nano": (0, 10000), "micro": (10000, 100000), "macro": (100000, 1000000), "mega": (1000000, 10**12)}
    min_f, max_f = tier_ranges.get(tier, (0, 10**12))
    q = {
        "plan": {"$exists": True},
        "niche": {"$exists": True, "$ne": ""},
        "base_rate_reel": {"$lte": max_rate},
        "instagram_followers_num": {"$gte": min_f, "$lte": max_f},
    }
    if niche:
        q["niche"] = {"$regex": re.escape(niche), "$options": "i"}
    if location:
        q["location"] = {"$regex": re.escape(location), "$options": "i"}
    try:
        users_col.update_one({"_id": oid(uid)}, {"$set": {"brand_preferences": {"niche": niche, "tier": tier, "location": location, "max_rate": max_rate}, "updated_at": now()}})
        rows = list(users_col.find(q, {"name": 1, "username": 1, "niche": 1, "instagram_followers_num": 1, "instagram_engagement_rate": 1, "base_rate_reel": 1, "notable_brands": 1}).sort("instagram_engagement_rate", DESCENDING).limit(25))
        out = [{
            "name": r.get("name") or r.get("username"),
            "username": r.get("username"),
            "niche": r.get("niche"),
            "tier": tier if tier else "auto",
            "follower_count": r.get("instagram_followers_num", 0),
            "engagement": r.get("instagram_engagement_rate", 0),
            "base_rate": r.get("base_rate_reel", 0),
            "notable_brands": r.get("notable_brands", []),
            "is_on_dealinbox": True,
        } for r in rows]
        return jsonify(out)
    except Exception:
        return jsonify([])


@app.route("/api/crm/brands/discover")
@require_login
def api_crm_brand_discover():
    uid = session["uid"]
    gate = _enforce_plan_limit(uid, "discover_feature", FREE_DISCOVER_DAILY_LIMIT, period="day")
    if gate:
        return gate
    user = _user_doc(uid)
    niche = (user.get("niche") or "").strip()
    try:
        q = {"user_id": {"$ne": uid}}
        if niche:
            q["niche"] = {"$regex": re.escape(niche), "$options": "i"}
        rows = list(enquiries.find(q, {"brand_name": 1, "budget": 1, "budget_num": 1, "niche": 1, "created_at": 1}).sort("created_at", DESCENDING).limit(30))
        payload = [{"industry": (r.get("niche") or "General"), "budget_range": r.get("budget") or f"₹{int(r.get('budget_num') or 0):,}", "created_at": fmt_date(r.get("created_at"))} for r in rows]
        return jsonify(payload)
    except Exception:
        return jsonify([])


@app.route("/crm/discover")
@require_login
def crm_discover_page():
    return render_template("crm_discover.html")


@app.route("/crm/reminders")
@require_login
def crm_reminders_page():
    uid = session["uid"]
    overdue, due_week, upcoming = [], [], []
    now_dt = now()
    try:
        all_rows = list(followup_reminders_col.find({"uid": uid, "status": {"$in": ["pending", "snoozed"]}}).sort("reminder_date", 1))
        for r in all_rows:
            r["id"] = str(r.get("_id"))
            rd = to_naive(r.get("reminder_date")) or now_dt
            if rd < now_dt:
                overdue.append(r)
            elif rd <= now_dt + timedelta(days=7):
                due_week.append(r)
            else:
                upcoming.append(r)
    except Exception:
        pass
    return render_template("crm_reminders.html", overdue=overdue, due_week=due_week, upcoming=upcoming)


@app.route("/crm/reminders/<id>/done", methods=["POST"])
@require_login
def crm_reminder_done(id):
    uid = session["uid"]
    obj_id = require_valid_oid(id)
    if obj_id:
        try:
            followup_reminders_col.update_one({"_id": obj_id, "uid": uid}, {"$set": {"status": "done", "updated_at": now()}})
        except Exception:
            pass
    return redirect(url_for("crm_reminders_page"))


@app.route("/crm/reminders/<id>/snooze", methods=["POST"])
@require_login
def crm_reminder_snooze(id):
    uid = session["uid"]
    obj_id = require_valid_oid(id)
    if obj_id:
        try:
            followup_reminders_col.update_one({"_id": obj_id, "uid": uid}, {"$set": {"status": "snoozed", "reminder_date": now() + timedelta(days=3), "updated_at": now()}})
        except Exception:
            pass
    return redirect(url_for("crm_reminders_page"))


@app.route("/crm/outreach")
@require_login
def crm_outreach_page():
    uid = session["uid"]
    status = (request.args.get("status") or "").strip()
    channel = (request.args.get("channel") or "").strip()
    target_type = (request.args.get("target_type") or "").strip()
    q = {"uid": uid}
    if status: q["status"] = status
    if channel: q["channel"] = channel
    if target_type: q["target_type"] = target_type
    rows = []
    try:
        rows = list(outreach_log_col.find(q).sort("sent_at", DESCENDING))
    except Exception:
        pass
    return render_template("crm_outreach.html", outreach=rows)


@app.route("/api/crm/dashboard-stats")
@require_login
def api_crm_dashboard_stats():
    uid = session["uid"]
    now_dt = now()
    try:
        total_brand_contacts = brand_contacts_col.count_documents({"uid": uid, "deleted_at": {"$exists": False}})
        warm_brands = brand_contacts_col.count_documents({"uid": uid, "relationship_status": "warm", "deleted_at": {"$exists": False}})
        vip_brands = brand_contacts_col.count_documents({"uid": uid, "relationship_status": "vip", "deleted_at": {"$exists": False}})
        total_influencers = influencer_profiles_col.count_documents({"uid": uid, "deleted_at": {"$exists": False}})
        prospects = influencer_profiles_col.count_documents({"uid": uid, "relationship_status": "prospect", "deleted_at": {"$exists": False}})
        contracted = influencer_profiles_col.count_documents({"uid": uid, "relationship_status": "contracted", "deleted_at": {"$exists": False}})
        sent_30 = outreach_log_col.count_documents({"uid": uid, "direction": "outbound", "sent_at": {"$gte": now_dt - timedelta(days=30)}})
        replied_30 = outreach_log_col.count_documents({"uid": uid, "status": "replied", "sent_at": {"$gte": now_dt - timedelta(days=30)}})
        overdue_reminders = followup_reminders_col.count_documents({"uid": uid, "status": {"$in": ["pending", "snoozed"]}, "reminder_date": {"$lt": now_dt}})
        followups_this_week = followup_reminders_col.count_documents({"uid": uid, "status": {"$in": ["pending", "snoozed"]}, "reminder_date": {"$gte": now_dt, "$lte": now_dt + timedelta(days=7)}})
        pipeline_value_crm = 0
        for r in brand_contacts_col.find({"uid": uid, "deleted_at": {"$exists": False}}, {"avg_deal_value": 1}):
            pipeline_value_crm += int(r.get("avg_deal_value") or 0)
        return jsonify({
            "total_brand_contacts": total_brand_contacts,
            "warm_brands": warm_brands,
            "vip_brands": vip_brands,
            "total_influencers": total_influencers,
            "prospects": prospects,
            "contracted": contracted,
            "outreach_sent_30d": sent_30,
            "reply_rate": round((replied_30 / max(1, sent_30)) * 100, 2),
            "overdue_reminders": overdue_reminders,
            "followups_this_week": followups_this_week,
            "pipeline_value_crm": pipeline_value_crm,
        })
    except Exception:
        return jsonify({})


@app.route("/api/crm/smart-followups")
@require_login
def api_crm_smart_followups():
    uid = session["uid"]
    suggestions = []
    now_dt = now()
    try:
        stale = list(brand_contacts_col.find({"uid": uid, "relationship_status": {"$in": ["warm", "active"]}, "$or": [{"last_contacted_at": None}, {"last_contacted_at": {"$lt": now_dt - timedelta(days=14)}}]}).limit(10))
        for c in stale:
            suggestions.append({"target": c.get("brand_name"), "reason": "No outreach in 14+ days on a warm relationship."})
        overdue = list(followup_reminders_col.find({"uid": uid, "status": {"$in": ["pending", "snoozed"]}, "reminder_date": {"$lt": now_dt}}).limit(10))
        for r in overdue:
            suggestions.append({"target": r.get("target_name"), "reason": "Follow-up reminder is overdue."})
    except Exception:
        pass
    return jsonify(suggestions[:8])


@app.route("/api/notifications")
@require_login
def api_notifications():
    uid = session["uid"]
    try:
        rows = list(notifications_col.find({"uid": uid}).sort("created_at", DESCENDING).limit(10))
        unread = notifications_col.count_documents({"uid": uid, "read": False})
        return jsonify({"unread": unread, "items": [{"id": str(r.get("_id")), "title": r.get("title"), "body": r.get("body"), "link": r.get("link"), "read": r.get("read", False), "created_at": fmt_dt(r.get("created_at"))} for r in rows]})
    except Exception:
        return jsonify({"unread": 0, "items": []})


@app.route("/api/notifications/mark-all-read", methods=["POST"])
@require_login
def api_notifications_mark_read():
    uid = session["uid"]
    try:
        notifications_col.update_many({"uid": uid, "read": False}, {"$set": {"read": True, "updated_at": now()}})
    except Exception:
        pass
    return jsonify({"ok": True})


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
