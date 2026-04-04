from datetime import datetime
from flask import Blueprint, request, redirect, url_for, jsonify
from flask_login import login_required, current_user
from twilio.rest import Client
from app import db
from app.models import oid, org_filter
from config import Config

bp = Blueprint('deals', __name__, url_prefix='/deals')


def _log(deal_id, action, metadata=None):
    db.activity_logs.insert_one({'deal_id': oid(deal_id), 'org_id': oid(current_user.org_id), 'user_id': oid(current_user.id), 'action': action, 'metadata': metadata or {}, 'timestamp': datetime.utcnow()})


def _whatsapp_send(to_mobile, text):
    if not (Config.TWILIO_ACCOUNT_SID and Config.TWILIO_AUTH_TOKEN and Config.TWILIO_WHATSAPP_NUMBER and to_mobile):
        return
    client = Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
    client.messages.create(from_=f"whatsapp:{Config.TWILIO_WHATSAPP_NUMBER}", to=f"whatsapp:{to_mobile}", body=text)


@bp.route('/', methods=['GET'])
@login_required
def list_deals():
    rows = list(db.deals.find(org_filter()).sort('updated_at', -1))
    return jsonify(rows)


@bp.route('/new', methods=['POST'])
@login_required
def create_deal():
    p = request.get_json() or request.form
    payload = {'title': p['title'], 'value': float(p.get('value', 0)), 'stage': p.get('stage', 'Lead'), 'contact_id': oid(p['contact_id']), 'org_id': oid(current_user.org_id), 'assigned_to': p.get('assigned_to'), 'source': p.get('source', ''), 'created_at': datetime.utcnow(), 'updated_at': datetime.utcnow()}
    r = db.deals.insert_one(payload)
    _log(r.inserted_id, 'created', {'title': payload['title']})
    return jsonify({'id': str(r.inserted_id)})


@bp.route('/<deal_id>/stage', methods=['POST'])
@login_required
def change_stage(deal_id):
    stage = (request.get_json() or request.form)['stage']
    db.deals.update_one(org_filter({'_id': oid(deal_id)}), {'$set': {'stage': stage, 'updated_at': datetime.utcnow()}})
    _log(deal_id, 'stage_change', {'stage': stage})
    deal = db.deals.find_one(org_filter({'_id': oid(deal_id)}))
    contact = db.contacts.find_one({'_id': deal['contact_id'], 'org_id': oid(current_user.org_id)}) if deal else None
    if contact:
        _whatsapp_send(contact.get('mobile'), f"Hi {contact.get('name')}, your deal '{deal.get('title')}' moved to {stage}.")
    return redirect(url_for('deals.list_deals'))
