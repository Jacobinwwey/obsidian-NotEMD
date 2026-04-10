
![image](https://img.shields.io/github/v/release/Jacobinwwey/obsidian-NotEMD?label=Version&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest) ![image](https://img.shields.io/github/downloads/Jacobinwwey/obsidian-NotEMD/total?logo=Obsidian&label=Downloads&labelColor=%237C3AED&color=%235b5b5b&link=https%3A%2F%2Fgithub.com%2FJacobinwwey%2Fobsidian-NotEMD%2Freleases%2Flatest)

# Complemento Notemd para Obsidian

[English](./README.md) | [简体中文](./README_zh.md) | [Español](./README_es.md) | [Français](./README_fr.md) | [Deutsch](./README_de.md) | [Italiano](./README_it.md) | [Português](./README_pt.md) | [繁體中文](./README_zh_Hant.md) | [日本語](./README_ja.md) | [한국어](./README_ko.md) | [Русский](./README_ru.md) | [العربية](./README_ar.md) | [हिन्दी](./README_hi.md) | [বাংলা](./README_bn.md) | [Nederlands](./README_nl.md) | [Svenska](./README_sv.md) | [Suomi](./README_fi.md) | [Dansk](./README_da.md) | [Norsk](./README_no.md) | [Polski](./README_pl.md) | [Türkçe](./README_tr.md) | [עברית](./README_he.md) | [ไทย](./README_th.md) | [Ελληνικά](./README_el.md) | [Čeština](./README_cs.md) | [Magyar](./README_hu.md) | [Română](./README_ro.md) | [Українська](./README_uk.md) | [Tiếng Việt](./README_vi.md) | [Bahasa Indonesia](./README_id.md) | [Bahasa Melayu](./README_ms.md)

Leer documentación en más idiomas: [Centro de Idiomas](./docs/i18n/README.md)

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

Notemd mejora tu flujo de trabajo en Obsidian integrándose con varios modelos de lenguaje de gran tamaño (LLM) para procesar tus notas multilingües, generar automáticamente enlaces wiki para conceptos clave, crear notas de conceptos correspondientes, realizar investigación web, ayudándote a construir potentes grafos de conocimiento y más.

**Versión:** 1.8.0

<img width="1853" height="1080" alt="show" src="https://github.com/user-attachments/assets/b9f9292b-a9d8-48a3-9acf-1b6f00413966" />

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

1.  **Instalar y Activar**: Obtén el complemento desde la tienda comunitaria de Obsidian.
2.  **Configurar LLM**: Ve a `Configuración -> Notemd`, selecciona tu proveedor de LLM (como OpenAI o uno local como Ollama) e ingresa tu clave API/URL.
3.  **Abrir Barra Lateral**: Haz clic en el icono de la varita de Notemd en la cinta izquierda para abrir la barra lateral.
4.  **Procesar una Nota**: Abre cualquier nota y haz clic en **"Procesar archivo (Añadir enlaces)"** en la barra lateral para añadir automáticamente `[[wiki-links]]` a los conceptos clave.
5.  **Ejecutar Flujo de Trabajo Rápido**: Usa el botón predeterminado **"One-Click Extract"** para encadenar el procesamiento, la generación por lotes y la limpieza de Mermaid desde un solo punto.

¡Eso es todo! Explora los ajustes para desbloquear más funciones como investigación web, traducción y generación de contenido.

## Soporte de Idiomas

### Contrato de Comportamiento del Idioma

| Aspecto | Alcance | Predeterminado | Notas |
|---|---|---|---|
| `UI Locale` | Solo texto de la interfaz (ajustes, barra lateral, avisos) | `auto` | Sigue el idioma de Obsidian; los catálogos actuales son `en`, `zh-CN`, `zh-TW`. |
| `Task Output Language` | Salida de tareas generada por LLM (enlaces, resúmenes) | `en` | Puede ser global o por tarea. |
| `Disable auto translation` | Tareas que no son de traducción mantienen el contexto original | `false` | Las tareas explícitas de `Traducir` siguen aplicando el idioma objetivo. |

- La documentación oficial se mantiene en inglés y chino simplificado, con soporte completo para más de 30 idiomas.
- Todos los idiomas soportados están enlazados en el encabezado superior.

## Características Principales

### Procesamiento de Documentos con IA
- **Soporte Multi-LLM**: Conéctate a varios proveedores de LLM en la nube y locales.
- **Fragmentación Inteligente**: Divide automáticamente documentos grandes en partes manejables.
- **Preservación de Contenido**: Mantiene el formato original mientras añade estructura y enlaces.
- **Lógica de Reintento**: Reintento automático opcional para llamadas API fallidas.
- **Presets para China**: Incluye proveedores como `Qwen`, `Doubao`, `Moonshot`, etc.

### Mejora del Grafo de Conocimiento
- **Wiki-Linking Automático**: Identifica y añade enlaces wiki a conceptos principales.
- **Creación de Notas de Concepto**: Crea automáticamente notas nuevas para conceptos descubiertos en una carpeta específica.

### Traducción
- **Traducción con IA**: Traduce el contenido de las notas usando el LLM configurado.
- **Traducción por Lotes**: Traduce todos los archivos dentro de una carpeta seleccionada.

### Investigación Web y Generación de Contenido
- **Investigación Web**: Realiza búsquedas usando Tavily o DuckDuckGo y resume los resultados.
- **Generación desde Título**: Usa el título de la nota para generar contenido inicial.
- **Auto-Corrección de Mermaid**: Repara automáticamente la sintaxis de diagramas Mermaid generados.

## Instalación
1. Ve a **Ajustes** → **Complementos de la comunidad**.
2. Desactiva el "Modo restringido".
3. Haz clic en **Explorar** y busca "Notemd".
4. Haz clic en **Instalar** y luego en **Activar**.

## Licencia
Licencia MIT - Consulta el archivo [LICENSE](LICENSE) para más detalles.

---
*Notemd v1.8.0 - Mejora tu grafo de conocimiento en Obsidian con IA.*
