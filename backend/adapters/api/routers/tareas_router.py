# ═══════════════════════════════════════════════════════════════════════════════
# CAPA: ADAPTERS — Router FastAPI (Endpoints HTTP)
#
# Analogía: el "recepcionista" del sistema. Recibe solicitudes HTTP del exterior,
# las traduce al lenguaje de los UseCases, y devuelve la respuesta al formato HTTP.
#
# El router:
#   1. Recibe el JSON del cliente (validado por Pydantic schemas)
#   2. Instancia el repo y el UseCase (inyección de dependencias)
#   3. Llama a UseCase.execute() con el INPUT DTO
#   4. Convierte la Entity del Domain a OUTPUT DTO (TareaResponse)
#   5. Devuelve HTTP response con el JSON serializado
#
# ✅ Puede importar: schemas (misma capa), use_cases (Application), infrastructure (repo)
# ❌ NO puede importar: domain entities directamente (solo vía use cases)
# ═══════════════════════════════════════════════════════════════════════════════

from fastapi import APIRouter, Depends, HTTPException, status
# APIRouter: permite agrupar endpoints relacionados (todos los de "tareas").
# Depends: sistema de inyección de dependencias de FastAPI (provee la sesión DB).
# HTTPException: para devolver errores HTTP (404, 400, etc.) desde el código.
# status: constantes HTTP (status.HTTP_201_CREATED = 201, etc.).

from sqlalchemy.orm import Session
# Session: tipo de la sesión SQLAlchemy — necesario para el type hint en get_db.

from infrastructure.database.session import get_db
# Importamos el generador de sesión. FastAPI lo llama automáticamente
# antes de cada request y cierra la sesión al terminar.

from infrastructure.repositories.tarea_repository_impl import TareaRepositoryImpl
# El repositorio concreto que implementa el Puerto.
# El Adapter crea la instancia con la sesión de DB inyectada.

from application.use_cases.crear_tarea import CrearTarea
from application.use_cases.listar_tareas import ListarTareas
from application.use_cases.actualizar_tarea import ActualizarTarea
from application.use_cases.eliminar_tarea import EliminarTarea
# Los cuatro UseCases — uno por operación.

from adapters.api.schemas import TareaCreateRequest, TareaUpdateRequest, TareaResponse
# Los DTOs Pydantic:
#   TareaCreateRequest → lo que llega en el body del POST
#   TareaUpdateRequest → lo que llega en el body del PUT
#   TareaResponse      → lo que devolvemos en todos los endpoints


# ─────────────────────────────────────────────────────────────────────────────
# Configuración del Router
# ─────────────────────────────────────────────────────────────────────────────

router = APIRouter(
    prefix="/api/tareas",
    # Todos los endpoints de este router comenzarán con "/api/tareas".
    # El router se registra en main.py con app.include_router(router).

    tags=["tareas"],
    # "tags" organiza los endpoints en la documentación Swagger (/docs).
    # Todos los endpoints de "tareas" aparecerán bajo la sección "tareas".
)


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[TareaResponse], status_code=status.HTTP_200_OK)
# @router.get("/") → responde a GET /api/tareas/
# response_model=list[TareaResponse] → FastAPI serializa la respuesta usando este schema.
# status_code=200 → HTTP 200 OK (éxito en lectura).
def listar_tareas(db: Session = Depends(get_db)):
    """
    GET /api/tareas/ — Devuelve todas las Tareas.

    db: Session = Depends(get_db)
      ↑ FastAPI llama automáticamente a get_db() antes de ejecutar este endpoint.
      ↑ La sesión de DB se inyecta aquí — nosotros no la creamos manualmente.
      ↑ Al terminar el endpoint, FastAPI cierra la sesión (el "finally" de get_db).
    """
    repo = TareaRepositoryImpl(db)
    # Creamos el repo inyectando la sesión de DB.

    use_case = ListarTareas(repo)
    # Creamos el UseCase inyectando el repo.
    # El UseCase no sabe que es SQLAlchemy — solo ve ITareaRepository.

    tareas = use_case.execute()
    # Ejecutamos el UseCase. Devuelve list[Tarea] (entities del Domain).

    return [TareaResponse.model_validate(t) for t in tareas]
    # Convertimos cada Tarea (Entity) a TareaResponse (Output DTO Pydantic).
    # model_validate(t) lee los atributos del dataclass Tarea.
    # FastAPI serializa la lista a JSON automáticamente.


@router.post("/", response_model=TareaResponse, status_code=status.HTTP_201_CREATED)
# POST /api/tareas/ — crea un recurso nuevo → HTTP 201 Created.
def crear_tarea(body: TareaCreateRequest, db: Session = Depends(get_db)):
    """
    POST /api/tareas/ — Crea una nueva Tarea.

    body: TareaCreateRequest
      ↑ FastAPI lee el JSON del request body y lo valida con Pydantic.
      ↑ Si falta "titulo" o es inválido, FastAPI devuelve HTTP 422 automáticamente.
      ↑ Si pasa validación, "body" es un objeto Python con .titulo
    """
    repo = TareaRepositoryImpl(db)
    use_case = CrearTarea(repo)

    try:
        # "try/except" = manejo de errores en Python.
        # Equivalente a try/catch en JavaScript.
        tarea = use_case.execute(titulo=body.titulo)
        # Pasamos solo el título — el UseCase genera id y creada_en.

    except ValueError as e:
        # ValueError = error de validación del Domain.
        # "as e" = guardamos la excepción en la variable "e".
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            # HTTP 422 = "los datos son válidos en formato pero no en negocio".
            detail=str(e),
            # str(e) convierte la excepción a string: "El título debe tener..."
        )

    return TareaResponse.model_validate(tarea)
    # Convertimos la Entity a Output DTO y FastAPI la serializa a JSON.


@router.get("/{id}", response_model=TareaResponse, status_code=status.HTTP_200_OK)
# {id} en el path = parámetro de ruta. GET /api/tareas/f47ac10b-... → id="f47ac10b-..."
def obtener_tarea(id: str, db: Session = Depends(get_db)):
    """
    GET /api/tareas/{id} — Obtiene una Tarea específica por ID.
    """
    repo = TareaRepositoryImpl(db)

    # Para obtener por ID no necesitamos UseCase complejo — el repo basta.
    # Si hubiera lógica de negocio (permisos, estado), iría en un UseCase.
    tarea = repo.obtener_por_id(id)

    if tarea is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tarea con id '{id}' no encontrada.",
        )

    return TareaResponse.model_validate(tarea)


@router.put("/{id}", response_model=TareaResponse, status_code=status.HTTP_200_OK)
# PUT /api/tareas/{id} — actualiza un recurso completo (reemplaza los campos enviados).
def actualizar_tarea(id: str, body: TareaUpdateRequest, db: Session = Depends(get_db)):
    """
    PUT /api/tareas/{id} — Actualiza título y/o estado de una Tarea.

    id: str   → viene del path (/api/tareas/f47ac10b-...)
    body: TareaUpdateRequest → viene del JSON del request body
    """
    repo = TareaRepositoryImpl(db)
    use_case = ActualizarTarea(repo)

    try:
        tarea = use_case.execute(id=id, titulo=body.titulo, completada=body.completada)
    except ValueError as e:
        # ValueError puede ser:
        #   - "No se encontró una Tarea..." → devolvemos 404
        #   - "El título debe tener..." → devolvemos 422
        error_msg = str(e)

        if "No se encontró" in error_msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_msg)

        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=error_msg)

    return TareaResponse.model_validate(tarea)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
# DELETE /api/tareas/{id} — elimina un recurso.
# HTTP 204 No Content = éxito, sin cuerpo de respuesta (el recurso ya no existe).
# No tiene response_model porque no devolvemos nada.
def eliminar_tarea(id: str, db: Session = Depends(get_db)):
    """
    DELETE /api/tareas/{id} — Elimina una Tarea por ID.
    """
    repo = TareaRepositoryImpl(db)
    use_case = EliminarTarea(repo)

    try:
        use_case.execute(id=id)
        # Si tiene éxito: no devuelve nada (-> None).
        # FastAPI devuelve HTTP 204 automáticamente.

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
