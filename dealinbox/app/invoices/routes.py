from datetime import datetime
from flask import Blueprint, request, jsonify, render_template, Response
from flask_login import login_required, current_user
from weasyprint import HTML
from twilio.rest import Client
from app import db
from app.models import oid, org_filter
from config import Config

bp = Blueprint('invoices', __name__, url_prefix='/invoices')


@bp.route('/new', methods=['POST'])
@login_required
def create_invoice():
    p = request.get_json() or request.form
    contact = db.contacts.find_one({'_id': oid(p['contact_id']), 'org_id': oid(current_user.org_id)})
    org = db.orgs.find_one({'_id': oid(current_user.org_id)})
    line_items = p.get('line_items', [])
    if isinstance(line_items, str):
        line_items = [{'desc': 'Service', 'qty': 1, 'rate': float(p.get('amount', 0))}]
    subtotal = sum(float(i['qty']) * float(i['rate']) for i in line_items)
    if (contact or {}).get('city') == org.get('city'):
        cgst = sgst = round(subtotal * 0.09, 2); igst = 0
    else:
        cgst = sgst = 0; igst = round(subtotal * 0.18, 2)
    total = subtotal + cgst + sgst + igst
    inv = {'inv_number': f"INV-{datetime.utcnow().year}-{db.invoices.count_documents(org_filter()) + 1:03d}", 'deal_id': oid(p['deal_id']), 'org_id': oid(current_user.org_id), 'line_items': line_items,
           'cgst': cgst, 'sgst': sgst, 'igst': igst, 'total': total, 'status': 'draft', 'created_at': datetime.utcnow()}
    iid = db.invoices.insert_one(inv).inserted_id
    return jsonify({'id': str(iid), 'total': total})


@bp.route('/<invoice_id>/pdf')
@login_required
def pdf(invoice_id):
    inv = db.invoices.find_one(org_filter({'_id': oid(invoice_id)}))
    html = render_template('invoices/pdf.html', inv=inv)
    pdf_bytes = HTML(string=html).write_pdf()
    return Response(pdf_bytes, mimetype='application/pdf', headers={'Content-Disposition': f'inline; filename={inv["inv_number"]}.pdf'})


@bp.route('/<invoice_id>/send-whatsapp', methods=['POST'])
@login_required
def send_invoice_whatsapp(invoice_id):
    inv = db.invoices.find_one(org_filter({'_id': oid(invoice_id)}))
    if not inv:
        return jsonify({'error': 'Not found'}), 404
    deal = db.deals.find_one({'_id': inv['deal_id'], 'org_id': oid(current_user.org_id)})
    contact = db.contacts.find_one({'_id': deal['contact_id'], 'org_id': oid(current_user.org_id)}) if deal else None
    if contact and Config.TWILIO_ACCOUNT_SID:
        Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN).messages.create(
            from_=f"whatsapp:{Config.TWILIO_WHATSAPP_NUMBER}", to=f"whatsapp:{contact['mobile']}",
            body=f"Invoice {inv['inv_number']}: {Config.BASE_URL}/invoices/{invoice_id}/pdf"
        )
    db.invoices.update_one({'_id': inv['_id']}, {'$set': {'status': 'sent'}})
    return jsonify({'sent': True})
