from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models import oid

bp = Blueprint('settings', __name__, url_prefix='/settings')

@bp.route('/org', methods=['GET', 'POST'])
@login_required
def org_settings():
    if request.method == 'POST':
        p = request.get_json() or request.form
        fields = {k: p[k] for k in ['name', 'gst_no', 'razorpay_key_id', 'razorpay_key_secret', 'twilio_sid', 'twilio_token', 'twilio_whatsapp_number', 'city', 'industry', 'plan'] if k in p}
        db.orgs.update_one({'_id': oid(current_user.org_id)}, {'$set': fields})
    return jsonify(db.orgs.find_one({'_id': oid(current_user.org_id)}, {'_id': 0}))
