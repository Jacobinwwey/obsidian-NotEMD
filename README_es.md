![GitHub Release](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2Jacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![GitHub Downloads](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)	![GitHub Repo stars](https://img.shields.io/github/stars/Jacobinwwey/obsidian-NotEMD?style=social)
![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=Downloads&query=%24%5B%22notemd%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

# Complemento Notemd para Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Lea los documentos en más idiomas: [Centro de Idiomas](./docs/i18n/README.md)

```
==================================================
  _   _       _   _ ___    __  __ ___
 | \ | | ___ | |_| |___|  |  \/  |___ \
 |  \| |/ _ \| __| |___|  | |\/| |   | |
 | |\  | (_) | |_| |___   | |  | |___| |
 |_| \_|\___/ \__|_|___|  | |  | |____/
==================================================
 Mejora del conocimiento multilingüe con IA
==================================================
```

¡Una forma fácil de crear tu propia base de conocimientos!

Notemd mejora tu flujo de trabajo en Obsidian integrándose con varios Modelos de Lenguaje de Gran Tamaño (LLM) para procesar tus notas multilingües, generar automáticamente enlaces wiki para conceptos clave, crear notas de conceptos correspondientes, realizar investigación web, ayudándote a construir potentes grafos de conocimiento y más.

Si te encanta usar Notemd, por favor considera [⭐ dar una estrella en GitHub](https://github.com/Jacobinwwey/obsidian-NotEMD) o [☕️ comprarme un café](https://ko-fi.com/jacobinwwey).

**Versión:** 1.8.4

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />
<img width="1853" height="1080" alt="multi-langu" src="https://github.com/user-attachments/assets/d9a0a4fb-1c00-425a-ac1d-0134a013a381" />
<img width="1657" height="1000" alt="NEW FEATURE" src="https://github.com/user-attachments/assets/3099bf73-97d1-482b-ba97-c28b113b623e" />

## Tabla de Contenidos

- [Inicio Rápido](#inicio-rápido)
- [Soporte de Idiomas](#soporte-de-idiomas)
- [Características](#características)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Guía de Uso](#guía-de-uso)
- [Proveedores de LLM Soportados](#proveedores-de-llm-soportados)
- [Uso de Red y Manejo de Datos](#uso-de-red-y-manejo-de-datos)
- [Solución de Problemas](#solución-de-problemas)
- [Contribuir](#contribuir)
- [Documentación del Mantenedor](#documentación-del-mantenedor)
- [Licencia](#licencia)

## Inicio Rápido

1.  **Instalar y Activar**: Obtén el complemento desde el Marketplace de Obsidian.
2.  **Configurar LLM**: Ve a `Configuración -> Notemd`, selecciona tu proveedor de LLM (como OpenAI o uno local como Ollama) e ingresa tu clave API/URL.
3.  **Abrir Barra Lateral**: Haz clic en el icono de la varita de Notemd en la cinta izquierda para abrir la barra lateral.
4.  **Procesar una Nota**: Abre cualquier nota y haz clic en **"Procesar archivo (Añadir enlaces)"** en la barra lateral para añadir automáticamente `[[wiki-links]]` a los conceptos clave.
5.  **Ejecutar un Flujo de Trabajo Rápido**: Usa el botón predeterminado **"One-Click Extract"** para encadenar el procesamiento, la generación por lotes y la limpieza de Mermaid desde un solo punto de entrada.

¡Eso es todo! Explora los ajustes para desbloquear más funciones como investigación web, traducción y generación de contenido.

## Soporte de Idiomas

### Contrato de Comportamiento del Idioma

| Aspecto | Alcance | Predeterminado | Notas |
|---|---|---|---|
| `Idioma de la interfaz` | Solo texto de la interfaz (ajustes, barra lateral, avisos) | `auto` | Sigue el idioma de Obsidian; los catálogos actuales son `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`. |
| `Idioma de salida de tareas` | Salida de tareas generada por LLM (enlaces, resúmenes, generación, extracción, objetivo de traducción) | `en` | Puede ser global o por tarea cuando se activa `Usar diferentes idiomas para tareas`. |
| `Desactivar la traducción automática` | Las tareas que no son de traducción mantienen el contexto original | `false` | Las tareas explícitas de `Traducir` siguen aplicando el idioma objetivo configurado. |
| `Idioma de respaldo` | Resolución de claves de UI faltantes | locale -> `en` | Mantiene la UI estable cuando algunas claves no están traducidas. |

- Los documentos fuente mantenidos son inglés y chino simplificado, y las traducciones README publicadas están enlazadas en el encabezado superior.
- La cobertura de UI locale dentro de la aplicación coincide actualmente con el catálogo explícito del código: `en`, `ar`, `de`, `es`, `fa`, `fr`, `id`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`.
- El fallback al inglés sigue existiendo como red de seguridad de implementación, pero las superficies visibles soportadas están cubiertas por pruebas de regresión y no deberían volver silenciosamente al inglés en el uso normal.
- Más detalles y pautas de contribución se encuentran en el [Centro de Idiomas](./docs/i18n/README.md).

## Características

### Procesamiento de Documentos con IA
- **Soporte Multi-LLM**: Conéctate a varios proveedores de LLM en la nube y locales (ver [Proveedores de LLM Soportados](#proveedores-de-llm-soportados)).
- **Fragmentación Inteligente**: Divide automáticamente documentos grandes en partes manejables basadas en el recuento de palabras para su procesamiento.
- **Preservación de Contenido**: Mantiene el formato original mientras añade estructura y enlaces.
- **Seguimiento de Progreso**: Actualizaciones en tiempo real a través de la barra lateral de Notemd o un modal de progreso.
- **Operaciones Cancelables**: Cancela cualquier tarea de procesamiento (individual o por lotes) iniciada desde la barra lateral mediante su botón de cancelación dedicado. Las operaciones de la paleta de comandos usan un modal que también se puede cancelar.
- **Configuración Multi-Modelo**: Usa diferentes proveedores de LLM *y* modelos específicos para diferentes tareas (Añadir enlaces, Investigación, Generar título, Traducir) o usa un único proveedor para todo.
- **Llamadas API Estables (Lógica de Reintento)**: Activa opcionalmente reintentos automáticos para llamadas API de LLM fallidas con intervalos y límites de intentos configurables.
- **Pruebas de Conexión de Proveedor Resilientes**: Si la primera prueba falla por una desconexión temporal, Notemd ahora recurre a la secuencia de reintento estable antes de fallar, cubriendo transportes compatibles con OpenAI, Anthropic, Google, Azure OpenAI y Ollama.
- **Recurso de Transporte de Entorno de Ejecución**: Cuando una solicitud de larga duración se cae por `requestUrl` con errores de red transitorios como `ERR_CONNECTION_CLOSED`, Notemd ahora reintenta el mismo intento a través de un transporte de reserva específico del entorno antes de entrar en el bucle de reintento configurado: las versiones de escritorio usan Node `http/https`, mientras que los entornos que no son de escritorio usan `fetch` del navegador. Esto reduce los fallos falsos en pasarelas lentas y proxies inversos.
- **Refuerzo de Cadena de Solicitud Larga Estable compatible con OpenAI**: En modo estable, las llamadas compatibles con OpenAI ahora usan un orden explícito de 3 etapas para cada intento: transporte de streaming directo primario, luego transporte directo sin streaming, luego reserva `requestUrl` (que aún puede actualizarse a análisis en streaming cuando sea necesario). Esto reduce los falsos negativos donde los proveedores completan respuestas en búfer pero los conductos de streaming son inestables.
- **Reserva de Streaming Sensible al Protocolo en todas las API de LLM**: Los intentos de reserva de larga duración ahora se actualizan a un análisis en streaming sensible al protocolo en cada ruta de LLM integrada, no solo en los puntos finales compatibles con OpenAI. Notemd ahora maneja SSE al estilo OpenAI/Azure, streaming de mensajes de Anthropic, respuestas SSE de Google Gemini y flujos NDJSON de Ollama tanto en escritorio `http/https` como en `fetch` fuera de escritorio, y los puntos de entrada de proveedores directos restantes al estilo OpenAI reutilizan esa misma ruta de reserva compartida.
- **Ajustes Preestablecidos Listos para China**: Los ajustes integrados ahora cubren `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan` y `SiliconFlow` además de los proveedores globales y locales existentes.
- **Procesamiento por Lotes Confiable**: Lógica de procesamiento concurrente mejorada con **llamadas API escalonadas** para evitar errores de límite de velocidad y garantizar un rendimiento estable durante grandes trabajos por lotes. La nueva implementación garantiza que las tareas se inicien en diferentes intervalos en lugar de todas a la vez.
- **Informes de Progreso Precisos**: Se corrigió un error donde la barra de progreso podía atascarse, asegurando que la interfaz refleje siempre el estado real de la operación.
- **Procesamiento por Lotes en Paralelo Robusto**: Se resolvió un problema donde las operaciones por lotes en paralelo se detenían prematuramente, asegurando que todos los archivos se procesen de manera confiable y eficiente.
- **Precisión de la Barra de Progreso**: Se corrigió un error donde la barra de progreso para el comando "Crear enlace Wiki y Generar nota" se quedaba en el 95%, asegurando que ahora muestre correctamente el 100% al finalizar.
- **Depuración de API Mejorada**: El "Modo de Depuración de Errores de API" ahora captura los cuerpos de respuesta completos de los proveedores de LLM y servicios de búsqueda (Tavily/DuckDuckGo), y también registra una línea de tiempo de transporte por intento con URLs de solicitud saneadas, duración transcurrida, encabezados de respuesta, cuerpos de respuesta parciales, contenido de flujo parcial analizado y trazas de pila para una mejor resolución de problemas en las reservas de OpenAI, Anthropic, Google, Azure OpenAI y Ollama.
- **Panel de Modo Desarrollador**: Los ajustes ahora incluyen un panel de diagnóstico dedicado solo para desarrolladores que permanece oculto a menos que se active el "Modo desarrollador". Permite seleccionar rutas de llamada de diagnóstico y ejecutar sondas de estabilidad repetidas para el modo seleccionado.
- **Barra Lateral Rediseñada**: Las acciones integradas se agrupan en secciones enfocadas con etiquetas más claras, estado en vivo, progreso cancelable y registros copiables para reducir el desorden. El pie de página de progreso/registro ahora permanece visible incluso cuando todas las secciones están expandidas, y el estado de listo usa una pista de progreso de espera más clara.
- **Pulido de Interacción y Legibilidad de la Barra Lateral**: Los botones de la barra lateral ahora proporcionan una respuesta de desplazamiento/presión/foco más clara, y los botones de llamada a la acción (CTA) coloridos (incluidos `One-Click Extract` y `Generación por lotes desde títulos`) usan un contraste de texto más fuerte para una mejor legibilidad en diferentes temas.
- **Mapeo de CTA para un Solo Archivo**: El estilo de CTA colorido ahora se reserva solo para acciones de un solo archivo. Las acciones a nivel de lote/carpeta y los flujos de trabajo mixtos usan un estilo que no es CTA para reducir los clics erróneos en el alcance de la acción.
- **Flujos de Trabajo Personalizados de un Solo Clic**: Convierte las utilidades integradas de la barra lateral en botones personalizados reutilizables con nombres definidos por el usuario y cadenas de acciones ensambladas. Se incluye un flujo de trabajo predeterminado `One-Click Extract`.


### Mejora del Grafo de Conocimiento
- **Wiki-Linking Automático**: Identifica y añade `[[wiki-links]]` a los conceptos principales dentro de tus notas procesadas basándose en la salida del LLM.
- **Creación de Notas de Concepto (Opcional y Personalizable)**: Crea automáticamente nuevas notas para los conceptos descubiertos en una carpeta específica del vault.
- **Rutas de Salida Personalizables**: Configura rutas relativas separadas dentro de tu vault para guardar archivos procesados y notas de concepto recién creadas.
- **Nombres de Archivo de Salida Personalizables (Añadir Enlaces)**: Sobrescribe opcionalmente el **archivo original** o usa un sufijo/cadena de reemplazo personalizado en lugar del predeterminado `_processed.md` al procesar archivos para enlaces.
- **Mantenimiento de Integridad de Enlaces**: Manejo básico para actualizar enlaces cuando las notas se renombran o eliminan dentro del vault.
- **Extracción de Conceptos Pura**: Extrae conceptos y crea las notas de concepto correspondientes sin modificar el documento original. Esto es ideal para poblar una base de conocimientos a partir de documentos existentes sin alterarlos. Esta característica tiene opciones configurables para crear notas de concepto mínimas y añadir enlaces de retroceso.


### Traducción

- **Traducción Impulsada por IA**:
    - Traduce el contenido de las notas usando el LLM configurado.
    - **Soporte para Archivos Grandes**: Divide automáticamente los archivos grandes en fragmentos más pequeños basados en el ajuste de `Recuento de palabras por fragmento` antes de enviarlos al LLM. Los fragmentos traducidos se combinan luego de forma fluida en un único documento.
    - Soporta traducción entre múltiples idiomas.
    - Idioma de destino personalizable en ajustes o en la interfaz de usuario.
    - Abre automáticamente el texto traducido a la derecha del texto original para una lectura fácil.
- **Traducción por Lotes**:
    - Traduce todos los archivos dentro de una carpeta seleccionada.
    - Soporta procesamiento en paralelo cuando el "Paralelismo de Lotes" está activado.
    - Usa prompts personalizados para la traducción si se configuran.
	- Añade una opción de "Traducir esta carpeta por lotes" al menú contextual del explorador de archivos.
- **Desactivar traducción automática**: Cuando esta opción está activada, las tareas que no son de traducción ya no forzarán las salidas a un idioma específico, preservando el contexto del idioma original. La tarea explícita de "Traducir" seguirá realizando la traducción según lo configurado.


### Investigación Web y Generación de Contenido
- **Investigación Web y Resumen**:
    - Realiza búsquedas web usando Tavily (requiere clave API) o DuckDuckGo (experimental).
    - **Robustez de Búsqueda Mejorada**: La búsqueda de DuckDuckGo ahora cuenta con una lógica de análisis mejorada (DOMParser con reserva de Regex) para manejar cambios de diseño y garantizar resultados confiables.
    - Resume los resultados de búsqueda usando el LLM configurado.
    - El idioma de salida del resumen se puede personalizar en los ajustes.
    - Añade los resúmenes a la nota actual.
    - Límite de tokens configurable para el contenido de investigación enviado al LLM.
- **Generación de Contenido desde Título**:
    - Usa el título de la nota para generar contenido inicial mediante LLM, reemplazando el contenido existente.
    - **Investigación Opcional**: Configura si se debe realizar una investigación web (usando el proveedor seleccionado) para proporcionar contexto para la generación.
- **Generación de Contenido por Lotes desde Títulos**: Genera contenido para todas las notas dentro de una carpeta seleccionada basándose en sus títulos (respeta el ajuste de investigación opcional). Los archivos procesados con éxito se mueven a una **subcarpeta "completada" configurable** (por ejemplo, `[nombre_carpeta]_complete` o un nombre personalizado) para evitar el reprocesamiento.
- **Acoplamiento de Auto-Corrección de Mermaid**: Cuando la auto-corrección de Mermaid está activada, los flujos de trabajo relacionados con Mermaid ahora reparan automáticamente los archivos generados o las carpetas de salida después del procesamiento. Esto cubre los flujos de Procesar, Generar desde título, Generar desde títulos por lotes, Investigación y resumen, Resumir como Mermaid y Traducir.


### Características de Utilidad
- **Resumir como diagrama Mermaid**:
    - Esta función te permite resumir el contenido de una nota en un diagrama Mermaid.
    - El idioma de salida del diagrama Mermaid se puede personalizar en los ajustes.
    - **Carpeta de Salida de Mermaid**: Configura la carpeta donde se guardarán los archivos de diagrama Mermaid generados.
    - **Traducir Resumen a Salida de Mermaid**: Traduce opcionalmente el contenido del diagrama Mermaid generado al idioma de destino configurado.
    
<img width="596" height="239" alt="SUMM" src="https://github.com/user-attachments/assets/08f44a41-9ec0-472c-91ee-19c8477ec639" />

- **Corrección Simple de Formato de Fórmulas**:
    - Corrige rápidamente fórmulas matemáticas de una sola línea delimitadas por un solo `$` a bloques estándar de doble `$$`.
    - **Archivo Único**: Procesa el archivo actual a través del botón de la barra lateral o la paleta de comandos.
    - **Corrección por Lotes**: Procesa todos los archivos en una carpeta seleccionada a través del botón de la barra lateral o la paleta de comandos.

- **Comprobar Duplicados en el Archivo Actual**: Este comando ayuda a identificar posibles términos duplicados dentro del archivo activo.
- **Detección de Duplicados**: Comprobación básica de palabras duplicadas dentro del contenido del archivo procesado actualmente (resultados registrados en la consola).
- **Comprobar y Eliminar Notas de Concepto Duplicadas**: Identifica posibles notas duplicadas dentro de la **Carpeta de Notas de Concepto** configurada basándose en coincidencias exactas de nombre, plurales, normalización y contención de una sola palabra en comparación con notas fuera de la carpeta. El alcance de la comparación (qué notas fuera de la carpeta de conceptos se comprueban) se puede configurar para **todo el vault**, **carpetas incluidas específicas** o **todas las carpetas excluyendo las específicas**. Presenta una lista detallada con razones y archivos en conflicto, luego solicita confirmación antes de mover los duplicados identificados a la papelera del sistema. Muestra el progreso durante la eliminación.
- **Corrección de Mermaid por Lotes**: Aplica correcciones de sintaxis de Mermaid y LaTeX a todos los archivos Markdown dentro de una carpeta seleccionada por el usuario.
    - **Listo para el Flujo de Trabajo**: Puede usarse como una utilidad independiente o como un paso dentro de un botón de flujo de trabajo personalizado de un solo clic.
    - **Informe de Errores**: Genera un informe `mermaid_error_{nombre_carpeta}.md` que enumera los archivos que aún contienen posibles errores de Mermaid después del procesamiento.
    - **Mover Archivos con Errores**: Mueve opcionalmente los archivos con errores detectados a una carpeta especificada para su revisión manual.
    - **Detección Inteligente**: Ahora comprueba inteligentemente los archivos en busca de errores de sintaxis usando `mermaid.parse` antes de intentar las correcciones, ahorrando tiempo de procesamiento y evitando ediciones innecesarias.
    - **Procesamiento Seguro**: Asegura que las correcciones de sintaxis se apliquen exclusivamente a los bloques de código de Mermaid, evitando la modificación accidental de tablas de Markdown u otro contenido. Incluye salvaguardas robustas para proteger la sintaxis de las tablas (por ejemplo, `| :--- |`) de correcciones de depuración agresivas.
    - **Modo de Depuración Profunda**: Si los errores persisten después de la corrección inicial, se activa un modo de depuración profunda avanzado. Este modo maneja casos extremos complejos, que incluyen:
        - **Integración de Comentarios**: Combina automáticamente los comentarios finales (que comienzan con `%`) en la etiqueta de la arista (por ejemplo, `A -- Etiqueta --> B; % Comentario` se convierte en `A -- "Etiqueta(Comentario)" --> B;`).
        - **Flechas Mal Formadas**: Corrige flechas absorbidas por comillas (por ejemplo, `A -- "Etiqueta -->" B` se convierte en `A -- "Etiqueta" --> B`).
        - **Subgrafos en Línea**: Convierte etiquetas de subgrafos en línea en etiquetas de aristas.
        - **Corrección de Flecha Inversa**: Corrige flechas `X <-- Y` no estándar a `Y --> X`.
        - **Corrección de Palabra Clave de Dirección**: Asegura que la palabra clave `direction` esté en minúsculas dentro de los subgrafos (por ejemplo, `Direction TB` -> `direction TB`).
        - **Conversión de Comentarios**: Convierte comentarios `//` en etiquetas de aristas (por ejemplo, `A --> B; // Comentario` -> `A -- "Comentario" --> B;`).
        - **Corrección de Etiquetas Duplicadas**: Simplifica las etiquetas entre corchetes repetidas (por ejemplo, `Node["Etiqueta"]["Etiqueta"]` -> `Node["Etiqueta"]`).
        - **Corrección de Flecha Inválida**: Convierte la sintaxis de flecha inválida `--|>` a la estándar `-->`.
        - **Manejo Robusto de Etiquetas y Notas**: Manejo mejorado para etiquetas que contienen caracteres especiales (como `/`) y mejor soporte para la sintaxis de notas personalizadas (`note for ...`), asegurando que los artefactos como los corchetes finales se eliminen limpiamente.
        - **Modo de Corrección Avanzado**: Incluye correcciones robustas para etiquetas de nodos sin comillas que contienen espacios, caracteres especiales o corchetes anidados (por ejemplo, `Node[Etiqueta [Texto]]` -> `Node["Etiqueta [Texto]"]`), asegurando la compatibilidad con diagramas complejos como las rutas de Evolución Estelar. También corrige etiquetas de aristas mal formadas (por ejemplo, `--["Etiqueta["-->` a `-- "Etiqueta" -->`). Adicionalmente convierte comentarios en línea (`Consensus --> Adaptive; # Algún consenso avanzado` a `Consensus -- "Algún consenso avanzado" --> Adaptive`) y corrige comillas incompletas al final de las líneas (`;"` al final reemplazado con `"]`).
                        - **Conversión de Notas**: Convierte automáticamente los comentarios `note right/left of` y `note :` independientes en definiciones y conexiones de nodos de Mermaid estándar (por ejemplo, `note right of A: texto` se convierte en `NoteA["Note: texto"]` vinculado a `A`), evitando errores de sintaxis y mejorando el diseño. Ahora soporta tanto enlaces de flecha (`-->`) como enlaces sólidos (`---`).
                        - **Soporte de Notas Extendido**: Convierte automáticamente `note for Node "Contenido"` y `note of Node "Contenido"` en nodos de notas vinculados estándar (por ejemplo, `NoteNode[" Contenido"]` vinculado a `Node`), asegurando la compatibilidad con la sintaxis extendida por el usuario.
                        - **Corrección de Notas Mejorada**: Renombra automáticamente las notas con numeración secuencial (por ejemplo, `Note1`, `Note2`) para evitar problemas de alias cuando hay múltiples notas presentes.
                        - **Corrección de Paralelogramo/Forma**: Corrige formas de nodos mal formadas como `[/["Etiqueta["/]` a la estándar `["Etiqueta"]`, asegurando la compatibilidad con el contenido generado.
                        - **Estandarizar Etiquetas de Tubería**: Corrige y estandariza automáticamente las etiquetas de aristas que contienen tuberías, asegurando que estén correctamente entrecomilladas (por ejemplo, `-->|Texto|` se convierte en `-->|"Texto"|` y `-->|Math|^2|` se convierte en `-->|"Math|^2"|`).
        - **Corrección de Tubería Mal Colocada**: Corrige etiquetas de arista mal colocadas que aparecen antes de la flecha (por ejemplo, `>|"Etiqueta"| A --> B` se convierte en `A -->|"Etiqueta"| B`).
                - **Fusionar Etiquetas Dobles**: Detecta y fusiona etiquetas dobles complejas en una sola arista (por ejemplo, `A -- Etiqueta1 -- Etiqueta2 --> B` o `A -- Etiqueta1 -- Etiqueta2 --- B`) en una sola etiqueta limpia con saltos de línea (`A -- "Etiqueta1<br>Etiqueta2" --> B`).
                        - **Corrección de Etiqueta sin Comillas**: Entrecomilla automáticamente las etiquetas de nodos que contienen caracteres potencialmente problemáticos (por ejemplo, comillas, signos de igual, operadores matemáticos) pero que carecen de comillas externas (por ejemplo, `Plot[Plot "A"]` se convierte en `Plot["Plot "A""]`), evitando errores de renderizado.
                        - **Corrección de Nodo Intermedio**: Divide las aristas que contienen una definición de nodo intermedio en dos aristas separadas (por ejemplo, `A -- B[...] --> C` se convierte en `A --> B[...]` y `B[...] --> C`), asegurando una sintaxis de Mermaid válida.
                        - **Corrección de Etiqueta Concatenada**: Corrige de forma robusta las definiciones de nodos donde el ID está concatenado con la etiqueta (por ejemplo, `SubdivideSubdivide...` se convierte en `Subdivide["Subdivide..."]`), incluso cuando está precedido por etiquetas de tubería o cuando la duplicación no es exacta, validando contra los IDs de nodos conocidos.
                        - **Extraer Texto Original Específico**:
                            - Define una lista de preguntas en los ajustes.
                            - Extrae segmentos de texto literales de la nota activa que responden a estas preguntas.
                            - **Modo de Consulta Fusionada**: Opción para procesar todas las preguntas en una sola llamada a la API para mayor eficiencia.
                            - **Traducción**: Opción para incluir traducciones del texto extraído en la salida.
                            - **Salida Personalizada**: Ruta de guardado y sufijo de nombre de archivo configurables para el archivo de texto extraído.
- **Prueba de Conexión de LLM**: Verifica los ajustes de API para el proveedor activo.


## Instalación

<img width="819" height="733" alt="Install" src="https://github.com/user-attachments/assets/f1733532-68fd-4c47-86b4-6fcc185e3f66" />

### Desde el Marketplace de Obsidian (Recomendado)
1. Abre **Ajustes** de Obsidian → **Complementos de la comunidad**.
2. Asegúrate de que el "Modo restringido" esté **desactivado**.
3. Haz clic en **Explorar** complementos de la comunidad y busca "Notemd".
4. Haz clic en **Instalar**.
5. Una vez instalado, haz clic en **Activar**.

### Instalación Manual
1. Descarga los últimos activos de lanzamiento desde la [página de lanzamientos en GitHub](https://github.com/Jacobinwwey/obsidian-NotEMD/releases). Cada lanzamiento también incluye un `README.md` como referencia, pero la instalación manual solo requiere `main.js`, `styles.css` y `manifest.json`.
2. Navega a la carpeta de configuración de tu vault de Obsidian: `<TuVault>/.obsidian/plugins/`.
3. Crea una nueva carpeta llamada `notemd`.
4. Copia `main.js`, `styles.css` y `manifest.json` en la carpeta `notemd`.
5. Reinicia Obsidian.
6. Ve a **Ajustes** → **Complementos de la comunidad** y activa "Notemd".

## Configuración

Accede a los ajustes del complemento a través de:
**Ajustes** → **Complementos de la comunidad** → **Notemd** (Haz clic en el icono del engranaje).

### Configuración del Proveedor de LLM
1.  **Proveedor Activo**: Selecciona el proveedor de LLM que deseas usar del menú desplegable.
2.  **Ajustes del Proveedor**: Configura los ajustes específicos para el proveedor seleccionado:
    *   **Clave API**: Requerida para la mayoría de los proveedores en la nube (por ejemplo, OpenAI, Anthropic, DeepSeek, Qwen, Qwen Code, Doubao, Moonshot, GLM, Z AI, MiniMax, Huawei Cloud MaaS, Baidu Qianfan, SiliconFlow, Google, Mistral, Azure OpenAI, OpenRouter, xAI, Groq, Together, Fireworks, Requesty). No es necesaria para Ollama. Opcional para LM Studio y el ajuste preestablecido genérico `OpenAI Compatible` cuando tu punto final acepta acceso anónimo o con marcadores de posición.
    *   **URL Base / Punto Final**: El punto final de la API para el servicio. Se proporcionan valores predeterminados, pero es posible que debas cambiarlos para modelos locales (LMStudio, Ollama), pasarelas (OpenRouter, Requesty, OpenAI Compatible) o despliegues específicos de Azure. **Requerido para Azure OpenAI.**
    *   **Modelo**: El nombre/ID del modelo específico a usar (por ejemplo, `gpt-4o`, `claude-3-5-sonnet-20240620`, `google/gemini-flash-1.5`, `grok-4`, `moonshotai/kimi-k2-instruct-0905`, `accounts/fireworks/models/kimi-k2p5`, `anthropic/claude-3-7-sonnet-latest`). Asegúrate de que el modelo esté disponible en tu punto final/proveedor.
    *   **Temperatura**: Controla la aleatoriedad de la salida del LLM (0=determinista, 1=máxima creatividad). Los valores bajos (por ejemplo, 0.2-0.5) suelen ser mejores para tareas estructuradas.
    *   **Versión de la API (Solo Azure)**: Requerida para despliegues de Azure OpenAI (por ejemplo, `2024-02-15-preview`).
3.  **Probar Conexión**: Usa el botón "Probar conexión" para el proveedor activo para verificar tus ajustes. Los proveedores compatibles con OpenAI ahora usan comprobaciones sensibles al proveedor: los puntos finales como `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `Groq`, `Together`, `Fireworks`, `LMStudio` y `OpenAI Compatible` prueban `chat/completions` directamente, mientras que los proveedores con un punto final `/models` confiable aún pueden usar primero la lista de modelos. Si la primera prueba falla con una desconexión de red transitoria como `ERR_CONNECTION_CLOSED`, Notemd recurre automáticamente a la secuencia de reintento estable en lugar de fallar inmediatamente.
4.  **Gestionar Configuraciones de Proveedor**: Usa los botones "Exportar proveedores" e "Importar proveedores" para guardar/cargar tus ajustes de proveedor de LLM en/desde un archivo `notemd-providers.json` dentro del directorio de configuración del complemento. Esto permite realizar copias de seguridad y compartir fácilmente.
5.  **Cobertura de Ajustes Preestablecidos**: Además de los proveedores originales, Notemd ahora incluye entradas preestablecidas para `Qwen`, `Qwen Code`, `Doubao`, `Moonshot`, `GLM`, `Z AI`, `MiniMax`, `Huawei Cloud MaaS`, `Baidu Qianfan`, `SiliconFlow`, `xAI`, `Groq`, `Together`, `Fireworks`, `Requesty` y un objetivo genérico `OpenAI Compatible` para LiteLLM, vLLM, Perplexity, Vercel AI Gateway o proxies personalizados.
<img width="804" height="506" alt="LLM" src="https://github.com/user-attachments/assets/8caf42e3-43ad-456d-8b96-b63e7914e45f" />

### Configuración Multi-Modelo
-   **Usar Diferentes Proveedores para Tareas**:
    *   **Desactivado (Predeterminado)**: Usa el único "Proveedor Activo" (seleccionado arriba) para todas las tareas.
    *   **Activado**: Te permite seleccionar un proveedor específico *y* opcionalmente sobrescribir el nombre del modelo para cada tarea ("Añadir enlaces", "Investigación y resumen", "Generar desde título", "Traducir", "Extraer conceptos"). Si el campo de sobrescritura de modelo para una tarea se deja en blanco, se usará el modelo predeterminado configurado para el proveedor seleccionado de esa tarea.
-   **Seleccionar diferentes idiomas para diferentes tareas**:
    *   **Desactivado (Predeterminado)**: Usa el único "Idioma de salida" para todas las tareas.
    *   **Activado**: Te permite seleccionar un idioma específico para cada tarea ("Añadir enlaces", "Investigación y resumen", "Generar desde título", "Resumir como diagrama Mermaid", "Extraer conceptos").

<img width="817" height="428" alt="Multi-model" src="https://github.com/user-attachments/assets/85e6b854-c0ca-45cc-a55e-24638dceb120" />

### Arquitectura de Idioma (Idioma de la interfaz vs idioma de salida de tareas)

-   **Idioma de la interfaz** controla solo el texto de la interfaz del complemento (etiquetas de ajustes, botones de la barra lateral, avisos y diálogos). El modo `auto` predeterminado sigue el idioma actual de la UI de Obsidian.
-   Las variantes regionales y de escritura ahora se resuelven al catálogo publicado más cercano en lugar de caer directamente al inglés. Por ejemplo, `fr-CA` usa francés, `es-419` usa español, `pt-PT` usa portugués, `zh-Hans` usa chino simplificado y `zh-Hant-HK` usa chino tradicional.
-   **Idioma de salida de tareas** controla la salida de tareas generada por el modelo (enlaces, resúmenes, generación de títulos, resumen de Mermaid, extracción de conceptos, objetivo de traducción).
-   **El modo de idioma por tarea** permite que cada tarea resuelva su propio idioma de salida desde una capa de política unificada en lugar de sobrescrituras dispersas por módulo.
-   **Desactivar traducción automática** mantiene las tareas que no son de traducción en el contexto del idioma original, mientras que las tareas explícitas de traducción siguen aplicando el idioma de destino configurado.
-   Las rutas de generación relacionadas con Mermaid siguen la misma política de idioma y aún pueden activar la auto-corrección de Mermaid cuando está activada.

### Ajustes de Llamadas API Estables
-   **Activar Llamadas API Estables (Lógica de Reintento)**:
    *   **Desactivado (Predeterminado)**: El fallo de una sola llamada API detendrá la tarea actual.
    *   **Activado**: Reintenta automáticamente las llamadas API de LLM fallidas (útil para problemas de red intermitentes o límites de velocidad).
    *   **Reserva de Prueba de Conexión**: Incluso cuando las llamadas normales no se ejecutan ya en modo estable, las pruebas de conexión del proveedor ahora cambian a la misma secuencia de reintento después del primer fallo de red transitorio.
    *   **Reserva de Transporte de Tiempo de Ejecución (Sensible al Entorno)**: Las solicitudes de tareas de larga duración que se caen transitoriamente por `requestUrl` ahora reintentan el mismo intento a través de una reserva sensible al entorno primero. Las versiones de escritorio usan Node `http/https`; los entornos que no son de escritorio usan `fetch` del navegador. Esos intentos de reserva ahora usan un análisis en streaming sensible al protocolo a través de las rutas de LLM integradas, cubriendo SSE compatible con OpenAI, SSE de Azure OpenAI, SSE de mensajes de Anthropic, SSE de Google Gemini y salida NDJSON de Ollama, para que las pasarelas lentas puedan devolver fragmentos del cuerpo antes. Los puntos de entrada de proveedores directos restantes al estilo OpenAI reutilizan esa misma ruta de reserva compartida.
    *   **Orden Estable compatible con OpenAI**: En modo estable, cada intento compatible con OpenAI ahora sigue `streaming directo -> directo sin stream -> requestUrl (con reserva de streaming cuando sea necesario)` antes de contar como un intento fallido. Esto evita fallos excesivamente agresivos cuando solo un modo de transporte es inestable.
-   **Intervalo de Reintento (segundos)**: (Visible solo cuando está activado) Tiempo de espera entre intentos de reintento (1-300 segundos). Predeterminado: 5.
-   **Máximo de Reintentos**: (Visible solo cuando está activado) Número máximo de intentos de reintento (0-10). Predeterminado: 3.
-   **Modo de Depuración de Errores de API**:
    *   **Desactivado (Predeterminado)**: Usa informes de errores estándar y concisos.
    *   **Activado**: Activa el registro detallado de errores (similar a la salida detallada de DeepSeek) para todos los proveedores y tareas (incluyendo Traducción, Búsqueda y Pruebas de Conexión). Esto incluye códigos de estado HTTP, texto de respuesta sin procesar, líneas de tiempo de transporte de solicitud, URLs y encabezados de solicitud saneados, duraciones de intentos transcurridas, encabezados de respuesta, cuerpos de respuesta parciales, salida de flujo parcial analizada y trazas de pila, lo cual es crucial para resolver problemas de conexión de API y reinicios de pasarelas ascendentes.
-   **Modo Desarrollador**:
    *   **Desactivado (Predeterminado)**: Oculta todos los controles de diagnóstico solo para desarrolladores a los usuarios normales.
    *   **Activado**: Muestra un panel de diagnóstico dedicado para desarrolladores en Ajustes.
-   **Diagnóstico de Proveedor para Desarrolladores (Solicitud Larga)**:
    *   **Modo de Llamada de Diagnóstico**: Elige la ruta de tiempo de ejecución por sonda. Los proveedores compatibles con OpenAI admiten modos forzados adicionales (`streaming directo`, `búfer directo`, `solo-requestUrl`) además de los modos de tiempo de ejecución.
    *   **Ejecutar Diagnóstico**: Ejecuta una sonda de solicitud larga con el modo de llamada seleccionado y escribe `Notemd_Provider_Diagnostic_*.txt` en la raíz del vault.
    *   **Ejecutar Prueba de Estabilidad**: Repite la sonda para ejecuciones configurables (1-10) usando el modo de llamada seleccionado y guarda un informe de estabilidad agregado.
    *   **Tiempo de Espera de Diagnóstico**: Tiempo de espera configurable por ejecución (15-3600 segundos).
    *   **Por Qué Usarlo**: Más rápido que la reproducción manual cuando un proveedor pasa la "Probar conexión" pero falla en tareas reales de larga duración (por ejemplo, traducción en pasarelas lentas).
<img width="805" height="187" alt="stable API calls" src="https://github.com/user-attachments/assets/936454a7-b657-413c-8a2a-13d517f9c519" />

### Ajustes Generales

#### Salida de Archivos Procesados
-   **Personalizar Ruta de Guardado de Archivos Procesados**:
    *   **Desactivado (Predeterminado)**: Los archivos procesados (por ejemplo, `TuNota_processed.md`) se guardan en la *misma carpeta* que la nota original.
    *   **Activado**: Te permite especificar una ubicación de guardado personalizada.
-   **Ruta de Carpeta de Archivos Procesados**: (Visible solo cuando el anterior está activado) Introduce una *ruta relativa* dentro de tu vault (por ejemplo, `Notas Procesadas` o `Salida/LLM`) donde se deben guardar los archivos procesados. Las carpetas se crearán si no existen. **No uses rutas absolutas (como C:\...) ni caracteres inválidos.**
-   **Usar Nombre de Archivo de Salida Personalizado para 'Añadir Enlaces'**:
    *   **Desactivado (Predeterminado)**: Los archivos procesados creados por el comando 'Añadir Enlaces' usan el sufijo predeterminado `_processed.md` (por ejemplo, `TuNota_processed.md`).
    *   **Activado**: Te permite personalizar el nombre del archivo de salida usando el ajuste de abajo.
-   **Sufijo/Cadena de Reemplazo Personalizada**: (Visible solo cuando el anterior está activado) Introduce la cadena a usar para el nombre del archivo de salida.
    *   Si se deja **vacío**, el archivo original será **sobrescrito** con el contenido procesado.
    *   Si introduces una cadena (por ejemplo, `_linked`), se añadirá al nombre base original (por ejemplo, `TuNota_linked.md`). Asegúrate de que el sufijo no contenga caracteres de nombre de archivo inválidos.

-   **Eliminar Cercas de Código al Añadir Enlaces**:
    *   **Desactivado (Predeterminado)**: Las cercas de código **(\`\\\`\`)** se mantienen en el contenido al añadir enlaces, y **(\`\\\`markdown)** se eliminará automáticamente.
    *   **Activado**: Elimina las cercas de código del contenido antes de añadir enlaces.
<img width="799" height="301" alt="Processed file output" src="https://github.com/user-attachments/assets/65d4e864-ff5f-402a-be90-e9c44b208903" />

#### Salida de Notas de Concepto
-   **Personalizar Ruta de Notas de Concepto**:
    *   **Desactivado (Predeterminado)**: La creación automática de notas para `[[conceptos enlazados]]` está desactivada.
    *   **Activado**: Te permite especificar una carpeta donde se crearán las nuevas notas de concepto.
-   **Ruta de Carpeta de Notas de Concepto**: (Visible solo cuando el anterior está activado) Introduce una *ruta relativa* dentro de tu vault (por ejemplo, `Conceptos` o `Generado/Temas`) donde se deben guardar las nuevas notas de concepto. Las carpetas se crearán si no existen. **Debe rellenarse si la personalización está activada.** **No uses rutas absolutas ni caracteres inválidos.**
<img width="800" height="145" alt="concept note output" src="https://github.com/user-attachments/assets/d0338341-7d67-4472-964c-75a0992165b8" />

#### Salida de Archivo de Registro de Conceptos
-   **Generar Archivo de Registro de Conceptos**:
    *   **Desactivado (Predeterminado)**: No se genera ningún archivo de registro.
    *   **Activado**: Crea un archivo de registro que enumera las notas de concepto recién creadas después del procesamiento. El formato es:
        ```
        generar xx archivos md de conceptos
        1. concepto1
        2. concepto2
        ...
        n. concepton
        ```
-   **Personalizar Ruta de Guardado del Archivo de Registro**: (Visible solo cuando "Generar Archivo de Registro de Conceptos" está activado)
    *   **Desactivado (Predeterminado)**: El archivo de registro se guarda en la **Ruta de Carpeta de Notas de Concepto** (si se especifica) o en la raíz del vault de lo contrario.
    *   **Activado**: Te permite especificar una carpeta personalizada para el archivo de registro.
-   **Ruta de Carpeta de Registro de Conceptos**: (Visible solo cuando "Personalizar Ruta de Guardado del Archivo de Registro" está activado) Introduce una *ruta relativa* dentro de tu vault (por ejemplo, `Logs/Notemd`) donde se debe guardar el archivo de registro. **Debe rellenarse si la personalización está activada.**
-   **Personalizar Nombre del Archivo de Registro**: (Visible solo cuando "Generar Archivo de Registro de Conceptos" está activado)
    *   **Desactivado (Predeterminado)**: El archivo de registro se llama `Generate.log`.
    *   **Activado**: Te permite especificar un nombre personalizado para el archivo de registro.
-   **Nombre del Archivo de Registro de Conceptos**: (Visible solo cuando "Personalizar Nombre del Archivo de Registro" está activado) Introduce el nombre de archivo deseado (por ejemplo, `CreacionDeConceptos.log`). **Debe rellenarse si la personalización está activada.**
<img width="809" height="281" alt="Concept log file output" src="https://github.com/user-attachments/assets/eef6f5d5-592d-4b8f-84b1-7404521a6e9b" />

#### Tarea de Extraer Conceptos
-   **Crear notas de concepto mínimas**:
    *   **Activado (Predeterminado)**: Las notas de concepto recién creadas solo contendrán el título (por ejemplo, `# Concepto`).
    *   **Desactivado**: Las notas de concepto pueden incluir contenido adicional, como un enlace de retroceso "Enlazado desde", si no se desactiva mediante el ajuste de abajo.
-   **Añadir enlace de retroceso "Enlazado desde"**:
    *   **Desactivado (Predeterminado)**: No añade un enlace de retroceso al documento de origen en la nota de concepto durante la extracción.
    *   **Activado**: Añade una sección "Enlazado desde" con un enlace de retroceso al archivo de origen.

#### Extraer Texto Original Específico
-   **Preguntas para la extracción**: Introduce una lista de preguntas (una por línea) para las que deseas que la IA extraiga respuestas literales de tus notas.
-   **Traducir salida al idioma correspondiente**:
    *   **Desactivado (Predeterminado)**: Produce solo el texto extraído en su idioma original.
    *   **Activado**: Añade una traducción del texto extraído en el idioma seleccionado para esta tarea.
-   **Modo de consulta fusionada**:
    *   **Desactivado**: Procesa cada pregunta individualmente (mayor precisión pero más llamadas API).
    *   **Activado**: Envía todas las preguntas en un solo prompt (más rápido y menos llamadas API).
-   **Personalizar ruta de guardado y nombre de archivo del texto extraído**:
    *   **Desactivado**: Guarda en la misma carpeta que el archivo original con el sufijo `_Extracted`.
    *   **Activado**: Te permite especificar una carpeta de salida y un sufijo de nombre de archivo personalizados.

#### Corrección de Mermaid por Lotes
-   **Activar Detección de Errores de Mermaid**:
    *   **Desactivado (Predeterminado)**: Se omite la detección de errores después del procesamiento.
    *   **Activado**: Escanea los archivos procesados en busca de errores de sintaxis de Mermaid restantes y genera un informe `mermaid_error_{nombre_carpeta}.md`.
-   **Mover archivos con errores de Mermaid a la carpeta especificada**:
    *   **Desactivado**: Los archivos con errores permanecen en su lugar.
    *   **Activado**: Mueve cualquier archivo que aún contenga errores de sintaxis de Mermaid después del intento de corrección a una carpeta dedicada para su revisión manual.
-   **Ruta de carpeta de errores de Mermaid**: (Visible si el anterior está activado) La carpeta a la que mover los archivos con errores.

#### Parámetros de Procesamiento
-   **Activar Paralelismo de Lotes**:
    *   **Desactivado (Predeterminado)**: Las tareas de procesamiento por lotes (como "Procesar carpeta" o "Generación por lotes desde títulos") procesan los archivos uno por uno (en serie).
    *   **Activado**: Permite que el complemento procese múltiples archivos de forma concurrente, lo que puede acelerar significativamente los trabajos por lotes grandes.
-   **Concurrencia de Lotes**: (Visible solo cuando el paralelismo está activado) Establece el número máximo de archivos a procesar en paralelo. Un número mayor puede ser más rápido pero consume más recursos y puede alcanzar los límites de velocidad de la API. (Predeterminado: 1, Rango: 1-20)
-   **Tamaño del Lote**: (Visible solo cuando el paralelismo está activado) El número de archivos a agrupar en un solo lote. (Predeterminado: 50, Rango: 10-200)
-   **Retraso entre Lotes (ms)**: (Visible solo cuando el paralelismo está activado) Un retraso opcional en milisegundos entre el procesamiento de cada lote, lo que puede ayudar a gestionar los límites de velocidad de la API. (Predeterminado: 1000ms)
-   **Intervalo de Llamada API (ms)**: Retraso mínimo en milisegundos *antes y después* de cada llamada API de LLM individual. Crucial para APIs de baja velocidad o para evitar errores 429. Establecer en 0 para que no haya retraso artificial. (Predeterminado: 500ms)
-   **Recuento de Palabras por Fragmento**: Máximo de palabras por fragmento enviado al LLM. Afecta al número de llamadas API para archivos grandes. (Predeterminado: 3000)
-   **Activar Detección de Duplicados**: Alterna la comprobación básica de palabras duplicadas dentro del contenido procesado (resultados en la consola). (Predeterminado: Activado)
-   **Máximo de Tokens**: Máximo de tokens que el LLM debe generar por fragmento de respuesta. Afecta al coste y al detalle. (Predeterminado: 4096)
<img width="795" height="274" alt="Processing Parameters   Language settings" src="https://github.com/user-attachments/assets%2F74e4af76-3333-48fc-bb86-0a3ee61825d1" />

#### Traducción
-   **Idioma de Destino Predeterminado**: Selecciona el idioma predeterminado al que deseas traducir tus notas. Esto se puede sobrescribir en la interfaz de usuario al ejecutar el comando de traducción. (Predeterminado: Inglés)
-   **Personalizar Ruta de Guardado de Archivos Traducidos**:
    *   **Desactivado (Predeterminado)**: Los archivos traducidos se guardan en la *misma carpeta* que la nota original.
    *   **Activado**: Te permite especificar una *ruta relativa* dentro de tu vault (por ejemplo, `Traducciones`) donde se deben guardar los archivos traducidos. Las carpetas se crearán si no existen.
-   **Usar sufijo personalizado para archivos traducidos**:
    *   **Desactivado (Predeterminado)**: Los archivos traducidos usan el sufijo predeterminado `_translated.md` (por ejemplo, `TuNota_translated.md`).
    *   **Activado**: Te permite especificar un sufijo personalizado.
-   **Sufijo Personalizado**: (Visible solo cuando el anterior está activado) Introduce el sufijo personalizado para añadir a los nombres de archivos traducidos (por ejemplo, `_es` o `_fr`).
<img width="811" height="243" alt="translate" src="https://github.com/user-attachments/assets/57d21a72-e86c-4369-8be5-fd18cb734e2b" />

#### Generación de Contenido
-   **Activar Investigación en "Generar desde Título"**:
    *   **Desactivado (Predeterminado)**: "Generar desde Título" usa solo el título como entrada.
    *   **Activado**: Realiza una investigación web usando el **Proveedor de Investigación Web** configurado e incluye los hallazgos como contexto para el LLM durante la generación basada en el título.
-   **Ejecutar automáticamente corrección de sintaxis de Mermaid tras la generación**:
    *   **Activado (Predeterminado)**: Ejecuta automáticamente una pasada de corrección de sintaxis de Mermaid después de flujos de trabajo relacionados con Mermaid como Procesar, Generar desde título, Generación por lotes desde títulos, Investigación y resumen, Resumir como Mermaid y Traducir.
    *   **Desactivado**: Deja la salida generada de Mermaid sin tocar a menos que ejecutes la `Corrección de Mermaid por Lotes` manualmente o la añadas a un flujo de trabajo personalizado.
-   **Idioma de Salida**: (Nuevo) Selecciona el idioma de salida deseado para las tareas de "Generar desde Título" y "Generación por lotes desde títulos".
    *   **Inglés (Predeterminado)**: Los prompts se procesan y producen en inglés.
    *   **Otros Idiomas**: Se instruye al LLM para que realice su razonamiento en inglés pero proporcione la documentación final en el idioma seleccionado (por ejemplo, Español, Français, 简体中文, 繁體中文, العربية, हिन्दी, etc.).
-   **Cambiar Palabra del Prompt**: (Nuevo)
    *   **Cambiar Palabra del Prompt**: Te permite cambiar la palabra del prompt para una tarea específica.
    *   **Palabra del Prompt Personalizada**: Introduce tu palabra de prompt personalizada para la tarea.
-   **Usar Carpeta de Salida Personalizada para 'Generar desde Título'**:
    *   **Desactivado (Predeterminado)**: Los archivos generados con éxito se mueven a una subcarpeta llamada `[NombreDeCarpetaOriginal]_complete` relativa al padre de la carpeta original (o `Vault_complete` si la carpeta original era la raíz).
    *   **Activado**: Te permite especificar un nombre personalizado para la subcarpeta donde se mueven los archivos completados.
-   **Nombre de la Carpeta de Salida Personalizada**: (Visible solo cuando el anterior está activado) Introduce el nombre deseado para la subcarpeta (por ejemplo, `Contenido Generado`, `_complete`). No se permiten caracteres inválidos. Predeterminado a `_complete` si se deja vacío. Esta carpeta se crea relativa al directorio padre de la carpeta original.

#### Botones de Flujo de Trabajo de un Solo Clic
-   **Constructor Visual de Flujos de Trabajo**: Crea botones de flujo de trabajo personalizados a partir de acciones integradas sin necesidad de escribir el DSL a mano.
-   **DSL de Botones de Flujo de Trabajo Personalizados**: Los usuarios avanzados aún pueden editar el texto de definición del flujo de trabajo directamente. Un DSL inválido recurre al flujo de trabajo predeterminado de forma segura y muestra una advertencia en la barra lateral/interfaz de ajustes.
-   **Estrategia ante Errores de Flujo de Trabajo**:
    *   **Detener en caso de Error (Predeterminado)**: Detiene el flujo de trabajo inmediatamente cuando falla un paso.
    *   **Continuar en caso de Error**: Continúa ejecutando los pasos posteriores e informa del número de acciones fallidas al final.
-   **Flujo de Trabajo Predeterminado Incluido**: `One-Click Extract` encadena `Procesar archivo (Añadir enlaces)`, `Generación por lotes desde títulos` y `Corrección de Mermaid por Lotes`.

#### Ajustes de Prompts Personalizados
Esta función te permite sobrescribir las instrucciones predeterminadas (prompts) enviadas al LLM para tareas específicas, dándote un control preciso sobre la salida.

-   **Activar Prompts Personalizados para Tareas Específicas**:
    *   **Desactivado (Predeterminado)**: El complemento usa sus prompts predeterminados integrados para todas las operaciones.
    *   **Activado**: Activa la capacidad de establecer prompts personalizados para las tareas enumeradas a continuación. Este es el interruptor maestro para esta función.

-   **Usar Prompt Personalizado para [Nombre de la Tarea]**: (Visible solo cuando el anterior está activado)
    *   Para cada tarea compatible ("Añadir enlaces", "Generar desde título", "Investigación y resumen", "Extraer conceptos"), puedes activar o desactivar individualmente tu prompt personalizado.
    *   **Desactivado**: Esta tarea específica usará el prompt predeterminado.
    *   **Activado**: Esta tarea usará el texto que proporciones en el área de texto "Prompt Personalizado" correspondiente a continuación.

-   **Área de Texto de Prompt Personalizado**: (Visible solo cuando el prompt personalizado de una tarea está activado)
    *   **Visualización del Prompt Predeterminado**: Para tu referencia, el complemento muestra el prompt predeterminado que normalmente usaría para la tarea. Puedes usar el botón **"Copiar Prompt Predeterminado"** para copiar este texto como punto de partida para tu propio prompt personalizado.
    *   **Entrada de Prompt Personalizado**: Aquí es donde escribes tus propias instrucciones para el LLM.
    *   **Marcadores de Posición**: Puedes (y debes) usar marcadores de posición especiales en tu prompt, que el complemento reemplazará con el contenido real antes de enviar la solicitud al LLM. Consulta el prompt predeterminado para ver qué marcadores de posición están disponibles para cada tarea. Los marcadores de posición comunes incluyen:
        *   `{TITLE}`: El título de la nota actual.
        *   `{RESEARCH_CONTEXT_SECTION}`: El contenido recopilado de la investigación web.
        *   `{USER_PROMPT}`: El contenido de la nota que se está procesando.

<img width="794" height="174" alt="Content generation   output" src="https://github.com/user-attachments/assets/76d93942-980d-49ad-b9d4-1c73ea013d17" />

<img width="866" height="646" alt="Duplicate check scope   Custom prompt settings" src="https://github.com/user-attachments/assets/1b37a523-ef00-4e40-94a0-43bbe0c78572" />

#### Alcance de Comprobación de Duplicados
-   **Modo de Alcance de Comprobación de Duplicados**: Controla qué archivos se comprueban contra las notas en tu Carpeta de Notas de Concepto para detectar posibles duplicados.
    *   **Todo el Vault (Predeterminado)**: Compara las notas de concepto contra todas las demás notas en el vault (excluyendo la propia Carpeta de Notas de Concepto).
    *   **Incluir solo Carpetas Específicas**: Compara las notas de concepto solo contra las notas dentro de las carpetas enumeradas a continuación.
    *   **Excluir Carpetas Específicas**: Compara las notas de concepto contra todas las notas *excepto* aquellas dentro de las carpetas enumeradas a continuación (y también excluyendo la Carpeta de Notas de Concepto).
    *   **Solo Carpeta de Conceptos**: Compara las notas de concepto solo contra *otras notas dentro de la Carpeta de Notas de Concepto*. Esto ayuda a encontrar duplicados puramente dentro de tus conceptos generados.
-   **Incluir/Excluir Carpetas**: (Visible solo si el Modo es 'Incluir' o 'Excluir') Introduce las *rutas relativas* de las carpetas que deseas incluir o excluir, **una ruta por línea**. Las rutas distinguen entre mayúsculas y minúsculas y usan `/` como separador (por ejemplo, `Material de Referencia/Articulos` o `Notas Diarias`). Estas carpetas no pueden ser las mismas que o estar dentro de la Carpeta de Notas de Concepto.

#### Proveedor de Investigación Web
-   **Proveedor de Búsqueda**: Elige entre `Tavily` (requiere clave API, recomendado) y `DuckDuckGo` (experimental, a menudo bloqueado por el motor de búsqueda para solicitudes automatizadas). Usado para "Investigación y resumen de tema" y opcionalmente para "Generar desde título".
-   **Clave API de Tavily**: (Visible solo si se selecciona Tavily) Introduce tu clave API de [tavily.com](https://tavily.com/).
-   **Máximo de Resultados de Tavily**: (Visible solo si se selecciona Tavily) Máximo número de resultados de búsqueda que Tavily debe devolver (1-20). Predeterminado: 5.
-   **Profundidad de Búsqueda de Tavily**: (Visible solo si se selecciona Tavily) Elige entre `basic` (predeterminado) o `advanced`. Nota: `advanced` proporciona mejores resultados pero cuesta 2 créditos de API por búsqueda en lugar de 1.
-   **Máximo de Resultados de DuckDuckGo**: (Visible solo si se selecciona DuckDuckGo) Máximo número de resultados de búsqueda a analizar (1-10). Predeterminado: 5.
-   **Tiempo de Espera de Obtención de Contenido de DuckDuckGo**: (Visible solo si se selecciona DuckDuckGo) Segundos máximos a esperar al intentar obtener contenido de cada URL de resultado de DuckDuckGo. Predeterminado: 15.
-   **Máximo de Tokens de Contenido de Investigación**: Máximo aproximado de tokens de los resultados de investigación web combinados (fragmentos/contenido obtenido) a incluir en el prompt de resumen. Ayuda a gestionar el tamaño de la ventana de contexto y el coste. (Predeterminado: 3000)
<img width="810" height="278" alt="Web research provider" src="https://github.com/user-attachments/assets/be0280eb-bb4e-4db0-bf69-91da3f0fd3c0" />

#### Dominio de Aprendizaje Enfocado
-   **Activar Dominio de Aprendizaje Enfocado**:
    *   **Desactivado (Predeterminado)**: Los prompts enviados al LLM usan las instrucciones estándar de propósito general.
    *   **Activado**: Te permite especificar uno o más campos de estudio para mejorar la comprensión contextual del LLM.
-   **Dominio de Aprendizaje**: (Visible solo cuando el anterior está activado) Introduce tu(s) campo(s) específico(s), por ejemplo, 'Ciencia de Materiales', 'Física de Polímeros', 'Aprendizaje Automático'. Esto añadirá una línea "Campos Relevantes: [...]" al principio de los prompts, ayudando al LLM a generar enlaces y contenidos más precisos y relevantes para tu área de estudio específica.
<img width="595" height="143" alt="focused learning domain" src="https://github.com/user-attachments/assets/1bcc9707-5c10-4944-a61b-65fde0cd0404" />


## Guía de Uso

### Flujos de Trabajo Rápidos y Barra Lateral

-   Abre la barra lateral de Notemd para acceder a secciones de acciones agrupadas para procesamiento central, generación, traducción, conocimiento y utilidades.
-   Usa el área de **Flujos de trabajo rápidos** en la parte superior de la barra lateral para lanzar botones de varios pasos personalizados.
-   El flujo de trabajo predeterminado **One-Click Extract** ejecuta `Procesar archivo (Añadir enlaces)` -> `Generación por lotes desde títulos` -> `Corrección de Mermaid por Lotes`.
-   El progreso del flujo de trabajo, los registros por paso y los fallos se muestran en la barra lateral, con un pie de página anclado que protege la barra de progreso y el área de registro de ser desplazadas por secciones expandidas.
-   La tarjeta de progreso mantiene legibles de un vistazo el texto de estado, una pastilla de porcentaje dedicada y el tiempo restante, y los mismos flujos de trabajo personalizados se pueden reconfigurar desde los ajustes.

### Procesamiento Original (Añadir Enlaces Wiki)
Esta es la funcionalidad principal enfocada en identificar conceptos y añadir `[[wiki-links]]`.

**Importante:** Este proceso solo funciona en archivos `.md` o `.txt`. Puedes convertir archivos PDF a archivos MD de forma gratuita usando [Mineru](https://github.com/opendatalab/MinerU) antes de procesarlos más.

1.  **Usando la Barra Lateral**:
    *   Abre la barra lateral de Notemd (icono de varita o paleta de comandos).
    *   Abre el archivo `.md` o `.txt`.
    *   Haz clic en **"Process File (Add Links)"**.
    *   Para procesar una carpeta: Haz clic en **"Process Folder (Add Links)"**, selecciona la carpeta y haz clic en "Process".
    *   El progreso se muestra en la barra lateral. Puedes cancelar la tarea usando el botón "Cancelar Procesamiento" en la barra lateral.
    *   *Nota para el procesamiento de carpetas:* Los archivos se procesan en segundo plano sin abrirse en el editor.

<img width="618" height="154" alt="image" src="https://github.com/user-attachments/assets/fcfbcc9e-3c80-4e84-b9bb-e3a5cd66acaa" />

2.  **Usando la Paleta de Comandos** (`Ctrl+P` o `Cmd+P`):
    *   **Archivo Único**: Abre el archivo y ejecuta `Notemd: Process Current File`.
    *   **Carpeta**: Ejecuta `Notemd: Process Folder`, luego selecciona la carpeta. Los archivos se procesan en segundo plano sin abrirse en el editor.
    *   Aparece un modal de progreso para las acciones de la paleta de comandos, que incluye un botón de cancelación.
    *   *Nota:* el complemento elimina automáticamente las líneas iniciales `\boxed{` y finales `}` si se encuentran en el contenido procesado final antes de guardar.

### Nuevas Funciones

1.  **Resumir como diagrama Mermaid**:
    *   Abre la nota que deseas resumir.
    *   Ejecuta el comando `Notemd: Summarise as Mermaid diagram` (vía paleta de comandos o botón de la barra lateral).
    *   El complemento generará una nueva nota con el diagrama Mermaid.

2.  **Traducir Nota/Selección**:
    *   Selecciona texto en una nota para traducir solo esa selección, o invoca el comando sin selección para traducir toda la nota.
    *   Ejecuta el comando `Notemd: Translate Note/Selection` (vía paleta de comandos o botón de la barra lateral).
    *   Aparecerá un modal que te permitirá confirmar o cambiar el **Idioma de Destino** (predeterminado según el ajuste especificado en Configuración).
    *   El complemento usa el **Proveedor de LLM** configurado (basado en los ajustes Multi-Modelo) para realizar la traducción.
    *   El contenido traducido se guarda en la **Ruta de Guardado de Traducciones** configurada con el sufijo apropiado, y se abre en un **nuevo panel a la derecha** del contenido original para una fácil comparación.
    *   Puedes cancelar esta tarea a través del botón de la barra lateral o del botón de cancelación del modal.
3.  **Traducción por Lotes**:
    *   Ejecuta el comando `Notemd: Batch Translate Folder` desde la paleta de comandos y selecciona una carpeta, o haz clic derecho en una carpeta en el explorador de archivos y elige "Traducir esta carpeta por lotes".
    *   El complemento traducirá todos los archivos Markdown en la carpeta seleccionada.
    *   Los archivos traducidos se guardan en la ruta de traducción configurada pero no se abren automáticamente.
    *   Este proceso se puede cancelar a través del modal de progreso.

<img width="1081" height="1214" alt="image" src="https://github.com/user-attachments/assets/6b6fefbf-3692-4281-bdb1-11efdd6c88b5" />

3.  **Investigar y Resumir Tema**:
    *   Selecciona texto en una nota O asegúrate de que la nota tenga un título (este será el tema de búsqueda).
    *   Ejecuta el comando `Notemd: Research and Summarize Topic` (vía paleta de comandos o botón de la barra lateral).
    *   El complemento usa el **Proveedor de Búsqueda** configurado (Tavily/DuckDuckGo) y el **Proveedor de LLM** apropiado (basado en los ajustes Multi-Modelo) para encontrar y resumir información.
    *   El resumen se añade a la nota actual.
    *   Puedes cancelar esta tarea a través del botón de la barra lateral o del botón de cancelación del modal.
    *   *Nota:* Las búsquedas en DuckDuckGo pueden fallar debido a la detección de bots. Se recomienda Tavily.

<img width="239" height="63" alt="image" src="https://github.com/user-attachments/assets/afcd0497-3ee3-41f2-9281-8bfbb448372d" />

4.  **Generar Contenido desde Título**:
    *   Abre una nota (puede estar vacía).
    *   Ejecuta el comando `Notemd: Generate Content from Title` (vía paleta de comandos o botón de la barra lateral).
    *   El complemento usa el **Proveedor de LLM** apropiado (basado en los ajustes Multi-Modelo) para generar contenido basado en el título de la nota, reemplazando cualquier contenido existente.
    *   Si el ajuste **"Activar Investigación en 'Generar desde Título'"** está activado, primero realizará una investigación web (usando el **Proveedor de Investigación Web** configurado) e incluirá ese contexto en el prompt enviado al LLM.
    *   Puedes cancelar esta tarea a través del botón de la barra lateral o del botón de cancelación del modal.

5.  **Generación de Contenido por Lotes desde Títulos**:
    *   Ejecuta el comando `Notemd: Batch Generate Content from Titles` (vía paleta de comandos o botón de la barra lateral).
    *   Selecciona la carpeta que contiene las notas que deseas procesar.
    *   El complemento iterará a través de cada archivo `.md` en la carpeta (excluyendo los archivos `_processed.md` y los archivos en la carpeta "complete" designada), generando contenido basado en el título de la nota y reemplazando el contenido existente. Los archivos se procesan en segundo plano sin abrirse en el editor.
    *   Los archivos procesados con éxito se mueven a la carpeta "complete" configurada.
    *   Este comando respeta el ajuste **"Activar Investigación en 'Generar desde Título'"** para cada nota procesada.
    *   Puedes cancelar esta tarea a través del botón de la barra lateral o del botón de cancelación del modal.
    *   El progreso y los resultados (número de archivos modificados, errores) se muestran en el registro de la barra lateral/modal.
<img width="477" height="76" alt="image" src="https://github.com/user-attachments/assets/8c762d0a-be60-4811-b3e0-9d86c6ddfa4e" />

6.  **Comprobar y Eliminar Notas de Concepto Duplicadas**:
    *   Asegúrate de que la **Ruta de Carpeta de Notas de Concepto** esté correctamente configurada en los ajustes.
    *   Ejecuta `Notemd: Check and Remove Duplicate Concept Notes` (vía paleta de comandos o botón de la barra lateral).
    *   El complemento escanea la carpeta de notas de concepto y compara los nombres de archivos contra las notas fuera de la carpeta usando varias reglas (coincidencia exacta, plurales, normalización, contención).
    *   Si se encuentran posibles duplicados, aparece una ventana modal que enumera los archivos, la razón por la que fueron marcados y los archivos en conflicto.
    *   Revisa la lista cuidadosamente. Haz clic en **"Delete Files"** para mover los archivos enumerados a la papelera del sistema, o en **"Cancel"** para no tomar ninguna acción.
    *   El progreso y los resultados se muestran en el registro de la barra lateral/modal.

7.  **Extraer Conceptos (Modo Puro)**:
    *   Esta función te permite extraer conceptos de un documento y crear las notas de concepto correspondientes *sin* alterar el archivo original. Es perfecto para poblar rápidamente tu base de conocimientos a partir de un conjunto de documentos.
    *   **Archivo Único**: Abre un archivo y ejecuta el comando `Notemd: Extract concepts (create concept notes only)` desde la paleta de comandos o haz clic en el botón **"Extract concepts (current file)"** en la barra lateral.
    *   **Carpeta**: Ejecuta el comando `Notemd: Batch extract concepts from folder` desde la paleta de comandos o haz clic en el botón **"Extract concepts (folder)"** en la barra lateral, luego selecciona una carpeta para procesar todas sus notas.
    *   El complemento leerá los archivos, identificará los conceptos y creará nuevas notas para ellos en tu **Carpeta de Notas de Concepto** designada, dejando tus archivos originales intactos.

8.  **Crear Enlace Wiki y Generar Nota desde Selección**:
    *   Este potente comando agiliza el proceso de creación y población de nuevas notas de concepto.
    *   Selecciona una palabra o frase en tu editor.
    *   Ejecuta el comando `Notemd: Create Wiki-Link & Generate Note from Selection` (se recomienda asignar un atajo de teclado a esto, como `Cmd+Shift+W`).
    *   El complemento:
        1.  Reemplazará tu texto seleccionado con un `[[enlace-wiki]]`.
        2.  Comprobará si ya existe una nota con ese título en tu **Carpeta de Notas de Concepto**.
        3.  Si existe, añade un enlace de retroceso a la nota actual.
        4.  Si no existe, crea una nueva nota vacía.
        5.  Luego ejecuta automáticamente el comando **"Generate Content from Title"** en la nota nueva o existente, poblándola con contenido generado por IA.

9.  **Extraer Conceptos y Generar Títulos**:
    *   Este comando encadena dos funciones potentes para un flujo de trabajo simplificado.
    *   Ejecuta el comando `Notemd: Extract Concepts and Generate Titles` desde la paleta de comandos (se recomienda asignar un atajo de teclado a esto).
    *   El complemento:
        1.  Primero, ejecutará la tarea **"Extract concepts (current file)"** en el archivo actualmente activo.
        2.  Luego, ejecutará automáticamente la tarea **"Batch generate from titles"** en la carpeta que has configurado como tu **Ruta de carpeta de notas de concepto** en los ajustes.
    *   Esto te permite primero poblar tu base de conocimientos con nuevos conceptos desde un documento de origen y luego desarrollar inmediatamente esas nuevas notas de concepto con contenido generado por IA en un solo paso.

10. **Extraer Texto Original Específico**:
    *   Configura tus preguntas en los ajustes bajo "Extraer Texto Original Específico".
    *   Usa el botón "Extraer Texto Original Específico" en la barra lateral para procesar el archivo activo.
    *   **Modo Fusionado**: Permite un procesamiento más rápido al enviar todas las preguntas en un solo prompt.
    *   **Traducción**: Traduce opcionalmente el texto extraído a tu idioma configurado.
    *   **Salida Personalizada**: Configura dónde y cómo se guarda el archivo extraído.

11. **Corrección de Mermaid por Lotes**:
    *   Usa el botón "Corrección de Mermaid por Lotes" en la barra lateral para escanear una carpeta y corregir errores comunes de sintaxis de Mermaid.
    *   El complemento informará de cualquier archivo que aún contenga errores en un archivo `mermaid_error_{nombre_carpeta}.md`.
    *   Configura opcionalmente el complemento para mover estos archivos problemáticos a una carpeta separada para su revisión.

## Proveedores de LLM Soportados

| Proveedor          | Tipo    | Clave API Requerida    | Notas                                                                 |
|--------------------|---------|------------------------|-----------------------------------------------------------------------|
| DeepSeek           | Nube    | Sí                     | Punto final nativo de DeepSeek con manejo de modelos de razonamiento  |
| Qwen               | Nube    | Sí                     | Ajuste DashScope compatible para modelos Qwen / QwQ                   |
| Qwen Code          | Nube    | Sí                     | Ajuste DashScope enfocado en código para modelos Qwen coder           |
| Doubao             | Nube    | Sí                     | Ajuste Volcengine Ark; normalmente establece el campo del modelo a tu ID de punto final |
| Moonshot           | Nube    | Sí                     | Punto final oficial de Kimi / Moonshot                                |
| GLM                | Nube    | Sí                     | Punto final oficial de Zhipu BigModel compatible con OpenAI           |
| Z AI               | Nube    | Sí                     | Punto final oficial de GLM/Zhipu internacional; complementa a `GLM`   |
| MiniMax            | Nube    | Sí                     | Punto final oficial de chat-completions de MiniMax                    |
| Huawei Cloud MaaS  | Nube    | Sí                     | Punto final de Huawei ModelArts MaaS compatible con OpenAI            |
| Baidu Qianfan      | Nube    | Sí                     | Punto final oficial de Baidu Qianfan compatible con OpenAI            |
| SiliconFlow        | Nube    | Sí                     | Punto final oficial de SiliconFlow compatible con OpenAI               |
| OpenAI             | Nube    | Sí                     | Soporta modelos GPT y series o                                        |
| Anthropic          | Nube    | Sí                     | Soporta modelos Claude                                                |
| Google             | Nube    | Sí                     | Soporta modelos Gemini                                                |
| Mistral            | Nube    | Sí                     | Soporta familias Mistral y Codestral                                  |
| Azure OpenAI       | Nube    | Sí                     | Requiere Punto final, Clave API, nombre de despliegue y Versión API   |
| OpenRouter         | Pasarela| Sí                     | Accede a muchos proveedores a través de IDs de modelo de OpenRouter   |
| xAI                | Nube    | Sí                     | Punto final nativo de Grok                                            |
| Groq               | Nube    | Sí                     | Inferencia rápida compatible con OpenAI para modelos OSS alojados     |
| Together           | Nube    | Sí                     | Punto final compatible con OpenAI para modelos OSS alojados           |
| Fireworks          | Nube    | Sí                     | Punto final de inferencia compatible con OpenAI                       |
| Requesty           | Pasarela| Sí                     | Enrutador multi-proveedor bajo una sola clave API                     |
| OpenAI Compatible  | Pasarela| Opcional               | Ajuste genérico para LiteLLM, vLLM, Perplexity, Vercel AI Gateway, etc.|
| LMStudio           | Local   | Opcional (`EMPTY`)     | Ejecuta modelos localmente vía servidor LM Studio                     |
| Ollama             | Local   | No                     | Ejecuta modelos localmente vía servidor Ollama                        |

*Nota: Para proveedores locales (LMStudio, Ollama), asegúrate de que la aplicación del servidor respectiva se esté ejecutando y sea accesible en la URL Base configurada.*
*Nota: Para OpenRouter y Requesty, usa el identificador de modelo completo/con prefijo de proveedor mostrado por la pasarela (por ejemplo, `google/gemini-flash-1.5` o `anthropic/claude-3-7-sonnet-latest`).*
*Nota: `Doubao` normalmente espera un ID de punto final/despliegue de Ark en el campo del modelo en lugar de un nombre de familia de modelo. La pantalla de ajustes ahora advierte cuando el valor del marcador de posición aún está presente y bloquea las pruebas de conexión hasta que lo reemplaces por un ID de punto final real.*
*Nota: `Z AI` se dirige a la línea internacional `api.z.ai`, mientras que `GLM` mantiene el punto final de BigModel en China continental. Elige el ajuste preestablecido que coincida con la región de tu cuenta.*
*Nota: Los ajustes preestablecidos enfocados en China usan comprobaciones de conexión chat-first para que la prueba valide el modelo/despliegue real configurado, no solo la accesibilidad de la clave API.*
*Nota: `OpenAI Compatible` está destinado a pasarelas y proxies personalizados. Establece la URL Base, la política de clave API y el ID del modelo de acuerdo con la documentación de tu proveedor.*

## Uso de Red y Manejo de Datos

Notemd se ejecuta localmente dentro de Obsidian, pero algunas funciones envían solicitudes salientes.

### Llamadas al Proveedor de LLM (Configurables)

- Activador: procesamiento de archivos, generación, traducción, resumen de investigación, resumen de Mermaid y acciones de conexión/diagnóstico.
- Punto final: tu(s) URL(s) base de proveedor configurada(s) en los ajustes de Notemd.
- Datos enviados: texto de prompt y contenido de la tarea requeridos para el procesamiento.
- Nota de manejo de datos: las claves API se configuran localmente en los ajustes del complemento y se usan para firmar solicitudes desde tu dispositivo.

### Llamadas de Investigación Web (Opcionales)

- Activador: cuando la investigación web está activada y se selecciona un proveedor de búsqueda.
- Punto final: API de Tavily o puntos finales de DuckDuckGo.
- Datos enviados: tu consulta de investigación y los metadatos de solicitud requeridos.

### Diagnósticos de Desarrollador y Registros de Depuración (Opcionales)

- Activador: modo de depuración de API y acciones de diagnóstico de desarrollador.
- Almacenamiento: los registros de diagnóstico y errores se escriben en la raíz de tu vault (por ejemplo, `Notemd_Provider_Diagnostic_*.txt` y `Notemd_Error_Log_*.txt`).
- Nota de riesgo: los registros pueden contener fragmentos de solicitud/respuesta. Revisa los registros antes de compartirlos públicamente.

### Almacenamiento Local

- La configuración del complemento se almacena en `.obsidian/plugins/notemd/data.json`.
- Los archivos generados, informes y registros opcionales se almacenan en tu vault de acuerdo con tus ajustes.

## Solución de Problemas

### Problemas Comunes
-   **El complemento no se carga**: Asegúrate de que `manifest.json`, `main.js`, `styles.css` estén en la carpeta correcta (`<Vault>/.obsidian/plugins/notemd/`) y reinicia Obsidian. Comprueba la Consola de Desarrollador (`Ctrl+Shift+I` o `Cmd+Option+I`) en busca de errores al iniciar.
-   **Fallos de Procesamiento / Errores de API**:
    1.  **Comprueba el Formato de Archivo**: Asegúrate de que el archivo que intentas procesar o comprobar tenga una extensión `.md` o `.txt`. Notemd actualmente solo admite estos formatos basados en texto.
    2.  Usa el comando/botón "Probar conexión de LLM" para verificar los ajustes del proveedor activo.
    3.  Comprueba dos veces la Clave API, la URL Base, el Nombre del Modelo y la Versión de la API (para Azure). Asegúrate de que la clave API sea correcta y tenga suficientes créditos/permisos.
    4.  Asegúrate de que tu servidor de LLM local (LMStudio, Ollama) se esté ejecutando y la URL Base sea correcta (p. ej., `http://localhost:1234/v1` para LMStudio).
    5.  Comprueba tu conexión a Internet para los proveedores en la nube.
    6.  **Para errores de procesamiento de un solo archivo:** Revisa la Consola de Desarrollador para ver mensajes de error detallados. Cópialos usando el botón en el modal de error si es necesario.
    7.  **Para errores de procesamiento por lotes:** Comprueba el archivo `error_processing_filename.log` en la raíz de tu vault para ver mensajes de error detallados de cada archivo fallido. La Consola de Desarrollador o el modal de error podrían mostrar un resumen o un error de lote general.
    8.  **Registros de Errores Automáticos:** Si un proceso falla, el complemento guarda automáticamente un archivo de registro detallado llamado `Notemd_Error_Log_[Timestamp].txt` en el directorio raíz de tu vault. Este archivo contiene el mensaje de error, la traza de la pila y los registros de la sesión. Si encuentras problemas persistentes, por favor comprueba este archivo. Activar el "Modo de Depuración de Errores de API" en los ajustes poblará este registro con datos de respuesta de la API aún más detallados.
    9.  **Diagnósticos de Solicitud Larga de Punto Final Real (Desarrollador)**:
        - Ruta interna del complemento (recomendada primero): usa **Ajustes -> Notemd -> Diagnóstico de proveedor para desarrolladores (solicitud larga)** para ejecutar una sonda en tiempo de ejecución sobre el proveedor activo y generar `Notemd_Provider_Diagnostic_*.txt` en la raíz del vault.
        - Ruta de CLI (fuera del tiempo de ejecución de Obsidian): para una comparación reproducible a nivel de punto final entre el comportamiento con búfer y en streaming, usa:
        ```bash
        npm run diagnose:llm -- \
          --transport openai-compatible \
          --provider-name OpenRouter \
          --base-url https://openrouter.ai/api/v1 \
          --api-key "$OPENROUTER_API_KEY" \
          --model anthropic/claude-3.7-sonnet \
          --prompt-file ./tmp/prompt.txt \
          --content-file ./tmp/content.txt \
          --mode compare \
          --timeout-ms 360000 \
          --output ./tmp/openrouter-diagnostic.txt
        ```
        El informe generado contiene tiempos por intento (`First Byte`, `Duration`), metadatos de solicitud saneados, encabezados de respuesta, fragmentos del cuerpo sin procesar/parciales, fragmentos de flujo analizados y puntos de fallo de la capa de transporte.
-   **Problemas de Conexión de LM Studio/Ollama**:
    *   **Fallo de Probar Conexión**: Asegúrate de que el servidor local (LM Studio u Ollama) se esté ejecutando y que el modelo correcto esté cargado/disponible.
    *   **Errores de CORS (Ollama en Windows)**: Si encuentras errores de CORS (Cross-Origin Resource Sharing) al usar Ollama en Windows, es posible que debas establecer la variable de entorno `OLLAMA_ORIGINS`. Puedes hacer esto ejecutando `set OLLAMA_ORIGINS=*` en tu símbolo del sistema antes de iniciar Ollama. Esto permite solicitudes desde cualquier origen.
    *   **Activar CORS en LM Studio**: Para LM Studio, puedes activar CORS directamente en los ajustes del servidor, lo cual puede ser necesario si Obsidian se ejecuta en un navegador o tiene políticas de origen estrictas.
-   **Errores de Creación de Carpeta ("El nombre del archivo no puede contener...")**:
    *   Esto normalmente significa que la ruta proporcionada en los ajustes (**Ruta de Carpeta de Archivos Procesados** o **Ruta de Carpeta de Notas de Concepto**) no es válida *para Obsidian*.
    *   **Asegúrate de usar rutas relativas** (p. ej., `Procesados`, `Notas/Conceptos`) y **no rutas absolutas** (p. ej., `C:\Usuarios\...`, `/Usuarios/...`).
    *   Comprueba si hay caracteres inválidos: `* " \ / < > : | ? # ^ [ ]`. Ten en cuenta que `\` no es válido incluso en Windows para las rutas de Obsidian. Usa `/` como separador de rutas.
-   **Problemas de Rendimiento**: Procesar archivos grandes o muchos archivos puede llevar tiempo. Reduce el ajuste "Recuento de Palabras por Fragmento" para llamadas API potencialmente más rápidas (pero más numerosas). Prueba con un proveedor o modelo de LLM diferente.
-   **Enlaces Inesperados**: La calidad de los enlaces depende en gran medida del LLM y del prompt. Experimenta con diferentes modelos o ajustes de temperatura.

## Contribuir

¡Las contribuciones son bienvenidas! Por favor, consulta el repositorio de GitHub para ver las pautas: [https://github.com/Jacobinwwey/obsidian-NotEMD](https://github.com/Jacobinwwey/obsidian-NotEMD) 

## Documentación del Mantenedor

- [Flujo de Trabajo de Lanzamiento (Inglés)](./docs/maintainer/release-workflow.md)
- [Flujo de Trabajo de Lanzamiento (简体中文)](./docs/maintainer/release-workflow.zh-CN.md)

## Licencia

Licencia MIT - Ver el archivo [LICENSE](LICENSE) para más detalles.

---


*Notemd v1.8.4 - Mejora tu grafo de conocimiento en Obsidian con IA.*


![Star History Chart](https://api.star-history.com/svg?repos=Jacobinwwey/obsidian-NotEMD&type=Date)
