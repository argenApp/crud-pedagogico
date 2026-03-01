# ═══════════════════════════════════════════════════════════════════════════════
# CAPA: ADAPTERS — Schemas Pydantic (DTOs HTTP)
#
# Analogía: la "aduana" del sistema. Todo lo que entra (request) y sale
# (response) por HTTP pasa por aquí para ser validado y serializado.
#
# Aquí viven los DTOs de la API:
#   INPUT DTO  (TareaCreateRequest, TareaUpdateRequest) ← lo que llega del cliente
#   OUTPUT DTO (TareaResponse)                          ← lo que devuelve la API
#
# La diferencia entre INPUT y OUTPUT:
#   INPUT  → solo los campos que el USUARIO envía (sin id, sin creada_en — el backend los genera)
#   OUTPUT → los campos COMPLETOS que el cliente recibe (con id, con creada_en)
#
# ✅ Puede importar: Pydantic (librería de validación)
# ❌ NO puede importar: SQLAlchemy Models (esos son de Infrastructure)
# ═══════════════════════════════════════════════════════════════════════════════

from pydantic import BaseModel, Field
# Pydantic: librería Python para validación de datos usando type hints.
# BaseModel: clase base de Pydantic — la herencia da validación automática.
# Field: permite agregar configuración extra a cada campo (descripción, ejemplo, validaciones).


# ─────────────────────────────────────────────────────────────────────────────
# INPUT DTOs — lo que el cliente (frontend) envía al servidor
# ─────────────────────────────────────────────────────────────────────────────

class TareaCreateRequest(BaseModel):
    """
    INPUT DTO para crear una Tarea.

    Pydantic lee este schema y:
    1. Valida que el JSON del request tenga el campo "titulo".
    2. Verifica que "titulo" sea un string.
    3. Si algo falla, devuelve HTTP 422 (Unprocessable Entity) automáticamente.
    4. Si todo pasa, el endpoint recibe un objeto TareaCreateRequest con .titulo

    Por qué NO tiene "id" ni "creada_en":
      El cliente nunca debe enviar esos campos — el backend los genera.
      Si el input los incluyera, el cliente podría manipularlos (problema de seguridad).
    """

    titulo: str = Field(
        ...,
        # "..." (Ellipsis) en Pydantic = campo REQUERIDO (obligatorio).
        # Si el request no incluye "titulo", Pydantic devuelve HTTP 422.

        min_length=3,
        # Pydantic valida que el string tenga al menos 3 caracteres.
        # Sí, Pydantic también valida — pero el Domain TAMBIÉN valida.
        # ¿Redundante? No: Pydantic valida el FORMATO HTTP (capa externa).
        # El Domain valida las REGLAS DE NEGOCIO (capa interna).
        # Si mañana esta API tiene múltiples entradas (CLI, otro endpoint), el Domain
        # siempre valida sin importar por dónde llegó el dato.

        max_length=200,
        description="El texto de la tarea. Mínimo 3 caracteres, máximo 200.",
        # "description" aparece en la documentación Swagger (/docs).
        example="Comprar leche",
        # "example" aparece en Swagger para guiar al desarrollador que usa la API.
    )


class TareaUpdateRequest(BaseModel):
    """
    INPUT DTO para actualizar una Tarea.

    Incluye "completada" (booleano) para marcar la tarea como hecha o deshecha.
    A diferencia de TareaCreateRequest, aquí el cliente envía el estado actual.
    """

    titulo: str = Field(..., min_length=3, max_length=200, example="Comprar leche y huevos")
    completada: bool = Field(..., description="True = tarea completada, False = pendiente", example=False)
    # bool en Pydantic acepta: true/false en JSON, también "True"/"False" strings.


# ─────────────────────────────────────────────────────────────────────────────
# OUTPUT DTO — lo que el servidor devuelve al cliente (frontend)
# ─────────────────────────────────────────────────────────────────────────────

class TareaResponse(BaseModel):
    """
    OUTPUT DTO: representa una Tarea como la ve el cliente.

    El router convierte una Entity (Tarea dataclass del Domain) a este schema
    antes de responder. Pydantic lo serializa a JSON automáticamente.

    Incluye TODOS los campos — incluyendo id y creada_en generados por el backend.
    """

    id: str = Field(..., description="UUID único de la tarea", example="f47ac10b-58cc-4372-a567-0e02b2c3d479")
    titulo: str = Field(..., description="Texto de la tarea")
    completada: bool = Field(..., description="Estado de la tarea")
    creada_en: str = Field(..., description="Timestamp ISO 8601 de creación", example="2026-03-01T10:30:00+00:00")

    model_config = {"from_attributes": True}
    # "from_attributes = True" permite crear TareaResponse desde un objeto Python
    # con atributos (ej: un dataclass o un ORM Model), no solo desde un dict.
    # Sin esto: TareaResponse(**vars(tarea))  → más verbose
    # Con esto:  TareaResponse.model_validate(tarea) → Pydantic lee .id, .titulo, etc.
