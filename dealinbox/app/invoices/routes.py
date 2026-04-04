from datetime import date
from flask import Blueprint, render_template, request, redirect, url_for, flash, make_response
from flask_login import login_required, current_user
from app import db
from app.models import Invoice, InvoiceItem, Customer
from app.utils import invoice_number

bp = Blueprint('invoices', __name__)


@bp.route('/invoices')
@login_required
def list_invoices():
    q = Invoice.query.filter_by(owner_id=current_user.id)
    if request.args.get('status'): q = q.filter_by(status=request.args['status'])
    invoices = q.order_by(Invoice.created_at.desc()).paginate(page=request.args.get('page', 1, type=int), per_page=20)
    return render_template('invoices/list.html', invoices=invoices)


@bp.route('/invoices/new', methods=['GET', 'POST'])
@bp.route('/invoices/<int:id>/edit', methods=['GET', 'POST'])
@login_required
def form(id=None):
    inv = Invoice.query.get_or_404(id) if id else None
    if request.method == 'POST':
        i = inv or Invoice(owner_id=current_user.id, invoice_number=invoice_number((Invoice.query.count() + 1)))
        i.customer_id = int(request.form['customer_id']); i.date = date.fromisoformat(request.form['date']); i.due_date = date.fromisoformat(request.form['due_date'])
        i.subtotal = float(request.form['subtotal']); i.discount = float(request.form.get('discount', 0)); i.gst_rate = float(request.form.get('gst_rate', 0))
        base = i.subtotal - i.discount; i.gst_amount = base * i.gst_rate / 100; i.total = base + i.gst_amount; i.status = request.form.get('status', 'draft'); i.notes = request.form.get('notes', '')
        db.session.add(i); db.session.commit();
        if request.form.get('desc'):
            db.session.add(InvoiceItem(invoice_id=i.id, description=request.form['desc'], quantity=float(request.form.get('qty', 1)), unit_price=float(request.form.get('unit', i.subtotal)), amount=float(request.form.get('subtotal', i.subtotal))))
            db.session.commit()
        return redirect(url_for('invoices.list_invoices'))
    return render_template('invoices/form.html', invoice=inv, customers=Customer.query.filter_by(owner_id=current_user.id).all())


@bp.route('/invoices/<int:id>')
@login_required
def detail(id):
    return render_template('invoices/detail.html', invoice=Invoice.query.get_or_404(id), items=InvoiceItem.query.filter_by(invoice_id=id).all())


@bp.route('/invoices/<int:id>/pdf')
@login_required
def pdf(id):
    html = render_template('invoices/pdf.html', invoice=Invoice.query.get_or_404(id), items=InvoiceItem.query.filter_by(invoice_id=id).all())
    resp = make_response(html); resp.headers['Content-Type'] = 'text/html'; return resp


@bp.post('/invoices/<int:id>/send')
@login_required
def send(id):
    i = Invoice.query.get_or_404(id); i.status = 'sent'; db.session.commit(); flash('Invoice sent via WhatsApp queue', 'success'); return redirect(url_for('invoices.detail', id=id))


@bp.post('/invoices/<int:id>/mark-paid')
@login_required
def mark_paid(id):
    i = Invoice.query.get_or_404(id); i.paid_amount = i.total; i.status = 'paid'; db.session.commit(); return redirect(url_for('invoices.detail', id=id))


@bp.post('/invoices/<int:id>/payment')
@login_required
def payment(id):
    i = Invoice.query.get_or_404(id); i.paid_amount += float(request.form['amount']); i.status = 'paid' if i.paid_amount >= i.total else 'sent'; db.session.commit(); return redirect(url_for('invoices.detail', id=id))
