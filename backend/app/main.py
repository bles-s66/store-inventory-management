from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import products

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Electronics Warehouse API",
    version="1.0.0",
    description="REST API для учета товаров магазина электроники"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/api")