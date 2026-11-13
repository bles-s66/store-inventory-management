
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db


router = APIRouter(
    prefix="/products",
    tags=["Товары"]
)


NOT_FOUND_RESPONSE = {
    404: {
        "description": "Товар с указанным идентификатором не найден",
        "content": {
            "application/json": {
                "example": {
                    "detail": "Товар не найден"
                }
            }
        }
    }
}


# GET — получить список всех товаров

@router.get(
    "/",
    response_model=list[schemas.Product],
    include_in_schema=False
)
@router.get(
    "",
    response_model=list[schemas.Product],
    summary="Получить список товаров"
)
def read_products(db: Session = Depends(get_db)):
    return crud.get_products(db)


# POST — создать новый товар

@router.post(
    "/",
    response_model=schemas.Product,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False
)
@router.post(
    "",
    response_model=schemas.Product,
    status_code=status.HTTP_201_CREATED,
    summary="Добавить товар"
)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db)
):
    return crud.create_product(db, product)


# GET — получить один товар по ID

@router.get(
    "/{product_id}",
    response_model=schemas.Product,
    summary="Получить товар по ID",
    responses=NOT_FOUND_RESPONSE
)
def read_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    db_product = crud.get_product(db, product_id)

    if db_product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Товар не найден"
        )

    return db_product


# PATCH — изменить данные товара

@router.patch(
    "/{product_id}",
    response_model=schemas.Product,
    summary="Частично обновить товар",
    responses=NOT_FOUND_RESPONSE
)
def update_product(
    product_id: int,
    product: schemas.ProductUpdate,
    db: Session = Depends(get_db)
):
    db_product = crud.update_product(
        db,
        product_id,
        product
    )

    if db_product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Товар не найден"
        )

    return db_product


# DELETE — удалить товар

@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить товар",
    responses=NOT_FOUND_RESPONSE
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    success = crud.delete_product(
        db,
        product_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Товар не найден"
        )

    return None
