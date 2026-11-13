
import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parent / "database.db"


def main():
    if not DB_PATH.is_file():
        print(f"База не найдена: {DB_PATH}")
        return

    with sqlite3.connect(DB_PATH) as db:
        row = db.execute(
            "SELECT sql FROM sqlite_master "
            "WHERE type = 'table' AND name = 'products'"
        ).fetchone()

        if row is None:
            print("Таблица products не найдена.")
            return

        if (
            "check_product_price" in row[0]
            and "check_product_quantity" in row[0]
        ):
            print("Ограничения уже добавлены.")
            return

        try:
            db.execute("BEGIN IMMEDIATE")

            db.execute("""
                CREATE TABLE products_new (
                    id INTEGER PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    price FLOAT NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 0,
                    description TEXT,
                    image_url VARCHAR(500),
                    created_at DATETIME NOT NULL,

                    CONSTRAINT check_product_price
                        CHECK (price >= 1 AND price <= 1000000),

                    CONSTRAINT check_product_quantity
                        CHECK (quantity >= 0 AND quantity <= 10000)
                )
            """)

            db.execute("""
                INSERT INTO products_new (
                    id, name, category, price, quantity,
                    description, image_url, created_at
                )
                SELECT
                    id, name, category, price, quantity,
                    description, image_url, created_at
                FROM products
            """)

            db.execute("DROP TABLE products")
            db.execute(
                "ALTER TABLE products_new RENAME TO products"
            )
            db.execute(
                "CREATE INDEX ix_products_id ON products (id)"
            )

        except sqlite3.Error as error:
            db.rollback()
            print(
                f"Не удалось обновить БД, изменения отменены: {error}"
            )
            return

        db.commit()
        print("Ограничения добавлены. Товары сохранены.")


if __name__ == "__main__":
    main()
