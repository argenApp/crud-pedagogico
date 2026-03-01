# ═══════════════════════════════════════════════════════════════════════════════
# CAPA: DOMAIN — El núcleo del sistema
#
# Analogía: es la "constitución" del sistema. Define QUÉ son las cosas y cuáles
# son las reglas máximas. No sabe si existe internet, React, SQLite, ni FastAPI.
# Si mañana cambias FastAPI por Django, o SQLite por PostgreSQL, este archivo
# NO cambia. Es el único código que puede sobrevivir a cualquier migración.
#
# ✅ Puede importar: solo librería estándar de Python (dataclasses, datetime, etc.)
# ❌ NO puede importar: SQLAlchemy, Pydantic, FastAPI, ni ningún framework externo
# ═══════════════════════════════════════════════════════════════════════════════

from dataclasses import dataclass
# "dataclass" es un decorador de Python estándar.
# Genera automáticamente __init__, __repr__ y __eq__ para la clase.
# No es de FastAPI ni de SQLAlchemy — es Python puro.

from datetime import datetime, timezone
# datetime: para manejar fechas y horas — también Python puro.


@dataclass
# "@dataclass" transforma esta clase en una estructura de datos simple.
# Sin @dataclass, tendrías que escribir manualmente:
#   def __init__(self, id, titulo, completada, creada_en): ...
# El decorador lo hace por vos automáticamente.
class Tarea:
    """
    La Entidad Tarea.

    Una Entidad representa un OBJETO DEL NEGOCIO — en este caso, una tarea pendiente.
    No es una tabla de base de datos (eso es el Model de SQLAlchemy, en Infrastructure).
    No es un schema de validación (eso es Pydantic, en Adapters).
    Es simplemente: ¿qué ES una Tarea en nuestro sistema?
    """

    id: str
    # Python type hints: "id: str" dice que id es un string.
    # A diferencia de TypeScript, Python SÍ ejecuta en runtime, pero los type hints
    # son opcionales y solo sirven para documentación y herramientas (mypy, IDEs).
    # No generan error en runtime si los ignorás — son orientativos.

    titulo: str
    # El texto que escribe el usuario. Ej: "Comprar leche"

    completada: bool
    # bool en Python = True o False (con mayúscula, a diferencia de JS: true/false)

    creada_en: str
    # Guardamos la fecha como string ISO 8601 para simplificar.
    # El backend la genera — el usuario nunca la envía.

    # ─────────────────────────────────────────────────────────────────────────
    # REGLAS DE NEGOCIO — viven AQUÍ, en el Domain
    #
    # Analogía: el Domain es el "árbitro" del partido. Él decide si algo es
    # válido o no. Los Use Cases (Application) son los jugadores — ellos
    # le preguntan al árbitro si una jugada es válida.
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def validar_creacion(titulo: str) -> None:
        """
        Regla de negocio: ¿qué se necesita para crear una Tarea válida?

        @staticmethod significa que no necesita instancia de la clase para llamarse.
        Se llama como: Tarea.validar_creacion("mi título")
        No como:       tarea_instance.validar_creacion("mi título")

        -> None significa que esta función no devuelve nada.
        Si algo falla, lanza una excepción (ValueError).
        """

        # Regla 1: el título no puede estar vacío ni ser solo espacios.
        # .strip() elimina espacios al principio y al final del string.
        if not titulo or not titulo.strip():
            # "raise" lanza una excepción — detiene la ejecución inmediatamente.
            # El UseCase que llamó a este método recibirá esta excepción.
            raise ValueError("El título de la tarea no puede estar vacío.")

        # Regla 2: el título debe tener al menos 3 caracteres (sin contar espacios).
        if len(titulo.strip()) < 3:
            raise ValueError("El título debe tener al menos 3 caracteres.")

        # Regla 3: el título no puede exceder 200 caracteres.
        if len(titulo.strip()) > 200:
            raise ValueError("El título no puede superar los 200 caracteres.")

    @staticmethod
    def validar_actualizacion(titulo: str) -> None:
        """
        Regla de negocio para actualizaciones.
        Mismas reglas que creación — extraído en método propio para claridad.
        Si las reglas de actualización difirieran de las de creación, este es
        el lugar correcto para manejar esa diferencia.
        """
        Tarea.validar_creacion(titulo)
        # Reutilizamos las mismas reglas. Si en el futuro fueran distintas,
        # solo cambiaría este método — no los UseCase ni los componentes.

    @staticmethod
    def generar_timestamp() -> str:
        """
        Genera el timestamp de creación en formato ISO 8601.
        Ej: "2026-03-01T10:30:00+00:00"

        Este método vive en el Domain porque "cuándo se crea una Tarea" es
        una decisión del negocio, no de la infraestructura.
        """
        return datetime.now(timezone.utc).isoformat()
        # datetime.now(timezone.utc) → hora actual en UTC (universal, sin zona horaria local)
        # .isoformat() → lo convierte a string estándar: "2026-03-01T10:30:00+00:00"
