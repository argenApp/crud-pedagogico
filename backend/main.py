# ═══════════════════════════════════════════════════════════════════════════════
# PUNTO DE ENTRADA — main.py
#
# Este es el primer archivo que ejecuta FastAPI al iniciarse.
# Su única responsabilidad: crear la app, configurar CORS y registrar los routers.
#
# CORS = Cross-Origin Resource Sharing.
# El browser bloquea por defecto requests entre orígenes distintos
# (ej: frontend en localhost:5173 hablando con backend en localhost:8000).
# CORS le dice al backend que acepte esas solicitudes.
# ═══════════════════════════════════════════════════════════════════════════════

from fastapi import FastAPI
# FastAPI: el framework web principal.

from fastapi.middleware.cors import CORSMiddleware
# Middleware de CORS — se ejecuta antes y después de cada request.

from infrastructure.database.session import engine, Base
# engine: la conexión a SQLite.
# Base: la clase base de la que heredan los Models. SQLAlchemy la usa para crear tablas.

from infrastructure.database.models import TareaModel  # noqa: F401
# Importamos el Model para que SQLAlchemy "lo vea" al crear las tablas.
# "noqa: F401" silencia el warning de "import no usado" — lo usamos indirectamente.

from presentation.api.v1.endpoints.tareas_endpoint import router as tareas_router
# El router con todos los endpoints de /api/v1/tareas/
# Vive en presentation/api/v1/endpoints/ — la capa que "habla HTTP".
# El prefijo "v1" versiona la API para no romper clientes al evolucionar el contrato.


# ─────────────────────────────────────────────────────────────────────────────
# Crear tablas en la DB (solo si no existen)
# ─────────────────────────────────────────────────────────────────────────────

Base.metadata.create_all(bind=engine)
# "metadata" contiene la definición de todas las tablas (de todos los Models que
# heredaron de Base).
# create_all() ejecuta los CREATE TABLE IF NOT EXISTS para cada tabla.
# Si la tabla ya existe, no hace nada — no borra datos.
# En producción, esto se reemplaza por Alembic (sistema de migraciones).


# ─────────────────────────────────────────────────────────────────────────────
# Crear la aplicación FastAPI
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="CRUD Pedagógico — Clean Architecture",
    description="API de ejemplo para aprender Clean Architecture con FastAPI.",
    version="1.0.0",
    # Estos metadatos aparecen en la documentación Swagger (/docs).
)


# ─────────────────────────────────────────────────────────────────────────────
# Configurar CORS
# ─────────────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    # Lista de orígenes permitidos. "http://localhost:5173" es el servidor de Vite.
    # En producción: ["https://mi-app.com"]
    # Para desarrollo sin restricciones: ["*"] (inseguro en producción)

    allow_credentials=True,
    # Permite cookies y headers de autenticación en los requests.

    allow_methods=["*"],
    # Permite todos los métodos HTTP: GET, POST, PUT, DELETE, PATCH, OPTIONS.
    # En producción podrías restringirlo: ["GET", "POST", "PUT", "DELETE"]

    allow_headers=["*"],
    # Permite todos los headers. En producción: ["Content-Type", "Authorization"]
)


# ─────────────────────────────────────────────────────────────────────────────
# Registrar los routers
# ─────────────────────────────────────────────────────────────────────────────

app.include_router(tareas_router)
# Registra el router de tareas. Todos sus endpoints quedan disponibles:
#   GET    /api/v1/tareas/      → listar tareas
#   POST   /api/v1/tareas/      → crear tarea
#   GET    /api/v1/tareas/{id}  → obtener tarea por ID
#   PUT    /api/v1/tareas/{id}  → actualizar tarea
#   DELETE /api/v1/tareas/{id}  → eliminar tarea


# ─────────────────────────────────────────────────────────────────────────────
# Endpoint de health check (opcional pero útil)
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    """
    GET / — Health check básico.
    Útil para verificar que el servidor está activo.
    """
    return {"mensaje": "API de Tareas activa ✓", "docs": "/docs"}
    # FastAPI serializa el dict a JSON automáticamente.
    # Al visitar http://localhost:8000/ verás: {"mensaje": "API de Tareas activa ✓", ...}

# ─────────────────────────────────────────────────────────────────────────────
# Para ejecutar:
#   cd backend/
#   pip install -r requirements.txt
#   uvicorn main:app --reload
#
# --reload: reinicia el servidor automáticamente al guardar cambios.
# Útil en desarrollo. No usar en producción.
#
# Documentación interactiva: http://localhost:8000/docs
# ─────────────────────────────────────────────────────────────────────────────
