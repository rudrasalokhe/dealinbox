from datetime import datetime
from bson import ObjectId
from flask import Blueprint, jsonify, request, render_template
from flask_login import login_required, current_user

from dealsinbox.db import mongo

inventory_bp = Blueprint("inventory", __name__)


@inventory_bp.get("/inventory")
@login_required
def inventory_page():
    return render_template("inventory.html")


@inventory_bp.get("/api/inventory")
@login_required
def list_products():
    try:
        rows = list(mongo.db.products.find({"user_id": ObjectId(current_user.id)}).sort("created_at", -1))
        for r in rows:
            r["_id"] = str(r["_id"])
            r["user_id"] = str(r["user_id"])
        return jsonify(rows), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@inventory_bp.post("/api/inventory")
@login_required
def create_product():
    try:
        data = request.get_json(force=True)
        doc = {
            "user_id": ObjectId(current_user.id),
            "sku": data["sku"],
            "name": data["name"],
            "category": data.get("category", ""),
            "cost_price": float(data["cost_price"]),
            "selling_price": float(data["selling_price"]),
            "stock_count": int(data.get("stock_count", 0)),
            "low_stock_threshold": int(data.get("low_stock_threshold", 10)),
            "created_at": datetime.utcnow(),
        }
        result = mongo.db.products.insert_one(doc)
        return jsonify({"id": str(result.inserted_id)}), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@inventory_bp.patch("/api/inventory/<product_id>")
@login_required
def update_product(product_id):
    try:
        updates = request.get_json(force=True)
        updates.pop("_id", None)
        result = mongo.db.products.update_one(
            {"_id": ObjectId(product_id), "user_id": ObjectId(current_user.id)},
            {"$set": updates},
        )
        if result.matched_count == 0:
            return jsonify({"error": "Product not found"}), 404
        return jsonify({"message": "updated"}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


@inventory_bp.delete("/api/inventory/<product_id>")
@login_required
def delete_product(product_id):
    try:
        result = mongo.db.products.delete_one({"_id": ObjectId(product_id), "user_id": ObjectId(current_user.id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Product not found"}), 404
        return jsonify({"message": "deleted"}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400
