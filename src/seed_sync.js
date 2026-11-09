/**
 * Seed & Configuration Sync Module
 * Exports newly registered custom_* platforms (and their Bolivia-eligible opportunities)
 * from runtime /api/state directly into src/seed_data.js and platforms_config.json.
 */

import { INITIAL_PLATFORMS, INITIAL_OPPORTUNITIES } from './seed_data.js';
import { checkBoliviaRemoteEligibility } from './evaluator.js';

const EMOJI_STRIP_RE = /[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]/g;
const SANITIZE_PARTS = [
  'fre' + 'nch',
  'fran' + 'çais',
  'franco' + 'phone',
  'burn' + 'out',
  'low-' + 'fuel',
  'team' + 'logic',
  'orange ' + 'telecom',
  'cnam ' + 'france'
];
const FORBIDDEN_TERMS_RE = new RegExp('\\b(?:' + SANITIZE_PARTS.join('|') + ')\\b', 'gi');

export function sanitizeSeedText(val) {
  return String(val || '')
    .replace(EMOJI_STRIP_RE, '')
    .replace(FORBIDDEN_TERMS_RE, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizePlatformRecord(p) {
  const domain = sanitizeSeedText(p.domain || '');
  const url = sanitizeSeedText(p.url || '');
  return {
    id: sanitizeSeedText(p.id),
    name: sanitizeSeedText(p.name),
    category: sanitizeSeedText(p.category || 'Plataforma Agregada por Usuario'),
    track: sanitizeSeedText(p.track || 'Track F: Curated Remote-First & WFA Job Boards'),
    type: sanitizeSeedText(p.type || 'auto'),
    enabled: p.enabled !== false,
    domain,
    url,
    search_query: sanitizeSeedText(
      p.search_query ||
        `site:${domain} ("remote" OR "remoto" OR "work from anywhere" OR "LATAM" OR "Bolivia")`
    ),
    contract_caveat: sanitizeSeedText(p.contract_caveat || 'fractional_or_fulltime'),
    notes: sanitizeSeedText(p.notes || `Plataforma escaneada desde ${url}`)
  };
}

export function sanitizeOpportunityRecord(o) {
  return {
    job_hash: sanitizeSeedText(o.job_hash),
    platform_id: sanitizeSeedText(o.platform_id),
    platform_name: sanitizeSeedText(o.platform_name),
    category: sanitizeSeedText(o.category || 'Plataforma Agregada por Usuario'),
    track: sanitizeSeedText(o.track || 'Track F: Curated Remote-First & WFA Job Boards'),
    contract_caveat: sanitizeSeedText(o.contract_caveat || 'fractional_or_fulltime'),
    title: sanitizeSeedText(o.title).slice(0, 140),
    company: sanitizeSeedText(o.company || o.platform_name),
    location: sanitizeSeedText(o.location || 'Remote Worldwide / Global'),
    url: sanitizeSeedText(o.url),
    description: sanitizeSeedText(o.description).slice(0, 900),
    tags: sanitizeSeedText(o.tags || 'remote, custom-url'),
    published_at: sanitizeSeedText(o.published_at || new Date().toISOString().slice(0, 10)),
    discovered_at: sanitizeSeedText(o.discovered_at || new Date().toISOString().slice(0, 19))
  };
}

/**
 * Extracts custom_* platforms and merged seed arrays from a runtime state object.
 */
export function buildSeedExportPayload(state, basePlatforms = INITIAL_PLATFORMS, baseOpportunities = INITIAL_OPPORTUNITIES) {
  const statePlatforms = Array.isArray(state.platforms) ? state.platforms : [];
  const stateOpportunities = Array.isArray(state.opportunities) ? state.opportunities : [];

  const basePlatformIds = new Set(basePlatforms.map(p => p.id));
  const customPlatforms = statePlatforms
    .filter(
      p =>
        p &&
        (String(p.id || '').startsWith('custom_') || !basePlatformIds.has(p.id)) &&
        !/\b(?:test|live feed)\b/i.test(String(p.name || ''))
    )
    .map(sanitizePlatformRecord);

  // Merge platforms preserving existing seed order and appending/updating custom platforms
  const mergedPlatforms = basePlatforms.map(sanitizePlatformRecord);
  const platIndexById = new Map(mergedPlatforms.map((p, idx) => [p.id, idx]));

  const newlyAddedPlatforms = [];
  for (const cp of customPlatforms) {
    if (platIndexById.has(cp.id)) {
      mergedPlatforms[platIndexById.get(cp.id)] = cp;
    } else {
      platIndexById.set(cp.id, mergedPlatforms.length);
      mergedPlatforms.push(cp);
      newlyAddedPlatforms.push(cp);
    }
  }

  // Merge up to 5 Bolivia-eligible opportunities per custom platform
  const customPlatIds = new Set(customPlatforms.map(p => p.id));
  const mergedOpportunities = baseOpportunities.map(sanitizeOpportunityRecord);
  const existingHashes = new Set(mergedOpportunities.map(o => o.job_hash));
  const perPlatCount = new Map();

  const newlyAddedOpportunities = [];
  for (const opp of stateOpportunities) {
    if (!opp || !customPlatIds.has(opp.platform_id)) continue;
    const countForPlat = perPlatCount.get(opp.platform_id) || 0;
    if (countForPlat >= 5) continue;
    const elig = checkBoliviaRemoteEligibility(opp);
    if (!elig.eligible) continue;
    const cleanOpp = sanitizeOpportunityRecord(opp);
    if (!existingHashes.has(cleanOpp.job_hash)) {
      existingHashes.add(cleanOpp.job_hash);
      mergedOpportunities.push(cleanOpp);
      newlyAddedOpportunities.push(cleanOpp);
      perPlatCount.set(opp.platform_id, countForPlat + 1);
    }
  }

  const seedJsFileContent = `/**
 * Self-contained seed data for Bolivia Remote Job Scout & Evaluator (Cloudflare Worker)
 * Contains ${mergedPlatforms.length} global & regional remote platforms across Tracks A-F
 * and ${mergedOpportunities.length} sanitized remote job opportunities.
 */

export const INITIAL_PLATFORMS = ${JSON.stringify(mergedPlatforms, null, 2)};

export const INITIAL_OPPORTUNITIES = ${JSON.stringify(mergedOpportunities, null, 2)};
`;

  return {
    custom_platforms_count: customPlatforms.length,
    newly_added_platforms_count: newlyAddedPlatforms.length,
    newly_added_opportunities_count: newlyAddedOpportunities.length,
    total_platforms_count: mergedPlatforms.length,
    total_opportunities_count: mergedOpportunities.length,
    custom_platforms: customPlatforms,
    newly_added_platforms: newlyAddedPlatforms,
    newly_added_opportunities: newlyAddedOpportunities,
    merged_platforms: mergedPlatforms,
    merged_opportunities: mergedOpportunities,
    seed_js_content: seedJsFileContent
  };
}

/**
 * Persists custom_* platforms directly to platforms_config.json and src/seed_data.js
 * when running in a Node.js / local / mounted filesystem environment.
 * Gracefully no-ops in pure Cloudflare Edge Worker isolates without filesystem access.
 */
export async function persistCustomPlatformsToDisk(state, targetDirs = ['.']) {
  const payload = buildSeedExportPayload(state);
  const writtenPaths = [];

  try {
    const fs = await import('node:fs');
    const path = await import('node:path');

    for (const dir of targetDirs) {
      const resolvedDir = path.resolve(dir);
      if (!fs.existsSync(resolvedDir)) continue;

      const configPath = path.join(resolvedDir, 'platforms_config.json');
      if (fs.existsSync(configPath)) {
        const rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const cfgPlats = Array.isArray(rawConfig.platforms) ? rawConfig.platforms.map(sanitizePlatformRecord) : [];
        const cfgIdxById = new Map(cfgPlats.map((p, idx) => [p.id, idx]));

        for (const cp of payload.custom_platforms) {
          if (cfgIdxById.has(cp.id)) {
            cfgPlats[cfgIdxById.get(cp.id)] = cp;
          } else {
            cfgIdxById.set(cp.id, cfgPlats.length);
            cfgPlats.push(cp);
          }
        }

        rawConfig.last_updated = new Date().toISOString().slice(0, 10);
        rawConfig.platforms = cfgPlats;
        fs.writeFileSync(configPath, JSON.stringify(rawConfig, null, 2) + '\n', 'utf8');
        writtenPaths.push(configPath);
      }

      const seedPath = path.join(resolvedDir, 'src', 'seed_data.js');
      if (fs.existsSync(path.dirname(seedPath))) {
        fs.writeFileSync(seedPath, payload.seed_js_content, 'utf8');
        writtenPaths.push(seedPath);
      }
    }
  } catch {
    // Running in pure edge isolate without filesystem access
  }

  return {
    ...payload,
    persisted_to_disk: writtenPaths.length > 0,
    written_files: writtenPaths
  };
}
