---
name: BlackGold Creativity Lab
description: Mesa de producción visual dark premium para crear, revisar, aprobar y archivar contenido Black Gold.
colors:
  surface-base: "#09090b"
  surface-sunken: "#0d0d0f"
  surface-card: "#121214"
  surface-raised: "#18181b"
  surface-top: "#1f1f23"
  gold-action: "#ffd700"
  gold-action-hover: "#ffd700"
  gold-structural: "#ffd700"
  text-primary: "#ededed"
  text-secondary: "#9ca3af"
  text-muted: "#828997"
  border-default: "rgba(255, 255, 255, .09)"
  border-strong: "rgba(255, 255, 255, .16)"
  state-success: "#71c99a"
  state-danger: "#ee817b"
  line-muted: "#4d5159"
  placeholder: "#606671"
  overlay-modal: "rgba(3,3,4,.78)"
  shadow-modal: "rgba(0,0,0,.48)"
typography:
  display:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "clamp(25px, 2.4vw, 34px)"
    fontWeight: 800
    letterSpacing: "-.035em"
  headline:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    letterSpacing: "-.025em"
  title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    letterSpacing: ".16em"
  micro:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "9px"
    fontWeight: 400
  metadata:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
  supporting:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
  section-compact:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
  button:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 800
  brand-wordmark:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 900
    letterSpacing: ".15em"
  editorial-light:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontWeight: 300
rounded:
  badge: "5px"
  thumbnail: "8px"
  field: "9px"
  control: "10px"
  preview: "11px"
  panel: "12px"
  brand-tile: "13px"
  modal-compact: "14px"
  modal: "16px"
  pill: "999px"
spacing:
  micro: "5px"
  compact: "8px"
  control: "12px"
  card: "13px"
  section: "16px"
  rail: "22px"
  panel: "24px"
  workspace: "30px"
  empty: "32px"
components:
  button-primary:
    backgroundColor: "{colors.gold-action}"
    textColor: "{colors.surface-base}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.gold-action-hover}"
    textColor: "{colors.surface-base}"
    rounded: "{rounded.control}"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-approval:
    backgroundColor: "{colors.text-primary}"
    textColor: "{colors.surface-base}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  input:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
    height: "44px"
  card-job:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.panel}"
    padding: "0"
  nav-active:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.control}"
    height: "46px"
---

# Design System: BlackGold Creativity Lab

## Overview

**Creative North Star: "La mesa de producción Black Gold"**

Creativity Lab es una mesa de producción viva: agentes, piezas y estados comparten una sola escena operativa desde la idea hasta el archivo. Su mundo visual es el vestuario de élite Black Gold llevado a software: negros estratificados, Outfit, líneas finas que recuerdan una cancha y una luz dorada que aparece únicamente cuando algo requiere atención o acción. La interfaz debe sentirse precisa, sobria y preparada para trabajar; nunca como un generador aislado lleno de tarjetas equivalentes.

El modo es **Operate**. La cola visual domina, el circuito permanece legible y la intervención humana tiene prioridad sobre el espectáculo. La luz siempre comunica una función: acción principal, etapa actual, selección o advertencia. La densidad es compacta en el control y generosa alrededor del contenido visual.

### Jerarquía oficial de marca

1. **Escudo institucional:** identidad oficial completa para presentaciones institucionales, documentos formales, alianzas y contextos donde debe aparecer BLACK GOLD + jaguar + BALONCESTO · SUCUMBÍOS.
2. **Cabeza de jaguar:** identificador oficial del producto; úsese en favicon, icono de aplicación, navegación compacta, estados vacíos y avatares de marca. `BrandMark` implementa esta función.
3. **Media cara:** recurso gráfico expresivo para recortes, fondos y composiciones editoriales; nunca reemplaza al escudo ni a la cabeza del producto.
4. **Doble B:** monograma secundario para firmas, sellos o espacios de marca ya contextualizados; no es el identificador predeterminado del producto.

**The Brand Authority Rule.** La superficie elige la marca según esta jerarquía; no redibuja, mezcla ni promueve un recurso secundario para resolver falta de espacio.

### Ecosistema operativo

- **System OS** conserva la cola canónica, los metadatos y las acciones; la web representa ese estado, no crea una segunda fuente de verdad.
- **Telegram** es un control rápido complementario sobre la misma cola y debe conservar nombres, estados y confirmaciones equivalentes.
- **Google Drive** es el archivo verificado y descargable; su conexión se muestra como servicio, pero nunca sustituye a la cola transaccional.
- **Proveedor local** significa System OS + ComfyUI por defecto; rutas premium deben aparecer desactivadas hasta una decisión explícita y ningún secreto llega al navegador.

**Key Characteristics:**

- Cinco superficies negras canónicas y bordes de baja intensidad.
- Un solo acento dorado sólido por vista.
- Cola dominante, inspector contextual y aprobación humana visible.
- Estado explicado con texto, icono o contexto además del color.
- La cabeza de jaguar identifica el producto; los demás signos respetan su rango.

## Colors

La paleta se construye por profundidad tonal, no por paneles decorativos. Los tokens del frontmatter son normativos.

### Primary

- **Oro de acción** (`gold-action`): única llamada principal de la vista, selección explícita y foco de teclado.
- **Oro de respuesta** (`gold-action-hover`): el mismo oro de marca con cambio de luminosidad por CSS; no introduce otro matiz.

### Secondary

- **Oro estructural** (`gold-structural`): alias del oro único reservado al foco de teclado y de campos; nunca crea otra masa dorada.

### Neutral

- **Negro base** (`surface-base`): lienzo general y contraste oscuro dentro del jaguar.
- **Negro hundido** (`surface-sunken`): sidebar, campos, medios pendientes y zonas internas.
- **Negro tarjeta** (`surface-card`): diálogo y superficies contenidas.
- **Negro elevado** (`surface-raised`): navegación activa, avisos y controles secundarios.
- **Negro superior** (`surface-top`): hover elevado y contadores.
- **Texto principal, secundario y tenue**: la escala `text-*` sostiene jerarquía sin reducir todo a blanco o gris único.
- **Borde tenue y borde fuerte**: `border-default` separa estructura; `border-strong` responde a hover, selección y contención crítica.

### Semantic

- **Éxito sereno** (`state-success`): conexión activa y aprobación.
- **Peligro humano** (`state-danger`): fallo o acción destructiva; siempre acompañado por una etiqueta legible.

**The One Gold Rule.** Reserva el oro sólido a un único logro o acción principal por vista. El oro puede reaparecer como texto, borde o indicador funcional, pero no como una segunda masa competidora.

**The Five Blacks Rule.** La profundidad se expresa con `surface-base`, `surface-sunken`, `surface-card`, `surface-raised` y `surface-top`; no se inventan negros locales para cada componente.

## Typography

**Display Font:** Outfit con respaldo `system-ui, sans-serif`
**Body Font:** Outfit con respaldo `system-ui, sans-serif`
**Technical IDs:** `ui-monospace, monospace`, únicamente para identificadores de trabajo.

Outfit da al producto una voz geométrica, atlética y contemporánea. La jerarquía surge del peso, tamaño y espaciado; no necesita mezclar familias ni recurrir a mayúsculas en párrafos.

### Hierarchy

- **300 — Light:** acento editorial excepcional o contenido futuro de gran escala; nunca texto pequeño ni controles críticos.
- **400 — Regular:** párrafos, metadatos y texto de formulario.
- **600 — Semibold:** títulos de tarjeta, etiquetas, estados y subtítulos operativos.
- **800 — ExtraBold:** encabezados, botones y decisiones de alta importancia.
- **900 — Black:** wordmark BLACK GOLD y firmas de marca muy breves; no para bloques de lectura.

El `display` fluido gobierna el H1; `headline` los H2; `title` las tarjetas; `body` campos y contenido; `label` los eyebrows compactos en mayúsculas. Las etiquetas usan tracking positivo; los encabezados usan tracking negativo. Los textos extensos mantienen 1.5 de interlineado y una medida objetivo de 60–72 caracteres.

**The One Family Rule.** Outfit cubre producto y contenido. El monoespaciado comunica datos técnicos, no una segunda personalidad visual.

## Layout

La escena de escritorio usa una shell de dos columnas: sidebar fija de 232 px y workspace flexible con 30 px de respiración lateral. Dentro del workspace, la barra superior, el pulso de servicios y el flujo de cinco etapas preparan la lectura; después, una grilla separa la cola dominante del inspector de 310 px. La cola muestra tres tarjetas por fila y el inspector mantiene variantes, decisiones, metadatos y agentes junto a la pieza activa.

### Responsive

- **Hasta 1180 px:** la sidebar se reduce a 78 px, oculta texto y contadores, la cola pasa a dos columnas y desaparece la nota secundaria del proveedor.
- **Hasta 850 px:** la navegación se convierte en barra inferior fija de 66 px; servicio y flujo admiten desplazamiento horizontal; el inspector se apila bajo la cola y su preview adopta 16:10.
- **Hasta 560 px:** la cola pasa a una lista de tarjetas horizontales 42/58, el formulario se apila, el refresh secundario se oculta y el diálogo conserva dos acciones de igual ancho.

Los espacios responden a contenido y a los tokens del frontmatter. Evite introducir máximos de ancho arbitrarios que separen la cola del inspector o rompan la continuidad del circuito.

### Reuse across future surfaces

- **Web:** extiende la shell, cola, estados, inspector y cinco niveles de superficie antes de crear patrones nuevos.
- **App móvil:** parte de la navegación inferior, objetivos de 44 px, Outfit y cabeza de jaguar como icono.
- **API / developer console:** reutiliza nombres y tonos semánticos de estado en documentación, logs y ejemplos; no copia valores de color fuera de los tokens.
- **Admin:** reutiliza servicio, proveedor, agentes y confirmaciones, reservando el oro para la acción administrativa principal.

**The One Queue Rule.** Web, app, Telegram, API y admin pueden cambiar la composición, pero nunca el vocabulario ni la jerarquía de la cola canónica.

## Elevation & Depth

El sistema es tonal y delineado por defecto. La mayoría de las superficies no proyecta sombra: profundidad significa cambiar de uno de los cinco negros al siguiente y reforzar el borde. Las excepciones funcionales son el diálogo, con sombra ambiental amplia, los halos mínimos de estado y el subrayado neutro interior de la tarjeta activa.

### Shadow vocabulary

- **Modal ambient:** `0 28px 80px rgba(0,0,0,.48)` separa una decisión bloqueante del workspace.
- **Status halo:** anillo de 4 px y baja opacidad alrededor del punto; amplía presencia sin convertirlo en ornamento.
- **Active inset:** línea interior inferior de 2 px en texto secundario; confirma la tarjeta seleccionada sin levantarla visualmente.

### Motion

Las transiciones de controles y tarjetas duran 160 ms con `ease`. El backdrop aparece en 160 ms; el diálogo entra en 220 ms con `cubic-bezier(.2,.8,.2,1)`, un desplazamiento vertical de 10 px y escala inicial .99. La tarjeta puede elevarse solo 1 px al hover.

Todas las transiciones y animaciones viven dentro de `prefers-reduced-motion: no-preference`; con movimiento reducido no se sustituyen por otra animación. No hay loops, parallax ni actividad decorativa: el estado se actualiza por contenido y texto.

**The Functional Motion Rule.** El movimiento explica entrada, hover o selección y termina inmediatamente; nunca simula trabajo que el sistema no está realizando.

## Shapes

La geometría mezcla paneles discretamente redondeados con contenido visual recortado. Los campos usan 9 px, controles 10 px, previews 11 px, tarjetas y filas de servicio 12 px, tile de marca 13 px y modal 16 px. Píldoras de 999 px se reservan a estados y contadores; no son la forma universal del producto.

Bordes finos y translúcidos definen estructura. Las líneas verticales y horizontales recuerdan marcadores y cancha sin convertirse en decoración literal. Las imágenes respetan sus ratios operativos: 4:3 en cola, 4:5 en inspector de escritorio, 16:10 cuando el inspector se apila y 1:1 en variantes.

**The Contained Curve Rule.** Las curvas suavizan áreas táctiles y medios; no convierten cada bloque de texto en una tarjeta flotante.

## Components

### Brand lockup

Combina la cabeza de jaguar en un tile dorado de 46 px con BLACK GOLD en peso 900 y “Creativity Lab” como descriptor. En navegación compacta se conserva solo la cabeza. El SVG recibe nombre accesible mediante `title`, `role="img"` y `aria-label`.

### Navigation

La sidebar de escritorio es estructural, sticky y oscura. Los elementos inactivos son tenues; hover usa una superficie más alta; activo añade superficie, borde e icono claro. En móvil se transforma en navegación inferior de tres destinos reales, con icono y etiqueta visibles. La página actual usa `aria-current="page"`.

### Buttons

- **Primary:** masa dorada, texto negro, mínimo 44 px y peso 800; una por vista o decisión local claramente acotada.
- **Secondary:** `surface-raised`, borde fuerte y texto principal; para cancelar, revisar o iniciar una acción sin primacía global.
- **Approval:** texto claro sobre fondo claro invertido a negro; distingue aprobación humana de creación dorada.
- **Icon:** 44 × 44 px, fondo transparente y borde tenue; siempre requiere nombre accesible.

Disabled reduce opacidad y cambia el cursor; hover nunca debe ser la única señal de disponibilidad. Focus visible usa un contorno dorado de 2 px con 3 px de separación.

### Job cards and inspector

Las tarjetas son botones completos con preview, badge textual, tipo de workflow, título, revisión y tiempo. Hover refuerza borde; selección agrega una línea clara interior. El inspector responde a la selección y reúne preview, variantes, acciones, metadatos y agentes sin duplicar la cola. Una variante seleccionada usa borde y número claros, junto con texto de elección.

### Status and workflow

Los pulsos de servicio combinan punto, etiqueta y detalle. El flujo conserva cinco pasos numerados — Idea, Brief, Atlas, Revisión, Drive — y la etapa activa usa texto principal. Éxito, advertencia y fallo siempre mantienen un equivalente textual.

### Forms and dialog

Los campos viven en `surface-sunken`, tienen 44 px mínimos, borde tenue y foco con `gold-structural`. El modal tiene ancho máximo de 680 px, padding de 24 px y scroll interno en viewports bajos. Debe capturar el foco, cerrar con Escape, devolver el foco al disparador y conservar `role="dialog"`, `aria-modal="true"` y título enlazado.

### Accessibility contract

- Contraste mínimo WCAG AA; el oro sólido usa texto oscuro y los textos tenues se validan según tamaño y fondo.
- Navegación completa por teclado, orden lógico, foco visible y objetivos táctiles mínimos de 44 × 44 px.
- Estado nunca solo por color: incluya etiqueta, número, icono o descripción; mensajes dinámicos usan una región de estado.
- Imágenes de pieza tienen alt contextual; thumbnails decorativos pueden usar alt vacío si el botón ya nombra la acción.
- Iconos decorativos permanecen ocultos a tecnologías asistivas; botones de solo icono llevan `aria-label` específico.

## Do's and Don'ts

### Do

- **Do** mantener la cola, la pieza activa, el agente y la etapa visibles como partes del mismo circuito.
- **Do** aplicar la jerarquía oficial: escudo institucional, cabeza de producto, media cara gráfica y doble B secundaria.
- **Do** reservar el oro sólido para la acción o logro principal y usar luz únicamente con significado.
- **Do** conservar aprobación y publicación como decisiones separadas, explícitas y humanas.
- **Do** reutilizar tokens, estados, lenguaje accesible y reduced motion en web, app, Telegram, API y admin.

### Don't

- **Don't** convertir la experiencia en un generador genérico con tarjetas equivalentes, neón, gradientes gratuitos o glows dorados decorativos.
- **Don't** usar media cara o doble B como sustituto del escudo institucional o de la cabeza de jaguar del producto.
- **Don't** inventar negros, radios, tipografías o acentos locales cuando ya existe un token canónico.
- **Don't** comunicar estado solo con color, depender solo de hover ni animar cuando el usuario solicita movimiento reducido.
- **Don't** exponer secretos, activar proveedores premium por defecto, publicar automáticamente ni tratar Drive como base transaccional.
