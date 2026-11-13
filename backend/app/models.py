
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text
)

from .database import Base


class Product(Base):
    __tablename__ = "products"

    __table_args__ = (
        CheckConstraint(
            "price >= 1 AND price <= 1000000",
            name="check_product_price"
        ),
        CheckConstraint(
            "quantity >= 0 AND quantity <= 10000",
            name="check_product_quantity"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(200),
        nullable=False
    )

    category = Column(
        String(100),
        nullable=False
    )

    price = Column(
        Float,
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False,
        default=0
    )

    description = Column(
        Text,
        nullable=True
    )

    image_url = Column(
        String(500),
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )
