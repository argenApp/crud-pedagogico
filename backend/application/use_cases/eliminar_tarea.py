# ═══════════════════════════════════════════════════════════════════════════════
# CAPA: APPLICATION — Use Case: EliminarTarea
# ═══════════════════════════════════════════════════════════════════════════════

from domain.entities.tarea import Tarea
from application.ports.itarea_repository import ITareaRepository


class EliminarTarea:
    """
    Use Case: Eliminar una Tarea por su ID.
    """

    def __init__(self, repo: ITareaRepository) -> None:
        self.repo = repo

    def execute(self, id: str) -> None:
        """
        Elimina la Tarea con el ID dado.

        -> None significa que no devuelve ningún valor.
        Si la Tarea no existe, lanza ValueError (el router lo convierte en HTTP 404).
        """

        # ── Delegar la eliminación al repositorio ─────────────────────────────
        fue_eliminada: bool = self.repo.eliminar(id)
        # bool = True si se eliminó, False si el ID no existía.

        if not fue_eliminada:
            # "not fue_eliminada" = "if fue_eliminada is False"
            raise ValueError(f"No se encontró una Tarea con id '{id}'.")
            # El Adapter (router) captura esta excepción y devuelve HTTP 404.

        # Si llegamos acá sin excepción, la eliminación fue exitosa.
        # El router devolverá HTTP 204 (No Content) — éxito sin cuerpo de respuesta.
