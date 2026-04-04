from flask import Blueprint, request, jsonify
from flask_login import login_required
from twilio.rest import Client
from config import Config

bp = Blueprint('whatsapp', __name__, url_prefix='/whatsapp')

@bp.route('/send', methods=['POST'])
@login_required
def send_message():
    p = request.get_json() or request.form
    if not Config.TWILIO_ACCOUNT_SID:
        return jsonify({'queued': False, 'reason': 'twilio_not_configured'})
    Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN).messages.create(
        from_=f"whatsapp:{Config.TWILIO_WHATSAPP_NUMBER}", to=f"whatsapp:{p['to']}", body=p['message']
    )
    return jsonify({'queued': True})
