from flask import Blueprint, render_template, request, redirect, url_for
from flask_login import login_required, current_user
from app import db
from app.models import Expense

bp = Blueprint('expenses', __name__)

@bp.route('/expenses')
@login_required
def list_expenses():
    ex=Expense.query.filter_by(owner_id=current_user.id).order_by(Expense.date.desc()).paginate(page=request.args.get('page',1,type=int), per_page=20)
    return render_template('expenses/list.html', expenses=ex)

@bp.route('/expenses/new', methods=['GET','POST'])
@bp.route('/expenses/<int:id>/edit', methods=['GET','POST'])
@login_required
def form(id=None):
    e=Expense.query.get_or_404(id) if id else None
    if request.method=='POST':
        e=e or Expense(owner_id=current_user.id)
        e.category=request.form['category']; e.description=request.form['description']; e.amount=float(request.form['amount']); e.date=request.form['date']
        db.session.add(e); db.session.commit(); return redirect(url_for('expenses.list_expenses'))
    return render_template('expenses/list.html', expenses=Expense.query.filter_by(owner_id=current_user.id).paginate(page=1, per_page=20), edit=e)

@bp.delete('/expenses/<int:id>')
@login_required
def delete(id):
    db.session.delete(Expense.query.get_or_404(id)); db.session.commit(); return ('',204)
