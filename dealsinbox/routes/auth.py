from datetime import datetime
from bson import ObjectId
from flask import Blueprint, request, jsonify, redirect, url_for, render_template, flash
from flask_login import login_user, logout_user, current_user

from db import mongo
from app import bcrypt, User

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.get("/login")
def login_page():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.dashboard_page"))
    return render_template("login.html")


@auth_bp.get("/register")
def register_page():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.dashboard_page"))
    return render_template("register.html")


@auth_bp.post("/login")
def login():
    try:
        data = request.get_json(silent=True) or request.form
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        remember = str(data.get("remember", "false")).lower() in ["true", "1", "on"]

        user = mongo.db.users.find_one({"email": email})
        if not user or not bcrypt.check_password_hash(user["password_hash"], password):
            if request.is_json:
                return jsonify({"error": "Invalid credentials"}), 401
            flash("Invalid credentials", "error")
            return redirect(url_for("auth.login_page"))

        login_user(User(user), remember=remember)
        if request.is_json:
            return jsonify({"message": "Logged in"}), 200
        return redirect(url_for("dashboard.dashboard_page"))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@auth_bp.post("/register")
def register():
    try:
        data = request.get_json(silent=True) or request.form
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        business_name = (data.get("business_name") or "").strip()

        if not email or not password or not business_name:
            return jsonify({"error": "email, password, business_name are required"}), 400

        if mongo.db.users.find_one({"email": email}):
            return jsonify({"error": "Email already exists"}), 400

        doc = {
            "email": email,
            "password_hash": bcrypt.generate_password_hash(password).decode("utf-8"),
            "business_name": business_name,
            "created_at": datetime.utcnow(),
        }
        inserted = mongo.db.users.insert_one(doc)
        user = mongo.db.users.find_one({"_id": ObjectId(inserted.inserted_id)})
        login_user(User(user))

        if request.is_json:
            return jsonify({"message": "Registered successfully"}), 201
        return redirect(url_for("dashboard.dashboard_page"))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@auth_bp.get("/logout")
def logout():
    try:
        logout_user()
        return redirect(url_for("auth.login_page"))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
