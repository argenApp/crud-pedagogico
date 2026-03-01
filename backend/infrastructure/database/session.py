# ═══════════════════════════════════════════════════════════════════════════════
# CAPA: INFRASTRUCTURE — Configuración de Base de Datos
#
# Analogía: este archivo es el "cable" que conecta nuestro sistema a SQLite.
# Puede reemplazarse por PostgreSQL, MySQL, o cualquier otra DB cambiando
# solo la URL de conexión — sin tocar Domain ni Application.
#
# ✅ Puede importar: SQLAlchemy (framework de DB), Python estándar
# ❌ NO puede importar: FastAPI routers, domain entities directamente (solo vía ports)
# ═══════════════════════════════════════════════════════════════════════════════

from sqlalchemy import create_engine
# SQLAlchemy: librería Python para interactuar con bases de datos relacionales.
# "create_engine" configura la conexión a la DB.

from sqlalchemy.orm import sessionmaker, DeclarativeBase
# sessionmaker: fábrica de sesiones de base de datos.
# Una "sesión" es la unidad de trabajo con la DB: agrupa queries y commits.
# DeclarativeBase: clase base para definir modelos ORM (los "Model" de Infrastructure).

# ─────────────────────────────────────────────────────────────────────────────
# Configuración de la conexión
# ─────────────────────────────────────────────────────────────────────────────

DATABASE_URL = "sqlite:///./tareas.db"
# "sqlite:///" = protocolo de SQLite (base de datos en archivo)
# "./tareas.db" = archivo en el directorio donde se ejecuta el servidor.
# Al correr "uvicorn main:app", se crea "tareas.db" en backend/.
# Para PostgreSQL sería: "postgresql://user:pass@localhost:5432/tareas"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    # "check_same_thread": False es necesario para SQLite + FastAPI.
    # SQLite por defecto solo permite acceso desde el hilo que lo creó.
    # FastAPI usa múltiples hilos, así que debemos desactivar esa restricción.
    # PostgreSQL no necesita esto — solo SQLite.
)
# "engine" es la conexión a la base de datos. Es el "motor" que ejecuta queries.

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# sessionmaker crea una "fábrica" de sesiones.
# autocommit=False → cada operación necesita un commit() explícito (control manual).
# autoflush=False  → no sincroniza automáticamente — lo hacemos cuando corresponde.
# bind=engine      → cada sesión creada usa el engine definido arriba.


# ─────────────────────────────────────────────────────────────────────────────
# Base para los modelos ORM
# ─────────────────────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    """
    Clase base de la que heredan todos los Models de Infrastructure.

    Un "Model" en SQLAlchemy (Infrastructure) es DISTINTO a una "Entity" en Domain:
      - Entity (Domain): define QUÉ es el objeto en el negocio (sin DB)
      - Model (Infrastructure): define CÓMO se guarda ese objeto en SQL (con DB)

    Analogía:
      - Entity = el concepto "casa" (tiene habitaciones, precio, metros cuadrados)
      - Model  = el plano de construcción con las medidas exactas y los materiales
    """
    pass
    # "pass" en Python = cuerpo vacío (nada que agregar aquí).


# ─────────────────────────────────────────────────────────────────────────────
# Función generadora de sesión (para inyección de dependencias en FastAPI)
# ─────────────────────────────────────────────────────────────────────────────

def get_db():
    """
    Generador que provee una sesión de DB y garantiza que se cierre al terminar.

    FastAPI usa esta función como "dependencia" en los endpoints.
    "yield" convierte esta función en un generador:
      1. Crea la sesión (db = SessionLocal())
      2. La provee al endpoint (yield db)
      3. Al terminar el endpoint (con éxito o error), ejecuta el finally
      4. Cierra la sesión (db.close())

    Esto garantiza que SIEMPRE se cierre la sesión, aunque haya un error.
    """
    db = SessionLocal()
    # Crea una nueva sesión de base de datos.
    try:
        yield db
        # "yield" pausa la función aquí y entrega "db" al que lo pide (el endpoint).
        # Cuando el endpoint termina, Python vuelve aquí para ejecutar el finally.
    finally:
        db.close()
        # .close() devuelve la conexión al pool — siempre se ejecuta, incluso con errores.
