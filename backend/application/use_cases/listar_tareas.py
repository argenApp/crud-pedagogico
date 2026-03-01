# ═══════════════════════════════════════════════════════════════════════════════
# CAPA: APPLICATION — Use Case: ListarTareas
#
# Este UseCase es el más simple: no valida (no hay input del usuario),
# solo delega la consulta al repositorio.
# Demuestra que incluso operaciones simples pasan por el UseCase —
# para mantener la arquitectura consistente y testeable.
# ═══════════════════════════════════════════════════════════════════════════════

from domain.entities.tarea import Tarea
from application.ports.itarea_repository import ITareaRepository


class ListarTareas:
    """
    Use Case: Obtener todas las Tareas del sistema.

    No hay input del usuario — solo se pide la lista completa.
    El UseCase delega directamente al repositorio sin validación previa.
    """

    def __init__(self, repo: ITareaRepository) -> None:
        self.repo = repo

    def execute(self) -> list[Tarea]:
        """
        Retorna la lista de todas las Tareas.

        list[Tarea] = lista (array) de objetos del tipo Tarea.
        Si no hay tareas, devuelve una lista vacía [].
        """
        return self.repo.listar()
        # Una línea. El UseCase de lectura simple no tiene nada más que hacer.
        # Si en el futuro necesitaras filtrar, paginar u ordenar, ese código
        # iría aquí — sin tocar el Domain ni el Repository.
