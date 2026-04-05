from flask import Blueprint, jsonify, request, render_template
from flask_login import login_required

profit_bp = Blueprint("profit", __name__)


@profit_bp.get("/calculator")
@login_required
def calculator_page():
    return render_template("calculator.html")


@profit_bp.post("/api/profit/calculate")
@login_required
def calculate_profit():
    try:
        data = request.get_json(force=True)
        selling_price = float(data.get("selling_price", 0))
        cogs = float(data.get("cogs", 0))
        shipping_cost = float(data.get("shipping_cost", 0))
        ad_spend = float(data.get("ad_spend", 0))
        return_rate = float(data.get("return_rate", 0)) / 100
        monthly_volume = int(data.get("monthly_volume", 0))

        gross = selling_price - cogs - shipping_cost - ad_spend
        expected_return_loss = selling_price * return_rate
        profit_per_order = gross - expected_return_loss
        net_margin_pct = (profit_per_order / selling_price * 100) if selling_price else 0
        break_even_units = int((ad_spend / profit_per_order) + 1) if profit_per_order > 0 else 0
        monthly_profit = profit_per_order * monthly_volume

        return jsonify({
            "net_margin_pct": round(net_margin_pct, 2),
            "profit_per_order": round(profit_per_order, 2),
            "break_even_units": break_even_units,
            "monthly_profit": round(monthly_profit, 2),
        }), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400
