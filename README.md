<div align="center">

# Buscador y Evaluador de Empleos 100% Remotos desde Bolivia (BO)

**Plataforma pública, autónoma y auto-contenida para Cloudflare Workers diseñada para encontrar, filtrar y evaluar ofertas laborales internacionales elegibles para trabajar desde Bolivia (BO · UTC-4).**

[![Versión](https://img.shields.io/badge/Versi%C3%B3n-v5.2.0%20Producci%C3%B3n-0284c7?style=for-the-badge&logo=cloudflare&logoColor=white)](src/worker.js)
[![Plataforma](https://img.shields.io/badge/Runtime-Cloudflare%20Workers-f38020?style=for-the-badge&logo=cloudflareworkers&logoColor=white)](wrangler.toml)
[![Automatización](https://img.shields.io/badge/Frecuencia-Cada%2015%20min%20%2B%20Bajo%20Demanda-10b981?style=for-the-badge&logo=clockify&logoColor=white)](wrangler.toml)
[![Idioma UI](https://img.shields.io/badge/Interfaz-Espa%C3%B1ol%20Bolivia%20%7C%20English-f59e0b?style=for-the-badge&logo=googletranslate&logoColor=white)](src/ui.js)
[![Licencia](https://img.shields.io/badge/Licencia-GPL%20v3.0-blue.svg?style=for-the-badge&logo=gnu&logoColor=white)](#-licencia)

<p align="center">
  <a href="#-manual-del-usuario-final"><b>Manual de Usuario</b></a> •
  <a href="#-c%C3%B3mo-funciona-la-arquitectura-interna"><b>Arquitectura Interna</b></a> •
  <a href="#-gu%C3%ADa-de-instalaci%C3%B3n-y-auto-alojamiento-self-hosting"><b>Guía de Auto-Alojamiento</b></a> •
  <a href="#-referencia-de-la-api-rest"><b>API REST</b></a>
</p>

</div>

---

## 🧭 Tabla de Contenidos

1. [💡 ¿Qué es esta plataforma?](#-qu%C3%A9-es-esta-plataforma)
2. [📖 Manual del Usuario Final](#-manual-del-usuario-final)
   - [Paso 1: Acceso e idioma](#paso-1-acceso-e-idioma)
   - [Paso 2: Configuración de tus filtros personalizados (12 Categorías)](#paso-2-configuraci%C3%B3n-de-tus-filtros-personalizados-12-categor%C3%ADas)
   - [Paso 3: El filtro base — ¿Por qué 100% Remoto desde Bolivia?](#paso-3-el-filtro-base--por-qu%C3%A9-100-remoto-desde-bolivia)
   - [Paso 4: Semáforo de calificación y toma de acción](#paso-4-sem%C3%A1foro-de-calificaci%C3%B3n-y-toma-de-acci%C3%B3n)
   - [Paso 5: Escanear y evaluar URLs de plataformas personalizadas](#paso-5-escanear-y-evaluar-urls-de-plataformas-personalizadas)
   - [Paso 6: Pestaña interactiva "Manual de Uso" integrada](#paso-6-pesta%C3%B1a-interactiva-manual-de-uso-integrada)
   - [Paso 7: Generación y descarga de resultados en vivo](#paso-7-generaci%C3%B3n-y-descarga-de-resultados-en-vivo)
3. [⚙️ Cómo Funciona la Arquitectura Interna](#-c%C3%B3mo-funciona-la-arquitectura-interna)
   - [Diagrama de flujo del sistema](#diagrama-de-flujo-del-sistema)
   - [Motor de calificación y rúbrica dinámica de 100 puntos](#motor-de-calificaci%C3%B3n-y-r%C3%BAbrica-din%C3%A1mica-de-100-puntos)
   - [Motor de ingesta y 85 plataformas públicas monitoreadas](#motor-de-ingesta-y-85-plataformas-p%C3%BAblicas-monitoreadas)
   - [Ciclo de ejecución bajo demanda y cron cada 15 minutos](#ciclo-de-ejecuci%C3%B3n-bajo-demanda-y-cron-cada-15-minutos)
4. [🛠️ Guía de Instalación y Auto-Alojamiento (Self-Hosting)](#-gu%C3%ADa-de-instalaci%C3%B3n-y-auto-alojamiento-self-hosting)
   - [Requisitos previos](#requisitos-previos)
   - [Instalación local y pruebas](#instalaci%C3%B3n-local-y-pruebas)
   - [Despliegue público en Cloudflare Workers](#despliegue-p%C3%BAblico-en-cloudflare-workers)
   - [Generación de HTML autónomo (Standalone)](#generaci%C3%B3n-de-html-aut%C3%B3nomo-standalone)
5. [🔌 Referencia de la API REST](#-referencia-de-la-api-rest)
6. [📄 Licencia](#-licencia)

---

## 💡 ¿Qué es esta plataforma?

Buscar trabajo remoto internacional desde Bolivia suele ser frustrante: la mayoría de bolsas de empleo anuncian puestos como *"remotos"*, pero al leer las letras pequeñas exigen residencia física en Estados Unidos, permiso de trabajo en la Unión Europea o contratación exclusiva local.

Esta herramienta es una **solución pública y gratuita** que centraliza **85 plataformas globales y regionales** (incluyendo Torre.ai, GetOnBoard, Virtual Latinos, Workana, SoyFreelancer, NoDesk, DailyRemote, Jobspresso, Dynamite Jobs, LatinHire, HireLatam, SheWorks, Himalayas, We Work Remotely, Remotive, etc.), filtrando automáticamente el ruido geográfico y evaluando cada oportunidad frente a tus preferencias individuales de **idiomas, área profesional (12 categorías técnicas y no técnicas), nivel de experiencia y modalidad de contrato**.

### ✨ Principales Características y Novedades (v5.2)

- **🌍 Identidad y Favicon Patrio:** Favicon vectorial del planeta Tierra con los colores de la bandera de Bolivia (`#EF4444`, `#FDE047`, `#10B981`) incrustado como Data URI SVG en el encabezado y disponible en `/favicon.svg`, `/favicon.ico` y `/favicon.png`.
- **🧭 Interfaz Despejada y Limpia:** Menú lateral optimizado con acceso directo a `🎯 Resultados en Vivo`, `📖 Manual de Uso` y los 6 Tracks de plataformas monitoreadas, sin categorías vacías ni enlaces innecesarios.
- **🚫 Cero Menciones de Francés:** Filtros, mecanismos de búsqueda y pesos adaptados estrictamente a oportunidades relevantes para postulantes desde Bolivia (Español, Inglés, Portugués, Alemán).
- **⚖️ Regla Estricta de Idiomas:** Si seleccionas exclusivamente Español, las ofertas en inglés reciben cero puntos de idioma y quedan descartadas de las vacantes recomendadas.
- **📖 Manual de Uso Práctico Integrado:** Sección dedicada exclusivamente a la guía operativa paso a paso para dominar el uso de la herramienta.

> [!NOTE]
> Todo el procesamiento ocurre en tiempo real en los servidores perimetrales de **Cloudflare Workers** o localmente en tu navegador. Cero datos privados, cero cookies de rastreo y cero cuentas obligatorias.

---

## 📖 Manual del Usuario Final

Si estás utilizando la versión alojada públicamente en línea, esta guía te muestra cómo aprovecharla al máximo en menos de 3 minutos.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Elige tu Idioma ──▶ 2. Ajusta tus Filtros ──▶ 3. Revisa tu Semáforo       │
│    (ES-BO / EN)         (12 Áreas, Exp, Mod)        (Postular / Explorar)   │
│                                                                             │
│ 4. ¿Tienes una URL? ─▶ 5. Escanéala en Vivo  ──▶ 6. Exporta tu Reporte      │
│    (Pega cualquier link)  (Evaluación instantánea)  (Markdown / CSV)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Paso 1: Acceso e idioma

Al abrir el portal, la aplicación carga por defecto en **Español (Bolivia)** (`es-BO`) con el nombre **Bolivia Remoto (BO)** en la barra de navegación y el título **Buscador y Evaluador de Empleos 100% Remotos desde Bolivia (BO)** en el banner principal. 

Si prefieres navegar en inglés, haz clic en el botón superior derecho:
- **`Español (Bolivia)`**: Textos, etiquetas, badges de contratación y reportes orientados a la región.
- **`English`**: Traducción completa de la interfaz, explicaciones y del reporte en formato Markdown.

---

### Paso 2: Configuración de tus filtros personalizados (12 Categorías)

En la sección **"🎛️ Personaliza tu Búsqueda y Criterios de Evaluación"**, puedes seleccionar tus preferencias haciendo clic sobre las etiquetas interactivas:

| Filtro | Opciones Disponibles | Cómo Influye en el Puntaje |
| :--- | :--- | :--- |
| **1. Tus Idiomas** | `Español (BO)`, `Inglés`, `Portugués`, `Alemán` | Pondera hasta **20 puntos**. **Regla Estricta:** Si seleccionas únicamente `Español (BO)`, el evaluador descarta las ofertas en inglés y solo muestra vacantes redactadas o ejecutadas en español. |
| **2. Tu Nivel de Experiencia** | `Todos los niveles`, `Inicial / Sin experiencia (0-1 a)`, `Junior (1-2 a)`, `Semi-Senior / Mid (3-5 a)`, `Senior (5+ a)`, `Lead / Manager (8+ a)` | Pondera dentro del bloque de contrato/experiencia (**20 puntos**). Evita que veas vacantes incompatibles con tu trayectoria. |
| **3. Tipo de Contrato** | `Tiempo Completo (40h/sem)`, `Medio Tiempo / Part-Time (20h / 4 días)`, `Por Proyectos / Freelance`, `Por Horas / Flexible / Asíncrono`, `Consultoría / Asesoría` | Puedes marcar uno, varios o todos. Pondera dentro del bloque de contrato (**20 puntos**). |
| **4. Áreas Profesionales (12 Categorías)** | 1. 💼 `Asistente Virtual & Soporte Ejecutivo`<br>2. 📋 `Coordinación de Operaciones & Proyectos`<br>3. 🎧 `Atención al Cliente & Chat Support`<br>4. 📈 `Ventas Remotas, BDR & SDR`<br>5. 📱 `Marketing Digital & Contenidos`<br>6. 👥 `Recursos Humanos & Recruiting LATAM`<br>7. 📊 `Finanzas, Contabilidad & Bookkeeping`<br>8. 🎨 `Diseño Gráfico, UI/UX & Video`<br>9. 🤖 `Entrenamiento IA, RLHF & Anotación`<br>10. 💻 `Desarrollo de Software`<br>11. ☁️ `Cloud, DevOps & Sistemas`<br>12. 📈 `Datos, BI & Machine Learning` | Pondera hasta **35 puntos**. Puedes marcar una o múltiples categorías. Si deseas ver todas las ofertas sin restricción de rol, pulsa *"Ver todas las áreas"*. |
| **Palabras Clave Libres** | Campo de texto abierto para escribir herramientas o cargos específicos (ej. *Excel, Canva, Shopify, HubSpot, Python, React, Soporte, Quickbooks*). | Las ofertas que contengan estas palabras recibirán una bonificación directa en su calificación. |

> [!TIP]
> **Casilla "Ocultar ofertas de otras áreas":**  
> Si marcas esta opción, el sistema actuará con filtro estricto y esconderá cualquier oferta que no coincida con tus áreas profesionales seleccionadas.

---

### Paso 3: El filtro base — ¿Por qué 100% Remoto desde Bolivia?

La casilla **"Mostrar solo ofertas 100% remotas desde Bolivia"** viene activada por defecto. 

#### ¿Qué hace este filtro?
El algoritmo analiza el texto completo de la oferta, su título, ubicación requerida y políticas de contratación para descartar automáticamente:
- Puestos que requieren residir físicamente en Estados Unidos (*"US Only"*, *"Must reside in the US"*, contratos *W-2* exclusivos).
- Puestos restringidos a Europa (*"EU Only"*), Reino Unido (*"UK Only"*), Canadá, México o España.
- Empleos presenciales o híbridos (*"On-site"*, *"Hybrid"*).
- Posiciones que exigen visados o autorizaciones gubernamentales extranjeras (*"Security Clearance"*, *"TS/SCI"*).

#### ¿Qué oportunidades mantiene visibles?
- **🌎 Específicas para Latinoamérica y Bolivia:** Empresas que contratan activamente en Sudamérica, zona horaria `UTC-4` / `EST` o mediante contrato internacional (*W-8BEN* sin visa).
- **🌍 100% Remoto Global / Work From Anywhere:** Compañías distribuidas en todo el mundo sin barrera geográfica de residencia.
- **🕒 Traslape Horario Internacional:** Ofertas que aceptan trabajo internacional requiriendo coincidencia horaria razonable con husos de América.

---

### Paso 4: Semáforo de calificación y toma de acción

Cada vacante es calificada sobre **100 puntos** y clasificada en cuatro grupos:

```mermaid
graph TD
    A["Oferta de Empleo Detectada"] --> B{"¿Apta para postular desde Bolivia?"}
    B -- No --> C["🚫 BLOQUEADA POR PAÍS (Descartada automáticamente)"]
    B -- Sí --> D["Cálculo de Afinidad frente a tus Filtros (0-100 pts)"]
    D --> E{"Puntaje Final"}
    E -- "≥ 78 pts" --> F["🔥 POSTULAR (Máxima afinidad, postulación recomendada)"]
    E -- "58 a 77 pts" --> G["🟡 EXPLORAR (Afinidad intermedia / compatible)"]
    E -- "< 58 pts" --> H["⚪ BAJA COINCIDENCIA (Fuera de tu área o contrato)"]
```

1. **🔥 POSTULAR (Puntaje ≥ 78/100):**  
   Coincide con tus idiomas, tu área profesional, tu nivel y es 100% accesible desde Bolivia. Incluye el botón **"🔗 Ver Oferta y Postular"** para abrir el enlace directo a la fuente original.
2. **🟡 EXPLORAR (Puntaje 58–77/100):**  
   Ofertas interesantes que coinciden con tus habilidades principales, pero presentan variaciones menores (por ejemplo, modalidad de tiempo completo cuando buscas medio tiempo).
3. **⚪ BAJA COINCIDENCIA (< 58/100):**  
   Ofertas legítimas desde Bolivia, pero fuera de las categorías o palabras clave que seleccionaste.
4. **🚫 NO ELEGIBLES BOLIVIA:**  
   Vacantes detectadas con restricciones geográficas locales. Puedes visualizarlas seleccionando la pestaña *"Bloqueadas País"*.

---

### Paso 5: Escanear y evaluar URLs de plataformas personalizadas

¿Encontraste una página de carreras de una empresa, una nueva bolsa de empleo o un enlace de ofertas remotas que quieres evaluar?

1. Dirígete a la sección **"➕ Agregar y Escanear tu Propia URL de Plataforma o Bolsa de Empleo"**.
2. Pega la URL en el campo correspondiente (por ejemplo: `https://empresa.com/careers` o `https://sitio.com/jobs.rss`).
3. *(Opcional)* Asigna un nombre descriptivo.
4. Selecciona el modo de escaneo:
   - **Auto-detectar (Recomendado):** Detecta automáticamente si el enlace es una página HTML con microdatos de empleo (*JSON-LD JobPosting*), un feed RSS/Atom en XML, o un endpoint JSON.
   - **Página Web / Bolsa HTML:** Rastrea enlaces y fichas de empleo dentro de la estructura web.
   - **Feed RSS / Atom XML:** Extrae las entradas publicadas en sindicación.
   - **API JSON:** Lee listas de vacantes expuestas en formato REST/JSON.
5. Haz clic en **"🔍 Escanear y Evaluar URL"**.
6. En segundos, las oportunidades encontradas serán analizadas con el filtro de Bolivia y tus criterios, integrándose inmediatamente a tus **Resultados**.

---

### Paso 6: Pestaña interactiva "Manual de Uso" integrada

En la barra de navegación lateral y en la barra de herramientas superior encontrarás el enlace directo a **📖 Manual de Uso**, que contiene exclusivamente la **Guía del Usuario: Bolivia Remoto (BO)** estructurada en 9 pasos prácticos para dominar la plataforma:

1. **Configura tus Idiomas de Trabajo:** Selecciona entre `Español (BO)`, `Inglés` y `Portugués`. *(Regla Estricta: si seleccionas únicamente Español, el motor descarta vacantes en inglés y prioriza empleos en habla hispana).*
2. **Define tu Nivel de Experiencia:** Desde *Inicial / Sin Experiencia (0-1 a)* hasta *Senior (5+ a)* y *Lead (8+ a)*.
3. **Elige tus Modalidades de Contrato:** *Tiempo Completo*, *Medio Tiempo*, *Por Proyectos*, *Por Horas* o *Consultoría/Asesoría* (con atajo *"Todos"*).
4. **Selecciona tus Áreas Profesionales y Palabras Clave:** Filtra entre 12 categorías laborales (incluyendo Asistente Virtual, Coordinación, Soporte, etc.), botón *"Ver todas las áreas"*, casilla *"Ocultar ofertas de otras áreas"* y campo para habilidades específicas (*Excel, Canva, Python, Shopify, etc.*).
5. **El Filtro Base 100% Remoto desde Bolivia:** Explicación del descarte de restricciones territoriales extranjeras (*US Only, W-2, EU Only*) y validación de esquemas globales y LATAM (*UTC-4*, *W-8BEN*).
6. **Interpreta el Semáforo de Compatibilidad:** Códigos de acción: 🔥 **POSTULAR** (≥78 pts), 🟡 **EXPLORAR** (58–77 pts), ⚪ **BAJA COINCIDENCIA** (<58 pts) y 🚫 **BLOQUEADAS PAÍS (GEO)**.
7. **Postula Directamente a la Fuente Original:** Apertura instantánea con el botón *"🔗 Ver Oferta y Postular"* hacia el portal oficial sin intermediarios ni cobros.
8. **Escanea tus Propias URLs de Plataformas:** Evaluación instantánea de enlaces web de empresas, feeds RSS/Atom o APIs JSON en el panel integrado.
9. **Exporta tus Resultados y Sincroniza en Segundo Plano:** Generación de reportes en Markdown (`.md`), descargas en CSV para Excel/Notion, escaneo manual *"🔄 Escanear Ofertas Ahora"* y cron perimetral cada 15 minutos.

---

### Paso 7: Generación y descarga de resultados en vivo

La aplicación no depende de boletines estáticos ni horarios rígidos: los resultados se generan al vuelo (*on-the-fly*):

- **Vista "📄 Reporte Markdown / Exportar":**  
  Genera un informe completo en formato Markdown (`.md`) con el resumen de vacantes recomendadas, desgloses de puntaje y enlaces directos.
- **Botón `📋 Copiar Resultados (.md)`:** Copia el reporte formateado a tu portapapeles.
- **Botón `⬇️ Descargar .md`:** Descarga el archivo `resultados-remoto-bolivia-YYYY-MM-DD.md`.
- **Botón `📊 Exportar CSV`:** Descarga una hoja de cálculo con todas las ofertas, empresas, ubicaciones, modalidades y enlaces para que lleves control de tus postulaciones en Excel o Notion.
- **Botón `🔄 Escanear Ofertas Ahora`:** En la cabecera superior, pulsa este botón cuando quieras solicitar a la red de Cloudflare un escaneo en vivo de las plataformas activas.

---

## ⚙️ Cómo Funciona la Arquitectura Interna

La solución está construida sobre una arquitectura **Serverless Zero-Dependency** en **Cloudflare Workers**, consumiendo únicamente estándares de la Web (Fetch API, Web Streams, Web Crypto, URL API, Cache API).

### Diagrama de flujo del sistema

```mermaid
flowchart TD
    subgraph Cliente ["🌐 Navegador del Usuario"]
        UI["Interfaz Web Bilingüe (es-BO / en)"]
        Filters["Filtros en LocalStorage (Idiomas, 12 Roles, Exp, Contrato)"]
        URLScan["Formulario de Escaneo de URLs"]
        ManualTab["Manual de Uso Integrado"]
    end

    subgraph CFWorker ["⚡ Cloudflare Worker (Edge Serverless)"]
        WorkerEntry["src/worker.js (Router & Cron Handler)"]
        ScannerEng["src/scanner.js (Parser JSON/RSS/HTML/Dorks)"]
        EvaluatorEng["src/evaluator.js (Algoritmo 4 Ejes & Filtro Bolivia)"]
        SeedData["src/seed_data.js (85 Plataformas / 137+ Ofertas Base)"]
        EdgeCache["Cloudflare Cache API (caches.default)"]
    end

    subgraph Fuentes ["🌍 85 Fuentes Globales de Empleo"]
        APIs["APIs REST Públicas (Torre, GetOnBoard, Remotive, etc.)"]
        RSS["Feeds RSS / Atom (Himalayas, WWR, NoDesk, DailyRemote, etc.)"]
        HTMLPages["Bolsas Web LATAM & Globales (Workana, Virtual Latinos, etc.)"]
    end

    UI <-->|JSON / HTML| WorkerEntry
    URLScan -->|POST /api/platforms/scan-url| WorkerEntry
    WorkerEntry --> ScannerEng
    ScannerEng -->|Fetch con Timeout| Fuentes
    ScannerEng --> EvaluatorEng
    EvaluatorEng --> WorkerEntry
    WorkerEntry <--> EdgeCache
    SeedData -.->|Fallback / Arranque en frío| WorkerEntry
```

---

### Motor de calificación y rúbrica dinámica de 100 puntos

El evaluador ([`src/evaluator.js`](src/evaluator.js)) analiza cada oportunidad descomponiéndola en 4 dimensiones ponderadas:

$$\text{Puntaje Total} = \text{Posición y Habilidades (35)} + \text{Elegibilidad Bolivia (25)} + \text{Contrato y Nivel (20)} + \text{Idiomas (20)}$$

```
  ┌───────────────────────────────────────────────────────────────┐
  │ 🎯 Posición & Habilidades: 35 pts                             │
  │   - Coincidencia con una de las 12 categorías laborales       │
  │   - Coincidencia con palabras clave libres del usuario        │
  │                                                               │
  │ 📍 Elegibilidad Remota Bolivia: 25 pts                        │
  │   - 25 pts: Explícitamente Bolivia / LATAM / UTC-4            │
  │   - 23 pts: Remoto Global / Work From Anywhere                │
  │   - 19 pts: Remoto internacional con traslape horario         │
  │   -  0 pts: Restringido a país local (descarta la vacante)    │
  │                                                               │
  │ ⏱️ Modalidad de Contrato & Experiencia: 20 pts                │
  │   - Contrato buscado: Full-time, Half-time, Proyectos, Horas  │
  │   - Nivel de experiencia requerido vs declarado               │
  │                                                               │
  │ 🗣️ Idiomas Requeridos: 20 pts                                 │
  │   - Regla Estricta: Español exclusivo descarta ofertas en     │
  │     inglés o que no admitan hispanohablantes                  │
  └───────────────────────────────────────────────────────────────┘
```

---

### Motor de ingesta y 85 plataformas públicas monitoreadas

El escáner ([`src/scanner.js`](src/scanner.js)) monitorea 85 bolsas de empleo públicas agrupadas en 6 Tracks:
- **Track A (B2B Directo & Freelance):** Arc.dev, Contra, Freelancer, Workana, SoyFreelancer.
- **Track B (Entrenamiento IA & RLHF):** Alignerr, DataAnnotation, Outlier, Mindrift, Remotasks.
- **Track C (Redes LATAM & Globales):** Torre.ai, GetOnBoard, Virtual Latinos, LatinHire, HireLatam, SheWorks, Turing, BairesDev.
- **Track D (Portales Europeos & Globales):** Welcome to the Jungle, WeLoveDevs, Malt, Emploi-Belgique.
- **Track E (Consultoría Experta):** GLG, AlphaSights, Dialectica, Guidepoint.
- **Track F (Bolsas 100% Remotas Abiertas):** Himalayas, We Work Remotely, Remotive, NoDesk, DailyRemote, Jobspresso, Dynamite Jobs, RemoteOK, Working Nomads.

---

### Ciclo de ejecución bajo demanda y cron cada 15 minutos

La plataforma combina dos modos de refresco:

- **Automático en segundo plano (Cloudflare Cron Trigger):**  
  Declarado en [`wrangler.toml`](wrangler.toml) como `crons = ["*/15 * * * *"]`. Cada 15 minutos, el worker despierta sin costo de servidor dedicado, sondea un lote rotativo de plataformas y persiste las nuevas vacantes elegibles en la memoria caché perimetral.
- **Bajo demanda del usuario:**  
  La interfaz gráfica realiza llamadas a `/api/scan` y `/api/platforms/scan-url` permitiendo que cualquier persona desencadene una actualización instantánea en el momento exacto en que la necesita.

---

## 🛠️ Guía de Instalación y Auto-Alojamiento (Self-Hosting)

Puedes alojar tu propia instancia en Cloudflare en menos de 5 minutos utilizando una cuenta gratuita.

### Requisitos previos

- **Node.js** v20.0.0 o superior ([nodejs.org](https://nodejs.org/)).
- **Cuenta de Cloudflare** gratuita ([dash.cloudflare.com](https://dash.cloudflare.com/)).
- **Git** instalado en tu sistema.

---

### Instalación local y pruebas

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/t0m-a/scout-analyst-pipeline.git
   cd scout-analyst-pipeline
   ```

2. **Verificar la suite de pruebas automatizadas:**
   ```bash
   npm test
   ```
   *Ejecuta 8 grupos de prueba automáticos que validan:*
   - Carga de la interfaz web en español Bolivia (`es-BO`) con branding limpio (`BO`) y manual integrado.
   - Estado general del servicio con 85 plataformas monitoreadas y catálogo base.
   - Ponderación estricta de idiomas (exclusión garantizada de ofertas en inglés si solo se marca Español).
   - Cobertura de 12 categorías y roles ampliados (Asistente Virtual, Coordinación, Operaciones, Soporte).
   - Generación instantánea del reporte de resultados en Markdown (`/api/results.md`).
   - Escaneo y extracción dinámica de ofertas desde URLs externas (`/api/platforms/scan-url`).
   - Disponibilidad del favicon vectorial del planeta Tierra con los colores de la bandera de Bolivia (`/favicon.svg`, `/favicon.ico`).
   - Auditoría estricta de privacidad: cero datos personales ni credenciales privadas en todo el repositorio.

3. **Iniciar el servidor local de desarrollo con Wrangler:**
   ```bash
   npm run dev
   ```
   Wrangler levantará la aplicación en `http://localhost:8787`, simulando de forma idéntica el entorno de Cloudflare Workers.

---

### Despliegue público en Cloudflare Workers

1. **Iniciar sesión en tu cuenta de Cloudflare desde la terminal:**
   ```bash
   npx wrangler login
   ```

2. **Publicar el Worker a nivel mundial:**
   ```bash
   npm run deploy
   ```

   Una vez finalizado, la consola mostrará tu URL pública activa, por ejemplo:
   ```text
   Uploaded bolivia-remote-scout (2.1 sec)
   Deployed bolivia-remote-scout triggers (1.0 sec)
     https://bolivia-remote-scout.<tu-subdominio>.workers.dev
     schedule: */15 * * * *
   ```

> [!IMPORTANT]
> **El Cron Trigger queda activo automáticamente:**  
> Al desplegar, Cloudflare programa la ejecución del escaneo cada 15 minutos sin que tengas que configurar tareas de cron en Linux ni administradores de tareas en Windows.

---

### Generación de HTML autónomo (Standalone)

Si deseas utilizar la interfaz como un archivo HTML único sin desplegar el Worker (por ejemplo, para abrirlo localmente en tu navegador o alojarlo en GitHub Pages / Nginx):

```bash
npm run build-html
```

Este comando empaqueta los datos base y el evaluador directamente dentro de [`index.html`](index.html), permitiendo abrir el archivo en cualquier navegador con doble clic.

---

## 🔌 Referencia de la API REST

El worker expone endpoints HTTP estándar para integraciones externas:

| Método | Ruta | Parámetros / Cuerpo | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Ninguno | Retorna la aplicación web interactiva completa (HTML5/CSS3/JS). |
| `GET` | `/api/state` | Ninguno | Retorna el listado completo de plataformas registradas y ofertas actuales en JSON. |
| `POST` | `/api/evaluate` | JSON `{ filters: { ... } }` | Evalúa dinámicamente el catálogo frente a los filtros provistos y retorna las ofertas ordenadas con sus puntajes. |
| `POST` | `/api/scan` | JSON opcional `{ track, platform }` | Ejecuta un escaneo de actualización bajo demanda sobre las plataformas monitoreadas. |
| `POST` | `/api/platforms/scan-url` | JSON `{ url, name, type, track, filters }` | Escanea cualquier URL ingresada por el usuario, extrae ofertas y las añade a la base. |
| `GET` | `/api/results.md` | Query: `?lang=es` o `?lang=en` | Genera y descarga el reporte de Resultados al instante en formato Markdown puro. |
| `GET` | `/favicon.svg` | Ninguno | Retorna el favicon vectorial en SVG del planeta Tierra con los colores de la bandera de Bolivia (`#EF4444`, `#FDE047`, `#10B981`). |
| `GET` | `/favicon.ico` | Ninguno | Favicon en formato ICO para compatibilidad universal con navegadores antiguos. |
| `GET` | `/favicon.png` | Ninguno | Favicon rasterizado en PNG para dispositivos móviles y Apple Touch Icon. |

#### Ejemplo con `curl`: Escaneo de una URL personalizada
```bash
curl -X POST https://bolivia-remote-scout.workers.dev/api/platforms/scan-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://remotive.com/api/remote-jobs?category=devops&limit=10",
    "name": "Remotive DevOps Feed",
    "type": "json_api"
  }'
```

---

## 📄 Licencia

Este proyecto es software libre y de código abierto bajo la licencia **GNU General Public License v3.0 (GPL-3.0)**. Eres libre de usarlo, estudiarlo, compartirlo y mejorarlo para beneficiar a la comunidad.

---

<div align="center">
  <sub>Construido con tecnología de borde en Cloudflare Workers para impulsar oportunidades de empleo remoto desde Bolivia hacia el mundo.</sub>
</div>
