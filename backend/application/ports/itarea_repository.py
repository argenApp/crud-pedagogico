# ═══════════════════════════════════════════════════════════════════════════════
# CAPA: APPLICATION — Puertos (Ports / Interfaces)
#
# Analogía: el "contrato laboral" entre el UseCase y el Repository.
# El UseCase dice: "necesito a alguien que sepa crear, listar, actualizar y
# eliminar tareas". Este archivo define ese contrato. No sabe CÓMO se hace —
# solo define QUÉ debe poder hacerse.
#
# Principio: Dependency Inversion (DI) — el UseCase depende de la abstracción
# (este archivo), NO de la implementación concreta (SQLAlchemy, PostgreSQL, etc.).
# Si mañana cambiás SQLite por MongoDB, el UseCase no cambia. Solo cambia
# quien implementa este contrato.
#
# ✅ Puede importar: domain/entities (para conocer la Entity que maneja)
# ❌ NO puede importar: SQLAlchemy, FastAPI, requests, nada externo
# ═══════════════════════════════════════════════════════════════════════════════

from abc import ABC, abstractmethod
# ABC = Abstract Base Class — clase base abstracta de Python estándar.
# Una clase abstracta NO puede instanciarse directamente.
# Solo puede usarse como "plantilla" para que otras clases la implementen.
# Analogía: es como un formulario en blanco — define los campos, pero alguien
# más tiene que llenarlo.

from typing import Optional
# Optional[X] significa que algo puede ser X o None.
# Ej: Optional[Tarea] = puede devolver una Tarea, o None si no existe.

from domain.entities.tarea import Tarea
# Importamos la Entity del Domain. El Puerto CONOCE la Entity porque
# necesita saber qué tipo de objeto maneja.
# Dirección correcta de dependencia: Application → Domain ✅


class ITareaRepository(ABC):
    """
    Puerto (Port) del repositorio de Tareas.

    "I" al inicio = Interface (convención). En Python no hay keyword "interface"
    como en Java o TypeScript; usamos ABC para simularlo.

    Cualquier clase que quiera ser un "repositorio de tareas" DEBE implementar
    todos los métodos marcados con @abstractmethod.
    Si no los implementa, Python lanza un TypeError al intentar instanciarla.
    """

    @abstractmethod
    # "@abstractmethod" marca este método como OBLIGATORIO de implementar.
    # Si olvidás implementarlo en la subclase, Python te avisa con error.
    def crear(self, id: str, titulo: str, completada: bool, creada_en: str) -> Tarea:
        """
        Persiste una nueva Tarea en el almacenamiento y la devuelve completa.

        Parámetros:
          id        — UUID generado antes de llamar (el Domain o UseCase lo genera)
          titulo    — texto de la tarea, ya validado por el Domain
          completada — siempre False en creación
          creada_en — timestamp ISO 8601, generado por el Domain

        Retorna: la Tarea recién creada (ya guardada en DB)
        """
        ...
        # "..." (Ellipsis) es el cuerpo vacío de un método abstracto en Python.
        # Equivalente a "pass" pero semánticamente más claro: "esto es un contrato".

    @abstractmethod
    def listar(self) -> list[Tarea]:
        """
        Devuelve todas las Tareas del almacenamiento.

        list[Tarea] = lista de objetos Tarea (Python 3.9+).
        En versiones anteriores se escribía: List[Tarea] (from typing import List).
        """
        ...

    @abstractmethod
    def obtener_por_id(self, id: str) -> Optional[Tarea]:
        """
        Busca una Tarea por su ID.

        Optional[Tarea] = puede devolver una Tarea o None.
        Si no existe la tarea con ese ID, devuelve None (no lanza error).
        El UseCase decide qué hacer si recibe None (ej: lanzar 404).
        """
        ...

    @abstractmethod
    def actualizar(self, id: str, titulo: str, completada: bool) -> Optional[Tarea]:
        """
        Actualiza los campos de una Tarea existente y la devuelve.

        Devuelve None si la Tarea no existe (ID inválido).
        """
        ...

    @abstractmethod
    def eliminar(self, id: str) -> bool:
        """
        Elimina una Tarea por su ID.

        Devuelve True si la eliminación fue exitosa.
        Devuelve False si la Tarea no existía (no lanza excepción).
        """
        ...
