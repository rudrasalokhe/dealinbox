import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/dealsinbox")
    MONGO_DBNAME = os.getenv("MONGO_DBNAME", "dealsinbox")
    PER_PAGE = 20


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}
