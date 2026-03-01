# ═══════════════════════════════════════════════════════════════════════════════
# CAPA: APPLICATION — Use Case: ActualizarTarea
#
# Demuestra el manejo de "not found": el UseCase decide qué hacer
# cuando el repositorio devuelve None (tarea no encontrada).
# Lanzar ValueError aquí es correcto — el Adapter (router) lo convierte en HTTP 404.
# ═══════════════════════════════════════════════════════════════════════════════

from typing import Optional

from domain.entities.tarea import Tarea
from application.ports.itarea_repository import ITareaRepository


class ActualizarTarea:
    """
    Use Case: Actualizar el título y/o el estado de una Tarea existente.
    """

    def __init__(self, repo: ITareaRepository) -> None:
        self.repo = repo

    def execute(self, id: str, titulo: str, completada: bool) -> Tarea:
        """
        Actualiza una Tarea y devuelve la versión actualizada.

        Parámetros:
          id         — UUID de la tarea a actualizar
          titulo     — nuevo título (debe cumplir las reglas del Domain)
          completada — nuevo estado booleano

        Retorna: la Tarea actualizada.
        Lanza ValueError si la Tarea no existe o si el título es inválido.
        """

        # ── Paso 1: Validar el nuevo título en el Domain ───────────────────────
        Tarea.validar_actualizacion(titulo)
        # Mismas reglas que en creación. Si el título nuevo es inválido,
        # el Domain lanza ValueError y detenemos todo aquí.

        # ── Paso 2: Delegar la actualización al repositorio ────────────────────
        tarea_actualizada: Optional[Tarea] = self.repo.actualizar(id, titulo.strip(), completada)
        # Optional[Tarea] = puede ser una Tarea o None.
        # Si el ID no existe en la base de datos, el repo devuelve None.

        # ── Paso 3: Verificar que la tarea existía ────────────────────────────
        if tarea_actualizada is None:
            # "is None" en Python = equivalente a "=== null" en JavaScript.
            raise ValueError(f"No se encontró una Tarea con id '{id}'.")
            # f"..." = f-string: permite insertar variables dentro de strings.
            # Equivalente a template literals en JS: `No se encontró con id '${id}'.`

        return tarea_actualizada
        # Devolvemos la Entity actualizada — el Adapter la convertirá a JSON.
