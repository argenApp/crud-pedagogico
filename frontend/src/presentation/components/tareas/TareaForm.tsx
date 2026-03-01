// ═══════════════════════════════════════════════════════════════════════════════
// CAPA: PRESENTATION — Componente: TareaForm
// Extensión: .tsx = TypeScript + JSX
//   .ts  = solo lógica (use cases, hooks, repos)
//   .tsx = lógica + UI visual (componentes React con JSX)
//
// Analogía: la "pantalla de cine". Solo muestra. No decide ni procesa nada.
// El componente recibe hooks del Adapter y los llama cuando el usuario actúa.
//
// ✅ Puede importar: hooks (Adapters) — UNA SOLA FUENTE
// ❌ NO puede importar: use cases, repos, domain, infrastructure directamente
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
// "useState" = hook de React para manejar estado local.
// "Caja de memoria del componente" — cuando cambia, React redibuja el componente.
// Es JavaScript runtime — existe en el browser.

import {
  useCrearTarea,
  type CrearTareaInput,
  // "type" antes del nombre = importación solo de TypeScript.
  // CrearTareaInput desaparece al compilar. Solo sirve para que TypeScript
  // verifique que el objeto que construimos tiene los campos correctos.
} from '@/adapters/ui/hooks/useTareas'
// El componente importa TODO desde el hook — nunca salta a application/ ni domain/.
// El hook re-exporta los tipos para que el componente los use sin saltar capas.


// ─────────────────────────────────────────────────────────────────────────────
// Definición de Props
// ─────────────────────────────────────────────────────────────────────────────

interface TareaFormProps {
  // "interface" = TypeScript. Define los "parámetros" del componente.
  // En React, los parámetros de un componente se llaman "props".
  // Desaparece al compilar — el browser solo ve la función React.

  onTareaCreada?: () => void
  // "?" después del nombre = prop OPCIONAL. Si no se pasa, es undefined.
  // "() => void" = una función que no recibe parámetros y no devuelve nada.
  // El padre puede pasar una función para saber cuándo se creó una tarea.
}


// ─────────────────────────────────────────────────────────────────────────────
// El Componente
// ─────────────────────────────────────────────────────────────────────────────

export function TareaForm({ onTareaCreada }: TareaFormProps) {
  // "function TareaForm(...)" = función JavaScript — existe en runtime.
  // "{ onTareaCreada }: TareaFormProps" = destructuring de props con tipo TypeScript.
  //   Destructuring = extraer propiedades de un objeto:
  //   { onTareaCreada } = props  →  const onTareaCreada = props.onTareaCreada

  // ── Estado local del formulario ─────────────────────────────────────────────

  const [titulo, setTitulo] = useState<string>('')
  // "useState<string>('')" — crea una "caja de memoria" para el título.
  //   useState → JavaScript runtime (hook de React)
  //   <string> → TypeScript: la caja solo puede contener strings
  //   ''       → valor inicial: string vacío
  //
  // Devuelve un array de 2 elementos:
  //   [0] titulo    = el valor actual (string)
  //   [1] setTitulo = función para cambiar el valor (dispara re-render)
  //
  // Cada vez que setTitulo('nuevo valor') se llama:
  //   1. React actualiza "titulo" al nuevo valor.
  //   2. React vuelve a ejecutar esta función (re-render).
  //   3. El JSX se redibuja con el nuevo valor.

  const [errorLocal, setErrorLocal] = useState<string>('')
  // Guardamos el mensaje de error de validación del Domain.
  // Si el Domain lanza Error, lo capturamos y lo mostramos al usuario.

  // ── Hook del Adapter ────────────────────────────────────────────────────────

  const { mutate, isPending } = useCrearTarea()
  // "useCrearTarea()" → llama al hook del Adapter. Devuelve un objeto.
  // Destructuring del objeto: extraemos solo lo que necesitamos.
  //
  //   mutate    → función JavaScript. Llama al UseCase cuando el usuario envía el form.
  //   isPending → boolean. True mientras el request HTTP está en vuelo.
  //               React Query lo actualiza automáticamente.
  //               Lo usamos para deshabilitar el botón y mostrar "Guardando...".

  // ── Manejador del formulario ─────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    // "handleSubmit" = función JavaScript que se ejecuta al enviar el form.
    // "e: React.FormEvent" → TypeScript: el parámetro "e" es un evento de formulario React.
    //   ": React.FormEvent" desaparece al compilar — solo verifica el tipo.

    e.preventDefault()
    // "preventDefault()" previene el comportamiento por defecto del form HTML.
    // Por defecto, un <form> recarga la página al enviarse.
    // Con preventDefault(), detenemos la recarga y manejamos el envío nosotros.
    // Este método SÍ existe en runtime — es JavaScript del browser.

    setErrorLocal('')
    // Limpiamos el error anterior antes de intentar de nuevo.
    // setErrorLocal('') dispara un re-render (React redibuja el componente).

    // ── Construir el INPUT DTO ────────────────────────────────────────────────
    const input: CrearTareaInput = {
      // "CrearTareaInput" → TypeScript. Verifica que el objeto tenga ".titulo".
      // Si olvidás "titulo:" o escribís mal el nombre, TypeScript falla AQUÍ
      // (al programar) — no en runtime cuando el usuario usa la app.
      titulo: titulo.trim(),
      // ".trim()" → elimina espacios al inicio y al final.
      // "Comprar leche  " → "Comprar leche"
    }

    // ── Llamar al hook ────────────────────────────────────────────────────────
    mutate(input, {
      // "mutate(input, callbacks)" → JavaScript runtime.
      // React Query llama a mutationFn(input) internamente.
      // Los callbacks son opcionales — podemos pasar lógica específica de ESTA pantalla.

      onSuccess: () => {
        // Se ejecuta cuando el UseCase y el repo completaron sin errores.
        setTitulo('')
        // Limpiamos el campo de texto. setTitulo('') dispara re-render.

        onTareaCreada?.()
        // "?." = optional chaining. Llama a onTareaCreada() solo si fue pasado.
        // Si onTareaCreada es undefined, no hace nada (no lanza error).
        // "?." es JavaScript moderno (ES2020) — funciona en el browser.
      },

      onError: (error: Error) => {
        // Se ejecuta cuando algo falló (validación del Domain, error HTTP, etc.).
        // "error: Error" → TypeScript: el error es un objeto Error con ".message".
        setErrorLocal(error.message)
        // Mostramos el mensaje de error al usuario.
        // Ej: "El título debe tener al menos 3 caracteres."
      },
    })
  }

  // ── JSX — lo que se renderiza en la pantalla ──────────────────────────────

  return (
    // "return (...)" → el componente devuelve JSX.
    // JSX compila a: React.createElement('form', { onSubmit: handleSubmit }, ...)
    // El browser nunca ve JSX — solo ve el JavaScript compilado.

    <form
      onSubmit={handleSubmit}
      // "onSubmit" → React escucha el evento "submit" del form.
      // Cuando el usuario hace click en el botón de tipo "submit" o presiona Enter,
      // React llama a handleSubmit automáticamente.
      // "{handleSubmit}" → lleva entre llaves porque es una expresión JS dentro de JSX.

      className="flex gap-2 mb-6"
      // "className" en JSX = "class" en HTML.
      // React usa "className" porque "class" es una keyword reservada en JavaScript.
      // Tailwind: "flex" = display:flex, "gap-2" = espacio entre hijos, "mb-6" = margin-bottom.
    >
      <input
        type="text"
        value={titulo}
        // "value={titulo}" → hace el input "controlado" por React.
        // React controla el valor del input (no el browser).
        // El input siempre muestra lo que tiene la variable "titulo".

        onChange={(e) => setTitulo(e.target.value)}
        // "onChange" → se ejecuta CADA VEZ que el usuario escribe un carácter.
        // "(e) => ..." → arrow function: recibe el evento, sin paréntesis en params de uno.
        // "e.target" → el elemento HTML del input.
        // "e.target.value" → el texto actual del input (string).
        // "setTitulo(e.target.value)" → actualiza la "caja de memoria" → re-render.
        // Flujo: usuario escribe → onChange → setTitulo → re-render → value={titulo} actualizado

        placeholder="Nueva tarea..."
        // "placeholder" = texto gris que aparece cuando el input está vacío.

        disabled={isPending}
        // "disabled={isPending}" → si isPending=true, el input queda bloqueado.
        // El usuario no puede escribir mientras se está guardando.
        // "{isPending}" → expresión JS dentro de JSX: reemplaza el valor real.

        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        // Tailwind classes: flex-1 = ocupa espacio restante, border = borde, rounded = esquinas redondeadas,
        // px-3 py-2 = padding horizontal/vertical, focus:ring-2 = anillo azul al hacer foco.
      />

      <button
        type="submit"
        // "type='submit'" → este botón envía el form al hacer click.
        // React llama a onSubmit={handleSubmit} automáticamente.

        disabled={isPending}
        // Si isPending=true, el botón queda deshabilitado (no clickeable).
        // Evita que el usuario envíe el form múltiples veces mientras espera.

        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        // hover:bg-blue-700 = color oscuro al pasar el mouse.
        // disabled:opacity-50 = semitransparente cuando está deshabilitado.
        // transition-colors = animación suave del cambio de color.
      >
        {isPending ? 'Guardando...' : 'Agregar'}
        {/* Expresión ternaria: condición ? valor_si_true : valor_si_false */}
        {/* Si isPending=true → muestra "Guardando...", sino → "Agregar" */}
        {/* "{}" en JSX = insertar expresión JavaScript dentro del HTML */}
      </button>

      {errorLocal && (
        // "errorLocal &&" → renderizado condicional.
        // Si errorLocal es string vacío (''), "" es falsy → no renderiza nada.
        // Si errorLocal tiene texto, es truthy → renderiza el div de error.
        // Esta es la forma idiomática de "if" en JSX (no podés usar if directamente).
        <p className="text-red-500 text-sm mt-1">{errorLocal}</p>
      )}
    </form>
  )
}
