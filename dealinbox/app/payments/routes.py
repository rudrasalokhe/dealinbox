from datetime import datetime
import hmac, hashlib, json
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
import razorpay
from app import db
from app.models import oid
from config import Config

bp = Blueprint('payments', __name__, url_prefix='/payments')


@bp.route('/link', methods=['POST'])
@login_required
def create_payment_link():
    p = request.get_json() or request.form
    client = razorpay.Client(auth=(Config.RAZORPAY_KEY_ID, Config.RAZORPAY_KEY_SECRET))
    data = {'amount': int(float(p['amount']) * 100), 'currency': 'INR', 'description': p.get('description', 'Invoice payment')}
    link = client.payment_link.create(data=data)
    doc = {'razorpay_link_id': link['id'], 'amount': float(p['amount']), 'description': p.get('description', ''), 'status': 'created', 'invoice_id': oid(p['invoice_id']), 'org_id': oid(current_user.org_id), 'created_at': datetime.utcnow(), 'paid_at': None}
    db.payments.insert_one(doc)
    return jsonify({'url': link.get('short_url'), 'id': link['id']})


@bp.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Razorpay-Signature', '')
    body = request.get_data()
    expected = hmac.new(Config.RAZORPAY_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return jsonify({'error': 'invalid signature'}), 400
    payload = json.loads(body.decode())
    link_id = payload.get('payload', {}).get('payment_link', {}).get('entity', {}).get('id')
    pay = db.payments.find_one({'razorpay_link_id': link_id})
    if not pay:
        return jsonify({'ok': True})
    db.payments.update_one({'_id': pay['_id']}, {'$set': {'status': 'paid', 'paid_at': datetime.utcnow()}})
    db.invoices.update_one({'_id': pay['invoice_id']}, {'$set': {'status': 'paid'}})
    db.activity_logs.insert_one({'deal_id': None, 'org_id': pay['org_id'], 'user_id': None, 'action': 'payment_received', 'metadata': {'link_id': link_id}, 'timestamp': datetime.utcnow()})
    return jsonify({'ok': True})
