/**
 * Multi-Track & Custom Platform URL Scanner Engine for Cloudflare Worker
 * Zero external dependencies — uses native Web Fetch API and regex XML/HTML/JSON parsers
 * compatible with Cloudflare Workers runtime and Node.js 20+.
 */

import { checkBoliviaRemoteEligibility, evaluateOpportunity } from './evaluator.js';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const DEAD_DOMAINS = ['joinstellar.ai'];

export function stripHtml(raw) {
  if (!raw) return '';
  let text = String(raw).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  for (let pass = 0; pass < 2; pass++) {
    text = text
      .replace(/&nbsp;/gi, ' ')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&#(\d+);/g, (_, code) => {
        const n = Number(code);
        return n >= 32 && n <= 126 ? String.fromCharCode(n) : ' ';
      })
      .replace(/&amp;/gi, '&')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
  }
  return text
    .replace(/[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Canonical key for cross-platform and repost deduplication
 */
export function normalizeJobKey(title, company) {
  const normTitle = String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const normCompany = String(company || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return `${normTitle}|${normCompany}`;
}

/**
 * Simple deterministic FNV-1a + hex hash for deduplication (sync, works everywhere, identical to scout_agent.py)
 */
export function computeJobHash(title, company, url) {
  const normTitle = String(title || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normCompany = String(company || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normUrl = String(url || '').trim().toLowerCase().replace(/\/+$/, '');
  const norm = `${normTitle}|${normCompany}|${normUrl}`;
  let h1 = 0xdeadbeef ^ norm.length;
  let h2 = 0x41c6ce57 ^ norm.length;
  for (let i = 0; i < norm.length; i++) {
    const ch = norm.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  return `${hex1}${hex2}${hex3}`;
}

export function isDeadPlatform(url, title = '') {
  const combined = `${url || ''} ${title || ''}`.toLowerCase();
  return DEAD_DOMAINS.some(d => combined.includes(d));
}

export async function fetchWithTimeout(url, timeoutMs = 9500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json, application/xml, text/xml, text/html, */*',
        'Accept-Language': 'es-BO,es;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      redirect: 'follow',
      signal: controller.signal
    });
    const contentType = resp.headers.get('content-type') || '';
    const text = await resp.text();
    return { ok: resp.ok, status: resp.status, contentType, text, finalUrl: resp.url || url };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parses a JSON API response into normalized opportunity objects.
 */
export function parseJsonFeed(rawText, platform) {
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    return [];
  }

  let records = [];
  if (Array.isArray(data)) {
    records = data;
  } else if (data && typeof data === 'object') {
    const rootKey = platform.json_root_key;
    if (rootKey && Array.isArray(data[rootKey])) {
      records = data[rootKey];
    } else {
      for (const candidateKey of ['jobs', 'data', 'results', 'items', 'postings', 'opportunities', 'positions']) {
        if (Array.isArray(data[candidateKey])) {
          records = data[candidateKey];
          break;
        }
      }
    }
  }

  if (!Array.isArray(records)) return [];
  const fmap = platform.field_mapping || {};
  const todayIso = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString().slice(0, 19);
  const results = [];

  for (const row of records.slice(0, 60)) {
    if (!row || typeof row !== 'object') continue;
    const rawTitle =
      row[fmap.title] || row.title || row.position || row.jobTitle || row.name || row.role || '';
    const title = stripHtml(rawTitle);
    if (!title || title.length < 3) continue;

    const rawCompany =
      row[fmap.company] || row.company || row.company_name || row.companyName || row.organization || platform.name;
    const company = stripHtml(rawCompany) || platform.name;

    const rawDesc =
      row[fmap.description] || row.description || row.excerpt || row.jobExcerpt || row.summary || row.content || '';
    const description = stripHtml(rawDesc).slice(0, 1500);

    let jobUrl = String(
      row[fmap.url] || row.url || row.applicationLink || row.apply_url || row.jobUrl || row.link || platform.url
    ).trim();
    if (jobUrl.startsWith('/') && platform.domain) {
      jobUrl = `https://${platform.domain}${jobUrl}`;
    }

    let locVal =
      row[fmap.location] ||
      row.location ||
      row.candidate_required_location ||
      row.jobGeo ||
      row.locationRestrictions ||
      row.region ||
      'Remote Worldwide';
    if (Array.isArray(locVal)) {
      locVal = locVal.length > 0 ? locVal.join(', ') : 'Remote Worldwide';
    }

    let tagsVal = row[fmap.tags] || row.tags || row.categories || row.jobIndustry || row.category || '';
    if (Array.isArray(tagsVal)) {
      tagsVal = tagsVal.join(', ');
    }

    const pubRaw = String(
      row[fmap.published_at] || row.published_at || row.pubDate || row.publication_date || row.date || todayIso
    ).slice(0, 10);

    if (isDeadPlatform(jobUrl, title)) continue;

    results.push({
      job_hash: computeJobHash(title, company, jobUrl),
      platform_id: platform.id,
      platform_name: platform.name,
      category: platform.category || 'Category 6: Curated Remote-First Job Boards',
      track: platform.track || 'Track F: Curated Remote-First & WFA Job Boards',
      contract_caveat: platform.contract_caveat || 'fractional_or_fulltime',
      title,
      company,
      location: stripHtml(locVal) || 'Remote Worldwide',
      url: jobUrl,
      description,
      tags: stripHtml(tagsVal),
      published_at: pubRaw,
      discovered_at: nowIso
    });
  }

  return results;
}

/**
 * Parses an XML RSS or Atom feed into normalized opportunity objects.
 */
export function parseRssFeed(rawXml, platform) {
  const results = [];
  const todayIso = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString().slice(0, 19);

  const itemBlocks =
    rawXml.match(/<item[\s>][\s\S]*?<\/item>/gi) ||
    rawXml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ||
    [];

  for (const block of itemBlocks.slice(0, 50)) {
    const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    let title = stripHtml(titleMatch ? titleMatch[1] : '');
    if (!title) continue;

    let company = platform.name.replace(/\s+(?:RSS Feed|Remote Jobs Feed|Curated Remote Feed|Feed|API|\(.*?\))$/i, '').trim() || platform.name;
    const creatorMatch = block.match(/<(?:dc:creator|author|company)[^>]*>([\s\S]*?)<\/(?:dc:creator|author|company)>/i);
    if (creatorMatch) {
      const cText = stripHtml(creatorMatch[1]);
      if (cText && cText.length > 1 && cText.length < 60 && !cText.includes('@')) {
        company = cText;
      }
    }
    if (title.includes(':')) {
      const parts = title.split(':');
      if (parts[0].length > 1 && parts[0].length < 45) {
        company = parts[0].trim();
        title = parts.slice(1).join(':').trim();
      }
    } else if (/\s+at\s+([A-Z0-9][A-Za-z0-9\s.&'-]{1,38})$/.test(title)) {
      const atMatch = title.match(/^(.*?)\s+at\s+([A-Z0-9][A-Za-z0-9\s.&'-]{1,38})$/);
      if (atMatch && atMatch[1].length >= 4) {
        title = atMatch[1].trim();
        company = atMatch[2].trim();
      }
    }

    let link = '';
    const linkHrefMatch = block.match(/<link[^>]+href=["']([^"']+)["']/i);
    const linkTextMatch = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    if (linkHrefMatch) {
      link = linkHrefMatch[1].trim();
    } else if (linkTextMatch) {
      link = stripHtml(linkTextMatch[1]);
    }

    const descMatch =
      block.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ||
      block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i) ||
      block.match(/<content[^>]*>([\s\S]*?)<\/content>/i);
    const description = stripHtml(descMatch ? descMatch[1] : '').slice(0, 1500);

    const regionMatch = block.match(/<region[^>]*>([\s\S]*?)<\/region>/i);
    const location = stripHtml(regionMatch ? regionMatch[1] : '') || 'Remote Worldwide';

    const pubMatch =
      block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ||
      block.match(/<published[^>]*>([\s\S]*?)<\/published>/i) ||
      block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i);
    let pubDate = todayIso;
    if (pubMatch) {
      const parsedDate = new Date(stripHtml(pubMatch[1]));
      if (!isNaN(parsedDate.getTime())) {
        pubDate = parsedDate.toISOString().slice(0, 10);
      }
    }

    const jobUrl = link || platform.url;
    if (isDeadPlatform(jobUrl, title)) continue;

    results.push({
      job_hash: computeJobHash(title, company, jobUrl),
      platform_id: platform.id,
      platform_name: platform.name,
      category: platform.category || 'Category 6: Curated Remote-First Job Boards',
      track: platform.track || 'Track F: Curated Remote-First & WFA Job Boards',
      contract_caveat: platform.contract_caveat || 'fractional_or_fulltime',
      title,
      company,
      location,
      url: jobUrl,
      description,
      tags: 'rss, remote',
      published_at: pubDate,
      discovered_at: nowIso
    });
  }

  return results;
}

/**
 * Extracts job postings from an HTML career page or job board (JSON-LD JobPosting + job anchor links).
 */
export function parseHtmlJobBoard(rawHtml, platform) {
  const results = [];
  const todayIso = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString().slice(0, 19);
  const seenUrls = new Set();

  // 1. Check for JSON-LD JobPosting schema blocks
  const ldMatches = rawHtml.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const scriptBlock of ldMatches) {
    const inner = scriptBlock.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '').trim();
    try {
      const parsed = JSON.parse(inner);
      const items = Array.isArray(parsed) ? parsed : (parsed['@graph'] || [parsed]);
      for (const obj of items) {
        if (obj && (obj['@type'] === 'JobPosting' || String(obj['@type']).includes('JobPosting'))) {
          const title = stripHtml(obj.title || obj.name || '');
          if (!title) continue;
          const company = stripHtml(obj.hiringOrganization?.name || platform.name);
          const desc = stripHtml(obj.description || '').slice(0, 1500);
          let jobUrl = String(obj.url || obj.sameAs || platform.url).trim();
          if (jobUrl.startsWith('/') && platform.domain) {
            jobUrl = `https://${platform.domain}${jobUrl}`;
          }
          const loc =
            obj.jobLocationType === 'TELECOMMUTE'
              ? 'Remote Worldwide'
              : stripHtml(
                  obj.applicantLocationRequirements?.name ||
                    obj.jobLocation?.address?.addressCountry ||
                    'Remote Worldwide'
                );
          if (!seenUrls.has(jobUrl)) {
            seenUrls.add(jobUrl);
            results.push({
              job_hash: computeJobHash(title, company, jobUrl),
              platform_id: platform.id,
              platform_name: platform.name,
              category: platform.category || 'Custom Scanned Platform',
              track: platform.track || 'Track F: Curated Remote-First & WFA Job Boards',
              contract_caveat: platform.contract_caveat || 'fractional_or_fulltime',
              title,
              company,
              location: loc,
              url: jobUrl,
              description: desc,
              tags: 'json-ld, remote',
              published_at: String(obj.datePosted || todayIso).slice(0, 10),
              discovered_at: nowIso
            });
          }
        }
      }
    } catch {
      // Ignore malformed JSON-LD
    }
  }

  // 2. Extract job-like anchor links from HTML
  const linkRegex = /<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const jobUrlPattern = /(?:\/jobs?\/|\/careers?\/|\/remote[-_]|\/positions?\/|\/openings?\/|\/roles?\/|\/apply\/|\/vacanc|\/oferta|gh_jid=|lever\.co\/|ashbyhq\.com\/|workable\.com\/)/i;
  const jobRoleKeywordPattern = /\b(?:engineer|developer|designer|manager|analyst|specialist|consultant|trainer|evaluator|support|architect|administrator|director|coordinator|qa|devops|cloud|data|python|react|full[- ]?stack|backend|frontend|ingeniero|desarrollador|analista|soporte|consultor|remoto|remote)\b/i;

  let match;
  while ((match = linkRegex.exec(rawHtml)) !== null && results.length < 40) {
    let href = match[1].trim();
    const rawAnchorText = stripHtml(match[2]);
    if (!rawAnchorText || rawAnchorText.length < 8 || rawAnchorText.length > 140) continue;
    if (/^(?:sign in|log in|register|privacy|terms|cookie|about us|contact|blog|home|read more|learn more|apply now|post a job)$/i.test(rawAnchorText)) {
      continue;
    }

    try {
      href = new URL(href, platform.url).toString();
    } catch {
      continue;
    }

    if (seenUrls.has(href)) continue;
    const isLikelyJob = jobUrlPattern.test(href) || jobRoleKeywordPattern.test(rawAnchorText);
    if (!isLikelyJob) continue;
    if (isDeadPlatform(href, rawAnchorText)) continue;

    seenUrls.add(href);
    results.push({
      job_hash: computeJobHash(rawAnchorText, platform.name, href),
      platform_id: platform.id,
      platform_name: platform.name,
      category: platform.category || 'Custom Scanned Platform',
      track: platform.track || 'Track F: Curated Remote-First & WFA Job Boards',
      contract_caveat: platform.contract_caveat || 'fractional_or_fulltime',
      title: rawAnchorText,
      company: platform.name,
      location: 'Remote / Global / LATAM (UTC-4)',
      url: href,
      description: `Oferta detectada en ${platform.name} (${platform.domain}). Postulación remota disponible en ${href}.`,
      tags: 'remote, web-scan',
      published_at: todayIso,
      discovered_at: nowIso
    });
  }

  return results;
}

/**
 * Queries DuckDuckGo HTML search for a portal dork query.
 */
export async function fetchPortalDork(platform) {
  const query =
    platform.search_query ||
    `site:${platform.domain} ("remote" OR "remoto" OR "work from anywhere" OR "LATAM" OR "Bolivia" OR "engineer" OR "developer" OR "analyst" OR "support" OR "trainer")`;
  const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const resp = await fetchWithTimeout(ddgUrl, 8500);
  if (!resp.ok || !resp.text) return [];

  const page = resp.text;
  const results = [];
  const todayIso = new Date().toISOString().slice(0, 10);
  const nowIso = new Date().toISOString().slice(0, 19);

  const blockPattern =
    /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

  let m;
  while ((m = blockPattern.exec(page)) !== null && results.length < 25) {
    const rawHref = m[1];
    const title = stripHtml(m[2]);
    const snippet = stripHtml(m[3]);
    if (!title) continue;

    let cleanUrl = rawHref;
    if (rawHref.includes('uddg=')) {
      try {
        const parsed = new URL(rawHref, 'https://html.duckduckgo.com');
        cleanUrl = parsed.searchParams.get('uddg') || rawHref;
      } catch {
        // Keep rawHref
      }
    }

    if (isDeadPlatform(cleanUrl, title)) continue;

    results.push({
      job_hash: computeJobHash(title, platform.name, cleanUrl),
      platform_id: platform.id,
      platform_name: platform.name,
      category: platform.category || 'Portal Scan',
      track: platform.track || 'Track B: Async AI Evaluation & RLHF',
      contract_caveat: platform.contract_caveat || 'fractional_or_fulltime',
      title,
      company: platform.name,
      location: 'Remote / Global / LATAM (UTC-4)',
      url: cleanUrl,
      description: snippet,
      tags: platform.category || 'remote',
      published_at: todayIso,
      discovered_at: nowIso
    });
  }

  return results;
}

/**
 * Scans and evaluates a single user-provided custom platform URL.
 * Auto-detects JSON API, RSS/Atom feed, HTML job board, and Portal Search Dork.
 */
export async function scanCustomPlatformUrl(input, userFilters = {}) {
  let rawUrl = String(input.url || '').trim();
  if (!rawUrl) {
    throw new Error('URL requerida / URL is required');
  }
  if (!/^https?:\/\//i.test(rawUrl)) {
    rawUrl = 'https://' + rawUrl;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error('Formato de URL inválido / Invalid URL format');
  }

  const domain = parsedUrl.hostname.replace(/^www\./i, '').toLowerCase();
  if (isDeadPlatform(rawUrl, domain)) {
    throw new Error(`La plataforma ${domain} está en la lista negra (inactiva) / Platform ${domain} is blacklisted (inactive).`);
  }

  const inferredName =
    String(input.name || '').trim() ||
    domain
      .split('.')[0]
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

  const platformId = 'custom_' + domain.replace(/[^a-z0-9]+/g, '_');
  const requestedType = input.type || 'auto';
  const track = input.track || 'Track F: Curated Remote-First & WFA Job Boards';
  const category = input.category || 'Plataforma Agregada por Usuario';

  const platformObj = {
    id: platformId,
    name: inferredName,
    category,
    track,
    type: requestedType,
    enabled: true,
    domain,
    url: rawUrl,
    search_query:
      input.query ||
      `site:${domain} ("remote" OR "remoto" OR "work from anywhere" OR "LATAM" OR "Bolivia")`,
    contract_caveat: input.contract_caveat || 'fractional_or_fulltime',
    notes: input.notes || `Plataforma escaneada desde ${rawUrl}`,
    added_at: new Date().toISOString()
  };

  let discovered = [];
  let detectedType = requestedType;
  let deadLead = false;
  let httpStatus = 200;

  try {
    if (requestedType === 'portal_dork') {
      discovered = await fetchPortalDork(platformObj);
      if (discovered.length === 0) {
        deadLead = true;
      }
    } else {
      const resp = await fetchWithTimeout(rawUrl, 9500);
      httpStatus = resp.status || 0;
      if (!resp.ok) {
        deadLead = true;
      } else {
        const text = resp.text || '';
        const trimmed = text.trim();
        const ct = (resp.contentType || '').toLowerCase();

        if (
          requestedType === 'json_api' ||
          (requestedType === 'auto' && (ct.includes('json') || trimmed.startsWith('{') || trimmed.startsWith('[')))
        ) {
          detectedType = 'json_api';
          discovered = parseJsonFeed(text, platformObj);
        } else if (
          requestedType === 'rss_feed' ||
          (requestedType === 'auto' &&
            (ct.includes('xml') || ct.includes('rss') || ct.includes('atom') || /^<\?xml|<rss|<feed/i.test(trimmed)))
        ) {
          detectedType = 'rss_feed';
          discovered = parseRssFeed(text, platformObj);
        } else {
          detectedType = 'html_board';
          discovered = parseHtmlJobBoard(text, platformObj);

          // If direct HTML parsing found few jobs (e.g. SPA or walled portal), supplement with portal search dork
          if (discovered.length < 2) {
            const dorkHits = await fetchPortalDork(platformObj).catch(() => []);
            if (dorkHits.length > 0) {
              detectedType = discovered.length > 0 ? 'html_board+dork' : 'portal_dork';
              discovered = [...discovered, ...dorkHits];
            }
          }
        }

        if (discovered.length === 0) {
          deadLead = true;
        }
      }
    }
  } catch {
    deadLead = true;
    httpStatus = 0;
  }

  platformObj.type = detectedType;

  // Evaluate all discovered items
  const evaluated = discovered.map(item => evaluateOpportunity(item, userFilters));
  const boliviaEligibleItems = evaluated.filter(item => item.bolivia_eligible);
  const isDeadLead = Boolean(deadLead || evaluated.length === 0);
  const verdictCounts = {
    apply: evaluated.filter(r => r.bolivia_eligible && r.verdict === 'APPLY').length,
    possible: evaluated.filter(r => r.bolivia_eligible && r.verdict === 'POSSIBLE').length,
    skip: evaluated.filter(r => r.bolivia_eligible && r.verdict === 'SKIP').length,
    geo: evaluated.filter(r => !r.bolivia_eligible).length,
    dead_lead: isDeadLead ? 1 : 0
  };

  return {
    platform: platformObj,
    dead_lead: isDeadLead,
    http_status: httpStatus,
    verdict_counts: verdictCounts,
    discovered_count: discovered.length,
    bolivia_eligible_count: boliviaEligibleItems.length,
    opportunities: discovered,
    evaluated_opportunities: evaluated
  };
}

/**
 * Runs a scheduled (every 15 mins) or on-demand ingestion scan across active feeds & a rotating batch of portal dorks.
 */
export async function runIngestionScan(platforms, existingHashesSet, options = {}) {
  const maxFeeds = options.maxFeeds || 8;
  const maxDorkClusters = options.maxDorkClusters || 2;
  const targetTrack = options.track ? String(options.track).toLowerCase() : '';
  const targetPlatform = options.platform ? String(options.platform).toLowerCase() : '';

  let active = platforms.filter(p => p.enabled !== false);
  if (targetTrack) {
    active = active.filter(p => String(p.track || '').toLowerCase().includes(targetTrack));
  }
  if (targetPlatform) {
    active = active.filter(
      p =>
        String(p.id || '').toLowerCase() === targetPlatform ||
        String(p.name || '').toLowerCase().includes(targetPlatform)
    );
  }

  const directFeeds = active.filter(p => p.type === 'json_api' || p.type === 'rss_feed');
  const dorkPlatforms = active.filter(p => p.type === 'portal_dork' || !p.type);

  // Rotate which feeds/clusters we poll based on the current 15-minute window
  const windowIndex = Math.floor(Date.now() / (15 * 60 * 1000));
  const selectedFeeds = [];
  for (let i = 0; i < Math.min(maxFeeds, directFeeds.length); i++) {
    selectedFeeds.push(directFeeds[(windowIndex + i) % directFeeds.length]);
  }

  const newOpportunities = [];
  const scannedPlatforms = [];

  // 1. Poll direct JSON & RSS feeds in parallel
  const feedPromises = selectedFeeds.map(async p => {
    try {
      const resp = await fetchWithTimeout(p.url, 8000);
      if (!resp.ok || !resp.text) return [];
      scannedPlatforms.push(p.name);
      return p.type === 'json_api' ? parseJsonFeed(resp.text, p) : parseRssFeed(resp.text, p);
    } catch {
      return [];
    }
  });

  const feedResults = await Promise.all(feedPromises);
  for (const list of feedResults) {
    for (const item of list) {
      if (!existingHashesSet.has(item.job_hash)) {
        const bol = checkBoliviaRemoteEligibility(item);
        if (bol.eligible) {
          existingHashesSet.add(item.job_hash);
          newOpportunities.push(item);
        }
      }
    }
  }

  // 2. Poll a rotating cluster of portal dorks
  if (dorkPlatforms.length > 0 && maxDorkClusters > 0) {
    const chunkSize = 5;
    const totalChunks = Math.ceil(dorkPlatforms.length / chunkSize);
    for (let c = 0; c < Math.min(maxDorkClusters, totalChunks); c++) {
      const chunkIdx = ((windowIndex * maxDorkClusters + c) % totalChunks) * chunkSize;
      const chunk = dorkPlatforms.slice(chunkIdx, chunkIdx + chunkSize);
      const sitesExpr = chunk.map(p => `site:${p.domain}`).filter(Boolean).join(' OR ');
      if (!sitesExpr) continue;

      const synthetic = {
        id: chunk[0].id,
        name: chunk[0].name,
        category: chunk[0].category,
        track: chunk[0].track,
        contract_caveat: chunk[0].contract_caveat,
        search_query: `(${sitesExpr}) ("Remote" OR "Remoto" OR "LATAM" OR "Bolivia" OR "Worldwide" OR "Cloud" OR "Developer" OR "AI" OR "Support")`
      };

      try {
        const hits = await fetchPortalDork(synthetic);
        scannedPlatforms.push(...chunk.map(p => p.name));
        for (const h of hits) {
          const urlLow = h.url.toLowerCase();
          const matchedP = chunk.find(p => p.domain && urlLow.includes(p.domain.toLowerCase())) || chunk[0];
          h.platform_id = matchedP.id;
          h.platform_name = matchedP.name;
          h.company = matchedP.name;
          h.category = matchedP.category;
          h.track = matchedP.track;
          h.contract_caveat = matchedP.contract_caveat || 'fractional_or_fulltime';
          h.job_hash = computeJobHash(h.title, h.company, h.url);

          if (!existingHashesSet.has(h.job_hash)) {
            const bol = checkBoliviaRemoteEligibility(h);
            if (bol.eligible) {
              existingHashesSet.add(h.job_hash);
              newOpportunities.push(h);
            }
          }
        }
      } catch {
        // Ignore dork rate limit errors
      }
    }
  }

  return {
    scanned_platforms: Array.from(new Set(scannedPlatforms)),
    new_count: newOpportunities.length,
    new_opportunities: newOpportunities,
    timestamp: new Date().toISOString()
  };
}
