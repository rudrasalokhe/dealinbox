import os


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret')
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/bharatstack')
    DB_NAME = os.getenv('DB_NAME', 'bharatstack')

    TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
    TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
    TWILIO_SMS_NUMBER = os.getenv('TWILIO_SMS_NUMBER', '')
    TWILIO_WHATSAPP_NUMBER = os.getenv('TWILIO_WHATSAPP_NUMBER', '')

    RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', '')
    RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', '')
    RAZORPAY_WEBHOOK_SECRET = os.getenv('RAZORPAY_WEBHOOK_SECRET', '')

    BASE_URL = os.getenv('BASE_URL', 'http://localhost:5000')
