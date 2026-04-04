import csv
from io import StringIO
from flask import Blueprint, render_template, request, redirect, url_for, Response
from flask_login import login_required, current_user
from app import db
from app.models import Customer, Booking, Invoice

bp = Blueprint('customers', __name__)

@bp.route('/customers')
@login_required
def list_customers():
    q = Customer.query.filter_by(owner_id=current_user.id)
    if request.args.get('q'): q = q.filter(Customer.name.ilike(f"%{request.args['q']}%"))
    customers = q.order_by(Customer.created_at.desc()).paginate(page=request.args.get('page',1,type=int), per_page=20)
    return render_template('customers/list.html', customers=customers)

@bp.route('/customers/new', methods=['GET','POST'])
@bp.route('/customers/<int:id>/edit', methods=['GET','POST'])
@login_required
def form(id=None):
    c = Customer.query.get_or_404(id) if id else None
    if request.method=='POST':
        c = c or Customer(owner_id=current_user.id)
        for f in ['name','phone','email','address','gstin','notes']:
            setattr(c,f,request.form.get(f))
        db.session.add(c); db.session.commit()
        return redirect(url_for('customers.list_customers'))
    return render_template('customers/form.html', customer=c)

@bp.route('/customers/<int:id>')
@login_required
def detail(id):
    c=Customer.query.get_or_404(id)
    return render_template('customers/profile.html', customer=c, bookings=Booking.query.filter_by(customer_id=id).all(), invoices=Invoice.query.filter_by(customer_id=id).all())

@bp.route('/customers/export')
@login_required
def export():
    out=StringIO(); w=csv.writer(out); w.writerow(['Name','Phone','Email'])
    for c in Customer.query.filter_by(owner_id=current_user.id).all(): w.writerow([c.name,c.phone,c.email])
    return Response(out.getvalue(), mimetype='text/csv', headers={'Content-Disposition':'attachment; filename=customers.csv'})
