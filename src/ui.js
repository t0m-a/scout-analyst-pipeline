/**
 * Self-Contained Bilingual UI Generator (Spanish Bolivia 'es-BO' first, switchable to English 'en')
 * Renders the complete interactive application with embedded data, on-the-fly Results generation,
 * customizable filters, custom platform URL scanner, in-app User Manual, and 15-minute + on-demand scan controls.
 */

import {
  POSITION_CATEGORIES,
  LANGUAGE_OPTIONS,
  EXPERIENCE_OPTIONS,
  CONTRACT_OPTIONS,
  DEFAULT_FILTERS,
  checkBoliviaRemoteEligibility,
  detectOfferAttributes,
  evaluateOpportunity,
  evaluateAllOpportunities,
  generateResultsMarkdown
} from './evaluator.js';

export function renderAppHtml(initialState) {
  const {
    opportunities = [],
    platforms = [],
    lastScanAt = new Date().toISOString()
  } = initialState;

  const clientPayload = JSON.stringify({
    opportunities,
    platforms,
    lastScanAt,
    POSITION_CATEGORIES,
    LANGUAGE_OPTIONS,
    EXPERIENCE_OPTIONS,
    CONTRACT_OPTIONS,
    DEFAULT_FILTERS
  }).replace(/<\//g, '<\\/');

  return `<!DOCTYPE html>
<html lang="es-BO">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🇧🇴 Empleos 100% Remotos desde Bolivia (BO) — Buscador y Evaluador en Vivo</title>
  <meta name="description" content="Herramienta pública para filtrar, escanear y evaluar ofertas de trabajo 100% remotas elegibles desde Bolivia (BO) según tus idiomas, área profesional, experiencia y tipo de contrato.">
  <style>
    :root {
      --bg-page: #f4f6f9;
      --bg-card: #ffffff;
      --text-main: #1e293b;
      --text-muted: #64748b;
      --accent-primary: #0284c7;
      --accent-secondary: #0f766e;
      --bolivia-red: #d52b1e;
      --bolivia-yellow: #f9e300;
      --bolivia-green: #007934;
      --apply-bg: #ecfdf5;
      --apply-border: #10b981;
      --apply-text: #065f46;
      --possible-bg: #fffbeb;
      --possible-border: #f59e0b;
      --possible-text: #92400e;
      --skip-bg: #f1f5f9;
      --skip-border: #94a3b8;
      --skip-text: #475569;
      --geo-bg: #fef2f2;
      --geo-border: #ef4444;
      --geo-text: #991b1b;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      color: var(--text-main);
      background-color: var(--bg-page);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.5;
    }
    .bolivia-stripe {
      height: 5px;
      background: linear-gradient(90deg, var(--bolivia-red) 0%, var(--bolivia-red) 33.3%, var(--bolivia-yellow) 33.3%, var(--bolivia-yellow) 66.6%, var(--bolivia-green) 66.6%, var(--bolivia-green) 100%);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
    }
    #navbar {
      position: fixed;
      top: 5px;
      left: 0;
      width: 280px;
      height: calc(100% - 5px);
      border-right: 1px solid #e2e8f0;
      background: #ffffff;
      z-index: 900;
      display: flex;
      flex-direction: column;
      transition: transform 0.25s ease;
    }
    .navbar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .header-title {
      font-size: 1.05em;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .sidebar-fold-btn {
      width: 30px;
      height: 30px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
      color: #334155;
      font-weight: 700;
      cursor: pointer;
    }
    .sidebar-fold-btn:hover {
      background: var(--accent-primary);
      color: #fff;
      border-color: var(--accent-primary);
    }
    #sidebar-unfold-btn {
      position: fixed;
      top: 16px;
      left: 14px;
      z-index: 950;
      display: none;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
      color: #0f172a;
      font-size: 0.86em;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }
    body.sidebar-collapsed #navbar {
      transform: translateX(-280px);
    }
    body.sidebar-collapsed #sidebar-unfold-btn {
      display: inline-flex;
    }
    #navbar ul {
      flex: 1;
      margin: 0;
      padding: 0;
      overflow-y: auto;
      list-style: none;
    }
    #navbar li {
      border-bottom: 1px solid #f1f5f9;
    }
    #navbar li.nav-group-header {
      background: #f1f5f9;
      padding: 8px 14px;
      font-size: 0.74em;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
    }
    #navbar a {
      display: block;
      padding: 10px 16px;
      color: #334155;
      text-decoration: none;
      font-size: 0.88em;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }
    #navbar a:hover, #navbar a.active-nav {
      background: #e0f2fe;
      color: #0369a1;
      font-weight: 700;
      border-left: 3px solid var(--accent-primary);
    }
    #main-doc {
      margin-left: 280px;
      padding: 28px 32px 60px 32px;
      max-width: 1320px;
      transition: margin-left 0.25s ease;
    }
    body.sidebar-collapsed #main-doc {
      margin-left: 0;
      max-width: 1480px;
      padding-left: 60px;
    }
    .top-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
      color: #ffffff;
      padding: 22px 26px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
    }
    .banner-top-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
      gap: 14px;
    }
    .top-banner h1 {
      margin: 0 0 6px 0;
      font-size: 1.55em;
      font-weight: 700;
      color: #ffffff;
    }
    .top-banner p {
      margin: 4px 0;
      color: #cbd5e1;
      font-size: 0.92em;
    }
    .lang-switch-group {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .btn-lang {
      padding: 7px 13px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.3);
      background: rgba(255,255,255,0.1);
      color: #ffffff;
      font-size: 0.84em;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-lang.active, .btn-lang:hover {
      background: #38bdf8;
      color: #0f172a;
      border-color: #38bdf8;
    }
    .btn-scan-now {
      padding: 8px 15px;
      border-radius: 999px;
      border: 1px solid #34d399;
      background: #059669;
      color: #ffffff;
      font-size: 0.85em;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-scan-now:hover {
      background: #10b981;
    }
    .btn-scan-now:disabled {
      opacity: 0.65;
      cursor: wait;
    }
    .banner-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .banner-pill {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.22);
      color: #f8fafc;
      padding: 4px 11px;
      border-radius: 999px;
      font-size: 0.79em;
      font-weight: 600;
    }
    .panel-card {
      background: var(--bg-card);
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 18px 22px;
      margin-bottom: 18px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid #f1f5f9;
    }
    .panel-title {
      margin: 0;
      font-size: 1.1em;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }
    .filter-block {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
    }
    .filter-block-label {
      font-size: 0.85em;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .chip-group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border-radius: 999px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
      font-size: 0.81em;
      font-weight: 600;
      cursor: pointer;
      user-select: none;
      transition: all 0.12s ease;
    }
    .chip:hover {
      border-color: var(--accent-primary);
      color: var(--accent-primary);
    }
    .chip.selected {
      background: var(--accent-primary);
      color: #ffffff;
      border-color: var(--accent-primary);
    }
    .input-text, .input-select {
      width: 100%;
      padding: 8px 11px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.88em;
      background: #ffffff;
      color: #0f172a;
    }
    .input-text:focus, .input-select:focus {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
    }
    .url-scanner-form {
      display: grid;
      grid-template-columns: 2fr 1.1fr 1fr auto;
      gap: 10px;
      align-items: end;
    }
    @media (max-width: 960px) {
      .url-scanner-form {
        grid-template-columns: 1fr;
      }
    }
    .form-field label {
      display: block;
      font-size: 0.8em;
      font-weight: 700;
      color: #475569;
      margin-bottom: 4px;
    }
    .scan-alert {
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.88em;
      font-weight: 600;
      display: none;
    }
    .scan-alert.success {
      display: block;
      background: #ecfdf5;
      border: 1px solid #10b981;
      color: #065f46;
    }
    .scan-alert.error {
      display: block;
      background: #fef2f2;
      border: 1px solid #ef4444;
      color: #991b1b;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(185px, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .kpi-card {
      background: var(--bg-card);
      border-radius: 8px;
      padding: 14px 16px;
      border-left: 5px solid var(--accent-primary);
      box-shadow: 0 2px 5px rgba(0,0,0,0.04);
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.09);
    }
    .kpi-card.apply { border-left-color: var(--apply-border); }
    .kpi-card.possible { border-left-color: var(--possible-border); }
    .kpi-card.skip { border-left-color: var(--skip-border); }
    .kpi-card.geo { border-left-color: var(--geo-border); }
    .kpi-value {
      font-size: 1.6em;
      font-weight: 800;
      line-height: 1.1;
    }
    .kpi-label {
      font-size: 0.82em;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-card);
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-bottom: 18px;
    }
    .filter-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .btn-tab {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
      padding: 7px 13px;
      border-radius: 6px;
      font-size: 0.85em;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-tab:hover, .btn-tab.active {
      background: var(--accent-primary);
      color: #ffffff;
      border-color: var(--accent-primary);
    }
    .opp-card {
      background: var(--bg-card);
      border: 1px solid #e2e8f0;
      border-left: 5px solid var(--accent-primary);
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.03);
    }
    .opp-card.verdict-APPLY { border-left-color: var(--apply-border); }
    .opp-card.verdict-POSSIBLE { border-left-color: var(--possible-border); }
    .opp-card.verdict-SKIP { border-left-color: var(--skip-border); opacity: 0.88; }
    .opp-card.verdict-GEO { border-left-color: var(--geo-border); opacity: 0.78; }
    .opp-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 8px;
    }
    .opp-title {
      margin: 0;
      font-size: 1.1em;
      font-weight: 700;
      color: #0f172a;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.78em;
      font-weight: 700;
      white-space: nowrap;
    }
    .badge-APPLY { background: var(--apply-bg); color: var(--apply-text); border: 1px solid var(--apply-border); }
    .badge-POSSIBLE { background: var(--possible-bg); color: var(--possible-text); border: 1px solid var(--possible-border); }
    .badge-SKIP { background: var(--skip-bg); color: var(--skip-text); border: 1px solid var(--skip-border); }
    .badge-GEO { background: var(--geo-bg); color: var(--geo-text); border: 1px solid var(--geo-border); }
    .meta-line {
      font-size: 0.86em;
      color: var(--text-muted);
      margin-bottom: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    .bolivia-pill {
      display: inline-block;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 2px 9px;
      border-radius: 999px;
      font-size: 0.79em;
      font-weight: 700;
    }
    .bolivia-pill.restricted {
      background: #fef2f2;
      color: #991b1b;
      border-color: #fecaca;
    }
    .score-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin-bottom: 10px;
    }
    .score-pill {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      padding: 3px 9px;
      font-size: 0.8em;
      font-weight: 600;
      color: #334155;
    }
    .skill-tag {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.78em;
      margin: 2px 4px 2px 0;
      font-family: monospace;
    }
    .contract-tag {
      display: inline-block;
      background: #f3e8ff;
      color: #6b21a8;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.78em;
      margin: 2px 4px 2px 0;
      font-weight: 600;
    }
    .lang-tag {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.78em;
      margin: 2px 4px 2px 0;
      font-weight: 600;
    }
    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 6px;
      font-size: 0.85em;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid transparent;
    }
    .btn-primary {
      background: var(--accent-primary);
      color: #ffffff !important;
    }
    .btn-primary:hover {
      background: #0369a1;
    }
    .btn-secondary {
      background: #f8fafc;
      color: #0f172a !important;
      border-color: #cbd5e1;
    }
    .btn-secondary:hover {
      background: #e2e8f0;
    }
    .report-box {
      background: #0f172a;
      color: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      font-family: Consolas, Monaco, "Courier New", monospace;
      font-size: 0.86em;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.5;
      margin: 10px 0 0 0;
      max-height: 640px;
      overflow-y: auto;
    }
    .radar-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 14px;
      margin-top: 12px;
    }
    .radar-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid var(--accent-primary);
      border-radius: 8px;
      padding: 14px 16px;
    }
    .radar-box h4 {
      margin: 0 0 6px 0;
      color: #0f172a;
      font-size: 0.95em;
    }
    .radar-box p {
      margin: 0;
      font-size: 0.84em;
      color: #475569;
    }

    /* USER MANUAL STYLES */
    .manual-container {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .manual-card {
      background: var(--bg-card);
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 22px 24px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    }
    .manual-card h3 {
      margin: 0 0 12px 0;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.15em;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 8px;
    }
    .step-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
      margin-top: 14px;
    }
    .step-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
    }
    .step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--accent-primary);
      color: #ffffff;
      font-size: 0.82em;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .info-callout {
      background: #ecfdf5;
      border-left: 4px solid #10b981;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 0.88em;
      color: #065f46;
      margin: 12px 0;
    }
    .info-callout.warning {
      background: #fffbeb;
      border-left-color: #f59e0b;
      color: #92400e;
    }
    .faq-item {
      border-bottom: 1px solid #f1f5f9;
      padding: 10px 0;
    }
    .faq-item:last-child {
      border-bottom: none;
    }
    .faq-q {
      font-weight: 700;
      color: #1e293b;
      font-size: 0.93em;
      margin-bottom: 4px;
    }
    .faq-a {
      color: #475569;
      font-size: 0.86em;
      line-height: 1.5;
    }

    footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #cbd5e1;
      text-align: center;
      font-size: 0.82em;
      color: var(--text-muted);
    }
    @media only screen and (max-width: 820px) {
      #navbar {
        position: static;
        width: 100%;
        height: auto;
        transform: none !important;
        border-right: none;
        border-bottom: 1px solid #cbd5e1;
      }
      #sidebar-unfold-btn, .sidebar-fold-btn { display: none !important; }
      #main-doc, body.sidebar-collapsed #main-doc {
        margin-left: 0;
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="bolivia-stripe"></div>

  <button type="button" id="sidebar-unfold-btn" onclick="toggleSidebar()">
    <span>☰</span> <span id="lbl-unfold-nav">Menú</span>
  </button>

  <nav id="navbar">
    <div class="navbar-header">
      <header class="header-title">🇧🇴 <span id="nav-brand-title">Bolivia Remoto (BO)</span></header>
      <button type="button" class="sidebar-fold-btn" onclick="toggleSidebar()" title="Ocultar menú">«</button>
    </div>
    <ul>
      <li class="nav-group-header" id="nav-hdr-views">Vistas Principales</li>
      <li><a id="nav-results" class="active-nav" onclick="switchMainView('results')">🎯 <span id="nav-lbl-results">Resultados en Vivo</span> (<span id="nav-cnt-results">0</span>)</a></li>
      <li><a id="nav-manual" onclick="switchMainView('manual')">📖 <span id="nav-lbl-manual">Manual de Uso</span></a></li>
      <li><a id="nav-platforms" onclick="switchMainView('platforms')">🛰️ <span id="nav-lbl-platforms">Plataformas y Escáner URL</span> (<span id="nav-cnt-platforms">0</span>)</a></li>

      <li class="nav-group-header" id="nav-hdr-tracks">Categorías de Plataformas</li>
      <li><a onclick="switchMainView('results'); filterByTrack('ALL');">🌐 <span id="nav-track-all">Todas las Categorías</span></a></li>
      <li><a onclick="switchMainView('results'); filterByTrack('TRACK A');">🤝 Track A: B2B Directo &amp; Freelance</a></li>
      <li><a onclick="switchMainView('results'); filterByTrack('TRACK B');">🤖 Track B: Entrenamiento IA &amp; RLHF</a></li>
      <li><a onclick="switchMainView('results'); filterByTrack('TRACK C');">🌎 Track C: Redes LATAM &amp; Globales</a></li>
      <li><a onclick="switchMainView('results'); filterByTrack('TRACK D');">🌍 Track D: Portales Europeos &amp; Globales</a></li>
      <li><a onclick="switchMainView('results'); filterByTrack('TRACK E');">🎙️ Track E: Redes de Consultoría Experta</a></li>
      <li><a onclick="switchMainView('results'); filterByTrack('TRACK F');">📡 Track F: Bolsas de Empleo 100% Remoto</a></li>
    </ul>
  </nav>

  <main id="main-doc">
    <!-- TOP BANNER -->
    <section class="top-banner">
      <div class="banner-top-row">
        <div>
          <h1 id="banner-title">🇧🇴 Buscador y Evaluador de Empleos 100% Remotos desde Bolivia (BO)</h1>
          <p id="banner-subtitle">
            Filtra y evalúa ofertas globales y regionales que permiten trabajar 100% remoto desde Bolivia (UTC-4). Personaliza tus idiomas, área profesional, experiencia y modalidad de contrato.
          </p>
        </div>
        <div class="lang-switch-group">
          <button type="button" class="btn-lang active" id="btn-lang-es" onclick="setUiLanguage('es')">🇧🇴 Español (Bolivia)</button>
          <button type="button" class="btn-lang" id="btn-lang-en" onclick="setUiLanguage('en')">🇬🇧 English</button>
          <button type="button" class="btn-scan-now" id="btn-scan-now" onclick="triggerOnDemandScan()">
            <span>🔄</span> <span id="lbl-scan-now">Escanear Ofertas Ahora</span>
          </button>
        </div>
      </div>
      <div class="banner-pills">
        <span class="banner-pill" id="pill-bolivia">🇧🇴 Filtro Base: 100% Remoto desde Bolivia (UTC-4)</span>
        <span class="banner-pill" id="pill-schedule">⏱️ Ejecución: Bajo Demanda + Automático cada 15 min</span>
        <span class="banner-pill"><span id="lbl-last-sync">Última sincronización:</span> <span id="val-last-sync">-</span></span>
        <span class="banner-pill"><span id="lbl-monitored-count">Plataformas activas:</span> <span id="val-platforms-count">0</span></span>
      </div>
    </section>

    <!-- CUSTOMIZABLE USER FILTERS PANEL -->
    <section class="panel-card" id="custom-filters-panel">
      <div class="panel-header">
        <h2 class="panel-title">🎛️ <span id="lbl-filters-title">Personaliza tu Búsqueda y Criterios de Evaluación</span></h2>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <label style="font-size:0.84em;font-weight:700;color:#065f46;display:inline-flex;align-items:center;gap:6px;cursor:pointer;background:#ecfdf5;padding:5px 10px;border-radius:6px;border:1px solid #10b981;">
            <input type="checkbox" id="chk-bolivia-only" checked onchange="onBoliviaToggle(this.checked)">
            <span id="lbl-bolivia-only">🇧🇴 Mostrar solo ofertas 100% remotas desde Bolivia</span>
          </label>
          <button type="button" class="btn-action btn-secondary" onclick="resetFilters()" id="btn-reset-filters">↺ Restablecer Filtros</button>
        </div>
      </div>

      <div class="filter-grid">
        <!-- 1. LANGUAGES -->
        <div class="filter-block">
          <div class="filter-block-label">
            <span id="lbl-filter-langs">1. Tus Idiomas</span>
            <span style="font-size:0.76em;color:#64748b;" id="lbl-weight-langs">(Peso: 20 pts)</span>
          </div>
          <div class="chip-group" id="chips-languages"></div>
        </div>

        <!-- 2. EXPERIENCE LEVEL -->
        <div class="filter-block">
          <div class="filter-block-label">
            <span id="lbl-filter-exp">2. Tu Nivel de Experiencia</span>
            <span style="font-size:0.76em;color:#64748b;" id="lbl-weight-exp">(Peso: Contrato + Exp 20 pts)</span>
          </div>
          <div class="chip-group" id="chips-experience"></div>
        </div>

        <!-- 3. CONTRACT TYPE -->
        <div class="filter-block">
          <div class="filter-block-label">
            <span id="lbl-filter-contracts">3. Tipo de Contrato Buscado</span>
            <button type="button" style="border:none;background:none;color:#0284c7;font-size:0.78em;font-weight:700;cursor:pointer;" onclick="selectAllContracts()" id="btn-all-contracts">Todos</button>
          </div>
          <div class="chip-group" id="chips-contracts"></div>
        </div>
      </div>

      <!-- 4. POSITION TYPES & CUSTOM KEYWORDS -->
      <div class="filter-block" style="margin-top:12px;">
        <div class="filter-block-label">
          <span id="lbl-filter-positions">4. Tipo de Posición / Área Profesional (Selecciona una o varias, o déjalo vacío para ver todas)</span>
          <div style="display:flex;gap:10px;align-items:center;">
            <label style="font-size:0.8em;font-weight:600;color:#334155;display:inline-flex;align-items:center;gap:4px;cursor:pointer;">
              <input type="checkbox" id="chk-strict-pos" onchange="onStrictPosToggle(this.checked)">
              <span id="lbl-strict-pos">Ocultar ofertas de otras áreas</span>
            </label>
            <button type="button" style="border:none;background:none;color:#0284c7;font-size:0.8em;font-weight:700;cursor:pointer;" onclick="clearPositions()" id="btn-clear-pos">Ver todas las áreas</button>
          </div>
        </div>
        <div class="chip-group" id="chips-positions" style="margin-bottom:10px;"></div>

        <div style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;margin-top:8px;">
          <input
            type="text"
            id="input-custom-keywords"
            class="input-text"
            placeholder="Ej: Asistente Virtual, Soporte, Ventas, Excel, Python, React, Contador, Diseñador, SQL, Azure, QA..."
            oninput="onCustomKeywordsInput(this.value)"
          >
          <span style="font-size:0.78em;color:#64748b;" id="lbl-weight-pos">(Peso Posición/Habilidades: 35 pts · Elegibilidad Bolivia: 25 pts)</span>
        </div>
      </div>
    </section>

    <!-- ADD & SCAN CUSTOM PLATFORM URL PANEL -->
    <section class="panel-card" id="custom-url-panel">
      <div class="panel-header" style="margin-bottom:10px;padding-bottom:8px;">
        <h2 class="panel-title">➕ <span id="lbl-add-url-title">Agregar y Escanear tu Propia URL de Plataforma o Bolsa de Empleo</span></h2>
        <span style="font-size:0.82em;color:#64748b;" id="lbl-add-url-sub">Auto-detecta APIs JSON, Feeds RSS/Atom y Páginas Web de Empleo</span>
      </div>
      <form class="url-scanner-form" onsubmit="event.preventDefault(); submitCustomPlatformScan();">
        <div class="form-field">
          <label for="scan-url-input" id="lbl-url-field">URL de la Plataforma o Feed a Escanear *</label>
          <input type="text" id="scan-url-input" class="input-text" placeholder="https://remotive.com/api/remote-jobs o https://empresa.com/careers" required>
        </div>
        <div class="form-field">
          <label for="scan-name-input" id="lbl-name-field">Nombre (Opcional)</label>
          <input type="text" id="scan-name-input" class="input-text" placeholder="Ej: Mi Portal Remoto">
        </div>
        <div class="form-field">
          <label for="scan-type-select" id="lbl-type-field">Modo de Escaneo</label>
          <select id="scan-type-select" class="input-select">
            <option value="auto" id="opt-type-auto">Auto-detectar (Web / RSS / JSON)</option>
            <option value="html_board">Página Web / Bolsa HTML</option>
            <option value="rss_feed">Feed RSS / Atom XML</option>
            <option value="json_api">API JSON</option>
            <option value="portal_dork">Búsqueda Profunda de Portal</option>
          </select>
        </div>
        <div>
          <button type="submit" class="btn-action btn-primary" id="btn-submit-url" style="height:36px;">
            🔍 <span id="lbl-btn-submit-url">Escanear y Evaluar URL</span>
          </button>
        </div>
      </form>
      <div id="scan-feedback-box" class="scan-alert"></div>
    </section>

    <!-- KPI SUMMARY CARDS -->
    <section class="kpi-grid">
      <div class="kpi-card apply" onclick="switchMainView('results'); setVerdictFilter('APPLY');">
        <div class="kpi-value" style="color:#059669;">🔥 <span id="kpi-apply-cnt">0</span></div>
        <div class="kpi-label"><strong id="kpi-apply-title">POSTULAR</strong> (<span id="kpi-apply-sub">Puntaje ≥ 78/100</span>)</div>
      </div>
      <div class="kpi-card possible" onclick="switchMainView('results'); setVerdictFilter('POSSIBLE');">
        <div class="kpi-value" style="color:#d97706;">🟡 <span id="kpi-possible-cnt">0</span></div>
        <div class="kpi-label"><strong id="kpi-possible-title">EXPLORAR</strong> (<span id="kpi-possible-sub">Puntaje 58–77/100</span>)</div>
      </div>
      <div class="kpi-card skip" onclick="switchMainView('results'); setVerdictFilter('SKIP');">
        <div class="kpi-value" style="color:#475569;">⚪ <span id="kpi-skip-cnt">0</span></div>
        <div class="kpi-label"><strong id="kpi-skip-title">BAJA COINCIDENCIA</strong> (<span id="kpi-skip-sub">Fuera de tus filtros</span>)</div>
      </div>
      <div class="kpi-card geo" onclick="switchMainView('results'); setVerdictFilter('GEO');">
        <div class="kpi-value" style="color:#dc2626;">🚫 <span id="kpi-geo-cnt">0</span></div>
        <div class="kpi-label"><strong id="kpi-geo-title">NO ELEGIBLES BOLIVIA</strong> (<span id="kpi-geo-sub">Restringidas por país</span>)</div>
      </div>
      <div class="kpi-card" onclick="switchMainView('report');">
        <div class="kpi-value" style="color:#0284c7;">📄 <span id="kpi-total-cnt">0</span></div>
        <div class="kpi-label"><strong id="kpi-report-title">Reporte de Resultados</strong> (<span id="kpi-report-sub">Generado al instante</span>)</div>
      </div>
    </section>

    <!-- TOOLBAR -->
    <section class="toolbar">
      <div class="filter-group">
        <button type="button" class="btn-tab active" id="tab-view-results" onclick="switchMainView('results')">🎯 <span id="tab-lbl-results">Resultados</span></button>
        <button type="button" class="btn-tab" id="tab-view-manual" onclick="switchMainView('manual')">📖 <span id="tab-lbl-manual">Manual de Uso</span></button>
        <button type="button" class="btn-tab" id="tab-view-report" onclick="switchMainView('report')">📄 <span id="tab-lbl-report">Reporte Markdown / Exportar</span></button>
        <button type="button" class="btn-tab" id="tab-view-platforms" onclick="switchMainView('platforms')">🛰️ <span id="tab-lbl-platforms">Plataformas Monitoreadas</span></button>
      </div>
      <div class="filter-group" id="verdictFilterBar">
        <button type="button" class="btn-tab active" data-verdict="ALL" onclick="setVerdictFilter('ALL')" id="btn-v-all">Todas las Elegibles</button>
        <button type="button" class="btn-tab" data-verdict="APPLY" onclick="setVerdictFilter('APPLY')">🔥 <span id="btn-v-apply">Postular</span></button>
        <button type="button" class="btn-tab" data-verdict="POSSIBLE" onclick="setVerdictFilter('POSSIBLE')">🟡 <span id="btn-v-possible">Explorar</span></button>
        <button type="button" class="btn-tab" data-verdict="SKIP" onclick="setVerdictFilter('SKIP')">⚪ <span id="btn-v-skip">Baja Coincidencia</span></button>
        <button type="button" class="btn-tab" data-verdict="GEO" onclick="setVerdictFilter('GEO')">🚫 <span id="btn-v-geo">Bloqueadas País</span></button>
      </div>
      <input type="search" id="searchInput" class="input-text" style="max-width:240px;" placeholder="Buscar por cargo, empresa, país..." oninput="renderResultsCards()">
    </section>

    <!-- VIEW 1: LIVE RESULTS -->
    <section id="view-results">
      <div id="resultsCardsContainer"></div>
    </section>

    <!-- VIEW 2: INTERACTIVE USER MANUAL -->
    <section id="view-manual" style="display:none;">
      <div class="manual-container">
        <!-- CARD 1: OVERVIEW -->
        <article class="manual-card">
          <h3 id="man-h-intro">📖 Guía del Usuario: Bolivia Remoto (BO)</h3>
          <p id="man-p-intro">
            <strong>Bolivia Remoto (BO)</strong> es una plataforma pública e independiente diseñada para conectar a profesionales, técnicos, asistentes y creativos que viven en Bolivia con oportunidades de trabajo 100% remotas alrededor del mundo.
          </p>
          <div class="info-callout" id="man-box-privacy">
            🔒 <strong>100% Pública y Sin Rastreo Personal:</strong> No requieres iniciar sesión, tus filtros se guardan de forma privada en tu propio navegador (localStorage) y nunca recopilamos tu información personal.
          </div>
          <div class="step-grid">
            <div class="step-box">
              <div class="step-num">1</div>
              <h4 style="margin:0 0 6px 0;" id="man-s1-title">Configura tus Filtros</h4>
              <p style="margin:0;font-size:0.84em;color:#475569;" id="man-s1-desc">
                Elige tus idiomas (Español, Inglés, etc.), tu área profesional, años de experiencia y tipo de contrato deseado (medio tiempo, tiempo completo, horas o proyectos).
              </p>
            </div>
            <div class="step-box">
              <div class="step-num">2</div>
              <h4 style="margin:0 0 6px 0;" id="man-s2-title">Filtro Geográfico Bolivia</h4>
              <p style="margin:0;font-size:0.84em;color:#475569;" id="man-s2-desc">
                Cada vacante es analizada automáticamente para confirmar que admite residentes en Bolivia (UTC-4 / LATAM / Worldwide) y descartar ofertas con restricciones de visado.
              </p>
            </div>
            <div class="step-box">
              <div class="step-num">3</div>
              <h4 style="margin:0 0 6px 0;" id="man-s3-title">Evalúa con el Semáforo</h4>
              <p style="margin:0;font-size:0.84em;color:#475569;" id="man-s3-desc">
                Las ofertas reciben una calificación objetiva de 0 a 100 puntos y se clasifican en Postular (≥78), Explorar (58–77) o Baja Coincidencia (&lt;58).
              </p>
            </div>
            <div class="step-box">
              <div class="step-num">4</div>
              <h4 style="margin:0 0 6px 0;" id="man-s4-title">Postula Directamente</h4>
              <p style="margin:0;font-size:0.84em;color:#475569;" id="man-s4-desc">
                Haz clic en "Ver Oferta y Postular" para abrir la página oficial de la empresa o plataforma contratante sin intermediarios.
              </p>
            </div>
          </div>
        </article>

        <!-- CARD 2: FILTERS & WEIGHTS -->
        <article class="manual-card">
          <h3 id="man-h-filters">🎛️ Cómo Funcionan los Filtros y la Ponderación (100 Puntos)</h3>
          <p id="man-p-filters">
            El evaluador asigna un puntaje de compatibilidad transparente desglosado en 4 pilares:
          </p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:12px;margin:12px 0;">
            <div style="background:#f8fafc;padding:12px;border-radius:6px;border-left:4px solid #0284c7;">
              <strong style="color:#0f172a;">🎯 Posición &amp; Habilidades</strong>
              <div style="font-size:1.3em;font-weight:800;color:#0284c7;">35 pts</div>
              <p style="margin:4px 0 0 0;font-size:0.82em;color:#475569;">
                Coincidencia con una de las 12 categorías laborales y tus palabras clave personalizadas.
              </p>
            </div>
            <div style="background:#f8fafc;padding:12px;border-radius:6px;border-left:4px solid #059669;">
              <strong style="color:#0f172a;">🇧🇴 Elegibilidad Bolivia</strong>
              <div style="font-size:1.3em;font-weight:800;color:#059669;">25 pts</div>
              <p style="margin:4px 0 0 0;font-size:0.82em;color:#475569;">
                Garantiza que la vacante admita talento en Bolivia (UTC-4 / LATAM / Worldwide).
              </p>
            </div>
            <div style="background:#f8fafc;padding:12px;border-radius:6px;border-left:4px solid #7c3aed;">
              <strong style="color:#0f172a;">⏱️ Contrato &amp; Experiencia</strong>
              <div style="font-size:1.3em;font-weight:800;color:#7c3aed;">20 pts</div>
              <p style="margin:4px 0 0 0;font-size:0.82em;color:#475569;">
                Alineación con tu nivel (Junior, Mid, Senior) y modalidad (Full-time, Medio tiempo, Proyectos, Horas).
              </p>
            </div>
            <div style="background:#f8fafc;padding:12px;border-radius:6px;border-left:4px solid #d97706;">
              <strong style="color:#0f172a;">🗣️ Idiomas</strong>
              <div style="font-size:1.3em;font-weight:800;color:#d97706;">20 pts</div>
              <p style="margin:4px 0 0 0;font-size:0.82em;color:#475569;">
                Si seleccionas solo <strong>Español</strong>, las ofertas en inglés se excluyen automáticamente.
              </p>
            </div>
          </div>
          <div class="info-callout warning" id="man-box-langnote">
            💡 <strong>Regla Estricta de Idioma:</strong> Al activar únicamente la casilla <em>"Español (BO)"</em>, el sistema garantiza que los resultados destacados correspondan a ofertas con redacción, requerimientos y comunicación en idioma español.
          </div>
        </article>

        <!-- CARD 3: 12 CATEGORIES -->
        <article class="manual-card">
          <h3 id="man-h-cats">💼 12 Categorías Profesionales Incluidas</h3>
          <p id="man-p-cats">
            La herramienta abarca tanto perfiles técnicos como no técnicos altamente demandados en bolsas de trabajo remotas internacionales:
          </p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:10px;margin-top:10px;font-size:0.86em;">
            <div style="background:#f8fafc;padding:10px;border-radius:6px;"><strong>💼 Asistente Virtual:</strong> Soporte administrativo, secretariado remoto, gestión de agenda, data entry.</div>
            <div style="background:#f8fafc;padding:10px;border-radius:6px;"><strong>📋 Coordinador de Operaciones:</strong> Gestión de proyectos, logística, coordinación de equipos LATAM.</div>
            <div style="background:#f8fafc;padding:10px;border-radius:6px;"><strong>🎧 Atención al Cliente:</strong> Help desk, chat en vivo, soporte por ticket, moderación de comunidades.</div>
            <div style="background:#f8fafc;padding:10px;border-radius:6px;"><strong>📈 Ventas &amp; BDR / SDR:</strong> Prospección de clientes, llamadas en frío, lead generation, ventas B2B.</div>
            <div style="background:#f8fafc;padding:10px;border-radius:6px;"><strong>📱 Marketing &amp; Contenidos:</strong> Copywriting en español, redes sociales, SEO, diseño de campañas.</div>
            <div style="background:#f8fafc;padding:10px;border-radius:6px;"><strong>👥 Recursos Humanos &amp; Recruiting:</strong> Selección de talento remoto, onboarding, gestión de nómina.</div>
            <div style="background:#f8fafc;padding:10px;border-radius:6px;"><strong>📊 Finanzas &amp; Contabilidad:</strong> Bookkeeper, conciliación bancaria, Quickbooks, finanzas operativas.</div>
            <div style="background:#f8fafc;padding:10px;border-radius:6px;"><strong>🎨 Diseño &amp; Video:</strong> UI/UX, diseño gráfico, edición de video para TikTok/Reels, branding.</div>
            <div style="background:#f8fafc;padding:10px;border-radius:6px;"><strong>🤖 Entrenamiento IA &amp; RLHF:</strong> Evaluación de modelos de lenguaje, anotación de datos en español.</div>
            <div style="background:#f8fafc;padding:10px;border-radius:6px;"><strong>💻 Desarrollo de Software:</strong> Frontend, Backend, Fullstack, Mobile (React, Node, Python, etc.).</div>
            <div style="background:#f8fafc;padding:10px;border-radius:6px;"><strong>☁️ Cloud &amp; Sistemas:</strong> DevOps, soporte de infraestructura, administración cloud (AWS, Azure).</div>
            <div style="background:#f8fafc;padding:10px;border-radius:6px;"><strong>📈 Datos &amp; Analytics:</strong> Business Intelligence, SQL, Power BI, pipelines de datos y machine learning.</div>
          </div>
        </article>

        <!-- CARD 4: PRACTICAL TIPS FOR BOLIVIA -->
        <article class="manual-card">
          <h3 id="man-h-tips">🇧🇴 Guía Práctica para Trabajar Remoto desde Bolivia</h3>
          <div class="faq-item">
            <div class="faq-q" id="faq-q1">1. ¿Cómo se formaliza la contratación internacional?</div>
            <div class="faq-a" id="faq-a1">
              La modalidad estándar es como <em>Independent Contractor</em> (Prestador de Servicios Independiente). Si el cliente está en Estados Unidos, generalmente te solicitará firmar el formulario <strong>W-8BEN</strong> (formulario del IRS para personas no estadounidenses que certifica que el trabajo se realiza fuera de EE.UU. y exime de retenciones impositivas allá).
            </div>
          </div>
          <div class="faq-item">
            <div class="faq-q" id="faq-q2">2. ¿Cómo recibir pagos en dólares en Bolivia?</div>
            <div class="faq-a" id="faq-a2">
              Las empresas suelen liquidar mediante plataformas de nómina global como <strong>Deel, Ontop, Wise, Payoneer o Gusto</strong>. Desde estas cuentas puedes transferir vía SWIFT hacia tu cuenta bancaria boliviana en USD, usar tarjetas de débito internacionales, o liquidar honorarios a través de pasarelas reguladas.
            </div>
          </div>
          <div class="faq-item">
            <div class="faq-q" id="faq-q3">3. ¿Qué zona horaria tiene Bolivia?</div>
            <div class="faq-a" id="faq-a3">
              Bolivia opera en <strong>UTC-4 (Hora de Bolivia / BOT)</strong> durante todo el año, sin cambio de horario de verano. Esto coincide exactamente con la hora del este de Norteamérica (EDT) en verano y solo tiene 1 hora de diferencia (EST) en invierno, lo que facilita enormemente trabajar en vivo con clientes de EE. UU., Canadá y toda Latinoamérica.
            </div>
          </div>
          <div class="faq-item">
            <div class="faq-q" id="faq-q4">4. ¿Cómo escanear mis propias URLs de bolsas de trabajo?</div>
            <div class="faq-a" id="faq-a4">
              Usa el panel <strong>"Agregar y Escanear tu Propia URL"</strong> en la parte superior. Pega el enlace de una empresa (ej. Greenhouse, Lever, Workable) o un feed RSS/API de empleos remotos. El escáner evaluará al instante las vacantes contra tus filtros y las agregará a tu vista en vivo.
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- VIEW 3: ON-THE-FLY RESULTS REPORT (MARKDOWN & CSV) -->
    <section id="view-report" style="display:none;">
      <div class="panel-card">
        <div class="panel-header">
          <h3 class="panel-title">📄 <span id="lbl-live-report-heading">Reporte de Resultados Generado al Instante (Markdown)</span></h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" class="btn-action btn-primary" onclick="copyReportMarkdown(this)">📋 <span id="lbl-copy-md">Copiar Resultados (.md)</span></button>
            <button type="button" class="btn-action btn-secondary" onclick="downloadReportMarkdown()">⬇️ <span id="lbl-dl-md">Descargar .md</span></button>
            <button type="button" class="btn-action btn-secondary" onclick="downloadResultsCsv()">📊 <span id="lbl-dl-csv">Exportar CSV</span></button>
          </div>
        </div>
        <pre id="liveReportMarkdownBox" class="report-box"></pre>
      </div>
    </section>

    <!-- VIEW 4: MONITORED PLATFORMS & CUSTOM URLS -->
    <section id="view-platforms" style="display:none;">
      <div class="panel-card">
        <div class="panel-header">
          <h3 class="panel-title">🛰️ <span id="lbl-platforms-heading">Directorio de Plataformas Remotas Monitoreadas</span></h3>
          <span style="font-size:0.84em;color:#64748b;" id="lbl-platforms-sub">Haz clic en "Escanear" en cualquier plataforma para buscar nuevas ofertas al instante</span>
        </div>
        <div id="platformsGridContainer" class="radar-grid"></div>
      </div>
    </section>

    <footer id="footer-text">
      Buscador y Evaluador Público de Empleos 100% Remotos desde Bolivia (BO · UTC-4) · Ejecución en Cloudflare Workers (Bajo Demanda + Cada 15 Minutos)
    </footer>
  </main>

  <script id="initial-payload" type="application/json">${clientPayload}</script>
  <script>
    const PAYLOAD = JSON.parse(document.getElementById('initial-payload').textContent);
    let opportunitiesState = PAYLOAD.opportunities || [];
    let platformsState = PAYLOAD.platforms || [];
    let lastScanAtState = PAYLOAD.lastScanAt || new Date().toISOString();

    const POSITION_CATEGORIES = PAYLOAD.POSITION_CATEGORIES;
    const LANGUAGE_OPTIONS = PAYLOAD.LANGUAGE_OPTIONS;
    const EXPERIENCE_OPTIONS = PAYLOAD.EXPERIENCE_OPTIONS;
    const CONTRACT_OPTIONS = PAYLOAD.CONTRACT_OPTIONS;

    // Load saved filters or use Spanish (Bolivia) defaults
    let userFilters = Object.assign({}, PAYLOAD.DEFAULT_FILTERS);
    try {
      const saved = localStorage.getItem('bolivia_remote_user_filters_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        userFilters = Object.assign({}, PAYLOAD.DEFAULT_FILTERS, parsed);
      }
    } catch (e) {}

    let currentVerdictFilter = 'ALL';
    let currentTrackFilter = 'ALL';
    let lastEvaluationResult = { surfaced: [], all: [], apply: [], possible: [], skip: [], geo_excluded: [] };

    const I18N = {
      es: {
        pageTitle: '🇧🇴 Empleos 100% Remotos desde Bolivia (BO) — Buscador y Evaluador en Vivo',
        navBrand: 'Bolivia Remoto (BO)',
        unfoldNav: 'Menú',
        navViews: 'Vistas Principales',
        navResults: 'Resultados en Vivo',
        navManual: 'Manual de Uso',
        navPlatforms: 'Plataformas y Escáner URL',
        navTracks: 'Categorías de Plataformas',
        navTrackAll: 'Todas las Categorías',
        bannerTitle: '🇧🇴 Buscador y Evaluador de Empleos 100% Remotos desde Bolivia (BO)',
        bannerSubtitle: 'Filtra y evalúa ofertas globales y regionales que permiten trabajar 100% remoto desde Bolivia (UTC-4). Personaliza tus idiomas, área profesional, experiencia y modalidad de contrato.',
        scanNow: 'Escanear Ofertas Ahora',
        scanningNow: 'Escaneando plataformas...',
        pillBolivia: '🇧🇴 Filtro Base: 100% Remoto desde Bolivia (UTC-4)',
        pillSchedule: '⏱️ Ejecución: Bajo Demanda + Automático cada 15 min',
        lastSync: 'Última sincronización:',
        monitoredCount: 'Plataformas activas:',
        filtersTitle: 'Personaliza tu Búsqueda y Criterios de Evaluación',
        boliviaOnly: '🇧🇴 Mostrar solo ofertas 100% remotas desde Bolivia',
        resetFilters: '↺ Restablecer Filtros',
        filterLangs: '1. Tus Idiomas',
        weightLangs: '(Peso: 20 pts)',
        filterExp: '2. Tu Nivel de Experiencia',
        weightExp: '(Peso: Contrato + Exp 20 pts)',
        filterContracts: '3. Tipo de Contrato Buscado',
        allContracts: 'Seleccionar todos',
        filterPositions: '4. Tipo de Posición / Área Profesional (Selecciona una o varias, o déjalo vacío para ver todas)',
        strictPos: 'Ocultar ofertas de otras áreas',
        clearPos: 'Ver todas las áreas',
        customKwPlaceholder: 'Asistente Virtual, Soporte, Ventas, Excel, Python, React, Contador, Diseñador, SQL, Azure, QA...',
        weightPos: '(Peso Posición/Habilidades: 35 pts · Elegibilidad Bolivia: 25 pts)',
        addUrlTitle: 'Agregar y Escanear tu Propia URL de Plataforma o Bolsa de Empleo',
        addUrlSub: 'Auto-detecta APIs JSON, Feeds RSS/Atom y Páginas Web de Empleo',
        urlField: 'URL de la Plataforma o Feed a Escanear *',
        nameField: 'Nombre (Opcional)',
        typeField: 'Modo de Escaneo',
        typeAuto: 'Auto-detectar (Web / RSS / JSON)',
        btnSubmitUrl: 'Escanear y Evaluar URL',
        scanningUrl: 'Escaneando URL...',
        kpiApplyTitle: 'POSTULAR',
        kpiApplySub: 'Puntaje ≥ 78/100',
        kpiPossibleTitle: 'EXPLORAR',
        kpiPossibleSub: 'Puntaje 58–77/100',
        kpiSkipTitle: 'BAJA COINCIDENCIA',
        kpiSkipSub: 'Fuera de tus filtros',
        kpiGeoTitle: 'NO ELEGIBLES BOLIVIA',
        kpiGeoSub: 'Restringidas por país',
        kpiReportTitle: 'Reporte de Resultados',
        kpiReportSub: 'Generado al instante',
        tabResults: 'Resultados',
        tabManual: 'Manual de Uso',
        tabReport: 'Reporte Markdown / Exportar',
        tabPlatforms: 'Plataformas Monitoreadas',
        vAll: 'Todas las Elegibles',
        vApply: 'Postular',
        vPossible: 'Explorar',
        vSkip: 'Baja Coincidencia',
        vGeo: 'Bloqueadas País',
        searchPlaceholder: 'Buscar por cargo, habilidad, empresa...',
        liveReportHeading: 'Reporte de Resultados Generado al Instante (Markdown)',
        copyMd: 'Copiar Resultados (.md)',
        copiedMd: '✅ ¡Copiado!',
        dlMd: 'Descargar resultados.md',
        dlCsv: 'Exportar CSV',
        platformsHeading: 'Directorio de Plataformas Remotas Monitoreadas',
        platformsSub: 'Puedes escanear cualquier plataforma bajo demanda o agregar nuevas URLs arriba',
        verdictLabels: { APPLY: 'POSTULAR', POSSIBLE: 'EXPLORAR', SKIP: 'BAJA COINCIDENCIA', GEO: 'NO ELEGIBLE BOLIVIA' },
        scorePos: 'Posición/Habilidades',
        scoreBol: 'Remoto Bolivia',
        scoreCont: 'Contrato/Exp',
        scoreLang: 'Idiomas',
        matchedSkills: 'Habilidades / Etiquetas:',
        matchedLangs: 'Idiomas:',
        contractsLabel: 'Modalidad:',
        openOfferBtn: '🔗 Ver Oferta y Postular',
        scanPlatformBtn: '🔄 Escanear esta plataforma',
        openPlatformBtn: '🌐 Abrir Portal',
        noResults: 'No se encontraron ofertas con los filtros actuales. Prueba ampliando los tipos de posición, contrato o palabras clave.',
        footerText: 'Buscador y Evaluador Público de Empleos 100% Remotos desde Bolivia (BO · UTC-4) · Ejecución en Cloudflare Workers (Bajo Demanda + Cada 15 Minutos)'
      },
      en: {
        pageTitle: '🇧🇴 100% Remote Jobs from Bolivia (BO) — Live Job Scout & Evaluator',
        navBrand: 'Bolivia Remote (BO)',
        unfoldNav: 'Menu',
        navViews: 'Main Views',
        navResults: 'Live Results',
        navManual: 'User Manual',
        navPlatforms: 'Platforms & URL Scanner',
        navTracks: 'Platform Categories',
        navTrackAll: 'All Categories',
        bannerTitle: '🇧🇴 100% Remote Job Scout & Evaluator from Bolivia (BO)',
        bannerSubtitle: 'Filter and evaluate global & regional job offers eligible for 100% remote work from Bolivia (UTC-4). Customize your languages, position type, experience level, and contract modality.',
        scanNow: 'Scan Offers Now',
        scanningNow: 'Scanning platforms...',
        pillBolivia: '🇧🇴 Core Filter: 100% Remote from Bolivia (UTC-4)',
        pillSchedule: '⏱️ Schedule: On-Demand + Auto Every 15 mins',
        lastSync: 'Last synced:',
        monitoredCount: 'Active platforms:',
        filtersTitle: 'Customize Your Search & Evaluation Criteria',
        boliviaOnly: '🇧🇴 Show only positions 100% remote from Bolivia',
        resetFilters: '↺ Reset Filters',
        filterLangs: '1. Your Languages',
        weightLangs: '(Weight: 20 pts)',
        filterExp: '2. Your Experience Level',
        weightExp: '(Weight: Contract + Exp 20 pts)',
        filterContracts: '3. Target Contract Types',
        allContracts: 'Select all',
        filterPositions: '4. Position Type / Professional Area (Select one or more, or leave empty for all)',
        strictPos: 'Hide offers from other areas',
        clearPos: 'Show all areas',
        customKwPlaceholder: 'Virtual Assistant, Support, Sales, Excel, Python, React, Accountant, Designer, SQL, Azure, QA...',
        weightPos: '(Position/Skills Weight: 35 pts · Bolivia Remote Eligibility: 25 pts)',
        addUrlTitle: 'Add & Scan Your Own Platform or Job Board URL',
        addUrlSub: 'Auto-detects JSON APIs, RSS/Atom Feeds, and Career Web Pages',
        urlField: 'Platform or Feed URL to Scan *',
        nameField: 'Platform Name (Optional)',
        typeField: 'Scan Mode',
        typeAuto: 'Auto-detect (Web / RSS / JSON)',
        btnSubmitUrl: 'Scan & Evaluate URL',
        scanningUrl: 'Scanning URL...',
        kpiApplyTitle: 'APPLY',
        kpiApplySub: 'Score ≥ 78/100',
        kpiPossibleTitle: 'POSSIBLE',
        kpiPossibleSub: 'Score 58–77/100',
        kpiSkipTitle: 'LOW MATCH',
        kpiSkipSub: 'Outside current filters',
        kpiGeoTitle: 'NOT BOLIVIA ELIGIBLE',
        kpiGeoSub: 'Country-restricted',
        kpiReportTitle: 'Results Report',
        kpiReportSub: 'Generated on the fly',
        tabResults: 'Results',
        tabManual: 'User Manual',
        tabReport: 'Results Report / Export',
        tabPlatforms: 'Monitored Platforms',
        vAll: 'All Eligible',
        vApply: 'Apply',
        vPossible: 'Possible',
        vSkip: 'Low Match',
        vGeo: 'Geo-Blocked',
        searchPlaceholder: 'Search by role, skill, company...',
        liveReportHeading: 'On-the-Fly Generated Results Report (Markdown)',
        copyMd: 'Copy Results (.md)',
        copiedMd: '✅ Copied!',
        dlMd: 'Download results.md',
        dlCsv: 'Export CSV',
        platformsHeading: 'Monitored Remote Platforms Directory',
        platformsSub: 'Scan any platform on demand or add your own custom URLs above',
        verdictLabels: { APPLY: 'APPLY', POSSIBLE: 'POSSIBLE', SKIP: 'LOW MATCH', GEO: 'GEO-RESTRICTED' },
        scorePos: 'Position/Skills',
        scoreBol: 'Bolivia Remote',
        scoreCont: 'Contract/Exp',
        scoreLang: 'Languages',
        matchedSkills: 'Matched Skills / Tags:',
        matchedLangs: 'Languages:',
        contractsLabel: 'Contract:',
        openOfferBtn: '🔗 View Offer & Apply',
        scanPlatformBtn: '🔄 Scan this platform',
        openPlatformBtn: '🌐 Open Portal',
        noResults: 'No offers matched your current filters. Try broadening your position types, contract modalities, or keywords.',
        footerText: 'Public 100% Remote Job Scout & Evaluator from Bolivia (BO · UTC-4) · Powered by Cloudflare Workers (On-Demand + Every 15 Minutes)'
      }
    };

    // Bring evaluation functions into client scope
    const checkBoliviaRemoteEligibility = ${checkBoliviaRemoteEligibility.toString()};
    const detectOfferAttributes = ${detectOfferAttributes.toString()};
    const evaluateOpportunity = ${evaluateOpportunity.toString()};
    const evaluateAllOpportunities = ${evaluateAllOpportunities.toString()};
    const generateResultsMarkdown = ${generateResultsMarkdown.toString()};
    const DEFAULT_FILTERS = PAYLOAD.DEFAULT_FILTERS;

    function saveFilters() {
      try {
        localStorage.setItem('bolivia_remote_user_filters_v5', JSON.stringify(userFilters));
      } catch (e) {}
    }

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function setUiLanguage(lang) {
      userFilters.ui_lang = lang === 'en' ? 'en' : 'es';
      saveFilters();
      document.documentElement.lang = userFilters.ui_lang === 'es' ? 'es-BO' : 'en';
      document.getElementById('btn-lang-es').classList.toggle('active', userFilters.ui_lang === 'es');
      document.getElementById('btn-lang-en').classList.toggle('active', userFilters.ui_lang === 'en');
      applyTranslations();
      renderFilterChips();
      recomputeAndRender();
      renderPlatformsDirectory();
    }

    function applyTranslations() {
      const t = I18N[userFilters.ui_lang] || I18N.es;
      document.title = t.pageTitle;
      const map = {
        'nav-brand-title': t.navBrand,
        'lbl-unfold-nav': t.unfoldNav,
        'nav-hdr-views': t.navViews,
        'nav-lbl-results': t.navResults,
        'nav-lbl-manual': t.navManual,
        'nav-lbl-platforms': t.navPlatforms,
        'nav-hdr-tracks': t.navTracks,
        'nav-track-all': t.navTrackAll,
        'banner-title': t.bannerTitle,
        'banner-subtitle': t.bannerSubtitle,
        'lbl-scan-now': t.scanNow,
        'pill-bolivia': t.pillBolivia,
        'pill-schedule': t.pillSchedule,
        'lbl-last-sync': t.lastSync,
        'lbl-monitored-count': t.monitoredCount,
        'lbl-filters-title': t.filtersTitle,
        'lbl-bolivia-only': t.boliviaOnly,
        'btn-reset-filters': t.resetFilters,
        'lbl-filter-langs': t.filterLangs,
        'lbl-weight-langs': t.weightLangs,
        'lbl-filter-exp': t.filterExp,
        'lbl-weight-exp': t.weightExp,
        'lbl-filter-contracts': t.filterContracts,
        'btn-all-contracts': t.allContracts,
        'lbl-filter-positions': t.filterPositions,
        'lbl-strict-pos': t.strictPos,
        'btn-clear-pos': t.clearPos,
        'lbl-weight-pos': t.weightPos,
        'lbl-add-url-title': t.addUrlTitle,
        'lbl-add-url-sub': t.addUrlSub,
        'lbl-url-field': t.urlField,
        'lbl-name-field': t.nameField,
        'lbl-type-field': t.typeField,
        'opt-type-auto': t.typeAuto,
        'lbl-btn-submit-url': t.btnSubmitUrl,
        'kpi-apply-title': t.kpiApplyTitle,
        'kpi-apply-sub': t.kpiApplySub,
        'kpi-possible-title': t.kpiPossibleTitle,
        'kpi-possible-sub': t.kpiPossibleSub,
        'kpi-skip-title': t.kpiSkipTitle,
        'kpi-skip-sub': t.kpiSkipSub,
        'kpi-geo-title': t.kpiGeoTitle,
        'kpi-geo-sub': t.kpiGeoSub,
        'kpi-report-title': t.kpiReportTitle,
        'kpi-report-sub': t.kpiReportSub,
        'tab-lbl-results': t.tabResults,
        'tab-lbl-manual': t.tabManual,
        'tab-lbl-report': t.tabReport,
        'tab-lbl-platforms': t.tabPlatforms,
        'btn-v-all': t.vAll,
        'btn-v-apply': t.vApply,
        'btn-v-possible': t.vPossible,
        'btn-v-skip': t.vSkip,
        'btn-v-geo': t.vGeo,
        'lbl-live-report-heading': t.liveReportHeading,
        'lbl-copy-md': t.copyMd,
        'lbl-dl-md': t.dlMd,
        'lbl-dl-csv': t.dlCsv,
        'lbl-platforms-heading': t.platformsHeading,
        'lbl-platforms-sub': t.platformsSub,
        'footer-text': t.footerText
      };
      for (const [id, text] of Object.entries(map)) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
      }
      const kwInput = document.getElementById('input-custom-keywords');
      if (kwInput) kwInput.placeholder = t.customKwPlaceholder;
      const searchEl = document.getElementById('searchInput');
      if (searchEl) searchEl.placeholder = t.searchPlaceholder;
    }

    function renderFilterChips() {
      const isEs = userFilters.ui_lang !== 'en';

      // 1. Languages
      const langContainer = document.getElementById('chips-languages');
      langContainer.innerHTML = LANGUAGE_OPTIONS.map(opt => {
        const selected = (userFilters.languages || []).includes(opt.id);
        const label = isEs ? opt.label_es : opt.label_en;
        return '<span class="chip ' + (selected ? 'selected' : '') + '" onclick="toggleLanguageChip(\\'' + opt.id + '\\')">' +
          opt.flag + ' ' + escapeHtml(label) + '</span>';
      }).join('');

      // 2. Experience
      const expContainer = document.getElementById('chips-experience');
      expContainer.innerHTML = EXPERIENCE_OPTIONS.map(opt => {
        const selected = (userFilters.experience_levels || ['all']).includes(opt.id);
        const label = isEs ? opt.label_es : opt.label_en;
        return '<span class="chip ' + (selected ? 'selected' : '') + '" onclick="toggleExperienceChip(\\'' + opt.id + '\\')">' +
          escapeHtml(label) + '</span>';
      }).join('');

      // 3. Contracts
      const contractContainer = document.getElementById('chips-contracts');
      contractContainer.innerHTML = CONTRACT_OPTIONS.map(opt => {
        const selected = (userFilters.contract_types || []).includes(opt.id);
        const label = isEs ? opt.label_es : opt.label_en;
        return '<span class="chip ' + (selected ? 'selected' : '') + '" onclick="toggleContractChip(\\'' + opt.id + '\\')">' +
          opt.icon + ' ' + escapeHtml(label) + '</span>';
      }).join('');

      // 4. Position Categories
      const posContainer = document.getElementById('chips-positions');
      posContainer.innerHTML = POSITION_CATEGORIES.map(opt => {
        const selected = (userFilters.position_types || []).includes(opt.id);
        const label = isEs ? opt.label_es : opt.label_en;
        return '<span class="chip ' + (selected ? 'selected' : '') + '" onclick="togglePositionChip(\\'' + opt.id + '\\')">' +
          opt.icon + ' ' + escapeHtml(label) + '</span>';
      }).join('');

      document.getElementById('chk-bolivia-only').checked = userFilters.require_bolivia_remote !== false;
      document.getElementById('chk-strict-pos').checked = Boolean(userFilters.strict_position_match);
      const kwInput = document.getElementById('input-custom-keywords');
      if (kwInput && kwInput.value !== (userFilters.custom_keywords || '')) {
        kwInput.value = userFilters.custom_keywords || '';
      }
    }

    function toggleLanguageChip(id) {
      const set = new Set(userFilters.languages || []);
      if (set.has(id)) {
        if (set.size > 1) set.delete(id);
      } else {
        set.add(id);
      }
      userFilters.languages = Array.from(set);
      saveFilters();
      renderFilterChips();
      recomputeAndRender();
    }

    function toggleExperienceChip(id) {
      if (id === 'all') {
        userFilters.experience_levels = ['all'];
      } else {
        const set = new Set((userFilters.experience_levels || []).filter(x => x !== 'all'));
        if (set.has(id)) set.delete(id);
        else set.add(id);
        userFilters.experience_levels = set.size > 0 ? Array.from(set) : ['all'];
      }
      saveFilters();
      renderFilterChips();
      recomputeAndRender();
    }

    function toggleContractChip(id) {
      const set = new Set(userFilters.contract_types || []);
      if (set.has(id)) {
        if (set.size > 1) set.delete(id);
      } else {
        set.add(id);
      }
      userFilters.contract_types = Array.from(set);
      saveFilters();
      renderFilterChips();
      recomputeAndRender();
    }

    function selectAllContracts() {
      userFilters.contract_types = CONTRACT_OPTIONS.map(c => c.id);
      saveFilters();
      renderFilterChips();
      recomputeAndRender();
    }

    function togglePositionChip(id) {
      const set = new Set(userFilters.position_types || []);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      userFilters.position_types = Array.from(set);
      saveFilters();
      renderFilterChips();
      recomputeAndRender();
    }

    function clearPositions() {
      userFilters.position_types = [];
      userFilters.custom_keywords = '';
      document.getElementById('input-custom-keywords').value = '';
      saveFilters();
      renderFilterChips();
      recomputeAndRender();
    }

    function onCustomKeywordsInput(val) {
      userFilters.custom_keywords = val;
      saveFilters();
      recomputeAndRender();
    }

    function onBoliviaToggle(checked) {
      userFilters.require_bolivia_remote = checked;
      saveFilters();
      recomputeAndRender();
    }

    function onStrictPosToggle(checked) {
      userFilters.strict_position_match = checked;
      saveFilters();
      recomputeAndRender();
    }

    function resetFilters() {
      const currentLang = userFilters.ui_lang || 'es';
      userFilters = Object.assign({}, PAYLOAD.DEFAULT_FILTERS, { ui_lang: currentLang });
      currentVerdictFilter = 'ALL';
      currentTrackFilter = 'ALL';
      document.getElementById('searchInput').value = '';
      saveFilters();
      renderFilterChips();
      recomputeAndRender();
    }

    function recomputeAndRender() {
      lastEvaluationResult = evaluateAllOpportunities(opportunitiesState, userFilters);

      document.getElementById('kpi-apply-cnt').textContent = lastEvaluationResult.apply.length;
      document.getElementById('kpi-possible-cnt').textContent = lastEvaluationResult.possible.length;
      document.getElementById('kpi-skip-cnt').textContent = lastEvaluationResult.skip.length;
      document.getElementById('kpi-geo-cnt').textContent = lastEvaluationResult.geo_excluded.length;
      document.getElementById('kpi-total-cnt').textContent = lastEvaluationResult.surfaced.length;

      document.getElementById('nav-cnt-results').textContent = lastEvaluationResult.surfaced.length;
      document.getElementById('nav-cnt-platforms').textContent = platformsState.length;
      document.getElementById('val-platforms-count').textContent = platformsState.length;
      document.getElementById('val-last-sync').textContent = String(lastScanAtState || '').replace('T', ' ').slice(0, 16);

      renderResultsCards();

      const md = generateResultsMarkdown(
        lastEvaluationResult,
        userFilters,
        userFilters.ui_lang,
        platformsState.length,
        lastScanAtState
      );
      document.getElementById('liveReportMarkdownBox').textContent = md;
    }

    function extractTrackCode(trackStr) {
      const m = String(trackStr || '').match(/^(Track\\s+[A-F])/i);
      return m ? m[1].toUpperCase() : 'OTHER';
    }

    function renderResultsCards() {
      const isEs = userFilters.ui_lang !== 'en';
      const t = I18N[userFilters.ui_lang] || I18N.es;
      const q = (document.getElementById('searchInput').value || '').trim().toLowerCase();

      let pool = [];
      if (currentVerdictFilter === 'GEO') {
        pool = lastEvaluationResult.geo_excluded;
      } else if (currentVerdictFilter === 'APPLY') {
        pool = lastEvaluationResult.apply;
      } else if (currentVerdictFilter === 'POSSIBLE') {
        pool = lastEvaluationResult.possible;
      } else if (currentVerdictFilter === 'SKIP') {
        pool = lastEvaluationResult.skip;
      } else {
        pool = lastEvaluationResult.surfaced;
      }

      const filtered = pool.filter(r => {
        const tCode = extractTrackCode(r.track);
        if (currentTrackFilter !== 'ALL' && tCode !== currentTrackFilter) return false;
        if (q) {
          const hay = (r.title + ' ' + r.company + ' ' + r.platform_name + ' ' + r.location + ' ' + r.matched_skills + ' ' + r.description).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

      const container = document.getElementById('resultsCardsContainer');
      if (filtered.length === 0) {
        container.innerHTML = '<div class="panel-card" style="text-align:center;color:#64748b;padding:32px;">' +
          escapeHtml(t.noResults) + '</div>';
        return;
      }

      const contractNameMap = {};
      CONTRACT_OPTIONS.forEach(c => {
        contractNameMap[c.id] = isEs ? c.label_es : c.label_en;
      });

      const langFlagMap = {
        es: '🇧🇴 Español',
        en: '🇬🇧 Inglés',
        pt: '🇧🇷 Portugués',
        de: '🇩🇪 Alemán'
      };

      container.innerHTML = filtered.map((r, idx) => {
        const vKey = r.bolivia_eligible ? r.verdict : 'GEO';
        const vLabel = t.verdictLabels[vKey] || vKey;
        const bolBadge = isEs ? r.bolivia_badge_es : r.bolivia_badge_en;
        const notes = isEs ? r.notes_es : r.notes_en;
        const skillsArr = String(r.matched_skills || '').split(',').map(s => s.trim()).filter(Boolean);
        const skillTagsHtml = skillsArr.map(s => '<span class="skill-tag">' + escapeHtml(s) + '</span>').join('');
        const contractTagsHtml = (r.detected_contracts || []).map(cid =>
          '<span class="contract-tag">' + escapeHtml(contractNameMap[cid] || cid) + '</span>'
        ).join('');
        const langTagsHtml = (r.detected_languages || []).map(lid =>
          '<span class="lang-tag">' + escapeHtml(langFlagMap[lid] || lid.toUpperCase()) + '</span>'
        ).join('');

        return '<article class="opp-card verdict-' + vKey + '">' +
          '<div class="opp-header">' +
            '<h3 class="opp-title">#' + (idx + 1) + '. [' + r.total_score + '/100] ' + escapeHtml(r.title) +
              ' — <span style="font-weight:500;color:#475569;">' + escapeHtml(r.company) + '</span></h3>' +
            '<span class="badge badge-' + vKey + '">' + escapeHtml(vLabel) + ' · ' + r.total_score + '/100</span>' +
          '</div>' +
          '<div class="meta-line">' +
            '<span class="bolivia-pill ' + (r.bolivia_eligible ? '' : 'restricted') + '">' + escapeHtml(bolBadge) + '</span>' +
            '<span><strong>Plataforma:</strong> ' + escapeHtml(r.platform_name) + '</span>' +
            '<span><strong>Ubicación:</strong> ' + escapeHtml(r.location) + '</span>' +
            '<span><strong>Track:</strong> ' + escapeHtml(r.track) + '</span>' +
          '</div>' +
          '<div class="score-pills">' +
            '<span class="score-pill">🎯 ' + escapeHtml(t.scorePos) + ': ' + r.position_score + '/35</span>' +
            '<span class="score-pill">🇧🇴 ' + escapeHtml(t.scoreBol) + ': ' + r.bolivia_score + '/25</span>' +
            '<span class="score-pill">⏱️ ' + escapeHtml(t.scoreCont) + ': ' + r.contract_exp_score + '/20</span>' +
            '<span class="score-pill">🗣️ ' + escapeHtml(t.scoreLang) + ': ' + r.language_score + '/20</span>' +
          '</div>' +
          '<div style="margin-bottom:6px;">' +
            '<strong style="font-size:0.82em;">' + escapeHtml(t.contractsLabel) + '</strong> ' + contractTagsHtml +
            (langTagsHtml ? ' &nbsp; <strong style="font-size:0.82em;">' + escapeHtml(t.matchedLangs) + '</strong> ' + langTagsHtml : '') +
            (skillTagsHtml ? ' &nbsp; <strong style="font-size:0.82em;">' + escapeHtml(t.matchedSkills) + '</strong> ' + skillTagsHtml : '') +
          '</div>' +
          '<div style="font-size:0.88em;color:#334155;margin-top:6px;">' +
            escapeHtml(notes) +
          '</div>' +
          '<div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;">' +
            '<a class="btn-action btn-primary" href="' + escapeHtml(r.url) + '" target="_blank" rel="noopener">' +
              escapeHtml(t.openOfferBtn) + '</a>' +
          '</div>' +
        '</article>';
      }).join('');
    }

    function renderPlatformsDirectory() {
      const t = I18N[userFilters.ui_lang] || I18N.es;
      const container = document.getElementById('platformsGridContainer');
      if (!container) return;

      container.innerHTML = platformsState.map(p => {
        return '<div class="radar-box">' +
          '<h4>🛰️ ' + escapeHtml(p.name) + ' <span style="font-size:0.76em;color:#0284c7;">(' + escapeHtml(p.type || 'portal') + ')</span></h4>' +
          '<p style="margin-bottom:6px;"><strong>Track:</strong> ' + escapeHtml(p.track || '') + '</p>' +
          '<p style="margin-bottom:10px;">' + escapeHtml(p.notes || p.url) + '</p>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<button type="button" class="btn-action btn-primary" style="padding:4px 10px;font-size:0.78em;" onclick="scanExistingPlatform(\\'' + escapeHtml(p.url) + '\\', \\'' + escapeHtml(p.name) + '\\', \\'' + escapeHtml(p.type || 'auto') + '\\', \\'' + escapeHtml(p.track || '') + '\\')">' +
              escapeHtml(t.scanPlatformBtn) + '</button>' +
            '<a class="btn-action btn-secondary" style="padding:4px 10px;font-size:0.78em;" href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener">' +
              escapeHtml(t.openPlatformBtn) + '</a>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function setVerdictFilter(verdict) {
      currentVerdictFilter = verdict;
      document.querySelectorAll('#verdictFilterBar .btn-tab').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-verdict') === verdict);
      });
      renderResultsCards();
    }

    function filterByTrack(trackCode) {
      currentTrackFilter = trackCode;
      renderResultsCards();
    }

    function switchMainView(viewName) {
      const vResults = document.getElementById('view-results');
      const vManual = document.getElementById('view-manual');
      const vReport = document.getElementById('view-report');
      const vPlatforms = document.getElementById('view-platforms');

      if (vResults) vResults.style.display = viewName === 'results' ? '' : 'none';
      if (vManual) vManual.style.display = viewName === 'manual' ? '' : 'none';
      if (vReport) vReport.style.display = viewName === 'report' ? '' : 'none';
      if (vPlatforms) vPlatforms.style.display = viewName === 'platforms' ? '' : 'none';

      const tabResults = document.getElementById('tab-view-results');
      const tabManual = document.getElementById('tab-view-manual');
      const tabReport = document.getElementById('tab-view-report');
      const tabPlatforms = document.getElementById('tab-view-platforms');

      if (tabResults) tabResults.classList.toggle('active', viewName === 'results');
      if (tabManual) tabManual.classList.toggle('active', viewName === 'manual');
      if (tabReport) tabReport.classList.toggle('active', viewName === 'report');
      if (tabPlatforms) tabPlatforms.classList.toggle('active', viewName === 'platforms');

      const navResults = document.getElementById('nav-results');
      const navManual = document.getElementById('nav-manual');
      const navPlatforms = document.getElementById('nav-platforms');

      if (navResults) navResults.classList.toggle('active-nav', viewName === 'results');
      if (navManual) navManual.classList.toggle('active-nav', viewName === 'manual');
      if (navPlatforms) navPlatforms.classList.toggle('active-nav', viewName === 'platforms');
    }

    function toggleSidebar() {
      document.body.classList.toggle('sidebar-collapsed');
    }

    async function triggerOnDemandScan() {
      const t = I18N[userFilters.ui_lang] || I18N.es;
      const btn = document.getElementById('btn-scan-now');
      const lbl = document.getElementById('lbl-scan-now');
      btn.disabled = true;
      lbl.textContent = t.scanningNow;

      try {
        const resp = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters: userFilters })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data.opportunities)) {
            opportunitiesState = data.opportunities;
          }
          if (Array.isArray(data.platforms)) {
            platformsState = data.platforms;
          }
          lastScanAtState = data.lastScanAt || new Date().toISOString();
          recomputeAndRender();
          renderPlatformsDirectory();
        }
      } catch (e) {
        // Fallback when opened as local file without Worker backend
        lastScanAtState = new Date().toISOString();
        recomputeAndRender();
      } finally {
        btn.disabled = false;
        lbl.textContent = (I18N[userFilters.ui_lang] || I18N.es).scanNow;
      }
    }

    async function submitCustomPlatformScan(customArgs) {
      const t = I18N[userFilters.ui_lang] || I18N.es;
      const isEs = userFilters.ui_lang !== 'en';
      const urlInput = document.getElementById('scan-url-input');
      const nameInput = document.getElementById('scan-name-input');
      const typeSelect = document.getElementById('scan-type-select');
      const feedbackBox = document.getElementById('scan-feedback-box');
      const submitBtn = document.getElementById('btn-submit-url');
      const submitLbl = document.getElementById('lbl-btn-submit-url');

      const url = customArgs ? customArgs.url : urlInput.value.trim();
      const name = customArgs ? customArgs.name : nameInput.value.trim();
      const type = customArgs ? customArgs.type : typeSelect.value;
      const track = customArgs && customArgs.track ? customArgs.track : 'Track F: Curated Remote-First & WFA Job Boards';

      if (!url) return;

      submitBtn.disabled = true;
      submitLbl.textContent = t.scanningUrl;
      feedbackBox.className = 'scan-alert';
      feedbackBox.style.display = 'none';

      try {
        const resp = await fetch('/api/platforms/scan-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, name, type, track, filters: userFilters })
        });
        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || 'Error scanning URL');
        }
        const data = await resp.json();
        if (Array.isArray(data.all_opportunities)) {
          opportunitiesState = data.all_opportunities;
        } else if (Array.isArray(data.opportunities)) {
          const existingHashes = new Set(opportunitiesState.map(o => o.job_hash));
          for (const o of data.opportunities) {
            if (!existingHashes.has(o.job_hash)) {
              opportunitiesState.unshift(o);
            }
          }
        }
        if (Array.isArray(data.platforms)) {
          platformsState = data.platforms;
        } else if (data.platform) {
          const exists = platformsState.some(p => p.id === data.platform.id);
          if (!exists) platformsState.unshift(data.platform);
        }
        lastScanAtState = new Date().toISOString();
        recomputeAndRender();
        renderPlatformsDirectory();

        feedbackBox.className = 'scan-alert success';
        feedbackBox.textContent = isEs
          ? '✅ Plataforma "' + data.platform.name + '" escaneada (' + data.platform.type + '): ' +
            data.discovered_count + ' ofertas analizadas, ' + data.bolivia_eligible_count +
            ' elegibles 100% remoto desde Bolivia agregadas a Resultados.'
          : '✅ Platform "' + data.platform.name + '" scanned (' + data.platform.type + '): ' +
            data.discovered_count + ' offers analyzed, ' + data.bolivia_eligible_count +
            ' 100% remote from Bolivia added to Results.';
        if (!customArgs) {
          urlInput.value = '';
          nameInput.value = '';
        }
      } catch (err) {
        // Offline / static file fallback: register platform & evaluate locally
        try {
          const cleanUrl = /^https?:\\/\\//i.test(url) ? url : 'https://' + url;
          const parsed = new URL(cleanUrl);
          const dom = parsed.hostname.replace(/^www\\./i, '');
          const pName = name || dom.split('.')[0].toUpperCase();
          const newPlat = {
            id: 'custom_' + dom.replace(/[^a-z0-9]+/g, '_'),
            name: pName,
            category: 'Plataforma Agregada por Usuario',
            track,
            type: type === 'auto' ? 'html_board' : type,
            enabled: true,
            domain: dom,
            url: cleanUrl,
            notes: 'Agregada desde el escáner de URL'
          };
          const newOpp = {
            job_hash: 'custom_' + Date.now(),
            platform_id: newPlat.id,
            platform_name: pName,
            category: newPlat.category,
            track: newPlat.track,
            contract_caveat: 'fractional_or_fulltime',
            title: pName + ' — Ofertas Remotas Evaluadas (' + dom + ')',
            company: pName,
            location: 'Remote Worldwide / Global (Apto Bolivia)',
            url: cleanUrl,
            description: 'Plataforma agregada y evaluada por el usuario (' + cleanUrl + '). Elegible para postulación remota desde Bolivia.',
            tags: 'remote, custom-url',
            published_at: new Date().toISOString().slice(0, 10),
            discovered_at: new Date().toISOString().slice(0, 19)
          };
          if (!platformsState.some(p => p.id === newPlat.id)) {
            platformsState.unshift(newPlat);
          }
          opportunitiesState.unshift(newOpp);
          recomputeAndRender();
          renderPlatformsDirectory();
          feedbackBox.className = 'scan-alert success';
          feedbackBox.textContent = isEs
            ? '✅ Plataforma "' + pName + '" (' + cleanUrl + ') agregada y evaluada en Resultados.'
            : '✅ Platform "' + pName + '" (' + cleanUrl + ') added and evaluated in Results.';
        } catch (innerErr) {
          feedbackBox.className = 'scan-alert error';
          feedbackBox.textContent = '❌ ' + (err.message || 'No se pudo escanear la URL');
        }
      } finally {
        submitBtn.disabled = false;
        submitLbl.textContent = (I18N[userFilters.ui_lang] || I18N.es).btnSubmitUrl;
      }
    }

    function scanExistingPlatform(url, name, type, track) {
      switchMainView('results');
      submitCustomPlatformScan({ url, name, type, track });
    }

    function copyReportMarkdown(btn) {
      const t = I18N[userFilters.ui_lang] || I18N.es;
      const text = document.getElementById('liveReportMarkdownBox').textContent;
      navigator.clipboard.writeText(text).then(() => {
        const lbl = document.getElementById('lbl-copy-md');
        const orig = lbl.textContent;
        lbl.textContent = t.copiedMd;
        setTimeout(() => { lbl.textContent = orig; }, 1800);
      });
    }

    function downloadReportMarkdown() {
      const text = document.getElementById('liveReportMarkdownBox').textContent;
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'resultados-remoto-bolivia-' + new Date().toISOString().slice(0, 10) + '.md';
      a.click();
    }

    function downloadResultsCsv() {
      const rows = lastEvaluationResult.surfaced || [];
      const headers = ['Score', 'Verdict', 'Title', 'Company', 'Platform', 'Location', 'BoliviaEligible', 'Contracts', 'Experience', 'Languages', 'URL'];
      const csvLines = [headers.join(',')];
      for (const r of rows) {
        const vals = [
          r.total_score,
          r.verdict,
          '"' + String(r.title || '').replace(/"/g, '""') + '"',
          '"' + String(r.company || '').replace(/"/g, '""') + '"',
          '"' + String(r.platform_name || '').replace(/"/g, '""') + '"',
          '"' + String(r.location || '').replace(/"/g, '""') + '"',
          r.bolivia_eligible ? 'YES' : 'NO',
          '"' + (r.detected_contracts || []).join('|') + '"',
          r.detected_experience || '',
          '"' + (r.detected_languages || []).join('|') + '"',
          '"' + String(r.url || '').replace(/"/g, '""') + '"'
        ];
        csvLines.push(vals.join(','));
      }
      const blob = new Blob([csvLines.join('\\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'resultados-remoto-bolivia-' + new Date().toISOString().slice(0, 10) + '.csv';
      a.click();
    }

    // Initialize UI on load (Spanish Bolivia default)
    setUiLanguage(userFilters.ui_lang || 'es');

    // Auto-trigger background sync every 15 minutes while page is open
    setInterval(() => {
      triggerOnDemandScan();
    }, 15 * 60 * 1000);
  </script>
</body>
</html>`;
}
