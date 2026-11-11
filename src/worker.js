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
import {
  scanCustomPlatformUrl,
  runIngestionScan,
  stripHtml,
  computeJobHash,
  normalizeJobKey
} from './scanner.js';
import { renderAppHtml } from './ui.js';
import { FAVICON_SVG } from './favicon.js';
import { buildSeedExportPayload, persistCustomPlatformsToDisk } from './seed_sync.js';
import {
  buildDeterministicSummaries,
  enrichOpportunityWithAI,
  enrichBatchWithAI,
  matchCvAndGenerateProposal
} from './ai_enricher.js';
import {
  semanticSearchOpportunities,
  indexOpportunitiesInVectorStore,
  deduplicateSemantically
} from './vector_store.js';
import { handleMcpRequest } from './mcp.js';
import { checkBoliviaRemoteEligibility } from './evaluator.js';

const CACHE_KEY_URL = 'https://bolivia-remote-scout.internal/state-v5.8';
const EMOJI_STRIP_RE = /[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]/g;

let MEMORY_STATE = null;

function cleanOpportunityFields(o) {
  let title = stripHtml(o.title || '').replace(EMOJI_STRIP_RE, '').trim();
  let company = stripHtml(o.company || o.platform_name || '').replace(EMOJI_STRIP_RE, '').trim();
  if (/\s+at\s+([A-Z0-9][A-Za-z0-9\s.&'-]{1,38})$/.test(title) && (company === o.platform_name || company.includes('Feed'))) {
    const m = title.match(/^(.*?)\s+at\s+([A-Z0-9][A-Za-z0-9\s.&'-]{1,38})$/);
    if (m && m[1].length >= 4) {
      title = m[1].trim();
      company = m[2].trim();
    }
  }
  company = company.replace(/\s+(?:RSS Feed|Remote Jobs Feed|Curated Remote Feed|Feed|API)$/i, '').trim() || company;
  const description = stripHtml(o.description || '').replace(EMOJI_STRIP_RE, '').trim();
  const url = String(o.url || '').trim();
  let published_at = String(o.published_at || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(published_at)) {
    const d = new Date(published_at);
    published_at = !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : String(o.discovered_at || new Date().toISOString()).slice(0, 10);
  }
  const job_hash = computeJobHash(title, company, url);
  const cleaned = {
    ...o,
    job_hash,
    title,
    company,
    description,
    url,
    published_at
  };
  const det = buildDeterministicSummaries(cleaned);
  return {
    ...cleaned,
    compensation_usd: cleaned.compensation_usd || det.compensation_usd,
    ai_summary_es: cleaned.ai_summary_es || det.ai_summary_es,
    ai_summary_en: cleaned.ai_summary_en || det.ai_summary_en,
    ai_verified: Number(cleaned.ai_verified || 0)
  };
}

async function ensureD1Tables(db) {
  if (!db || typeof db.prepare !== 'function') return;
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS opportunities (
      job_hash TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company TEXT,
      platform_id TEXT,
      platform_name TEXT,
      track TEXT,
      url TEXT,
      location TEXT,
      contract_caveat TEXT,
      tags TEXT,
      description TEXT,
      published_at TEXT,
      discovered_at TEXT,
      bolivia_eligible INTEGER DEFAULT 1,
      compensation_usd TEXT DEFAULT '',
      ai_summary_es TEXT DEFAULT '',
      ai_summary_en TEXT DEFAULT '',
      ai_verified INTEGER DEFAULT 0
    )
  `).run();
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS custom_platforms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      track TEXT DEFAULT 'Custom',
      url TEXT NOT NULL,
      rss_url TEXT DEFAULT '',
      contract_caveat TEXT DEFAULT 'fractional_or_fulltime',
      bolivia_avenue TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT
    )
  `).run();
}

function normalizeAndMergeState(rawState) {
  const existingPlatIds = new Set((rawState.platforms || []).map(p => p.id));
  const mergedPlatforms = [...(rawState.platforms || [])];
  for (const p of INITIAL_PLATFORMS) {
    if (!existingPlatIds.has(p.id)) {
      existingPlatIds.add(p.id);
      mergedPlatforms.push(p);
    }
  }

  const existingHashes = new Set();
  const existingKeys = new Set();
  const existingUrls = new Set();
  const mergedOpportunities = [];

  const allCandidates = [...(rawState.opportunities || []), ...INITIAL_OPPORTUNITIES];
  for (const rawOpp of allCandidates) {
    if (!rawOpp) continue;
    const opp = cleanOpportunityFields(rawOpp);
    if (!opp.title) continue;
    const key = normalizeJobKey(opp.title, opp.company);
    const normUrl = opp.url.toLowerCase().replace(/\/+$/, '');
    const isGenericUrl = /^https?:\/\/[^/]+\/?(?:jobs\/?|careers\/?|work\/?|remote\/?|apply\/?)?$/i.test(normUrl);

    if (existingHashes.has(opp.job_hash) || existingKeys.has(key) || (!isGenericUrl && normUrl && existingUrls.has(normUrl))) {
      continue;
    }
    existingHashes.add(opp.job_hash);
    existingKeys.add(key);
    if (!isGenericUrl && normUrl) {
      existingUrls.add(normUrl);
    }
    mergedOpportunities.push(opp);
  }

  return {
    opportunities: mergedOpportunities,
    platforms: mergedPlatforms,
    lastScanAt: rawState.lastScanAt || new Date().toISOString()
  };
}

async function loadState(env) {
  if (MEMORY_STATE && !(env && env.DB && !MEMORY_STATE._d1Loaded)) {
    return MEMORY_STATE;
  }

  // 0. Try Cloudflare D1 SQL Database if bound (`env.DB`)
  if (env && env.DB && typeof env.DB.prepare === 'function') {
    try {
      await ensureD1Tables(env.DB);
      const oppsRes = await env.DB.prepare('SELECT * FROM opportunities ORDER BY published_at DESC LIMIT 500').all();
      const platsRes = await env.DB.prepare('SELECT * FROM custom_platforms ORDER BY created_at DESC LIMIT 200').all();
      const dbOpps = Array.isArray(oppsRes && oppsRes.results) ? oppsRes.results : [];
      const dbPlats = Array.isArray(platsRes && platsRes.results) ? platsRes.results : [];
      if (dbOpps.length > 0 || dbPlats.length > 0) {
        MEMORY_STATE = normalizeAndMergeState({
          opportunities: [...dbOpps, ...(MEMORY_STATE ? MEMORY_STATE.opportunities : [])],
          platforms: [...dbPlats, ...(MEMORY_STATE ? MEMORY_STATE.platforms : [])],
          lastScanAt: new Date().toISOString()
        });
        MEMORY_STATE._d1Loaded = true;
        return MEMORY_STATE;
      }
    } catch {
      // Ignore D1 read error and fallback to KV / Cache / Seed
    }
  }

  // 1. Try Cloudflare KV if bound
  if (env && env.STORE && typeof env.STORE.get === 'function') {
    try {
      const kvRaw = await env.STORE.get('bolivia_remote_state_v5', 'json');
      if (kvRaw && Array.isArray(kvRaw.opportunities)) {
        MEMORY_STATE = normalizeAndMergeState(kvRaw);
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
          MEMORY_STATE = normalizeAndMergeState(cachedData);
          return MEMORY_STATE;
        }
      }
    } catch {
      // Ignore Cache read error
    }
  }

  // 3. Initialize from bundled seed data (137 public opportunities + 85 platforms)
  MEMORY_STATE = normalizeAndMergeState({
    opportunities: [...INITIAL_OPPORTUNITIES],
    platforms: [...INITIAL_PLATFORMS],
    lastScanAt: new Date().toISOString()
  });
  if (env && env.DB) {
    MEMORY_STATE._d1Loaded = true;
  }

  return MEMORY_STATE;
}

async function saveState(state, env) {
  MEMORY_STATE = normalizeAndMergeState(state);
  state.opportunities = MEMORY_STATE.opportunities;
  state.platforms = MEMORY_STATE.platforms;

  // Save to Cloudflare D1 if bound (`env.DB`)
  if (env && env.DB && typeof env.DB.prepare === 'function') {
    try {
      await ensureD1Tables(env.DB);
      const oppsToSave = MEMORY_STATE.opportunities.slice(0, 200);
      for (const o of oppsToSave) {
        const bol = checkBoliviaRemoteEligibility(o);
        await env.DB.prepare(
          `INSERT OR REPLACE INTO opportunities (
            job_hash, title, company, platform_id, platform_name, track, url,
            location, contract_caveat, tags, description, published_at, discovered_at,
            bolivia_eligible, compensation_usd, ai_summary_es, ai_summary_en, ai_verified
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          o.job_hash,
          o.title,
          o.company,
          o.platform_id || 'custom',
          o.platform_name || o.company,
          o.track || 'Custom',
          o.url,
          o.location || 'Remote',
          o.contract_caveat || 'fractional_or_fulltime',
          o.tags || '',
          o.description || '',
          o.published_at || '',
          o.discovered_at || new Date().toISOString(),
          bol.eligible ? 1 : 0,
          o.compensation_usd || '',
          o.ai_summary_es || '',
          o.ai_summary_en || '',
          Number(o.ai_verified || 0)
        ).run();
      }

      const seedIds = new Set(INITIAL_PLATFORMS.map(p => p.id));
      for (const p of MEMORY_STATE.platforms) {
        if (p && p.id && (!seedIds.has(p.id) || String(p.id).startsWith('custom_'))) {
          await env.DB.prepare(
            `INSERT OR REPLACE INTO custom_platforms (
              id, name, track, url, rss_url, contract_caveat, bolivia_avenue, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            p.id,
            p.name || p.id,
            p.track || 'Custom',
            p.url || '',
            p.rss_url || '',
            p.contract_caveat || 'fractional_or_fulltime',
            p.bolivia_avenue || '',
            p.notes || '',
            new Date().toISOString()
          ).run();
        }
      }
      MEMORY_STATE._d1Loaded = true;
    } catch {
      // Ignore D1 write error
    }
  }

  // Save to KV if bound
  if (env && env.STORE && typeof env.STORE.put === 'function') {
    try {
      await env.STORE.put('bolivia_remote_state_v5', JSON.stringify(MEMORY_STATE));
    } catch {
      // Ignore KV write error
    }
  }

  // Save to Cloudflare Edge Cache API
  if (typeof caches !== 'undefined' && caches.default) {
    try {
      const resp = new Response(JSON.stringify(MEMORY_STATE), {
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
      'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, X-MCP-API-Key, Mcp-Session-Id'
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
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        }
      });
    }

    // 1b. Favicon Endpoints (Earth with Bolivian flag colors)
    if (request.method === 'GET' && (path === '/favicon.ico' || path === '/favicon.svg' || path === '/favicon.png')) {
      return new Response(FAVICON_SVG, {
        status: 200,
        headers: {
          'Content-Type': path.endsWith('.ico') ? 'image/x-icon' : (path.endsWith('.png') ? 'image/png' : 'image/svg+xml'),
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }

    // 1c. SEO Sitemap XML & robots.txt Endpoints
    if (request.method === 'GET' && path === '/sitemap.xml') {
      const lastModDate = String(state.lastScanAt || new Date().toISOString()).slice(0, 10);
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://boliviaremote.work/</loc>
    <xhtml:link rel="alternate" hreflang="es-BO" href="https://boliviaremote.work/" />
    <xhtml:link rel="alternate" hreflang="es" href="https://boliviaremote.work/" />
    <xhtml:link rel="alternate" hreflang="en" href="https://boliviaremote.work/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://boliviaremote.work/" />
    <lastmod>${lastModDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://boliviaremote.work/api/results.md?lang=es</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://boliviaremote.work/api/results.md?lang=en</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
      return new Response(sitemapXml, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    if (request.method === 'GET' && path === '/robots.txt') {
      const robotsTxt = `User-agent: *
Allow: /
Disallow: /mcp
Disallow: /api/mcp
Disallow: /.well-known/mcp.json

Sitemap: https://boliviaremote.work/sitemap.xml
`;
      return new Response(robotsTxt, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }

    // 2. Get Current State API
    if (request.method === 'GET' && path === '/api/state') {
      return jsonResponse({
        version: '5.8.0',
        schedule: '*/15 * * * *',
        ai_enabled: Boolean(env && env.AI),
        d1_enabled: Boolean(env && env.DB),
        vectorize_enabled: Boolean(env && env.VECTORIZE),
        qdrant_enabled: Boolean(env && env.QDRANT_URL),
        mcp_endpoint: '/mcp',
        mcp_auth_enabled: !(env && String(env.MCP_PUBLIC_ACCESS).toLowerCase() === 'true'),
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
        const enrichedNew = await enrichBatchWithAI(scanRes.new_opportunities, env, 5);
        await indexOpportunitiesInVectorStore(enrichedNew, env, 10);
        state.opportunities = [...enrichedNew, ...state.opportunities];
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
        scanRes.opportunities = await enrichBatchWithAI(scanRes.opportunities, env, 4);
        await indexOpportunitiesInVectorStore(scanRes.opportunities, env, 10);

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

        let seedSyncInfo = null;
        if (body.persist === true && !scanRes.dead_lead) {
          const syncRes = await persistCustomPlatformsToDisk(state, ['.', 'z:/opt/scout-analyst']);
          seedSyncInfo = {
            persisted_to_disk: syncRes.persisted_to_disk,
            custom_platforms_count: syncRes.custom_platforms_count,
            total_platforms_count: syncRes.total_platforms_count
          };
        }

        return jsonResponse({
          ok: true,
          platform: scanRes.platform,
          dead_lead: scanRes.dead_lead,
          http_status: scanRes.http_status,
          verdict_counts: scanRes.verdict_counts,
          discovered_count: scanRes.discovered_count,
          bolivia_eligible_count: scanRes.bolivia_eligible_count,
          opportunities: scanRes.opportunities,
          evaluated_opportunities: scanRes.evaluated_opportunities,
          all_opportunities: state.opportunities,
          platforms: state.platforms,
          seed_sync: seedSyncInfo
        });
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message || 'Failed to scan URL' }, 400);
      }
    }

    // 7. Export / Sync Custom Platforms to src/seed_data.js & platforms_config.json
    if ((request.method === 'GET' || request.method === 'POST') && path === '/api/platforms/sync') {
      try {
        if (request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          if (Array.isArray(body.platforms)) {
            const existingIds = new Set(state.platforms.map(p => p.id));
            for (const p of body.platforms) {
              if (p && p.id && !existingIds.has(p.id)) {
                existingIds.add(p.id);
                state.platforms.unshift(p);
              }
            }
          }
          if (Array.isArray(body.opportunities)) {
            const existingHashes = new Set(state.opportunities.map(o => o.job_hash));
            for (const o of body.opportunities) {
              if (o && o.job_hash && !existingHashes.has(o.job_hash)) {
                existingHashes.add(o.job_hash);
                state.opportunities.unshift(o);
              }
            }
          }
          await saveState(state, env);
          const syncRes = await persistCustomPlatformsToDisk(state, ['.', 'z:/opt/scout-analyst']);
          return jsonResponse({
            ok: true,
            persisted_to_disk: syncRes.persisted_to_disk,
            written_files: syncRes.written_files,
            custom_platforms_count: syncRes.custom_platforms_count,
            newly_added_platforms_count: syncRes.newly_added_platforms_count,
            newly_added_opportunities_count: syncRes.newly_added_opportunities_count,
            total_platforms_count: syncRes.total_platforms_count,
            total_opportunities_count: syncRes.total_opportunities_count,
            custom_platforms: syncRes.custom_platforms
          });
        }

        const exportPayload = buildSeedExportPayload(state);
        return jsonResponse({
          ok: true,
          custom_platforms_count: exportPayload.custom_platforms_count,
          newly_added_platforms_count: exportPayload.newly_added_platforms_count,
          newly_added_opportunities_count: exportPayload.newly_added_opportunities_count,
          total_platforms_count: exportPayload.total_platforms_count,
          total_opportunities_count: exportPayload.total_opportunities_count,
          custom_platforms: exportPayload.custom_platforms,
          newly_added_platforms: exportPayload.newly_added_platforms,
          newly_added_opportunities: exportPayload.newly_added_opportunities
        });
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message || 'Sync failed' }, 500);
      }
    }

    // 8. Cloudflare Workers AI — CV / Profile Matcher & Tailored Cover Letter Generator
    if (request.method === 'POST' && path === '/api/ai/match-cv') {
      try {
        const body = await request.json().catch(() => ({}));
        const res = await matchCvAndGenerateProposal(body, state.opportunities, env);
        return jsonResponse(res);
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message || 'AI CV match failed' }, 400);
      }
    }

    // 9. Cloudflare Workers AI — On-Demand Opportunity Enrichment API
    if (request.method === 'POST' && path === '/api/ai/enrich') {
      try {
        const body = await request.json().catch(() => ({}));
        const targetHash = String(body.job_hash || '').trim();
        let enrichedCount = 0;
        const updatedItems = [];

        if (targetHash) {
          const idx = state.opportunities.findIndex(o => o.job_hash === targetHash);
          if (idx < 0) {
            return jsonResponse({ ok: false, error: 'Opportunity not found' }, 404);
          }
          state.opportunities[idx] = await enrichOpportunityWithAI(state.opportunities[idx], env);
          updatedItems.push(state.opportunities[idx]);
          enrichedCount = 1;
        } else {
          const limit = Math.min(Math.max(Number(body.max_items) || 5, 1), 15);
          for (let i = 0; i < Math.min(limit, state.opportunities.length); i++) {
            state.opportunities[i] = await enrichOpportunityWithAI(state.opportunities[i], env);
            updatedItems.push(state.opportunities[i]);
            enrichedCount++;
          }
        }

        await saveState(state, env);
        return jsonResponse({
          ok: true,
          ai_enabled: Boolean(env && env.AI),
          enriched_count: enrichedCount,
          opportunities: updatedItems
        });
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message || 'AI enrichment failed' }, 500);
      }
    }

    // 10. Vectorial Database — Multilingual Semantic Search API (Cloudflare Vectorize / Qdrant / Edge Vectors)
    if ((request.method === 'GET' || request.method === 'POST') && path === '/api/search/semantic') {
      try {
        let query = url.searchParams.get('q') || url.searchParams.get('query') || '';
        let filters = { ...DEFAULT_FILTERS };
        let topK = Number(url.searchParams.get('limit') || url.searchParams.get('topK') || 25);

        if (request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          query = body.query || body.q || query;
          if (body.filters) {
            filters = { ...DEFAULT_FILTERS, ...body.filters };
          }
          if (body.topK || body.limit) {
            topK = Number(body.topK || body.limit);
          }
        }

        const semRes = await semanticSearchOpportunities(query, state.opportunities, filters, env, { topK });
        return jsonResponse(semRes);
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message || 'Semantic search failed' }, 400);
      }
    }

    // 11. Vectorial Database — Index Opportunities & Semantic Deduplication API
    if (request.method === 'POST' && path === '/api/vectors/index') {
      try {
        const body = await request.json().catch(() => ({}));
        const maxItems = Math.min(Math.max(Number(body.max_items) || 25, 1), 150);
        let dedupRemoved = 0;

        if (body.deduplicate === true) {
          const dedupRes = deduplicateSemantically(state.opportunities, Number(body.threshold) || 0.92);
          state.opportunities = dedupRes.opportunities;
          dedupRemoved = dedupRes.duplicates_removed;
        }

        const idxRes = await indexOpportunitiesInVectorStore(state.opportunities, env, maxItems);
        await saveState(state, env);

        return jsonResponse({
          ok: true,
          indexed_count: idxRes.indexed_count,
          backends: idxRes.backends,
          duplicates_removed: dedupRemoved,
          total_opportunities: state.opportunities.length
        });
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message || 'Vector indexing failed' }, 500);
      }
    }

    // 12. Model Context Protocol (MCP) Server over Streamable HTTP (`/mcp`, `/api/mcp`, `/.well-known/mcp.json`)
    if (path === '/mcp' || path === '/api/mcp' || path === '/.well-known/mcp.json') {
      return handleMcpRequest(request, state, env, ctx, () => saveState(state, env));
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
        const enrichedNew = await enrichBatchWithAI(scanRes.new_opportunities, env, 5);
        await indexOpportunitiesInVectorStore(enrichedNew, env, 10);
        state.opportunities = [...enrichedNew, ...state.opportunities];
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
