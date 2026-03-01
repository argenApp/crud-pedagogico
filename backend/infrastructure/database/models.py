# ═══════════════════════════════════════════════════════════════════════════════
# CAPA: INFRASTRUCTURE — Modelo ORM (SQLAlchemy)
#
# Analogía: si la Entity (Domain) es el CONCEPTO de una Tarea,
# el Model (Infrastructure) es la TABLA en la base de datos que la guarda.
#
# Son cosas distintas que viven en capas distintas:
#   domain/entities/tarea.py   ← QUÉ es una Tarea (negocio)
#   infrastructure/database/models.py ← CÓMO se guarda en SQL (técnico)
#
# Por eso se llaman diferente: "Tarea" vs "TareaModel".
# Si los mezclás en un solo archivo, perdés la separación de capas.
#
# ✅ Puede importar: SQLAlchemy, session.py (misma capa Infrastructure)
# ❌ NO puede importar: FastAPI, domain entities directamente para herencia
# ═══════════════════════════════════════════════════════════════════════════════

from sqlalchemy import Column, String, Boolean
# Column  = una columna de la tabla SQL
# String  = tipo SQL equivalente a VARCHAR
# Boolean = tipo SQL equivalente a BOOLEAN (0/1)

from infrastructure.database.session import Base
# Base es la clase DeclarativeBase definida en session.py.
# Todos los Models heredan de ella para que SQLAlchemy los "conozca".


class TareaModel(Base):
    """
    Modelo ORM de la tabla "tareas".

    ORM = Object-Relational Mapping.
    Permite trabajar con la DB usando objetos Python en lugar de SQL crudo.
    En lugar de: INSERT INTO tareas VALUES (...) — escribís: db.add(TareaModel(...))

    SQLAlchemy convierte los objetos Python a SQL automáticamente.
    """

    __tablename__ = "tareas"
    # "__tablename__" le dice a SQLAlchemy cómo se llama la tabla en la DB.
    # Este string se usa en los queries SQL generados internamente.

    id = Column(String, primary_key=True, index=True)
    # primary_key=True → esta columna es la clave primaria (identificador único).
    # index=True → SQLAlchemy crea un índice en esta columna para búsquedas más rápidas.
    # String en SQLite = TEXT — puede guardar cualquier texto, incluyendo UUIDs.

    titulo = Column(String, nullable=False)
    # nullable=False → esta columna NO puede ser NULL en la DB.
    # Si intentás insertar sin "titulo", la DB lanza un error.

    completada = Column(Boolean, nullable=False, default=False)
    # default=False → si no especificás el valor, SQLAlchemy inserta False.
    # Toda tarea nueva nace como "no completada".

    creada_en = Column(String, nullable=False)
    # Guardamos el timestamp como String (ISO 8601) por simplicidad.
    # En producción podría ser Column(DateTime) para queries de rango de fechas.
    # Para este ejemplo educativo, String es suficiente.
