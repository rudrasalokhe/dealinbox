from flask import Blueprint, render_template
from flask_login import login_required
bp = Blueprint('settings', __name__)

@bp.route('/settings', methods=['GET','POST'])
@bp.route('/settings/business', methods=['GET','POST'])
@bp.route('/settings/invoice', methods=['GET','POST'])
@bp.route('/settings/notifications', methods=['GET','POST'])
@bp.route('/settings/integrations', methods=['GET','POST'])
@login_required
def index(): return render_template('settings/index.html')
