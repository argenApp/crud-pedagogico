// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: ADAPTERS — Store de UI: Rol del usuario simulado
//
// ¿Por qué el rol vive en Zustand y no en React Query?
// ─────────────────────────────────────────────────────────────────────────────
//   Porque el rol es ESTADO DE UI (una decisión del cliente), no datos del servidor.
//   En producción real, el rol vendría del token JWT verificado por el backend.
//   Acá lo simulamos con Zustand para poder demostrarlo sin un sistema de auth real.
//
//   Regla: servidor da el rol → Zustand lo guarda → UseCase lo consume para filtrar.
//
// ┌──────────────────────────────────────────────────────────────────┐
// │  ZUSTAND (rol)  →  Adapter Hook  →  UseCase.execute(rol)        │
// │                                   →  ReglaRol.filtrarPorRol()   │
// │                                   →  datos filtrados al Adapter  │
// └──────────────────────────────────────────────────────────────────┘
//
// ✅ Puede importar: zustand, domain/roles/Rol
// ❌ NO puede importar: React, fetch, componentes de presentación
// ═══════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand'
import type { Rol } from '@/domain/roles/Rol'
// Importamos el TYPE del Domain — el store conoce el vocabulario del negocio.
// "import type" = solo TypeScript, desaparece al compilar.


// ─────────────────────────────────────────────────────────────────────────────
// Contrato del store
// ─────────────────────────────────────────────────────────────────────────────

interface RolStore {
  rol: Rol
  // El rol activo. Por defecto: 'ADMIN' (para ver algo al abrir la app).
  // En producción: este valor vendría del token JWT del usuario autenticado.

  setRol: (rol: Rol) => void
  // Función para cambiar el rol activo (simulación del switch de usuario).
  // Convención de naming del skill: set{Field} para setters simples.
}


// ─────────────────────────────────────────────────────────────────────────────
// Implementación del store
// ─────────────────────────────────────────────────────────────────────────────

export const useRolStore = create<RolStore>()((set) => ({
  // "create<RolStore>()" → Zustand crea el store tipado con RolStore.
  // "(set) => ({...})" → función que recibe "set" y devuelve el estado inicial.

  rol: 'ADMIN',
  // Estado inicial: ADMIN para que la primera vez se vean todas las tareas.
  // Sin este default, la lista estaría vacía hasta que el usuario elija un rol.

  setRol: (rol: Rol) => set({ rol }),
  // "set({ rol })" es shorthand de "set({ rol: rol })".
  // Zustand fusiona el objeto parcial con el estado existente.
  // Equivalente completo: set((state) => ({ ...state, rol }))
  // Zustand lo hace automáticamente — no necesitás el spread manual.
}))
