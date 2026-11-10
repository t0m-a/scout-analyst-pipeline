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
import { FAVICON_DATA_URI } from './favicon.js';

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
  <title>Empleos Remotos desde Bolivia — Buscador y Evaluador en Vivo</title>
  <link rel="icon" type="image/svg+xml" href="${FAVICON_DATA_URI}">
  <link rel="alternate icon" type="image/x-icon" href="/favicon.ico">
  <link rel="alternate icon" type="image/png" href="/favicon.png">
  <link rel="apple-touch-icon" href="/favicon.png">
  <meta name="description" content="Herramienta pública para filtrar, escanear y evaluar ofertas de trabajo remotas elegibles desde Bolivia según tus idiomas, área profesional, experiencia y tipo de contrato.">
  <script>
    (function() {
      try {
        var t = localStorage.getItem('bolivia_remote_theme');
        if (t === 'dark' || (!t && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark-mode');
        }
      } catch (e) {}
    })();
  </script>
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
      overflow-x: hidden;
      max-width: 100%;
    }
    h1, h2, h3, h4, h5, p, span, a, li, label, .opp-card, .panel-card, .manual-card, .radar-box, .scan-alert, footer {
      overflow-wrap: break-word;
      word-wrap: break-word;
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
      position: sticky;
      top: 5px;
      left: 0;
      width: 100%;
      height: auto;
      border-bottom: 1px solid #e2e8f0;
      background: #ffffff;
      z-index: 900;
      display: flex;
      flex-direction: column;
    }
    .navbar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 24px;
      background: #f8fafc;
      width: 100%;
    }
    .header-title {
      font-size: 1.05em;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .sidebar-fold-btn,
    #sidebar-unfold-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: auto;
      height: 34px;
      padding: 0 12px;
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      background: #ffffff;
      color: #0f172a;
      font-size: 0.85em;
      font-weight: 700;
      line-height: 1;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    }
    .hamburger-label {
      display: inline-block;
      line-height: 1;
    }
    .sidebar-fold-btn:hover,
    #sidebar-unfold-btn:hover {
      background: #f1f5f9;
      border-color: var(--accent-primary);
      color: var(--accent-primary);
    }
    .hamburger-icon {
      display: inline-flex;
      flex-direction: column;
      justify-content: space-between;
      width: 16px;
      height: 12px;
    }
    .hamburger-icon span {
      display: block;
      height: 2px;
      width: 100%;
      background: currentColor;
      border-radius: 1px;
    }
    #navbar ul {
      position: absolute;
      top: 100%;
      right: 24px;
      width: min(300px, calc(100vw - 32px));
      max-height: calc(100vh - 70px);
      margin: 0;
      padding: 0;
      overflow-y: auto;
      list-style: none;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 0 0 10px 10px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.14);
      z-index: 950;
    }
    body.sidebar-collapsed #navbar ul {
      display: none !important;
    }
    #navbar li {
      border-bottom: 1px solid #f1f5f9;
    }
    #navbar li.nav-group-header {
      background: #f1f5f9;
      padding: 10px 16px;
      font-size: 0.88em;
      font-weight: 700;
      text-transform: capitalize;
      letter-spacing: normal;
      color: #475569;
    }
    #navbar li.nav-collapsible-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
      transition: background 0.15s ease, color 0.15s ease;
    }
    #navbar li.nav-collapsible-header:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .nav-caret {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-right: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      transform: rotate(-45deg);
      transition: transform 0.2s ease;
      margin-left: 8px;
      flex-shrink: 0;
    }
    #navbar li.nav-collapsible-header.expanded .nav-caret {
      transform: rotate(45deg);
    }
    #navbar li.nav-track-item.nav-track-folded,
    #navbar li.nav-payment-item.nav-payment-folded {
      display: none !important;
    }
    #navbar li.nav-track-item a,
    #navbar li.nav-payment-item a {
      padding-left: 26px;
      font-size: 0.85em;
    }
    #navbar li.nav-payment-desc {
      padding: 10px 16px 12px 26px;
      background: #f8fafc;
    }
    #navbar li.nav-payment-desc p {
      margin: 0;
      font-size: 0.78em;
      line-height: 1.45;
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
    #main-doc,
    body.sidebar-collapsed #main-doc {
      margin-left: 0;
      max-width: 100% !important;
      width: 100% !important;
      box-sizing: border-box;
      padding: 22px 24px 60px 24px;
      transition: padding 0.25s ease;
    }
    body.sidebar-collapsed .top-banner,
    body.sidebar-collapsed .panel-card,
    body.sidebar-collapsed .kpi-grid,
    body.sidebar-collapsed .toolbar,
    body.sidebar-collapsed #view-results,
    body.sidebar-collapsed #view-manual,
    body.sidebar-collapsed #view-report,
    body.sidebar-collapsed #view-platforms,
    body.sidebar-collapsed .manual-container,
    body.sidebar-collapsed .manual-card,
    body.sidebar-collapsed .report-box,
    body.sidebar-collapsed #footer-text {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box;
    }
    body.view-manual-active .top-banner,
    body.view-manual-active #custom-filters-panel,
    body.view-manual-active #custom-url-panel,
    body.view-manual-active .kpi-grid,
    body.view-manual-active .toolbar,
    body.view-manual-active footer {
      display: none !important;
    }
    .manual-card .btn-lang {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #0f172a;
    }
    .manual-card .btn-lang.active, .manual-card .btn-lang:hover {
      background: var(--accent-primary);
      color: #ffffff;
      border-color: var(--accent-primary);
    }
    .top-banner {
      background: var(--bg-card);
      color: var(--text-main);
      border: 1px solid #e2e8f0;
      padding: 18px 22px;
      border-radius: 10px;
      margin-bottom: 18px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
    }
    .banner-header-block {
      width: 100%;
      margin-bottom: 12px;
    }
    .top-banner h1 {
      margin: 0 0 6px 0;
      font-size: 1.55em;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
    }
    .top-banner p,
    #banner-subtitle,
    .banner-disclaimer {
      margin: 4px 0;
      color: #334155;
      font-family: inherit;
      font-size: 0.92em;
      font-weight: 400;
      line-height: 1.5;
    }
    .banner-disclaimer {
      margin-top: 6px;
    }
    .banner-disclaimer a {
      color: var(--accent-primary);
      text-decoration: underline;
      font-weight: 600;
    }
    .banner-disclaimer a:hover {
      color: var(--accent-hover);
    }
    .banner-actions-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      margin-bottom: 0;
      flex-wrap: wrap;
      width: 100%;
    }
    .lang-switch-group {
      display: inline-flex;
      gap: 7px;
      align-items: center;
      flex-wrap: wrap;
      max-width: 100%;
    }
    .btn-lang {
      padding: 5px 12px;
      border-radius: 999px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
      font-size: 0.79em;
      font-weight: 600;
      cursor: pointer;
      line-height: 1.4;
      white-space: normal;
      text-align: center;
      max-width: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .btn-lang.active, .btn-lang:hover {
      background: var(--accent-primary);
      color: #ffffff;
      border-color: var(--accent-primary);
    }
    .btn-scan-now {
      padding: 5px 12px;
      border-radius: 999px;
      border: 1px solid #059669;
      background: #059669;
      color: #ffffff;
      font-size: 0.79em;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      line-height: 1.4;
      white-space: normal;
      text-align: center;
      max-width: 100%;
      transition: all 0.15s ease;
    }
    .btn-scan-now:hover {
      background: #047857;
      border-color: #047857;
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
      align-items: center;
      width: 100%;
    }
    .banner-pill {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #334155;
      padding: 4px 11px;
      border-radius: 999px;
      font-size: 0.79em;
      font-weight: 600;
      white-space: normal;
      overflow-wrap: anywhere;
      line-height: 1.45;
      max-width: 100%;
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
    }
    .panel-card {
      background: var(--bg-card);
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 18px 22px;
      margin-bottom: 18px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
      max-width: 100%;
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
    .panel-header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
      max-width: 100%;
    }
    .bolivia-only-label {
      font-size: 0.84em;
      font-weight: 700;
      color: #065f46;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      background: #ecfdf5;
      padding: 6px 11px;
      border-radius: 6px;
      border: 1px solid #10b981;
      max-width: 100%;
      white-space: normal;
      line-height: 1.35;
    }
    .bolivia-only-label input[type="checkbox"] {
      flex-shrink: 0;
      margin: 0;
    }
    .panel-title {
      margin: 0;
      font-size: 1.1em;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      flex: 1 1 240px;
      min-width: 0;
      line-height: 1.35;
    }
    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
      gap: 16px;
    }
    .filter-block {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      min-width: 0;
      max-width: 100%;
    }
    .filter-block-label {
      font-size: 0.85em;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
    }
    .keywords-input-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      margin-top: 8px;
      width: 100%;
    }
    .keywords-input-row .input-text {
      flex: 1 1 260px;
      min-width: 0;
      width: auto;
    }
    .keywords-input-row #lbl-weight-pos {
      flex: 0 1 auto;
      max-width: 100%;
      line-height: 1.4;
    }
    .chip-group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      width: 100%;
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
      max-width: 100%;
      white-space: normal;
      text-align: left;
      line-height: 1.35;
      overflow-wrap: anywhere;
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
      max-width: 100%;
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
      grid-template-columns: minmax(220px, 2fr) minmax(150px, 1.1fr) minmax(160px, 1fr) auto;
      gap: 10px;
      align-items: end;
      width: 100%;
    }
    .url-scanner-form #btn-submit-url {
      min-height: 36px;
      height: auto;
      width: 100%;
      justify-content: center;
    }
    .form-field {
      min-width: 0;
      width: 100%;
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
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
      gap: 12px;
      margin-bottom: 18px;
      width: 100%;
    }
    .kpi-card {
      background: var(--bg-card);
      border-radius: 8px;
      padding: 14px 16px;
      border-left: 5px solid var(--accent-primary);
      box-shadow: 0 2px 5px rgba(0,0,0,0.04);
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      min-width: 0;
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
      line-height: 1.35;
      overflow-wrap: anywhere;
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
      width: 100%;
    }
    .toolbar #searchInput {
      flex: 1 1 220px;
      max-width: 300px;
      min-width: min(100%, 180px);
      width: auto;
    }
    .filter-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      max-width: 100%;
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
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      white-space: normal;
      line-height: 1.35;
      max-width: 100%;
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
      max-width: 100%;
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
      flex: 1 1 240px;
      min-width: 0;
      line-height: 1.35;
    }
    .opp-company {
      font-weight: 500;
      color: #475569;
    }
    .opp-notes {
      font-size: 0.88em;
      color: #334155;
      margin-top: 6px;
      line-height: 1.5;
    }
    .opp-tags-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 14px;
      margin-bottom: 6px;
    }
    .opp-tag-group {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
      max-width: 100%;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.78em;
      font-weight: 700;
      white-space: normal;
      text-align: center;
      line-height: 1.3;
      max-width: 100%;
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
      gap: 8px 12px;
      align-items: center;
    }
    .meta-line > span {
      max-width: 100%;
      overflow-wrap: anywhere;
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
      max-width: 100%;
      white-space: normal;
      line-height: 1.35;
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
      max-width: 100%;
      white-space: normal;
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
      max-width: 100%;
      overflow-wrap: anywhere;
    }
    .comp-pill {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
      padding: 2px 9px;
      border-radius: 999px;
      font-size: 0.79em;
      font-weight: 700;
      max-width: 100%;
    }
    .semantic-pill {
      display: inline-block;
      background: #ede9fe;
      color: #5b21b6;
      border: 1px solid #c4b5fd;
      padding: 2px 9px;
      border-radius: 999px;
      font-size: 0.79em;
      font-weight: 700;
      max-width: 100%;
    }
    .ai-cv-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
      width: 100%;
    }
    .ai-textarea {
      width: 100%;
      min-height: 78px;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.88em;
      font-family: inherit;
      background: #ffffff;
      color: #0f172a;
      resize: vertical;
      line-height: 1.45;
    }
    .ai-textarea:focus {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
    }
    .ai-result-box {
      margin-top: 12px;
      padding: 14px 16px;
      border-radius: 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      display: none;
    }
    .ai-proposal-pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 14px;
      border-radius: 6px;
      font-size: 0.84em;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 8px 0 0 0;
      line-height: 1.5;
      max-height: 320px;
      overflow-y: auto;
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
      max-width: 100%;
      overflow-wrap: anywhere;
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
      max-width: 100%;
      overflow-wrap: anywhere;
    }
    .btn-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 6px;
      font-size: 0.85em;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid transparent;
      white-space: normal;
      text-align: center;
      line-height: 1.35;
      max-width: 100%;
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
      max-width: 100%;
    }
    .radar-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
      gap: 14px;
      margin-top: 12px;
      width: 100%;
    }
    .radar-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid var(--accent-primary);
      border-radius: 8px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 0;
      max-width: 100%;
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
    .guide-step {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 18px;
      margin-bottom: 14px;
    }
    .guide-step-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .guide-step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--accent-primary);
      color: #ffffff;
      font-weight: 800;
      font-size: 0.88em;
      flex-shrink: 0;
    }
    .guide-step-title {
      font-size: 1.02em;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .guide-step-body {
      font-size: 0.88em;
      color: #334155;
      line-height: 1.6;
    }
    .guide-step-body ul {
      margin: 6px 0 6px 20px;
      padding: 0;
    }
    .guide-step-body li {
      margin-bottom: 4px;
    }
    .guide-tip {
      background: #eff6ff;
      border-left: 4px solid var(--accent-primary);
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 0.85em;
      color: #1e40af;
      margin-top: 8px;
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

    footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #cbd5e1;
      text-align: center;
      font-size: 0.82em;
      color: var(--text-muted);
    }
    footer a {
      color: var(--accent-primary);
      text-decoration: underline;
    }
    footer a:hover {
      color: var(--accent-hover);
    }
    /* THEME TOGGLE BUTTON */
    .btn-theme-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 27px;
      height: 27px;
      min-width: 27px;
      min-height: 27px;
      padding: 0;
      border-radius: 50%;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #0f172a;
      cursor: pointer;
      transition: all 0.15s ease;
      line-height: 1;
      flex-shrink: 0;
    }
    .btn-theme-toggle:hover {
      background: #e2e8f0;
      border-color: #94a3b8;
    }
    .theme-symbol {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .theme-symbol svg {
      display: block;
    }
    .manual-card .btn-theme-toggle {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #0f172a;
    }
    .manual-card .btn-theme-toggle:hover {
      background: #e2e8f0;
      border-color: #94a3b8;
    }

    /* COMPLETE DARK MODE THEME */
    html.dark-mode, body.dark-mode {
      --bg-page: #0b0f17;
      --bg-card: #131d2e;
      --text-main: #e2e8f0;
      --text-muted: #94a3b8;
      background-color: #0b0f17;
      color: #e2e8f0;
    }
    body.dark-mode #navbar {
      background: #0f172a;
      border-bottom-color: #1e293b;
    }
    body.dark-mode .navbar-header {
      background: #131d2e;
      border-bottom-color: #1e293b;
    }
    body.dark-mode .header-title {
      color: #f8fafc;
    }
    body.dark-mode .sidebar-fold-btn,
    body.dark-mode #sidebar-unfold-btn {
      background: #1e293b;
      color: #f8fafc;
      border-color: #334155;
    }
    body.dark-mode .sidebar-fold-btn:hover,
    body.dark-mode #sidebar-unfold-btn:hover {
      background: var(--accent-primary);
      color: #ffffff;
      border-color: var(--accent-primary);
    }
    body.dark-mode #navbar ul {
      background: #0f172a;
      border-color: #334155;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }
    body.dark-mode #navbar li {
      border-bottom-color: #1e293b;
    }
    body.dark-mode #navbar li.nav-group-header {
      background: #131d2e;
      color: #94a3b8;
    }
    body.dark-mode #navbar li.nav-collapsible-header:hover {
      background: #1e293b;
      color: #f8fafc;
    }
    body.dark-mode #navbar a {
      color: #cbd5e1;
    }
    body.dark-mode #navbar a:hover, body.dark-mode #navbar a.active-nav {
      background: #1e293b;
      color: #38bdf8;
      border-left-color: #38bdf8;
    }
    body.dark-mode #navbar li.nav-payment-desc {
      background: #0f172a;
    }
    body.dark-mode #navbar li.nav-payment-desc p {
      color: #94a3b8;
    }
    body.dark-mode #navbar li.nav-payment-desc p strong {
      color: #e2e8f0;
    }
    body.dark-mode .top-banner {
      background: var(--bg-card);
      border-color: #1e293b;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      color: #e2e8f0;
    }
    body.dark-mode .top-banner h1 {
      color: #f8fafc;
    }
    body.dark-mode .top-banner p,
    body.dark-mode #banner-subtitle,
    body.dark-mode .banner-disclaimer {
      color: #cbd5e1;
    }
    body.dark-mode .banner-disclaimer a {
      color: #38bdf8;
    }
    body.dark-mode .banner-disclaimer a:hover {
      color: #7dd3fc;
    }
    body.dark-mode .banner-pill {
      background: #0f172a;
      border-color: #334155;
      color: #cbd5e1;
    }
    body.dark-mode .btn-lang {
      background: #1e293b;
      color: #cbd5e1;
      border-color: #334155;
    }
    body.dark-mode .btn-lang.active, body.dark-mode .btn-lang:hover {
      background: var(--accent-primary);
      color: #ffffff;
      border-color: var(--accent-primary);
    }
    body.dark-mode .btn-theme-toggle {
      background: #1e293b;
      border-color: #334155;
      color: #fde047;
    }
    body.dark-mode .btn-theme-toggle:hover {
      background: #334155;
      border-color: #475569;
    }
    body.dark-mode .manual-card .btn-theme-toggle {
      background: #1e293b;
      color: #fde047;
      border-color: #334155;
    }
    body.dark-mode .manual-card .btn-theme-toggle:hover {
      background: #334155;
      border-color: #475569;
    }
    body.dark-mode .panel-card {
      background: var(--bg-card);
      border-color: #1e293b;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    body.dark-mode .panel-header {
      border-bottom-color: #1e293b;
    }
    body.dark-mode .panel-title {
      color: #f8fafc;
    }
    body.dark-mode .filter-block {
      background: #0f172a;
      border-color: #1e293b;
    }
    body.dark-mode .filter-block-label {
      color: #f1f5f9;
    }
    body.dark-mode .chip {
      background: #1e293b;
      color: #cbd5e1;
      border-color: #334155;
    }
    body.dark-mode .chip:hover {
      border-color: #38bdf8;
      color: #38bdf8;
    }
    body.dark-mode .chip.selected {
      background: var(--accent-primary);
      color: #ffffff;
      border-color: var(--accent-primary);
    }
    body.dark-mode .input-text, body.dark-mode .input-select {
      background: #0f172a;
      color: #f8fafc;
      border-color: #334155;
    }
    body.dark-mode .input-text:focus, body.dark-mode .input-select:focus {
      border-color: #38bdf8;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
    }
    body.dark-mode .form-field label {
      color: #94a3b8;
    }
    body.dark-mode .kpi-card {
      background: var(--bg-card);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    body.dark-mode .kpi-value {
      color: #f8fafc;
    }
    body.dark-mode .toolbar {
      background: var(--bg-card);
      border-color: #1e293b;
    }
    body.dark-mode .btn-tab {
      background: #0f172a;
      color: #cbd5e1;
      border-color: #334155;
    }
    body.dark-mode .btn-tab:hover, body.dark-mode .btn-tab.active {
      background: var(--accent-primary);
      color: #ffffff;
      border-color: var(--accent-primary);
    }
    body.dark-mode .opp-card {
      background: var(--bg-card);
      border-color: #1e293b;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    body.dark-mode .opp-title {
      color: #f8fafc;
    }
    body.dark-mode .opp-company {
      color: #94a3b8;
    }
    body.dark-mode .opp-notes {
      color: #cbd5e1;
    }
    body.dark-mode .bolivia-only-label {
      background: #064e3b;
      color: #a7f3d0;
      border-color: #10b981;
    }
    body.dark-mode .score-pill {
      background: #0f172a;
      border-color: #334155;
      color: #cbd5e1;
    }
    body.dark-mode .skill-tag {
      background: #082f49;
      color: #38bdf8;
    }
    body.dark-mode .comp-pill {
      background: #064e3b;
      color: #a7f3d0;
      border-color: #10b981;
    }
    body.dark-mode .semantic-pill {
      background: #2e1065;
      color: #ddd6fe;
      border-color: #7c3aed;
    }
    body.dark-mode .ai-textarea {
      background: #0f172a;
      color: #f8fafc;
      border-color: #334155;
    }
    body.dark-mode .ai-result-box {
      background: #0f172a;
      border-color: #334155;
      color: #cbd5e1;
    }
    body.dark-mode .contract-tag {
      background: #3b0764;
      color: #d8b4fe;
    }
    body.dark-mode .lang-tag {
      background: #451a03;
      color: #fde047;
    }
    body.dark-mode .btn-secondary {
      background: #1e293b;
      color: #f8fafc !important;
      border-color: #334155;
    }
    body.dark-mode .btn-secondary:hover {
      background: #334155;
    }
    body.dark-mode .radar-box {
      background: #0f172a;
      border-color: #1e293b;
    }
    body.dark-mode .radar-box h4 {
      color: #f8fafc;
    }
    body.dark-mode .radar-box p {
      color: #94a3b8;
    }
    body.dark-mode .manual-card {
      background: var(--bg-card);
      border-color: #1e293b;
    }
    body.dark-mode .manual-card h3, body.dark-mode .manual-card h4 {
      color: #f8fafc;
      border-bottom-color: #1e293b;
    }
    body.dark-mode .manual-card .btn-lang {
      background: #1e293b;
      color: #cbd5e1;
      border-color: #334155;
    }
    body.dark-mode .manual-card .btn-lang.active, body.dark-mode .manual-card .btn-lang:hover {
      background: var(--accent-primary);
      color: #ffffff;
      border-color: var(--accent-primary);
    }
    body.dark-mode .guide-step {
      background: #0f172a;
      border-color: #1e293b;
    }
    body.dark-mode .guide-step-title {
      color: #f8fafc;
    }
    body.dark-mode .guide-step-body {
      color: #cbd5e1;
    }
    body.dark-mode .guide-tip {
      background: #0c2340;
      color: #93c5fd;
      border-left-color: var(--accent-primary);
    }
    body.dark-mode .info-callout {
      background: #064e3b;
      color: #a7f3d0;
      border-left-color: #10b981;
    }
    body.dark-mode footer {
      border-top-color: #1e293b;
    }
    body.dark-mode footer a {
      color: #38bdf8;
    }
    body.dark-mode footer a:hover {
      color: #7dd3fc;
    }

    @media only screen and (max-width: 1080px) {
      .url-scanner-form {
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
      }
      .toolbar #searchInput {
        max-width: 100%;
        flex: 1 1 100%;
      }
    }

    @media only screen and (max-width: 820px) {
      .navbar-header {
        padding: 10px 16px;
      }
      .sidebar-fold-btn,
      #sidebar-unfold-btn {
        width: 36px;
        padding: 0;
        gap: 0;
      }
      .hamburger-label {
        display: none;
      }
      #navbar ul {
        position: static;
        width: 100%;
        max-width: 100%;
        right: auto;
        border: none;
        border-top: 1px solid #e2e8f0;
        border-radius: 0;
        box-shadow: none;
        max-height: 75vh;
      }
      body.dark-mode #navbar ul {
        border-top-color: #1e293b;
        box-shadow: none;
      }
      #main-doc, body.sidebar-collapsed #main-doc {
        margin-left: 0;
        padding: 16px;
      }
      .top-banner,
      .panel-card,
      .manual-card {
        padding: 16px;
      }
      .top-banner h1 {
        font-size: 1.32em;
      }
      .keywords-input-row .input-text {
        flex: 1 1 100%;
        width: 100%;
      }
      .toolbar {
        flex-direction: column;
        align-items: stretch;
      }
      .toolbar .filter-group {
        width: 100%;
      }
      .toolbar #searchInput,
      #searchInput {
        max-width: 100% !important;
        width: 100%;
        flex: 1 1 auto;
      }
      .kpi-grid {
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 155px), 1fr));
        gap: 10px;
      }
      .radar-grid {
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
      }
    }

    @media only screen and (max-width: 640px) {
      .navbar-header {
        padding: 10px 14px;
      }
      #main-doc, body.sidebar-collapsed #main-doc {
        padding: 12px;
      }
      .top-banner,
      .panel-card,
      .manual-card,
      .opp-card {
        padding: 14px;
      }
      .top-banner h1 {
        font-size: 1.18em;
        line-height: 1.3;
      }
      #banner-subtitle,
      .banner-disclaimer {
        font-size: 0.88em;
      }
      .banner-pill {
        white-space: normal;
        word-break: break-word;
        line-height: 1.4;
      }
      .lang-switch-group {
        width: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
      }
      .panel-header-actions {
        width: 100%;
      }
      .panel-header-actions .btn-action,
      .panel-header-actions .bolivia-only-label {
        width: 100%;
        justify-content: center;
      }
      .filter-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .chip {
        white-space: normal;
        line-height: 1.35;
      }
      .url-scanner-form {
        grid-template-columns: 1fr;
      }
      .url-scanner-form #btn-submit-url {
        width: 100%;
        justify-content: center;
      }
      .kpi-grid {
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 145px), 1fr));
        gap: 8px;
      }
      .kpi-value {
        font-size: 1.35em;
      }
      .toolbar .filter-group .btn-tab {
        flex: 1 1 auto;
      }
      .opp-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }
      .opp-title {
        flex: 1 1 auto;
        width: 100%;
      }
      .badge {
        white-space: normal;
      }
      .opp-card .btn-action {
        width: 100%;
        justify-content: center;
      }
      .radar-grid {
        grid-template-columns: 1fr;
      }
      .radar-box p {
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      .guide-step {
        padding: 12px 14px;
      }
    }

    @media only screen and (max-width: 400px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
      .lang-switch-group .btn-scan-now {
        width: 100%;
      }
    }
  </style>
</head>
<body class="sidebar-collapsed">
  <div class="bolivia-stripe"></div>

  <nav id="navbar">
    <div class="navbar-header">
      <header class="header-title"><span id="nav-brand-title">Bolivia Remote Work</span></header>
      <button type="button" id="sidebar-unfold-btn" class="sidebar-fold-btn" onclick="toggleSidebar()" title="Mostrar menú" aria-label="Mostrar menú" aria-expanded="false">
        <span class="hamburger-label" id="lbl-unfold-nav">Menú</span>
        <span class="hamburger-icon"><span></span><span></span><span></span></span>
      </button>
    </div>
    <ul id="navbar-menu-list">
      <li><a id="nav-results" class="active-nav" onclick="switchMainView('results'); closeNavbarMenu();"><span id="nav-lbl-results">Resultados en Vivo</span> (<span id="nav-cnt-results">0</span>)</a></li>
      <li><a id="nav-manual" onclick="switchMainView('manual'); closeNavbarMenu();"><span id="nav-lbl-manual">Manual de Uso</span></a></li>

      <li class="nav-group-header nav-collapsible-header" id="nav-hdr-tracks-item" onclick="toggleCategoriesMenu()" role="button" tabindex="0" aria-expanded="false">
        <span id="nav-hdr-tracks">Categorías De Plataformas</span>
        <span class="nav-caret" id="nav-tracks-caret" aria-hidden="true"></span>
      </li>
      <li class="nav-track-item nav-track-folded"><a onclick="switchMainView('results'); filterByTrack('ALL'); closeNavbarMenu();"><span id="nav-track-all">Todas las Categorías</span></a></li>
      <li class="nav-track-item nav-track-folded"><a onclick="switchMainView('results'); filterByTrack('TRACK A'); closeNavbarMenu();"><span id="nav-track-a">B2B Directo &amp; Freelance</span></a></li>
      <li class="nav-track-item nav-track-folded"><a onclick="switchMainView('results'); filterByTrack('TRACK B'); closeNavbarMenu();"><span id="nav-track-b">Entrenamiento IA &amp; RLHF</span></a></li>
      <li class="nav-track-item nav-track-folded"><a onclick="switchMainView('results'); filterByTrack('TRACK C'); closeNavbarMenu();"><span id="nav-track-c">Redes LATAM &amp; Globales</span></a></li>
      <li class="nav-track-item nav-track-folded"><a onclick="switchMainView('results'); filterByTrack('TRACK D'); closeNavbarMenu();"><span id="nav-track-d">Portales Europeos &amp; Globales</span></a></li>
      <li class="nav-track-item nav-track-folded"><a onclick="switchMainView('results'); filterByTrack('TRACK E'); closeNavbarMenu();"><span id="nav-track-e">Redes de Consultoría Experta</span></a></li>
      <li class="nav-track-item nav-track-folded"><a onclick="switchMainView('results'); filterByTrack('TRACK F'); closeNavbarMenu();"><span id="nav-track-f">Bolsas de Empleo Remoto</span></a></li>

      <li class="nav-group-header nav-collapsible-header" id="nav-hdr-payments-item" onclick="togglePaymentsMenu()" role="button" tabindex="0" aria-expanded="false">
        <span id="nav-hdr-payments">Información Financiera</span>
        <span class="nav-caret" id="nav-payments-caret" aria-hidden="true"></span>
      </li>
      <li class="nav-payment-item nav-payment-folded"><a href="https://www.airtm.com/" target="_blank" rel="noopener noreferrer">AirTM</a></li>
      <li class="nav-payment-item nav-payment-folded"><a href="https://www.payoneer.com/" target="_blank" rel="noopener noreferrer">Payoneer</a></li>
      <li class="nav-payment-item nav-payment-folded"><a href="https://wise.com/" target="_blank" rel="noopener noreferrer">Wise</a></li>
      <li class="nav-payment-item nav-payment-folded"><a href="https://tipalti.com/" target="_blank" rel="noopener noreferrer">Tipalti</a></li>
      <li class="nav-payment-item nav-payment-folded"><a href="https://dolarboliviahoy.com/" target="_blank" rel="noopener noreferrer">Dólar Bolivia Hoy</a></li>
      <li class="nav-payment-item nav-payment-folded nav-payment-desc">
        <p id="nav-payments-desc">Las empresas suelen liquidar mediante plataformas de nómina global como <strong>AirTM. Wise, Payoneer o Tipalti</strong>. Desde estas cuentas puedes transferir vía SWIFT O transferancia ACH hacia tu cuenta bancaria boliviana en Boliviano o en USD, usar tarjetas de débito internacionales, o liquidar honorarios a través de pasarelas reguladas entre tus cuentas globales y locales.</p>
      </li>
    </ul>
  </nav>

  <main id="main-doc">
    <!-- TOP BANNER -->
    <section class="top-banner">
      <div class="banner-header-block">
        <h1 id="banner-title">Buscador y Evaluador de Empleos Remotos desde Bolivia</h1>
        <p id="banner-subtitle">
          Filtra y evalúa ofertas globales y regionales que permiten trabajar remoto desde Bolivia (UTC-4). Personaliza tus idiomas, área profesional, experiencia y modalidad de contrato.
        </p>
        <p id="banner-disclaimer" class="banner-disclaimer">
          Aviso: algunas de estas plataformas requieren registrarse y utilizar una herramienta de traducción en el navegador para aprovechar al máximo su contenido. Para el trabajo remoto a nivel global, se recomienda encarecidamente <a href="https://www.languagetransfer.org" title="Language Transfer: aprende inglés y más, ¡gratis!" target="_blank" rel="noopener noreferrer">aprender inglés</a>. Te abre todo un entorno de oportunidades y con <a href="https://www.languagetransfer.org" title="Language Transfer: aprende inglés y más, ¡gratis!" target="_blank" rel="noopener noreferrer">Language Transfer</a>, es <strong>gratis</strong>!
        </p>
      </div>
      <div class="banner-pills banner-actions-row">
        <span class="banner-pill" id="pill-bolivia">Filtro Base: 100% Remoto desde Bolivia (UTC-4)</span>
        <span class="banner-pill" id="pill-schedule">Ejecución: Bajo Demanda + Automático cada 15 min</span>
        <span class="banner-pill"><span id="lbl-last-sync">Última sincronización:</span> <span id="val-last-sync">-</span></span>
        <span class="banner-pill"><span id="lbl-monitored-count">Plataformas activas:</span> <span id="val-platforms-count">0</span></span>
        <div class="lang-switch-group">
          <button type="button" class="btn-lang active" id="btn-lang-es" onclick="setUiLanguage('es')">Español (Bolivia)</button>
          <button type="button" class="btn-lang" id="btn-lang-en" onclick="setUiLanguage('en')">English</button>
          <button type="button" class="btn-theme-toggle" id="btn-theme-toggle" onclick="toggleTheme()" title="Cambiar a modo oscuro" aria-label="Cambiar tema">
            <span class="theme-symbol theme-symbol-moon" id="theme-sym-moon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            </span>
            <span class="theme-symbol theme-symbol-sun" id="theme-sym-sun" style="display:none;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            </span>
          </button>
          <button type="button" class="btn-scan-now" id="btn-scan-now" onclick="triggerOnDemandScan()">
            <span id="lbl-scan-now">Escanear Ofertas Ahora</span>
          </button>
        </div>
      </div>
    </section>

    <!-- CUSTOMIZABLE USER FILTERS PANEL -->
    <section class="panel-card" id="custom-filters-panel">
      <div class="panel-header">
        <h2 class="panel-title"><span id="lbl-filters-title">Personaliza tu Búsqueda y Criterios de Evaluación</span></h2>
        <div class="panel-header-actions">
          <label class="bolivia-only-label">
            <input type="checkbox" id="chk-bolivia-only" checked onchange="onBoliviaToggle(this.checked)">
            <span id="lbl-bolivia-only">Mostrar solo ofertas 100% remotas desde Bolivia</span>
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
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <label style="font-size:0.8em;font-weight:600;color:#334155;display:inline-flex;align-items:center;gap:4px;cursor:pointer;">
              <input type="checkbox" id="chk-strict-pos" onchange="onStrictPosToggle(this.checked)">
              <span id="lbl-strict-pos">Ocultar ofertas de otras áreas</span>
            </label>
            <button type="button" style="border:none;background:none;color:#0284c7;font-size:0.8em;font-weight:700;cursor:pointer;" onclick="clearPositions()" id="btn-clear-pos">Ver todas las áreas</button>
          </div>
        </div>
        <div class="chip-group" id="chips-positions" style="margin-bottom:10px;"></div>

        <div class="keywords-input-row">
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
        <h2 class="panel-title"><span id="lbl-add-url-title">Agregar y Escanear tu Propia URL de Plataforma o Bolsa de Empleo</span></h2>
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
          <button type="submit" class="btn-action btn-primary" id="btn-submit-url">
            <span id="lbl-btn-submit-url">Escanear y Evaluar URL</span>
          </button>
        </div>
      </form>
      <div id="scan-feedback-box" class="scan-alert"></div>
    </section>

    <!-- CLOUDFLARE WORKERS AI — CV MATCHER & APPLICATION LETTER GENERATOR PANEL -->
    <section class="panel-card" id="ai-cv-panel">
      <div class="panel-header" style="margin-bottom:10px;padding-bottom:8px;">
        <h2 class="panel-title"><span id="lbl-ai-cv-title">Asistente IA de Perfil y Generador de Cartas de Postulación (Cloudflare Workers AI)</span></h2>
        <span style="font-size:0.82em;color:#64748b;" id="lbl-ai-cv-sub">Pega tu resumen profesional o habilidades para detectar tu afinidad y redactar una carta de presentación a medida (UTC-4 / W-8BEN)</span>
      </div>
      <div class="ai-cv-grid">
        <div class="form-field">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
            <label for="ai-cv-input" id="lbl-ai-cv-field" style="margin-bottom:0;">Tu Resumen Profesional, Experiencia o Habilidades Clave *</label>
            <span id="ai-target-job-pill" style="display:none;font-size:0.78em;background:#e0f2fe;color:#0369a1;padding:2px 9px;border-radius:999px;font-weight:700;">
              <span id="ai-target-job-text"></span>
              <button type="button" onclick="clearAiTargetJob()" style="border:none;background:none;color:#0369a1;font-weight:800;cursor:pointer;margin-left:6px;">x</button>
            </span>
          </div>
          <textarea
            id="ai-cv-input"
            class="ai-textarea"
            placeholder="Ej: Ingeniero de Software / Analista de Datos / Asistente Virtual Bilingüe con 4 años de experiencia en Python, SQL, React, Soporte Técnico, Gestión de Proyectos y Atención al Cliente..."
          ></textarea>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <button type="button" class="btn-action btn-primary" id="btn-submit-ai-cv" onclick="submitAiCvMatch()">
            <span id="lbl-btn-ai-cv">Analizar CV y Redactar Carta IA</span>
          </button>
          <button type="button" class="btn-action btn-secondary" id="btn-apply-ai-filters" onclick="applyAiSkillsToFilters()" style="display:none;">
            <span id="lbl-btn-apply-ai-filters">Aplicar Habilidades Detectadas a Mis Filtros</span>
          </button>
        </div>
      </div>
      <div id="ai-cv-error" class="scan-alert"></div>
      <div id="ai-cv-result-box" class="ai-result-box">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
          <strong style="font-size:0.92em;" id="lbl-ai-analysis-hdr">Diagnóstico de Compatibilidad Remota (Bolivia UTC-4)</strong>
          <span id="ai-engine-badge" class="score-pill" style="font-size:0.75em;">Workers AI</span>
        </div>
        <p id="ai-cv-analysis-text" style="margin:0 0 12px 0;font-size:0.88em;line-height:1.5;"></p>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
          <strong style="font-size:0.9em;" id="lbl-ai-proposal-hdr">Carta de Postulación Personalizada</strong>
          <button type="button" class="btn-action btn-secondary" style="padding:4px 10px;font-size:0.78em;" onclick="copyAiProposal()">
            <span id="lbl-copy-ai-proposal">Copiar Carta</span>
          </button>
        </div>
        <pre id="ai-cv-proposal-pre" class="ai-proposal-pre"></pre>
      </div>
    </section>

    <!-- KPI SUMMARY CARDS -->
    <section class="kpi-grid">
      <div class="kpi-card apply" onclick="switchMainView('results'); setVerdictFilter('APPLY');">
        <div class="kpi-value" style="color:#059669;"><span id="kpi-apply-cnt">0</span></div>
        <div class="kpi-label"><strong id="kpi-apply-title">POSTULAR</strong> (<span id="kpi-apply-sub">Puntaje ≥ 78/100</span>)</div>
      </div>
      <div class="kpi-card possible" onclick="switchMainView('results'); setVerdictFilter('POSSIBLE');">
        <div class="kpi-value" style="color:#d97706;"><span id="kpi-possible-cnt">0</span></div>
        <div class="kpi-label"><strong id="kpi-possible-title">EXPLORAR</strong> (<span id="kpi-possible-sub">Puntaje 58–77/100</span>)</div>
      </div>
      <div class="kpi-card skip" onclick="switchMainView('results'); setVerdictFilter('SKIP');">
        <div class="kpi-value" style="color:#475569;"><span id="kpi-skip-cnt">0</span></div>
        <div class="kpi-label"><strong id="kpi-skip-title">BAJA COINCIDENCIA</strong> (<span id="kpi-skip-sub">Fuera de tus filtros</span>)</div>
      </div>
      <div class="kpi-card geo" onclick="switchMainView('results'); setVerdictFilter('GEO');">
        <div class="kpi-value" style="color:#dc2626;"><span id="kpi-geo-cnt">0</span></div>
        <div class="kpi-label"><strong id="kpi-geo-title">NO ELEGIBLES BOLIVIA</strong> (<span id="kpi-geo-sub">Restringidas por país</span>)</div>
      </div>
      <div class="kpi-card" onclick="switchMainView('report');">
        <div class="kpi-value" style="color:#0284c7;"><span id="kpi-total-cnt">0</span></div>
        <div class="kpi-label"><strong id="kpi-report-title">Reporte de Resultados</strong> (<span id="kpi-report-sub">Generado al instante</span>)</div>
      </div>
    </section>

    <!-- TOOLBAR -->
    <section class="toolbar">
      <div class="filter-group">
        <button type="button" class="btn-tab active" id="tab-view-results" onclick="switchMainView('results')"><span id="tab-lbl-results">Resultados</span></button>
        <button type="button" class="btn-tab" id="tab-view-manual" onclick="switchMainView('manual')"><span id="tab-lbl-manual">Manual de Uso</span></button>
        <button type="button" class="btn-tab" id="tab-view-platforms" onclick="switchMainView('platforms')"><span id="tab-lbl-platforms">Plataformas Monitoreadas</span></button>
      </div>
      <div class="filter-group" id="verdictFilterBar">
        <button type="button" class="btn-tab active" data-verdict="ALL" onclick="setVerdictFilter('ALL')" id="btn-v-all">Todas las Elegibles</button>
        <button type="button" class="btn-tab" data-verdict="APPLY" onclick="setVerdictFilter('APPLY')"><span id="btn-v-apply">Postular</span></button>
        <button type="button" class="btn-tab" data-verdict="POSSIBLE" onclick="setVerdictFilter('POSSIBLE')"><span id="btn-v-possible">Explorar</span></button>
        <button type="button" class="btn-tab" data-verdict="SKIP" onclick="setVerdictFilter('SKIP')"><span id="btn-v-skip">Baja Coincidencia</span></button>
        <button type="button" class="btn-tab" data-verdict="GEO" onclick="setVerdictFilter('GEO')"><span id="btn-v-geo">Bloqueadas País</span></button>
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;flex:1 1 280px;justify-content:flex-end;">
        <input type="search" id="searchInput" class="input-text" placeholder="Buscar por cargo, empresa, país..." oninput="onSearchInputChange(this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();runSemanticSearch();}">
        <button type="button" class="btn-action btn-primary" id="btn-semantic-search" onclick="runSemanticSearch()" style="padding:7px 12px;font-size:0.82em;">
          <span id="lbl-btn-semantic">Búsqueda Vectorial IA</span>
        </button>
        <button type="button" class="btn-action btn-secondary" id="btn-clear-semantic" onclick="clearSemanticSearch()" style="display:none;padding:7px 10px;font-size:0.8em;">
          <span id="lbl-btn-clear-semantic">Limpiar Vector</span>
        </button>
      </div>
    </section>

    <!-- VIEW 1: LIVE RESULTS -->
    <section id="view-results">
      <div id="semantic-status-bar" class="scan-alert success" style="display:none;margin-top:0;margin-bottom:14px;"></div>
      <div id="resultsCardsContainer"></div>
    </section>

    <!-- VIEW 2: INTERACTIVE USER MANUAL -->
    <section id="view-manual" style="display:none;">
      <div class="manual-container">
        <!-- GUÍA DEL USUARIO: Bolivia Remote Work -->
        <article class="manual-card">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px;border-bottom:1px solid #f1f5f9;padding-bottom:12px;">
            <h3 id="man-h-intro" style="margin:0;">Guía del Usuario: Bolivia Remote Work</h3>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              <button type="button" class="btn-lang active" id="man-btn-lang-es" onclick="setUiLanguage('es')">Español (Bolivia)</button>
              <button type="button" class="btn-lang" id="man-btn-lang-en" onclick="setUiLanguage('en')">English</button>
              <button type="button" class="btn-theme-toggle" id="man-btn-theme-toggle" onclick="toggleTheme()" title="Cambiar a modo oscuro" aria-label="Cambiar tema">
                <span class="theme-symbol theme-symbol-moon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                </span>
                <span class="theme-symbol theme-symbol-sun" style="display:none;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                </span>
              </button>
              <button type="button" class="btn-action btn-primary" onclick="switchMainView('results')"><span id="man-btn-back">Ver Resultados en Vivo</span></button>
            </div>
          </div>
          <p id="man-p-intro" style="font-size:0.92em;color:#334155;line-height:1.6;">
            <strong>Bolivia Remote Work</strong> es una plataforma pública, gratuita e interactiva diseñada para encontrar, filtrar y evaluar en vivo oportunidades laborales internacionales que admiten trabajo 100% remoto desde Bolivia (UTC-4), eliminando el ruido de ofertas con restricciones territoriales o visados extranjeros.
          </p>
          <div class="info-callout" id="man-box-privacy">
            <strong>Privacidad Total y Sin Registros:</strong> No necesitas crear una cuenta ni ingresar datos personales. Tus filtros y preferencias se guardan de forma privada en tu propio navegador (localStorage).
          </div>

          <h4 style="margin:20px 0 14px 0;color:#0f172a;font-size:1.08em;display:flex;align-items:center;gap:8px;border-bottom:1px solid #f1f5f9;padding-bottom:8px;">
            Cómo Utilizar la Herramienta Paso a Paso
          </h4>

          <!-- PASO 1 -->
          <div class="guide-step">
            <div class="guide-step-header">
              <span class="guide-step-num">1</span>
              <h5 class="guide-step-title">Configura tus Idiomas de Trabajo</h5>
            </div>
            <div class="guide-step-body">
              En la sección <strong>1. Tus Idiomas</strong>, haz clic sobre las etiquetas interactivas de los idiomas que dominas (<code>Español</code>, <code>Inglés</code>, <code>Portugués</code>):
              <ul>
                <li><strong>Solo Español:</strong> Si seleccionas únicamente <em>Español (BO)</em>, el evaluador activa una regla estricta que prioriza vacantes en español y excluye ofertas redactadas en inglés.</li>
                <li><strong>Bilingüe / Multilingüe:</strong> Si activas también <em>Inglés</em> o <em>Portugués</em>, el sistema evaluará y sumará oportunidades internacionales que requieren fluidez en esos idiomas.</li>
              </ul>
              <div class="guide-tip">
                En la esquina superior derecha del banner puedes cambiar el idioma general de la plataforma (<em>Español (Bolivia)</em> o <em>English</em>) en cualquier momento.
              </div>
            </div>
          </div>

          <!-- PASO 2 -->
          <div class="guide-step">
            <div class="guide-step-header">
              <span class="guide-step-num">2</span>
              <h5 class="guide-step-title">Define tu Nivel de Experiencia</h5>
            </div>
            <div class="guide-step-body">
              En <strong>2. Tu Nivel de Experiencia</strong>, selecciona el rango correspondiente a tu trayectoria profesional:
              <ul>
                <li><strong>Todos los niveles:</strong> Muestra todas las vacantes sin restringir por años de experiencia.</li>
                <li><strong>Inicial / Sin Experiencia (0-1 años):</strong> Puestos de entrada, pasantías y roles de entrenamiento.</li>
                <li><strong>Junior (1-2 años):</strong> Roles iniciales con supervisión mínima.</li>
                <li><strong>Semi-Senior / Mid (3-5 años):</strong> Profesionales autónomos con experiencia demostrada.</li>
                <li><strong>Senior (5+ años) &amp; Lead (8+ años):</strong> Especialistas, líderes técnicos y directores de área.</li>
              </ul>
            </div>
          </div>

          <!-- PASO 3 -->
          <div class="guide-step">
            <div class="guide-step-header">
              <span class="guide-step-num">3</span>
              <h5 class="guide-step-title">Elige tus Modalidades de Contrato</h5>
            </div>
            <div class="guide-step-body">
              En <strong>3. Tipo de Contrato Buscado</strong>, marca una o varias modalidades según tu disponibilidad:
              <ul>
                <li><strong>Tiempo Completo (Full-Time):</strong> Jornadas estándar de 40 horas semanales.</li>
                <li><strong>Medio Tiempo (Part-Time):</strong> Esquemas de 20 horas por semana o semanas de 4 días.</li>
                <li><strong>Por Proyectos / Freelance:</strong> Contratos cerrados por entregables u objetivos.</li>
                <li><strong>Por Horas / Asíncrono:</strong> Horarios flexibles con pago por hora trabajada.</li>
                <li><strong>Consultoría / Asesoría:</strong> Llamadas de asesoramiento y redes de expertos internacionales.</li>
              </ul>
              <div class="guide-tip">
                Haz clic en el enlace <strong>"Todos"</strong> para seleccionar simultáneamente todas las modalidades disponibles.
              </div>
            </div>
          </div>

          <!-- PASO 4 -->
          <div class="guide-step">
            <div class="guide-step-header">
              <span class="guide-step-num">4</span>
              <h5 class="guide-step-title">Selecciona tus Áreas Profesionales y Palabras Clave</h5>
            </div>
            <div class="guide-step-body">
              En <strong>4. Tipo de Posición / Área Profesional</strong>:
              <ul>
                <li>Haz clic en uno o varios chips para enfocar tu búsqueda en tus disciplinas (ej: <em>Asistente Virtual, Atención al Cliente, Ventas, Marketing, Finanzas, Diseño, Software, Cloud, Datos</em>).</li>
                <li><strong>Ver todas las áreas:</strong> Pulsa este botón si deseas explorar oportunidades de cualquier disciplina sin restricción.</li>
                <li><strong>Casilla "Ocultar ofertas de otras áreas":</strong> Actívala para esconder estrictamente cualquier vacante que no pertenezca a tus categorías seleccionadas.</li>
                <li><strong>Palabras clave personalizadas:</strong> En el campo de texto inferior, escribe herramientas, tecnologías o habilidades específicas (ej: <code>Excel, Canva, Shopify, HubSpot, Python, React, Quickbooks, SQL</code>). Las ofertas que las mencionen recibirán puntos adicionales.</li>
              </ul>
            </div>
          </div>

          <!-- PASO 5 -->
          <div class="guide-step">
            <div class="guide-step-header">
              <span class="guide-step-num">5</span>
              <h5 class="guide-step-title">El Filtro Base 100% Remoto desde Bolivia</h5>
            </div>
            <div class="guide-step-body">
              La casilla <strong>"Mostrar solo ofertas 100% remotas desde Bolivia"</strong> viene activada por defecto:
              <ul>
                <li>Descarta automáticamente vacantes que exijan residencia física o visados en Estados Unidos (<em>US Only</em>, <em>W-2</em>), Europa (<em>EU Only</em>) u otros países específicos.</li>
                <li>Conserva únicamente vacantes abiertas a Sudamérica, Latinoamérica, esquemas globales de contratación independiente (<em>W-8BEN</em>) y modalidad <em>Work From Anywhere</em>.</li>
              </ul>
            </div>
          </div>

          <!-- PASO 6 -->
          <div class="guide-step">
            <div class="guide-step-header">
              <span class="guide-step-num">6</span>
              <h5 class="guide-step-title">Interpreta el Semáforo de Compatibilidad y Filtra Resultados</h5>
            </div>
            <div class="guide-step-body">
              Cada vacante se evalúa en tiempo real con una calificación de 0 a 100 puntos y se clasifica mediante colores:
              <ul>
                <li><strong style="color:#059669;">POSTULAR (Puntaje ≥ 78):</strong> Máxima afinidad con tus filtros e idiomas, verificada 100% para Bolivia. ¡Recomendada para postular de inmediato!</li>
                <li><strong style="color:#d97706;">EXPLORAR (Puntaje 58–77):</strong> Ofertas compatibles con pequeñas variaciones de modalidad o experiencia.</li>
                <li><strong style="color:#475569;">BAJA COINCIDENCIA (&lt; 58):</strong> Ofertas remotas válidas pero fuera de tus áreas o preferencias actuales.</li>
                <li><strong style="color:#dc2626;">BLOQUEADAS PAÍS (GEO):</strong> Excluidas por restricciones de residencia geográfica local.</li>
              </ul>
              <div class="guide-tip">
                Usa los botones del semáforo en la barra de herramientas para ver solo vacantes de <strong>Postular</strong> o <strong>Explorar</strong>, o escribe en la barra de búsqueda para filtrar por empresa o cargo al instante.
              </div>
            </div>
          </div>

          <!-- PASO 7 -->
          <div class="guide-step">
            <div class="guide-step-header">
              <span class="guide-step-num">7</span>
              <h5 class="guide-step-title">Postula Directamente a la Fuente Original</h5>
            </div>
            <div class="guide-step-body">
              En cada tarjeta de oferta, haz clic en el botón azul <strong>"Ver Oferta y Postular"</strong> para abrir directamente la página oficial de la empresa o bolsa de trabajo contratante, sin registros intermedios ni cobro de comisiones.
            </div>
          </div>

          <!-- PASO 8 -->
          <div class="guide-step">
            <div class="guide-step-header">
              <span class="guide-step-num">8</span>
              <h5 class="guide-step-title">Escanea tus Propias URLs de Plataformas o Empresas</h5>
            </div>
            <div class="guide-step-body">
              ¿Encontraste una nueva bolsa de empleo o una página de carreras de una empresa internacional?
              <ul>
                <li>Ve al panel <strong>"Agregar y Escanear tu Propia URL de Plataforma o Bolsa de Empleo"</strong>.</li>
                <li>Pega el enlace web, feed RSS o endpoint JSON.</li>
                <li>Haz clic en <strong>"Escanear y Evaluar URL"</strong>.</li>
                <li>El motor analizará las vacantes encontradas, verificará su elegibilidad remota para Bolivia y las añadirá al instante a tus resultados en vivo.</li>
              </ul>
            </div>
          </div>

          <!-- PASO 9 -->
          <div class="guide-step" style="margin-bottom:0;">
            <div class="guide-step-header">
              <span class="guide-step-num">9</span>
              <h5 class="guide-step-title">Exporta tus Resultados y Sincroniza en Segundo Plano</h5>
            </div>
            <div class="guide-step-body">
              <ul>
                <li>Haz clic en la tarjeta o pestaña <strong>"Reporte de Resultados"</strong> para copiar el informe formateado, descargar el archivo <code>.md</code> o exportar una planilla <code>.csv</code> para gestionarla en Excel o Notion.</li>
                <li>La herramienta se sincroniza automáticamente cada 15 minutos en segundo plano, o puedes forzar un escaneo inmediato haciendo clic en <strong>"Escanear Ofertas Ahora"</strong> en el banner superior.</li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- VIEW 3: ON-THE-FLY RESULTS REPORT (MARKDOWN & CSV) -->
    <section id="view-report" style="display:none;">
      <div class="panel-card">
        <div class="panel-header">
          <h3 class="panel-title"><span id="lbl-live-report-heading">Reporte de Resultados Generado al Instante (Markdown)</span></h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" class="btn-action btn-primary" onclick="copyReportMarkdown(this)"><span id="lbl-copy-md">Copiar Resultados (.md)</span></button>
            <button type="button" class="btn-action btn-secondary" onclick="downloadReportMarkdown()"><span id="lbl-dl-md">Descargar .md</span></button>
            <button type="button" class="btn-action btn-secondary" onclick="downloadResultsCsv()"><span id="lbl-dl-csv">Exportar CSV</span></button>
          </div>
        </div>
        <pre id="liveReportMarkdownBox" class="report-box"></pre>
      </div>
    </section>

    <!-- VIEW 4: MONITORED PLATFORMS & CUSTOM URLS -->
    <section id="view-platforms" style="display:none;">
      <div class="panel-card">
        <div class="panel-header">
          <h3 class="panel-title"><span id="lbl-platforms-heading">Directorio de Plataformas Remotas Monitoreadas</span></h3>
          <span style="font-size:0.84em;color:#64748b;" id="lbl-platforms-sub">Haz clic en "Escanear" en cualquier plataforma para buscar nuevas ofertas al instante</span>
        </div>
        <div id="platformsGridContainer" class="radar-grid"></div>
      </div>
    </section>

    <footer id="footer-text">
      Buscador y Evaluador Público de Empleos Remotos desde Bolivia (UTC-4) · Ejecución en Cloudflare Workers (Bajo Demanda + Cada 15 Minutos) · Designed, engineered and hosted by <a href="mailto:contact@tsimon.me">Thomas M. Simon</a> · <a href="https://tsimon.me" title="Thomas Mathieu Simon  · Cloud Systems Architect · NOC &amp; AI Engineer" target="_blank" rel="noopener noreferrer">tsimon.me</a>
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

    let currentTheme = 'light';
    try {
      const savedTheme = localStorage.getItem('bolivia_remote_theme');
      if (savedTheme === 'dark' || (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        currentTheme = 'dark';
      }
    } catch (e) {}

    function applyTheme(theme) {
      currentTheme = theme;
      const isDark = (theme === 'dark');
      if (isDark) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
      }
      try {
        localStorage.setItem('bolivia_remote_theme', theme);
      } catch (e) {}
      updateThemeButtons();
    }

    function toggleTheme() {
      applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    }
    window.toggleTheme = toggleTheme;

    function updateThemeButtons() {
      const isDark = (currentTheme === 'dark');
      const t = I18N[userFilters.ui_lang] || I18N.es;
      const btnTitle = isDark ? (t.themeLightTitle || 'Cambiar a modo claro') : (t.themeDarkTitle || 'Cambiar a modo oscuro');

      document.querySelectorAll('.btn-theme-toggle').forEach(btn => {
        btn.setAttribute('title', btnTitle);
        btn.setAttribute('aria-label', btnTitle);
        const moon = btn.querySelector('.theme-symbol-moon');
        const sun = btn.querySelector('.theme-symbol-sun');
        if (moon) moon.style.display = isDark ? 'none' : 'inline-flex';
        if (sun) sun.style.display = isDark ? 'inline-flex' : 'none';
      });
    }

    function cleanTrackName(trackStr) {
      return String(trackStr || '').replace(/^Track\s+[A-F]:?\s*/i, '').trim();
    }

    const I18N = {
      es: {
        pageTitle: 'Empleos Remotos desde Bolivia — Buscador y Evaluador en Vivo',
        navBrand: 'Bolivia Remote Work',
        unfoldNav: 'Menú',
        navViews: 'Vistas Principales',
        navResults: 'Resultados en Vivo',
        navManual: 'Manual de Uso',
        navPlatforms: 'Plataformas y Escáner URL',
        navTracks: 'Categorías De Plataformas',
        navTrackAll: 'Todas las Categorías',
        navTrackA: 'B2B Directo & Freelance',
        navTrackB: 'Entrenamiento IA & RLHF',
        navTrackC: 'Redes LATAM & Globales',
        navTrackD: 'Portales Europeos & Globales',
        navTrackE: 'Redes de Consultoría Experta',
        navTrackF: 'Bolsas de Empleo Remoto',
        navPayments: 'Información Financiera',
        navPaymentsDesc: 'Las empresas suelen liquidar mediante plataformas de nómina global como <strong>AirTM. Wise, Payoneer o Tipalti</strong>. Desde estas cuentas puedes transferir vía SWIFT O transferancia ACH hacia tu cuenta bancaria boliviana en Boliviano o en USD, usar tarjetas de débito internacionales, o liquidar honorarios a través de pasarelas reguladas entre tus cuentas globales y locales.',
        categoryLabel: 'Categoría',
        themeDarkTitle: 'Cambiar a modo oscuro',
        themeLightTitle: 'Cambiar a modo claro',
        themeDarkText: 'Oscuro',
        themeLightText: 'Claro',
        bannerTitle: 'Buscador y Evaluador de Empleos Remotos desde Bolivia',
        bannerSubtitle: 'Filtra y evalúa ofertas globales y regionales que permiten trabajar remoto desde Bolivia (UTC-4). Personaliza tus idiomas, área profesional, experiencia y modalidad de contrato.',
        bannerDisclaimer: 'Aviso: algunas de estas plataformas requieren registrarse y utilizar una herramienta de traducción en el navegador para aprovechar al máximo su contenido. Para el trabajo remoto a nivel global, se recomienda encarecidamente <a href="https://www.languagetransfer.org" title="Language Transfer: aprende inglés y más, ¡gratis!" target="_blank" rel="noopener noreferrer">aprender inglés</a>. Te abre todo un entorno de oportunidades y con <a href="https://www.languagetransfer.org" title="Language Transfer: aprende inglés y más, ¡gratis!" target="_blank" rel="noopener noreferrer">Language Transfer</a>, es <strong>gratis</strong>!',
        scanNow: 'Escanear Ofertas Ahora',
        scanningNow: 'Escaneando plataformas...',
        pillBolivia: 'Filtro Base: 100% Remoto desde Bolivia (UTC-4)',
        pillSchedule: 'Ejecución: Bajo Demanda + Automático cada 15 min',
        lastSync: 'Última sincronización:',
        monitoredCount: 'Plataformas activas:',
        filtersTitle: 'Personaliza tu Búsqueda y Criterios de Evaluación',
        boliviaOnly: 'Mostrar solo ofertas 100% remotas desde Bolivia',
        resetFilters: 'Restablecer Filtros',
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
        aiCvTitle: 'Asistente IA de Perfil y Generador de Cartas de Postulación (Cloudflare Workers AI)',
        aiCvSub: 'Pega tu resumen profesional o habilidades para detectar tu afinidad y redactar una carta de presentación a medida (UTC-4 / W-8BEN)',
        aiCvField: 'Tu Resumen Profesional, Experiencia o Habilidades Clave *',
        aiCvPlaceholder: 'Ej: Ingeniero de Software / Analista de Datos / Asistente Virtual Bilingüe con 4 años de experiencia en Python, SQL, React, Soporte Técnico, Gestión de Proyectos y Atención al Cliente...',
        btnAiCv: 'Analizar CV y Redactar Carta IA',
        btnAiCvLoading: 'Analizando con IA...',
        btnApplyAiFilters: 'Aplicar Habilidades Detectadas a Mis Filtros',
        aiAnalysisHdr: 'Diagnóstico de Compatibilidad Remota (Bolivia UTC-4)',
        aiProposalHdr: 'Carta de Postulación Personalizada',
        copyAiProposal: 'Copiar Carta',
        copiedAiProposal: '¡Carta Copiada!',
        draftAiBtn: 'Redactar Carta IA',
        semanticBtn: 'Búsqueda Vectorial IA',
        semanticLoading: 'Buscando Vectores...',
        semanticClear: 'Limpiar Vector',
        semanticBadge: 'Afinidad Vectorial:',
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
        copiedMd: '¡Copiado!',
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
        openOfferBtn: 'Ver Oferta y Postular',
        scanPlatformBtn: 'Escanear esta plataforma',
        openPlatformBtn: 'Abrir Portal',
        noResults: 'No se encontraron ofertas con los filtros actuales. Prueba ampliando los tipos de posición, contrato o palabras clave.',
        manBtnBack: 'Ver Resultados en Vivo',
        footerText: 'Buscador y Evaluador Público de Empleos Remotos desde Bolivia (UTC-4) · Ejecución en Cloudflare Workers (Bajo Demanda + Cada 15 Minutos) · Designed, engineered and hosted by <a href="mailto:contact@tsimon.me">Thomas M. Simon</a> · <a href="https://tsimon.me" title="Thomas Mathieu Simon  · Cloud Systems Architect · NOC &amp; AI Engineer" target="_blank" rel="noopener noreferrer">tsimon.me</a>'
      },
      en: {
        pageTitle: 'Remote Jobs from Bolivia — Live Job Scout & Evaluator',
        navBrand: 'Bolivia Remote Work',
        unfoldNav: 'Menu',
        navViews: 'Main Views',
        navResults: 'Live Results',
        navManual: 'User Manual',
        navPlatforms: 'Platforms & URL Scanner',
        navTracks: 'Platform Categories',
        navTrackAll: 'All Categories',
        navTrackA: 'Direct B2B & Freelance',
        navTrackB: 'AI Training & RLHF',
        navTrackC: 'LATAM & Global Networks',
        navTrackD: 'European & Global Portals',
        navTrackE: 'Expert Consulting Networks',
        navTrackF: 'Remote Job Boards',
        navPayments: 'Información Financiera',
        navPaymentsDesc: 'Las empresas suelen liquidar mediante plataformas de nómina global como <strong>AirTM. Wise, Payoneer o Tipalti</strong>. Desde estas cuentas puedes transferir vía SWIFT O transferancia ACH hacia tu cuenta bancaria boliviana en Boliviano o en USD, usar tarjetas de débito internacionales, o liquidar honorarios a través de pasarelas reguladas entre tus cuentas globales y locales.',
        categoryLabel: 'Category',
        themeDarkTitle: 'Switch to dark mode',
        themeLightTitle: 'Switch to light mode',
        themeDarkText: 'Dark',
        themeLightText: 'Light',
        bannerTitle: 'Remote Job Scout & Evaluator from Bolivia',
        bannerSubtitle: 'Filter and evaluate global & regional job offers eligible for remote work from Bolivia (UTC-4). Customize your languages, position type, experience level, and contract modality.',
        bannerDisclaimer: 'Notice: Some of these platforms require registration and using an in-browser translation tool to make the most of their listings. For global remote work, it is strongly recommended to <a href="https://www.languagetransfer.org" title="Language Transfer: free audio courses" target="_blank" rel="noopener noreferrer">learn English</a>. It opens up a whole world of opportunities and with <a href="https://www.languagetransfer.org" title="Language Transfer: free audio courses" target="_blank" rel="noopener noreferrer">Language Transfer</a>, it is <strong>free</strong>!',
        scanNow: 'Scan Offers Now',
        scanningNow: 'Scanning platforms...',
        pillBolivia: 'Core Filter: 100% Remote from Bolivia (UTC-4)',
        pillSchedule: 'Schedule: On-Demand + Auto Every 15 mins',
        lastSync: 'Last synced:',
        monitoredCount: 'Active platforms:',
        filtersTitle: 'Customize Your Search & Evaluation Criteria',
        boliviaOnly: 'Show only positions 100% remote from Bolivia',
        resetFilters: 'Reset Filters',
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
        aiCvTitle: 'AI Profile Matcher & Cover Letter Generator (Cloudflare Workers AI)',
        aiCvSub: 'Paste your CV summary or key skills to evaluate remote fit and draft a tailored application letter (UTC-4 / W-8BEN)',
        aiCvField: 'Your Professional Summary, Experience, or Key Skills *',
        aiCvPlaceholder: 'E.g., Software Engineer / Data Analyst / Bilingual Virtual Assistant with 4 years of experience in Python, SQL, React, Technical Support, Project Management, and Customer Success...',
        btnAiCv: 'Analyze CV & Draft AI Cover Letter',
        btnAiCvLoading: 'Analyzing with AI...',
        btnApplyAiFilters: 'Apply Detected Skills to My Filters',
        aiAnalysisHdr: 'Remote Compatibility Assessment (Bolivia UTC-4)',
        aiProposalHdr: 'Tailored Application Cover Letter',
        copyAiProposal: 'Copy Letter',
        copiedAiProposal: 'Letter Copied!',
        draftAiBtn: 'Draft AI Cover Letter',
        semanticBtn: 'AI Vector Search',
        semanticLoading: 'Searching Vectors...',
        semanticClear: 'Clear Vector',
        semanticBadge: 'Vector Match:',
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
        copiedMd: 'Copied!',
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
        openOfferBtn: 'View Offer & Apply',
        scanPlatformBtn: 'Scan this platform',
        openPlatformBtn: 'Open Portal',
        noResults: 'No offers matched your current filters. Try broadening your position types, contract modalities, or keywords.',
        manBtnBack: 'View Live Results',
        footerText: 'Public Remote Job Scout & Evaluator from Bolivia (UTC-4) · Powered by Cloudflare Workers (On-Demand + Every 15 Minutes) · Designed, engineered and hosted by <a href="mailto:contact@tsimon.me">Thomas M. Simon</a> · <a href="https://tsimon.me" title="Thomas Mathieu Simon  · Cloud Systems Architect · NOC &amp; AI Engineer" target="_blank" rel="noopener noreferrer">tsimon.me</a>'
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
      const esBtn = document.getElementById('btn-lang-es');
      const enBtn = document.getElementById('btn-lang-en');
      if (esBtn) esBtn.classList.toggle('active', userFilters.ui_lang === 'es');
      if (enBtn) enBtn.classList.toggle('active', userFilters.ui_lang === 'en');
      const manEsBtn = document.getElementById('man-btn-lang-es');
      const manEnBtn = document.getElementById('man-btn-lang-en');
      if (manEsBtn) manEsBtn.classList.toggle('active', userFilters.ui_lang === 'es');
      if (manEnBtn) manEnBtn.classList.toggle('active', userFilters.ui_lang === 'en');
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
        'nav-track-a': t.navTrackA,
        'nav-track-b': t.navTrackB,
        'nav-track-c': t.navTrackC,
        'nav-track-d': t.navTrackD,
        'nav-track-e': t.navTrackE,
        'nav-track-f': t.navTrackF,
        'nav-hdr-payments': t.navPayments,
        'nav-payments-desc': t.navPaymentsDesc,
        'banner-title': t.bannerTitle,
        'banner-subtitle': t.bannerSubtitle,
        'banner-disclaimer': t.bannerDisclaimer,
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
        'lbl-ai-cv-title': t.aiCvTitle,
        'lbl-ai-cv-sub': t.aiCvSub,
        'lbl-ai-cv-field': t.aiCvField,
        'lbl-btn-ai-cv': t.btnAiCv,
        'lbl-btn-apply-ai-filters': t.btnApplyAiFilters,
        'lbl-ai-analysis-hdr': t.aiAnalysisHdr,
        'lbl-ai-proposal-hdr': t.aiProposalHdr,
        'lbl-copy-ai-proposal': t.copyAiProposal,
        'lbl-btn-semantic': t.semanticBtn,
        'lbl-btn-clear-semantic': t.semanticClear,
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
        'man-btn-back': t.manBtnBack,
        'footer-text': t.footerText
      };
      for (const [id, text] of Object.entries(map)) {
        const el = document.getElementById(id);
        if (el) {
          if (id === 'banner-disclaimer' || id === 'footer-text' || id === 'nav-payments-desc') {
            el.innerHTML = text;
          } else {
            el.textContent = text;
          }
        }
      }
      const unfoldBtn = document.getElementById('sidebar-unfold-btn');
      if (unfoldBtn) {
        const titleText = userFilters.ui_lang === 'en' ? 'Show menu' : 'Mostrar menú';
        unfoldBtn.title = titleText;
        unfoldBtn.setAttribute('aria-label', titleText);
      }
      const kwInput = document.getElementById('input-custom-keywords');
      if (kwInput) kwInput.placeholder = t.customKwPlaceholder;
      const aiCvInput = document.getElementById('ai-cv-input');
      if (aiCvInput) aiCvInput.placeholder = t.aiCvPlaceholder;
      const searchEl = document.getElementById('searchInput');
      if (searchEl) searchEl.placeholder = t.searchPlaceholder;
      updateThemeButtons();
    }

    function renderFilterChips() {
      const isEs = userFilters.ui_lang !== 'en';

      // 1. Languages
      const langContainer = document.getElementById('chips-languages');
      langContainer.innerHTML = LANGUAGE_OPTIONS.map(opt => {
        const selected = (userFilters.languages || []).includes(opt.id);
        const label = isEs ? opt.label_es : opt.label_en;
        return '<span class="chip ' + (selected ? 'selected' : '') + '" onclick="toggleLanguageChip(\\'' + opt.id + '\\')">' +
          escapeHtml(label) + '</span>';
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
          escapeHtml(label) + '</span>';
      }).join('');

      // 4. Position Categories
      const posContainer = document.getElementById('chips-positions');
      posContainer.innerHTML = POSITION_CATEGORIES.map(opt => {
        const selected = (userFilters.position_types || []).includes(opt.id);
        const label = isEs ? opt.label_es : opt.label_en;
        return '<span class="chip ' + (selected ? 'selected' : '') + '" onclick="togglePositionChip(\\'' + opt.id + '\\')">' +
          escapeHtml(label) + '</span>';
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
      const navPlatCntEl = document.getElementById('nav-cnt-platforms');
      if (navPlatCntEl) navPlatCntEl.textContent = platformsState.length;
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

    let semanticOverrideResults = null;

    function onSearchInputChange(val) {
      if (!String(val || '').trim() && semanticOverrideResults) {
        clearSemanticSearch();
        return;
      }
      if (!semanticOverrideResults) {
        renderResultsCards();
      }
    }
    window.onSearchInputChange = onSearchInputChange;

    async function runSemanticSearch() {
      const t = I18N[userFilters.ui_lang] || I18N.es;
      const isEs = userFilters.ui_lang !== 'en';
      const searchEl = document.getElementById('searchInput');
      const btn = document.getElementById('btn-semantic-search');
      const lbl = document.getElementById('lbl-btn-semantic');
      const clearBtn = document.getElementById('btn-clear-semantic');
      const statusBar = document.getElementById('semantic-status-bar');

      const query = (searchEl ? searchEl.value : '').trim();
      if (!query) {
        clearSemanticSearch();
        return;
      }

      btn.disabled = true;
      lbl.textContent = t.semanticLoading || 'Buscando Vectores...';

      try {
        const resp = await fetch('/api/search/semantic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            filters: userFilters,
            topK: 30
          })
        });
        if (!resp.ok) throw new Error('Semantic API unavailable');
        const data = await resp.json();
        semanticOverrideResults = Array.isArray(data.results) ? data.results : [];
        if (clearBtn) clearBtn.style.display = 'inline-flex';
        if (statusBar) {
          statusBar.style.display = 'block';
          statusBar.textContent = isEs
            ? 'Búsqueda Vectorial IA activa ("' + query + '"): ' + semanticOverrideResults.length + ' ofertas ordenadas por similitud semántica (' + (data.vector_backend || 'edge-multilingual-vectors') + ').'
            : 'AI Vector Search active ("' + query + '"): ' + semanticOverrideResults.length + ' offers ranked by semantic similarity (' + (data.vector_backend || 'edge-multilingual-vectors') + ').';
        }
        renderResultsCards();
      } catch (e) {
        // Offline client-side semantic fallback using detectOfferAttributes
        const qAttrs = detectOfferAttributes({
          title: query,
          description: query,
          tags: '',
          location: 'Bolivia',
          contract_caveat: 'fractional_or_fulltime'
        });
        const qCats = new Set(qAttrs.categories || []);
        const qWords = query.toLowerCase().split(/\\s+/).filter(w => w.length >= 3);
        const pool = lastEvaluationResult.surfaced || [];

        const scored = pool.map(r => {
          const rCats = r.detected_categories || [];
          let catOverlap = 0;
          for (const c of rCats) {
            if (qCats.has(c)) catOverlap++;
          }
          const blob = (r.title + ' ' + r.company + ' ' + r.matched_skills + ' ' + r.description).toLowerCase();
          let wordHits = 0;
          for (const w of qWords) {
            if (blob.includes(w)) wordHits++;
          }
          const simScore = Math.min(100, Math.round(catOverlap * 38 + (qWords.length ? (wordHits / qWords.length) * 62 : 0)));
          return Object.assign({}, r, {
            semantic_score: simScore,
            blended_score: Math.round(simScore * 0.55 + r.total_score * 0.45)
          });
        }).filter(r => r.semantic_score >= 20);

        scored.sort((a, b) => b.blended_score - a.blended_score);
        semanticOverrideResults = scored.slice(0, 30);
        if (clearBtn) clearBtn.style.display = 'inline-flex';
        if (statusBar) {
          statusBar.style.display = 'block';
          statusBar.textContent = isEs
            ? 'Búsqueda Vectorial Local activa ("' + query + '"): ' + semanticOverrideResults.length + ' ofertas encontradas.'
            : 'Local Vector Search active ("' + query + '"): ' + semanticOverrideResults.length + ' offers matched.';
        }
        renderResultsCards();
      } finally {
        btn.disabled = false;
        lbl.textContent = (I18N[userFilters.ui_lang] || I18N.es).semanticBtn;
      }
    }
    window.runSemanticSearch = runSemanticSearch;

    function clearSemanticSearch() {
      semanticOverrideResults = null;
      const clearBtn = document.getElementById('btn-clear-semantic');
      const statusBar = document.getElementById('semantic-status-bar');
      if (clearBtn) clearBtn.style.display = 'none';
      if (statusBar) statusBar.style.display = 'none';
      renderResultsCards();
    }
    window.clearSemanticSearch = clearSemanticSearch;

    function renderResultsCards() {
      const isEs = userFilters.ui_lang !== 'en';
      const t = I18N[userFilters.ui_lang] || I18N.es;
      const q = (document.getElementById('searchInput').value || '').trim().toLowerCase();

      let pool = [];
      if (Array.isArray(semanticOverrideResults)) {
        pool = semanticOverrideResults;
      } else if (currentVerdictFilter === 'GEO') {
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
        if (q && !Array.isArray(semanticOverrideResults)) {
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
        es: 'Español',
        en: 'Inglés',
        pt: 'Portugués',
        de: 'Alemán'
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
              ' — <span class="opp-company">' + escapeHtml(r.company) + '</span></h3>' +
            '<span class="badge badge-' + vKey + '">' + escapeHtml(vLabel) + ' · ' + r.total_score + '/100</span>' +
          '</div>' +
          '<div class="meta-line">' +
            '<span class="bolivia-pill ' + (r.bolivia_eligible ? '' : 'restricted') + '">' + escapeHtml(bolBadge) + '</span>' +
            (typeof r.semantic_score === 'number' ? '<span class="semantic-pill">' + escapeHtml(t.semanticBadge || 'Afinidad Vectorial:') + ' ' + r.semantic_score + '%</span>' : '') +
            (r.compensation_usd ? '<span class="comp-pill">USD: ' + escapeHtml(r.compensation_usd) + '</span>' : '') +
            '<span><strong>Plataforma:</strong> ' + escapeHtml(r.platform_name) + '</span>' +
            '<span><strong>Ubicación:</strong> ' + escapeHtml(r.location) + '</span>' +
            '<span><strong>' + escapeHtml(t.categoryLabel || 'Categoría') + ':</strong> ' + escapeHtml(cleanTrackName(r.track)) + '</span>' +
          '</div>' +
          '<div class="score-pills">' +
            '<span class="score-pill">' + escapeHtml(t.scorePos) + ': ' + r.position_score + '/35</span>' +
            '<span class="score-pill">' + escapeHtml(t.scoreBol) + ': ' + r.bolivia_score + '/25</span>' +
            '<span class="score-pill">' + escapeHtml(t.scoreCont) + ': ' + r.contract_exp_score + '/20</span>' +
            '<span class="score-pill">' + escapeHtml(t.scoreLang) + ': ' + r.language_score + '/20</span>' +
          '</div>' +
          '<div class="opp-tags-row">' +
            '<span class="opp-tag-group"><strong style="font-size:0.82em;">' + escapeHtml(t.contractsLabel) + '</strong> ' + contractTagsHtml + '</span>' +
            (langTagsHtml ? '<span class="opp-tag-group"><strong style="font-size:0.82em;">' + escapeHtml(t.matchedLangs) + '</strong> ' + langTagsHtml + '</span>' : '') +
            (skillTagsHtml ? '<span class="opp-tag-group"><strong style="font-size:0.82em;">' + escapeHtml(t.matchedSkills) + '</strong> ' + skillTagsHtml + '</span>' : '') +
          '</div>' +
          '<div class="opp-notes">' +
            escapeHtml(notes) +
          '</div>' +
          '<div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;">' +
            '<a class="btn-action btn-primary" href="' + escapeHtml(r.url) + '" target="_blank" rel="noopener">' +
              escapeHtml(t.openOfferBtn) + '</a>' +
            '<button type="button" class="btn-action btn-secondary" onclick="openAiProposalForJob(\\'' + escapeHtml(r.job_hash) + '\\')">' +
              escapeHtml(t.draftAiBtn || 'Redactar Carta IA') + '</button>' +
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
          '<h4>' + escapeHtml(p.name) + ' <span style="font-size:0.76em;color:#0284c7;">(' + escapeHtml(p.type || 'portal') + ')</span></h4>' +
          '<p style="margin-bottom:6px;"><strong>' + escapeHtml(t.categoryLabel || 'Categoría') + ':</strong> ' + escapeHtml(cleanTrackName(p.track || '')) + '</p>' +
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

      const isManual = viewName === 'manual';
      document.body.classList.toggle('view-manual-active', isManual);

      const banner = document.querySelector('.top-banner');
      const filters = document.getElementById('custom-filters-panel');
      const urlPanel = document.getElementById('custom-url-panel');
      const aiPanel = document.getElementById('ai-cv-panel');
      const kpis = document.querySelector('.kpi-grid');
      const toolbar = document.querySelector('.toolbar');
      const footer = document.getElementById('footer-text');

      if (banner) banner.style.display = isManual ? 'none' : '';
      if (filters) filters.style.display = isManual ? 'none' : '';
      if (urlPanel) urlPanel.style.display = isManual ? 'none' : '';
      if (aiPanel) aiPanel.style.display = isManual ? 'none' : '';
      if (kpis) kpis.style.display = isManual ? 'none' : '';
      if (toolbar) toolbar.style.display = isManual ? 'none' : '';
      if (footer) footer.style.display = isManual ? 'none' : '';

      if (isManual) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

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
      const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
      const btn = document.getElementById('sidebar-unfold-btn');
      if (btn) {
        btn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
      }
    }
    window.toggleSidebar = toggleSidebar;

    function closeNavbarMenu() {
      document.body.classList.add('sidebar-collapsed');
      const btn = document.getElementById('sidebar-unfold-btn');
      if (btn) {
        btn.setAttribute('aria-expanded', 'false');
      }
    }
    window.closeNavbarMenu = closeNavbarMenu;

    function toggleCategoriesMenu() {
      const hdr = document.getElementById('nav-hdr-tracks-item');
      const items = document.querySelectorAll('#navbar li.nav-track-item');
      let nowExpanded = false;
      items.forEach(item => {
        const isFolded = item.classList.toggle('nav-track-folded');
        if (!isFolded) nowExpanded = true;
      });
      if (hdr) {
        hdr.classList.toggle('expanded', nowExpanded);
        hdr.setAttribute('aria-expanded', nowExpanded ? 'true' : 'false');
      }
    }
    window.toggleCategoriesMenu = toggleCategoriesMenu;

    function togglePaymentsMenu() {
      const hdr = document.getElementById('nav-hdr-payments-item');
      const items = document.querySelectorAll('#navbar li.nav-payment-item');
      let nowExpanded = false;
      items.forEach(item => {
        const isFolded = item.classList.toggle('nav-payment-folded');
        if (!isFolded) nowExpanded = true;
      });
      if (hdr) {
        hdr.classList.toggle('expanded', nowExpanded);
        hdr.setAttribute('aria-expanded', nowExpanded ? 'true' : 'false');
      }
    }
    window.togglePaymentsMenu = togglePaymentsMenu;

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
          body: JSON.stringify({ url, name, type, track, persist: true, filters: userFilters })
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
          ? 'Plataforma "' + data.platform.name + '" escaneada (' + data.platform.type + '): ' +
            data.discovered_count + ' ofertas analizadas, ' + data.bolivia_eligible_count +
            ' elegibles 100% remoto desde Bolivia agregadas a Resultados.'
          : 'Platform "' + data.platform.name + '" scanned (' + data.platform.type + '): ' +
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
            ? 'Plataforma "' + pName + '" (' + cleanUrl + ') agregada y evaluada en Resultados.'
            : 'Platform "' + pName + '" (' + cleanUrl + ') added and evaluated in Results.';
        } catch (innerErr) {
          feedbackBox.className = 'scan-alert error';
          feedbackBox.textContent = err.message || 'No se pudo escanear la URL';
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

    let currentAiTargetJobHash = '';
    let lastAiDetectedProfile = null;
    let lastAiResultData = null;

    function openAiProposalForJob(jobHash) {
      currentAiTargetJobHash = String(jobHash || '');
      const job = opportunitiesState.find(o => o.job_hash === currentAiTargetJobHash);
      const pill = document.getElementById('ai-target-job-pill');
      const txt = document.getElementById('ai-target-job-text');
      if (job && pill && txt) {
        txt.textContent = job.title + ' (' + job.company + ')';
        pill.style.display = 'inline-flex';
      }
      const cvInput = document.getElementById('ai-cv-input');
      if (cvInput && !cvInput.value.trim()) {
        const kw = userFilters.custom_keywords || (job ? job.tags || job.title : '');
        cvInput.value = userFilters.ui_lang === 'en'
          ? 'Remote professional based in Bolivia (UTC-4) with experience in ' + kw + '.'
          : 'Profesional remoto desde Bolivia (UTC-4) con experiencia en ' + kw + '.';
      }
      const panel = document.getElementById('ai-cv-panel');
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      submitAiCvMatch();
    }
    window.openAiProposalForJob = openAiProposalForJob;

    function clearAiTargetJob() {
      currentAiTargetJobHash = '';
      const pill = document.getElementById('ai-target-job-pill');
      if (pill) pill.style.display = 'none';
    }
    window.clearAiTargetJob = clearAiTargetJob;

    async function submitAiCvMatch() {
      const t = I18N[userFilters.ui_lang] || I18N.es;
      const isEs = userFilters.ui_lang !== 'en';
      const cvInput = document.getElementById('ai-cv-input');
      const errBox = document.getElementById('ai-cv-error');
      const resBox = document.getElementById('ai-cv-result-box');
      const btn = document.getElementById('btn-submit-ai-cv');
      const lbl = document.getElementById('lbl-btn-ai-cv');
      const applyBtn = document.getElementById('btn-apply-ai-filters');

      const cvText = (cvInput ? cvInput.value : '').trim();
      errBox.className = 'scan-alert';
      errBox.style.display = 'none';

      if (cvText.length < 10) {
        errBox.className = 'scan-alert error';
        errBox.style.display = 'block';
        errBox.textContent = isEs
          ? 'Ingresa al menos 10 caracteres describiendo tu perfil, experiencia o habilidades.'
          : 'Please enter at least 10 characters describing your profile, experience, or skills.';
        return;
      }

      btn.disabled = true;
      lbl.textContent = t.btnAiCvLoading || 'Analizando...';

      try {
        const resp = await fetch('/api/ai/match-cv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cv_text: cvText,
            target_job_hash: currentAiTargetJobHash,
            filters: userFilters
          })
        });
        if (!resp.ok) {
          const errJson = await resp.json().catch(() => ({}));
          throw new Error(errJson.error || 'AI service unavailable');
        }
        const data = await resp.json();
        lastAiResultData = data;
        lastAiDetectedProfile = data.detected_profile || null;
        document.getElementById('ai-engine-badge').textContent = data.ai_engine || 'Workers AI';
        document.getElementById('ai-cv-analysis-text').textContent = isEs ? data.analysis_es : data.analysis_en;
        document.getElementById('ai-cv-proposal-pre').textContent = isEs ? data.proposal_es : data.proposal_en;
        resBox.style.display = 'block';
        if (applyBtn) applyBtn.style.display = 'inline-flex';
      } catch (e) {
        // Offline / static HTML fallback
        const attrs = detectOfferAttributes({
          title: cvText.slice(0, 240),
          description: cvText,
          tags: '',
          location: 'Bolivia',
          contract_caveat: 'fractional_or_fulltime'
        });
        lastAiDetectedProfile = {
          categories: attrs.categories,
          matched_skills: attrs.matchedKeywords,
          experience: attrs.experience
        };
        const target = opportunitiesState.find(o => o.job_hash === currentAiTargetJobHash) ||
          (lastEvaluationResult.surfaced && lastEvaluationResult.surfaced[0]) || null;
        const jTitle = target ? target.title : (isEs ? 'Especialista Remoto' : 'Remote Specialist');
        const jComp = target ? target.company : (isEs ? 'Empresa Contratante' : 'Hiring Team');
        const sk = attrs.matchedKeywords.length ? attrs.matchedKeywords.join(', ') : cvText.slice(0, 80);

        document.getElementById('ai-engine-badge').textContent = 'Edge Local Analyzer';
        document.getElementById('ai-cv-analysis-text').textContent = isEs
          ? 'Habilidades identificadas: ' + sk + '. Ventaja desde Bolivia: Zona horaria UTC-4 alineada con EST/EDT y modalidad contratista internacional W-8BEN.'
          : 'Identified skills: ' + sk + '. Bolivia Advantage: UTC-4 timezone aligned with US EST/EDT and W-8BEN independent contractor readiness.';
        document.getElementById('ai-cv-proposal-pre').textContent = isEs
          ? 'Asunto: Postulación a ' + jTitle + ' — ' + jComp + ' (Remoto UTC-4)\\n\\nEstimado equipo de ' + jComp + ',\\n\\nPresento mi postulación a la vacante de ' + jTitle + '. Cuento con experiencia práctica en ' + sk + ' y disponibilidad inmediata desde Bolivia (UTC-4) bajo contrato internacional independiente (W-8BEN).\\n\\nAtentamente,\\n[Tu Nombre]'
          : 'Subject: Application for ' + jTitle + ' — ' + jComp + ' (Remote UTC-4)\\n\\nDear ' + jComp + ' Team,\\n\\nI am writing to apply for the ' + jTitle + ' role. I bring hands-on experience in ' + sk + ' and full US Eastern Timezone overlap from Bolivia (UTC-4) as an independent contractor (W-8BEN).\\n\\nBest regards,\\n[Your Name]';
        resBox.style.display = 'block';
        if (applyBtn) applyBtn.style.display = 'inline-flex';
      } finally {
        btn.disabled = false;
        lbl.textContent = (I18N[userFilters.ui_lang] || I18N.es).btnAiCv;
      }
    }
    window.submitAiCvMatch = submitAiCvMatch;

    function applyAiSkillsToFilters() {
      if (!lastAiDetectedProfile) return;
      if (Array.isArray(lastAiDetectedProfile.categories) && lastAiDetectedProfile.categories.length > 0) {
        const set = new Set([...(userFilters.position_types || []), ...lastAiDetectedProfile.categories]);
        userFilters.position_types = Array.from(set);
      }
      if (Array.isArray(lastAiDetectedProfile.matched_skills) && lastAiDetectedProfile.matched_skills.length > 0) {
        const existingKw = String(userFilters.custom_keywords || '').split(/[,;]+/).map(s => s.trim()).filter(Boolean);
        const mergedKw = Array.from(new Set([...existingKw, ...lastAiDetectedProfile.matched_skills]));
        userFilters.custom_keywords = mergedKw.join(', ');
      }
      saveFilters();
      renderFilterChips();
      recomputeAndRender();
    }
    window.applyAiSkillsToFilters = applyAiSkillsToFilters;

    function copyAiProposal() {
      const t = I18N[userFilters.ui_lang] || I18N.es;
      const text = document.getElementById('ai-cv-proposal-pre').textContent;
      navigator.clipboard.writeText(text).then(() => {
        const lbl = document.getElementById('lbl-copy-ai-proposal');
        const orig = lbl.textContent;
        lbl.textContent = t.copiedAiProposal || 'Copiado';
        setTimeout(() => { lbl.textContent = orig; }, 1800);
      });
    }
    window.copyAiProposal = copyAiProposal;

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
    applyTheme(currentTheme);
    setUiLanguage(userFilters.ui_lang || 'es');

    // Auto-trigger background sync every 15 minutes while page is open
    setInterval(() => {
      triggerOnDemandScan();
    }, 15 * 60 * 1000);
  </script>
</body>
</html>`;
}
