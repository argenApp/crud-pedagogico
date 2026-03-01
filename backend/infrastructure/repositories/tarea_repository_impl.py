# ═══════════════════════════════════════════════════════════════════════════════
# CAPA: INFRASTRUCTURE — Implementación del Repositorio
#
# Este archivo es donde "todo se hace real". Aquí vive el código que
# realmente habla con SQLite vía SQLAlchemy.
#
# Implementa el CONTRATO definido en application/ports/itarea_repository.py.
# Si el contrato dice "def crear(...) -> Tarea:", este archivo lo cumple.
#
# Analogía: el Puerto (ITareaRepository) es el formulario de trabajo.
# Este archivo es el empleado que lo completa con resultados reales.
#
# Responsabilidades ÚNICAS de esta capa:
#   1. Convertir Entity → Model (para guardar en DB)
#   2. Convertir Model → Entity (para devolver al UseCase)  ← "_to_entity()"
#   3. Ejecutar queries SQL vía SQLAlchemy
#
# ✅ Puede importar: domain/entities, application/ports, infrastructure/database
# ❌ NO puede importar: FastAPI routers, Pydantic schemas (esos son del Adapter)
# ═══════════════════════════════════════════════════════════════════════════════

from typing import Optional
from sqlalchemy.orm import Session
# Session: la sesión de SQLAlchemy — el "contexto" de trabajo con la DB.
# Se inyecta desde el router vía FastAPI Depends.

from domain.entities.tarea import Tarea
# La Entity del Domain: lo que devolvemos al UseCase.

from application.ports.itarea_repository import ITareaRepository
# El contrato que debemos implementar. Al escribir "implements ITareaRepository"
# (en Python: "class X(ITareaRepository)"), Python verifica que implementemos
# todos los métodos @abstractmethod.

from infrastructure.database.models import TareaModel
# El Model de SQLAlchemy: lo que usamos internamente para hablar con la DB.


class TareaRepositoryImpl(ITareaRepository):
    """
    Implementación concreta del repositorio de Tareas usando SQLAlchemy + SQLite.

    "Impl" al final = Implementation (convención). Indica que es la versión
    concreta que implementa el contrato abstracto.

    En tests podría existir TareaRepositoryFake (sin DB) que también implementa
    ITareaRepository — el UseCase no notaría la diferencia.
    """

    def __init__(self, db: Session) -> None:
        """
        Recibe la sesión de DB por inyección de dependencias.
        La sesión es creada y cerrada por el router (Adapter), no por nosotros.
        """
        self.db = db
        # self.db = la sesión de SQLAlchemy que usaremos en todos los métodos.

    # ─────────────────────────────────────────────────────────────────────────
    # Función privada de conversión Model → Entity
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _to_entity(model: TareaModel) -> Tarea:
        """
        Convierte un TareaModel (SQLAlchemy, Infrastructure) a una Tarea (Entity, Domain).

        Este es el único lugar donde "cruza la frontera" entre el mundo de la DB
        y el mundo del negocio.

        Analogía: el repositorio recibe los datos en "lenguaje SQL" (TareaModel)
        y los "traduce" al "lenguaje del negocio" (Tarea Entity).

        "_" al inicio del nombre = convención Python para método "privado".
        No es privado de verdad (Python no tiene privados reales), pero señaliza
        que es de uso interno — no debe llamarse desde afuera de esta clase.
        """
        return Tarea(
            id=model.id,
            titulo=model.titulo,
            completada=model.completada,
            creada_en=model.creada_en,
        )
        # Construimos la Entity con los datos del Model.
        # En este caso los nombres son iguales, pero si el backend usara
        # snake_case interno diferente al Domain, la conversión iría aquí.

    # ─────────────────────────────────────────────────────────────────────────
    # Implementación de los métodos del contrato
    # ─────────────────────────────────────────────────────────────────────────

    def crear(self, id: str, titulo: str, completada: bool, creada_en: str) -> Tarea:
        """
        Inserta una nueva fila en la tabla "tareas" y devuelve la Entity.
        """
        nuevo_model = TareaModel(
            id=id,
            titulo=titulo,
            completada=completada,
            creada_en=creada_en,
        )
        # Creamos un objeto TareaModel (no una Tarea Entity).
        # SQLAlchemy necesita su propio tipo de objeto para saber cómo guardarlo.

        self.db.add(nuevo_model)
        # "add" registra el objeto en la sesión — aún NO está en la DB.
        # Equivale a preparar un INSERT SQL sin ejecutarlo todavía.

        self.db.commit()
        # "commit" ejecuta el INSERT en la DB y confirma la transacción.
        # Analogía: es como hacer clic en "Guardar" — antes de esto, todo puede revertirse.

        self.db.refresh(nuevo_model)
        # "refresh" actualiza el objeto Python con los datos que la DB confirmó.
        # Necesario si la DB genera valores automáticos (autoincrement, defaults, etc.).

        return self._to_entity(nuevo_model)
        # Convertimos el Model guardado en una Entity Domain para devolver al UseCase.

    def listar(self) -> list[Tarea]:
        """
        Consulta todas las filas de la tabla "tareas".
        """
        models = self.db.query(TareaModel).all()
        # query(TareaModel) → SELECT * FROM tareas
        # .all() → ejecuta el query y devuelve una lista de TareaModel

        return [self._to_entity(m) for m in models]
        # List comprehension: aplica _to_entity a cada model de la lista.
        # Equivalente en JS: models.map(m => this._toEntity(m))
        # Resultado: lista de Tarea Entities (no de TareaModels).

    def obtener_por_id(self, id: str) -> Optional[Tarea]:
        """
        Busca una fila por primary key.
        """
        model = self.db.query(TareaModel).filter(TareaModel.id == id).first()
        # .filter(TareaModel.id == id) → WHERE id = 'el-uuid'
        # .first() → devuelve el primer resultado o None si no hay ninguno.

        if model is None:
            return None
            # None en Python = null en JavaScript.
            # El UseCase decide qué hacer cuando no hay resultado.

        return self._to_entity(model)

    def actualizar(self, id: str, titulo: str, completada: bool) -> Optional[Tarea]:
        """
        Actualiza una fila existente.
        """
        model = self.db.query(TareaModel).filter(TareaModel.id == id).first()

        if model is None:
            return None
            # El UseCase recibirá None y lanzará ValueError → HTTP 404.

        # Modificamos los atributos del objeto Python.
        # SQLAlchemy detecta los cambios automáticamente al hacer commit.
        model.titulo = titulo
        model.completada = completada

        self.db.commit()
        # Ejecuta el UPDATE en la DB.

        self.db.refresh(model)
        # Actualizamos el objeto Python con los datos confirmados en DB.

        return self._to_entity(model)

    def eliminar(self, id: str) -> bool:
        """
        Elimina una fila por ID.
        Devuelve True si se eliminó, False si no existía.
        """
        model = self.db.query(TareaModel).filter(TareaModel.id == id).first()

        if model is None:
            return False
            # El UseCase recibirá False y lanzará ValueError → HTTP 404.

        self.db.delete(model)
        # "delete" marca el objeto para eliminación — aún no ejecuta el DELETE SQL.

        self.db.commit()
        # Ejecuta el DELETE en la DB y confirma la transacción.

        return True
        # Éxito: la fila fue eliminada.
