// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: ADAPTERS — State Store (Zustand): Filtro de Tareas
//
// Posición en la cadena de dependencias:
//   Presentation (TareaList) → useFiltroTareasStore(selectFiltro) → [filtro activo]
//   → .filter() sobre datos de React Query → UI actualizada SIN HTTP
//
// ★ Este archivo es un STORE DE ZUSTAND — gestiona ESTADO DE UI en el cliente.
//   NO hace HTTP. NO habla con el backend. Es JavaScript puro en RAM.
//
// ─────────────────────────────────────────────────────────────────────────────
// ¿QUÉ ES ZUSTAND?
//
// Zustand es una librería de gestión de estado para React.
// "zustand" significa "estado" en alemán.
//
// Analogía: es una "caja de memoria compartida" que todos los componentes
// pueden leer y modificar sin necesidad de pasarse props entre sí.
//
//   Sin Zustand:
//     Padre pasa filtro a Hijo1 → Hijo1 pasa a Nieto → Nieto lo usa
//     (prop drilling: cadena de props tediosa y frágil)
//
//   Con Zustand:
//     Nieto lee directamente del store: useFiltroTareasStore(selectFiltro)
//     Botón en Hermano2 llama: setFiltro('pendientes')
//     Nieto se re-renderiza automáticamente — sin comunicación entre Padre y Hermanos.
//
// ─────────────────────────────────────────────────────────────────────────────
// ZUSTAND vs REACT QUERY — State Rule: cuándo usar cada uno
//
//   ZUSTAND (este archivo):
//     → Estado de UI: ¿qué tab está activo? ¿está el modal abierto?
//     → Vive solo en el cliente (RAM)
//     → No hace HTTP — no habla con el backend
//     → Se pierde al recargar la página (volátil)
//     → Ejemplo: filtro activo ('todas' | 'pendientes' | 'completadas')
//
//   REACT QUERY (useTareasQueries.ts):
//     → Datos del servidor: lista de tareas, usuarios, productos
//     → Hace HTTP — habla con el backend
//     → Tiene cache con lógica HIT/MISS
//     → También se pierde al recargar (sin configurar persist)
//     → Ejemplo: el array TareaOutputDTO[] que viene del GET /api/v1/tareas/
//
// REGLA: Nunca guardes datos del servidor en Zustand. Nunca guardes estado de UI
//        en React Query. Cada herramienta tiene su dominio.
//
// ─────────────────────────────────────────────────────────────────────────────
// ¿POR QUÉ vive en adapters/ui/state/stores/ y no en infrastructure/?
//
//   El filtro es estado de UI — una decisión del cliente (JS puro, sin I/O).
//   No es infrastructure porque infrastructure = herramientas de acceso a datos
//   (HTTP, localStorage, indexedDB). El filtro no accede a nada externo.
//   Si mañana reemplazás Zustand por Jotai, solo cambia esta carpeta.
//   Los componentes siguen importando del mismo lugar.
//
// Regla de dependencias (Clean Architecture — Ley de Dependencia):
//   ✅ Puede importar: zustand (librería)
//   ❌ NO puede importar: React Query, repositorios, Use Cases
//
// 🔍 DevTools — cómo observar este archivo en acción:
//   React DevTools > Components > TareaList > hooks:
//   Buscá el hook de Zustand → State: 'todas'|'pendientes'|'completadas'
//   Cambia en tiempo real al hacer click en los tabs del filtro.
//   NO hay request en Network — el filtro es solo JavaScript .filter().
// ═══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand'
// "create" = la función principal de Zustand.
// Recibe un callback que define el estado inicial y las acciones.
// Devuelve un HOOK — por eso el archivo se llama "use...Store.ts".
//
// "import { create } from 'zustand'" → Zustand 5.x — sin importer default.
// La librería existe en runtime (el browser la ejecuta).


// ─────────────────────────────────────────────────────────────────────────────
// Tipo del filtro — los tres valores posibles del tab bar
// ─────────────────────────────────────────────────────────────────────────────

export type Filtro = 'todas' | 'pendientes' | 'completadas'
// "type" = TypeScript puro. Desaparece al compilar.
// "Union type": Filtro puede ser EXACTAMENTE uno de estos tres strings.
// Si alguien intenta setFiltro('borradores'), TypeScript falla al compilar.
// El browser nunca ve este tipo — es solo para que el editor avise errores.


// ─────────────────────────────────────────────────────────────────────────────
// Interface del store — qué contiene el store (estado + acciones)
// ─────────────────────────────────────────────────────────────────────────────

interface FiltroTareasStore {
  // "interface" = TypeScript. Desaparece al compilar. Solo guía al editor.
  // Define la FORMA del objeto que devuelve el store.

  filtro: Filtro
  // El tab actualmente seleccionado.
  // Valor inicial: 'todas' (ver abajo).
  // Cuando el usuario hace click en otro tab → setFiltro() cambia este valor.

  setFiltro: (filtro: Filtro) => void
  // "setFiltro" = la acción para cambiar el filtro.
  // "(filtro: Filtro) => void" = es una función que recibe un Filtro y no devuelve nada.
  // "void" en TypeScript = "esta función no tiene return útil".
  // El componente llama: setFiltro('pendientes') → el store actualiza filtro.
  // Todos los componentes que leen "filtro" se re-renderizan automáticamente.
}


// ─────────────────────────────────────────────────────────────────────────────
// Creación del store
// ─────────────────────────────────────────────────────────────────────────────

export const useFiltroTareasStore = create<FiltroTareasStore>()(
  // "create<FiltroTareasStore>()" → Zustand 5 con TypeScript.
  // El generic "<FiltroTareasStore>" le dice a TypeScript qué forma tiene el estado.
  // El "()" extra es porque Zustand 5 usa "currying" (función que devuelve función).
  // Parece raro pero es la sintaxis estándar de Zustand con TypeScript.

  (set) => ({
    // "(set) => ({ ... })" → callback que define el estado inicial y las acciones.
    //
    // "set" = función de Zustand para actualizar el estado.
    // Cuando llamás set({ filtro: 'pendientes' }), Zustand:
    //   1. Fusiona el objeto nuevo con el estado actual
    //   2. Notifica a todos los componentes que leen este store
    //   3. React re-renderiza los componentes afectados

    filtro: 'todas',
    // Estado inicial: empieza mostrando todas las tareas.
    // Es un string JavaScript runtime — existe en el browser.

    setFiltro: (filtro: Filtro) => set({ filtro }),
    // "setFiltro" = la acción.
    // "(filtro: Filtro)" → TypeScript: el parámetro debe ser uno de los tres valores.
    // "set({ filtro })" → shorthand de JS: equivalente a set({ filtro: filtro }).
    //
    // 🔍 React DevTools: después de onClick en un tab → el State del store cambia.
    // NO hay request en Network (es solo JavaScript .filter() sobre datos en cache).
    //
    // Flujo cuando el usuario hace click en "Pendientes":
    //   1. onClick del botón llama setFiltro('pendientes')
    //   2. Zustand ejecuta set({ filtro: 'pendientes' })
    //   3. Estado del store: { filtro: 'pendientes', setFiltro: [fn] }
    //   4. TareaList re-renderiza → filtra tareas con !t.completada
    //   5. El tab "Pendientes" aparece visualmente activo
  })
)

// ─────────────────────────────────────────────────────────────────────────────
// ¿Cómo se usa este store en un componente?
//
//   import { useFiltroTareasStore } from '@/adapters/ui/state/stores/useFiltroTareasStore'
//   import { selectFiltro } from '@/adapters/ui/state/selectors/filtroTareasSelectors'
//
//   function MiComponente() {
//     const filtro = useFiltroTareasStore(selectFiltro)
//     //                                  ↑ selector: re-renderiza SOLO si filtro cambia
//
//     return <button onClick={() => setFiltro('pendientes')}>Pendientes</button>
//   }
// ─────────────────────────────────────────────────────────────────────────────
