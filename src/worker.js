/**
 * Cloudflare Worker Entrypoint — Bolivia 100% Remote Job Scout & Evaluator
 * Self-contained public web application & API with:
 *   - Spanish (Bolivia) first UI + English switcher
 *   - Customizable user filters (Languages, Position Type, Experience, Contract Type)
 *   - Mandatory 100% Remote from Bolivia eligibility filter
 *   - Custom Platform URL live scanner & evaluator
 *   - On-the-fly Results ("Resultados") generation
 *   - On-demand execution + Scheduled Cron Trigger every 15 minutes
 */

import { INITIAL_PLATFORMS, INITIAL_OPPORTUNITIES } from './seed_data.js';
import {
  DEFAULT_FILTERS,
  evaluateAllOpportunities,
  generateResultsMarkdown
} from './evaluator.js';
import { scanCustomPlatformUrl, runIngestionScan } from './scanner.js';
import { renderAppHtml } from './ui.js';

const CACHE_KEY_URL = 'https://bolivia-remote-scout.internal/state-v5';

let MEMORY_STATE = null;

async function loadState(env) {
  if (MEMORY_STATE) {
    return MEMORY_STATE;
  }

  // 1. Try Cloudflare KV if bound
  if (env && env.STORE && typeof env.STORE.get === 'function') {
    try {
      const kvRaw = await env.STORE.get('bolivia_remote_state_v5', 'json');
      if (kvRaw && Array.isArray(kvRaw.opportunities)) {
        MEMORY_STATE = kvRaw;
        return MEMORY_STATE;
      }
    } catch {
      // Ignore KV read error
    }
  }

  // 2. Try Cloudflare Edge Cache API (available on all Workers with zero config)
  if (typeof caches !== 'undefined' && caches.default) {
    try {
      const cachedResp = await caches.default.match(CACHE_KEY_URL);
      if (cachedResp) {
        const cachedData = await cachedResp.json();
        if (cachedData && Array.isArray(cachedData.opportunities)) {
          MEMORY_STATE = cachedData;
          return MEMORY_STATE;
        }
      }
    } catch {
      // Ignore Cache read error
    }
  }

  // 3. Initialize from bundled seed data (121 public opportunities + 73 platforms)
  MEMORY_STATE = {
    opportunities: [...INITIAL_OPPORTUNITIES],
    platforms: [...INITIAL_PLATFORMS],
    lastScanAt: new Date().toISOString()
  };

  return MEMORY_STATE;
}

async function saveState(state, env) {
  MEMORY_STATE = state;

  // Save to KV if bound
  if (env && env.STORE && typeof env.STORE.put === 'function') {
    try {
      await env.STORE.put('bolivia_remote_state_v5', JSON.stringify(state));
    } catch {
      // Ignore KV write error
    }
  }

  // Save to Cloudflare Edge Cache API
  if (typeof caches !== 'undefined' && caches.default) {
    try {
      const resp = new Response(JSON.stringify(state), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400'
        }
      });
      await caches.default.put(CACHE_KEY_URL, resp);
    } catch {
      // Ignore Cache write error
    }
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return jsonResponse({ ok: true });
    }

    const state = await loadState(env);

    // 1. Main Web Interface (Spanish Bolivia first, switchable to English)
    if (request.method === 'GET' && (path === '/' || path === '/index.html')) {
      const html = renderAppHtml(state);
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // 2. Get Current State API
    if (request.method === 'GET' && path === '/api/state') {
      return jsonResponse({
        version: '5.0.0',
        schedule: '*/15 * * * *',
        lastScanAt: state.lastScanAt,
        platforms_count: state.platforms.length,
        opportunities_count: state.opportunities.length,
        platforms: state.platforms,
        opportunities: state.opportunities
      });
    }

    // 3. On-the-Fly Results Markdown Endpoint
    if (request.method === 'GET' && (path === '/api/results.md' || path === '/results.md')) {
      const lang = url.searchParams.get('lang') || 'es';
      const customKeywords = url.searchParams.get('keywords') || '';
      const languages = url.searchParams.get('languages')
        ? url.searchParams.get('languages').split(',')
        : DEFAULT_FILTERS.languages;
      const positionTypes = url.searchParams.get('positions')
        ? url.searchParams.get('positions').split(',')
        : [];
      const contractTypes = url.searchParams.get('contracts')
        ? url.searchParams.get('contracts').split(',')
        : DEFAULT_FILTERS.contract_types;
      const experienceLevels = url.searchParams.get('experience')
        ? url.searchParams.get('experience').split(',')
        : ['all'];

      const filters = {
        ...DEFAULT_FILTERS,
        ui_lang: lang,
        languages,
        position_types: positionTypes,
        custom_keywords: customKeywords,
        contract_types: contractTypes,
        experience_levels: experienceLevels
      };

      const evalResult = evaluateAllOpportunities(state.opportunities, filters);
      const md = generateResultsMarkdown(
        evalResult,
        filters,
        lang,
        state.platforms.length,
        state.lastScanAt
      );

      return new Response(md, {
        status: 200,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
      });
    }

    // 4. Dynamic On-the-Fly Evaluation API
    if (request.method === 'POST' && path === '/api/evaluate') {
      const body = await request.json().catch(() => ({}));
      const filters = { ...DEFAULT_FILTERS, ...(body.filters || body) };
      const evalResult = evaluateAllOpportunities(state.opportunities, filters);
      const markdown = generateResultsMarkdown(
        evalResult,
        filters,
        filters.ui_lang || 'es',
        state.platforms.length,
        state.lastScanAt
      );
      return jsonResponse({
        ok: true,
        counts: {
          surfaced: evalResult.surfaced.length,
          apply: evalResult.apply.length,
          possible: evalResult.possible.length,
          skip: evalResult.skip.length,
          geo_excluded: evalResult.geo_excluded.length
        },
        results: evalResult.surfaced,
        markdown
      });
    }

    // 5. On-Demand Scan Trigger API
    if (request.method === 'POST' && path === '/api/scan') {
      const body = await request.json().catch(() => ({}));
      const existingHashes = new Set(state.opportunities.map(o => o.job_hash));
      const scanRes = await runIngestionScan(state.platforms, existingHashes, {
        track: body.track,
        platform: body.platform,
        maxFeeds: 8,
        maxDorkClusters: 2
      });

      if (scanRes.new_opportunities.length > 0) {
        state.opportunities = [...scanRes.new_opportunities, ...state.opportunities];
      }
      state.lastScanAt = scanRes.timestamp;
      if (ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(saveState(state, env));
      } else {
        await saveState(state, env);
      }

      return jsonResponse({
        ok: true,
        scanned_platforms: scanRes.scanned_platforms,
        new_count: scanRes.new_count,
        lastScanAt: state.lastScanAt,
        platforms: state.platforms,
        opportunities: state.opportunities
      });
    }

    // 6. Custom Platform URL Live Scanner & Evaluator API
    if (request.method === 'POST' && path === '/api/platforms/scan-url') {
      try {
        const body = await request.json();
        const scanRes = await scanCustomPlatformUrl(body, body.filters || DEFAULT_FILTERS);

        // Save or update platform in registry
        const existingIdx = state.platforms.findIndex(p => p.id === scanRes.platform.id);
        if (existingIdx >= 0) {
          state.platforms[existingIdx] = scanRes.platform;
        } else {
          state.platforms.unshift(scanRes.platform);
        }

        // Prepend newly discovered opportunities (deduplicated by job_hash)
        const existingHashes = new Set(state.opportunities.map(o => o.job_hash));
        for (const item of scanRes.opportunities) {
          if (!existingHashes.has(item.job_hash)) {
            existingHashes.add(item.job_hash);
            state.opportunities.unshift(item);
          }
        }

        state.lastScanAt = new Date().toISOString();
        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(saveState(state, env));
        } else {
          await saveState(state, env);
        }

        return jsonResponse({
          ok: true,
          platform: scanRes.platform,
          discovered_count: scanRes.discovered_count,
          bolivia_eligible_count: scanRes.bolivia_eligible_count,
          opportunities: scanRes.opportunities,
          evaluated_opportunities: scanRes.evaluated_opportunities,
          all_opportunities: state.opportunities,
          platforms: state.platforms
        });
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message || 'Failed to scan URL' }, 400);
      }
    }

    return jsonResponse({ error: 'Not Found' }, 404);
  },

  /**
   * Cloudflare Cron Trigger Handler — Runs automatically every 15 minutes
   */
  async scheduled(event, env, ctx) {
    const task = (async () => {
      const state = await loadState(env);
      const existingHashes = new Set(state.opportunities.map(o => o.job_hash));
      const scanRes = await runIngestionScan(state.platforms, existingHashes, {
        maxFeeds: 8,
        maxDorkClusters: 2
      });
      if (scanRes.new_opportunities.length > 0) {
        state.opportunities = [...scanRes.new_opportunities, ...state.opportunities];
      }
      state.lastScanAt = scanRes.timestamp;
      await saveState(state, env);
    })();

    if (ctx && typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(task);
    } else {
      await task;
    }
  }
};
