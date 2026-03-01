# ═══════════════════════════════════════════════════════════════════════════════
# CAPA: APPLICATION — Use Case: CrearTarea
#
# Analogía: el UseCase es el "director de orquesta". No toca ningún instrumento
# él mismo; solo sabe a quién llamar y en qué orden.
#   - Llama al Domain (árbitro) para validar las reglas.
#   - Llama al Repositorio para persistir el resultado.
#
# ✅ Puede importar: domain/entities, application/ports
# ❌ NO puede importar: SQLAlchemy, FastAPI, requests, Infrastructure
# ═══════════════════════════════════════════════════════════════════════════════

import uuid
# uuid: librería estándar de Python para generar identificadores únicos.
# uuid4() genera un UUID completamente aleatorio. Ej: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
# El UseCase genera el ID — no el Repository ni el Domain.

from domain.entities.tarea import Tarea
# Importamos la Entity: el UseCase conoce la forma del objeto que maneja.
# Application → Domain ✅ (dirección correcta de dependencia)

from application.ports.itarea_repository import ITareaRepository
# Importamos el CONTRATO (Puerto), no la implementación concreta.
# El UseCase NO sabe que existe TareaRepositoryImpl ni SQLAlchemy.
# Solo sabe que existe algo llamado ITareaRepository con ciertos métodos.
# Application → Application/Ports ✅ (misma capa)


class CrearTarea:
    """
    Use Case: Crear una nueva Tarea.

    Un UseCase = una operación del negocio = un archivo = una clase.
    Esta clase NO hace fetch, NO habla con la base de datos, NO sabe de HTTP.
    Solo orquesta: valida → genera datos → delega al repo.
    """

    def __init__(self, repo: ITareaRepository) -> None:
        """
        Constructor: recibe el repositorio por "inyección de dependencias".

        "Inyección de dependencias" = alguien de afuera le da el repositorio
        al UseCase, en lugar de que el UseCase lo cree por su cuenta.

        Por qué importa: si el UseCase hiciera 'repo = TareaRepositoryImpl()',
        estaría acoplado a SQLAlchemy para siempre. Así, en tests podés pasar
        un repo falso (mock) sin base de datos real.

        repo: ITareaRepository → el tipo es el CONTRATO (ABC), no la implementación.
        self.repo = repo       → guardamos el repo como atributo de la instancia.
        """
        self.repo = repo
        # "self" en Python = la instancia actual de la clase.
        # Equivalente a "this" en TypeScript/JavaScript.

    def execute(self, titulo: str) -> Tarea:
        """
        Ejecuta la operación: crear una Tarea.

        Parámetros:
          titulo: str — el texto que ingresó el usuario.

        Retorna: Tarea — la entity completa con id y creada_en ya generados.

        El UseCase hace exactamente 3 cosas:
          1. Delega la validación al Domain.
          2. Genera los datos que el sistema necesita (id, timestamp).
          3. Delega la persistencia al repositorio.
        """

        # ── Paso 1: Validar (el Domain sabe las reglas, el UseCase NO) ──────────
        Tarea.validar_creacion(titulo)
        # Tarea.validar_creacion es un @staticmethod del Domain.
        # Si el título está vacío o es muy corto, lanza ValueError.
        # La excepción sube automáticamente al router (Adapter), que la convierte en HTTP 422.
        # El UseCase NO escribe los "if" de validación — esos son del Domain.

        # ── Paso 2: Generar datos que el sistema necesita ──────────────────────
        nuevo_id = str(uuid.uuid4())
        # str() convierte el UUID en string: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
        # Sin str(), sería un objeto UUID, no un string.

        creada_en = Tarea.generar_timestamp()
        # El Domain genera el timestamp — es una regla de negocio (siempre UTC, siempre ISO).

        titulo_limpio = titulo.strip()
        # .strip() elimina espacios al inicio y al final. "  Mi tarea  " → "Mi tarea"
        # El UseCase normaliza el dato antes de persistirlo.

        # ── Paso 3: Delegar la persistencia al Repositorio ────────────────────
        return self.repo.crear(
            id=nuevo_id,
            titulo=titulo_limpio,
            completada=False,    # Toda tarea nueva nace como "no completada"
            creada_en=creada_en,
        )
        # self.repo.crear(...) llama al método del Puerto (ITareaRepository).
        # El UseCase no sabe si adentro hay SQLAlchemy, un dict en memoria, o Mongo.
        # Solo sabe que le prometieron un "crear()" que devuelve una Tarea.
