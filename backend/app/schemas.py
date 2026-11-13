
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductBase(BaseModel):
    name: str = Field(
        min_length=3,
        max_length=60,
        description="Название товара"
    )
    category: str = Field(
        min_length=1,
        max_length=100,
        description="Категория товара"
    )
    price: float = Field(
        ge=1,
        le=1_000_000,
        allow_inf_nan=False,
        description="Цена в рублях"
    )
    quantity: int = Field(
        ge=0,
        le=10_000,
        description="Количество на складе"
    )
    description: str | None = Field(
        default=None,
        max_length=200
    )
    image_url: str | None = Field(
        default=None,
        max_length=500
    )

    @field_validator("name", "category", mode="before")
    @classmethod
    def strip_required_text(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value


class ProductCreate(ProductBase):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "Ноутбук HP Pavilion",
                    "category": "Электроника",
                    "price": 45000,
                    "quantity": 10,
                    "description": "Ноутбук для работы и учёбы",
                    "image_url": "https://example.com/laptop.jpg"
                }
            ]
        }
    )


class ProductUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=3,
        max_length=60
    )
    category: str | None = Field(
        default=None,
        min_length=1,
        max_length=100
    )
    price: float | None = Field(
        default=None,
        ge=1,
        le=1_000_000,
        allow_inf_nan=False
    )
    quantity: int | None = Field(
        default=None,
        ge=0,
        le=10_000
    )
    description: str | None = Field(
        default=None,
        max_length=200
    )
    image_url: str | None = Field(
        default=None,
        max_length=500
    )

    @field_validator(
        "name",
        "category",
        "price",
        "quantity",
        mode="before"
    )
    @classmethod
    def reject_null_for_required_fields(cls, value):
        if value is None:
            raise ValueError(
                "Обязательное поле нельзя устанавливать в null"
            )

        if isinstance(value, str):
            return value.strip()

        return value

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "price": 42000,
                    "quantity": 8
                }
            ]
        }
    )


class Product(ProductBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "name": "Ноутбук HP Pavilion",
                    "category": "Электроника",
                    "price": 45000,
                    "quantity": 10,
                    "description": "Ноутбук для работы и учёбы",
                    "image_url": "https://example.com/laptop.jpg",
                    "created_at": "2026-11-13T12:00:00"
                }
            ]
        }
    )
