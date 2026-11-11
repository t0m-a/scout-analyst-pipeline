/**
 * Vectorial Database & Multilingual Semantic Search Engine (Phase 3)
 * Supports 3-tier hybrid vector indexing and search:
 *   1. Cloudflare Vectorize (`env.VECTORIZE`) with `@cf/baai/bge-m3` (1024-dim multilingual embeddings)
 *   2. Raspberry Pi 5 Qdrant Edge Bridge (`env.QDRANT_URL`, e.g. edge-rag-hub Qdrant v1.12)
 *   3. Cross-Lingual Edge Semantic Vector Index (128-dim ES/EN/PT concept + n-gram vectors)
 *      for zero-latency local / standalone fallback.
 */

import {
  DEFAULT_FILTERS,
  evaluateAllOpportunities,
  checkBoliviaRemoteEligibility
} from './evaluator.js';
import { stripHtml, computeJobHash } from './scanner.js';

export const EMBEDDING_MODEL = '@cf/baai/bge-m3';
const LOCAL_DIM = 128;

/**
 * Cross-lingual concept clusters mapping Spanish, English, and Portuguese terms
 * to shared semantic dimensions (indices 0..31 of the 128-dim local vector).
 */
const SEMANTIC_CONCEPT_CLUSTERS = [
  // 0: Virtual Assistant & Executive Admin
  /\b(asistente\s+virtual|virtual\s+assistant|executive\s+assistant|secretaria|administrativ[oa]|admin\s+support|calendar|scheduling|agenda|data\s+entry|back\s*office)\b/gi,
  // 1: Project & Operations Coordination
  /\b(project\s+manager|gesti[oó]n\s+de\s+proyectos|operations|operaciones|coordinador|coordinator|scrum|agile|pmo|notion|asana|jira|clickup)\b/gi,
  // 2: Customer Support & Success
  /\b(customer\s+support|atenci[oó]n\s+al\s+cliente|soporte\s+al\s+cliente|customer\s+service|customer\s+success|help\s*desk|chat\s+support|zendesk|intercom|call\s+center)\b/gi,
  // 3: Sales, SDR, BDR & Account Management
  /\b(sales|ventas|sdr|bdr|account\s+executive|business\s+development|outbound|inbound|closing|prospecci[oó]n|hubspot|salesforce|crm|lead\s+generation)\b/gi,
  // 4: Digital Marketing, SEO & Social Media
  /\b(marketing|seo|sem|social\s+media|redes\s+sociales|community\s+manager|copywriter|content|contenidos|redactor|google\s+ads|meta\s+ads|email\s+marketing)\b/gi,
  // 5: HR, Talent Acquisition & Recruiting
  /\b(recruiter|recruiting|reclutador|reclutamiento|recursos\s+humanos|human\s+resources|talent\s+acquisition|sourcer|hr|people\s+ops)\b/gi,
  // 6: Finance, Accounting & Bookkeeping
  /\b(finance|finanzas|accounting|contabilidad|contador|accountant|bookkeeper|bookkeeping|quickbooks|xero|excel|payroll|n[oó]mina|auditor|impuestos|fp&a)\b/gi,
  // 7: Design, UI/UX & Video Editing
  /\b(design|dise[ñn]o|dise[ñn]ador|designer|ui|ux|figma|canva|photoshop|illustrator|video\s+editor|edici[oó]n\s+de\s+video|motion\s+graphics)\b/gi,
  // 8: AI Training, RLHF & Data Annotation
  /\b(ai\s+trainer|entrenamiento\s+ia|rlhf|llm|prompt|annotator|anotaci[oó]n|data\s+labeling|evaluador\s+ia|rater|search\s+quality)\b/gi,
  // 9: Software Engineering (Frontend / Backend / Fullstack / Mobile)
  /\b(software\s+engineer|developer|desarrollador|programador|fullstack|full-stack|frontend|front-end|backend|back-end|web\s+developer|mobile|ios|android)\b/gi,
  // 10: JavaScript / TypeScript / React / Node Ecosystem
  /\b(javascript|typescript|react|nextjs|next\.js|nodejs|node\.js|vue|angular|express|nestjs|graphql)\b/gi,
  // 11: Python / Backend / APIs
  /\b(python|django|fastapi|flask|golang|rust|java|spring|c#|dotnet|\.net|php|laravel|ruby|rails)\b/gi,
  // 12: Cloud, DevOps, SRE & Infrastructure
  /\b(cloud|nube|devops|sre|aws|azure|gcp|kubernetes|k8s|docker|terraform|ansible|linux|ci\/cd|sysadmin|infrastructure|infraestructura|noc|network)\b/gi,
  // 13: Data Science, Analytics, BI & Machine Learning
  /\b(data\s+analyst|analista\s+de\s+datos|data\s+engineer|ingeniero\s+de\s+datos|data\s+scientist|ciert[ií]fico\s+de\s+datos|sql|power\s*bi|tableau|snowflake|dbt|spark|etl|machine\s+learning|ml)\b/gi,
  // 14: Translation, Interpretation & Localization
  /\b(translator|traductor|traducci[oó]n|translation|interpreter|int[eé]rprete|interpretaci[oó]n|localization|localizaci[oó]n|subtitling|transcription|transcripci[oó]n|bilingual|biling[uü]e|esl|tutor)\b/gi,
  // 15: Cybersecurity & InfoSec
  /\b(security|seguridad|cybersecurity|ciberseguridad|infosec|pentest|soc|vulnerability|iam|devsecops)\b/gi,
  // 16: QA & Testing
  /\b(qa|quality\s+assurance|tester|testing|pruebas|automation|cypress|playwright|selenium)\b/gi,
  // 17: E-commerce & Shopify
  /\b(shopify|woocommerce|ecommerce|e-commerce|amazon|mercado\s*libre|dropshipping|catalog)\b/gi,
  // 18: Senior / Lead Experience
  /\b(senior|sr\.?|lead|principal|staff|architect|arquitecto|director|head\s+of|manager|jefe)\b/gi,
  // 19: Entry / Junior Experience
  /\b(junior|jr\.?|entry\s*level|trainee|pasante|intern|sin\s+experiencia|inicial|assistant|associate)\b/gi,
  // 20: Part-Time / Flexible / Hourly
  /\b(part-time|part\s+time|medio\s+tiempo|freelance|por\s+horas|hourly|flexible|async|as[ií]ncrono|fractional)\b/gi,
  // 21: Full-Time Dedicated
  /\b(full-time|full\s+time|tiempo\s+completo|dedicado|dedicated|40\s*h)\b/gi,
  // 22: Bolivia / LATAM / South America / UTC-4
  /\b(bolivia|latam|latin\s+america|latinoam[eé]rica|south\s+america|sudam[eé]rica|utc-4|est|americas)\b/gi,
  // 23: Worldwide / Work From Anywhere
  /\b(worldwide|global|anywhere|work\s+from\s+anywhere|wfa|100%\s+remote|remoto\s+global)\b/gi
];

/**
 * Normalizes a vector in-place to unit L2 norm.
 */
export function normalizeVector(vec) {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 1e-9) {
    for (let i = 0; i < vec.length; i++) {
      vec[i] = vec[i] / norm;
    }
  }
  return vec;
}

/**
 * Computes cosine similarity between two numeric vectors in [0, 1].
 */
export function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }
  const len = Math.min(vecA.length, vecB.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    const a = Number(vecA[i]) || 0;
    const b = Number(vecB[i]) || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom <= 1e-9) return 0;
  return Math.max(0, Math.min(1, dot / denom));
}

/**
 * Builds a deterministic 128-dimensional cross-lingual semantic vector
 * combining concept cluster activations (dims 0..23) and hashed token/trigram projections (dims 24..127).
 */
export function buildLocalSemanticVector(rawText) {
  const vec = new Array(LOCAL_DIM).fill(0);
  const clean = stripHtml(rawText || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (!clean) return vec;

  // 1. Concept cluster dimensions (dims 0..23) with high semantic weight
  for (let c = 0; c < SEMANTIC_CONCEPT_CLUSTERS.length; c++) {
    const matches = clean.match(SEMANTIC_CONCEPT_CLUSTERS[c]);
    if (matches && matches.length > 0) {
      vec[c] = 2.4 * Math.min(1 + Math.log1p(matches.length), 3.0);
    }
  }

  // 2. Token + character trigram feature hashing into dims 24..127
  const span = LOCAL_DIM - 24;
  const tokens = clean
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2);

  for (const tok of tokens) {
    let h = 2166136261;
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const idx = 24 + (Math.abs(h) % span);
    const sign = (h & 1) === 0 ? 1 : -1;
    vec[idx] += sign * 1.0;

    // Character 4-grams for morphological stem matching across ES/EN (e.g. "contab", "progr", "traduc")
    if (tok.length >= 5) {
      const stem = tok.slice(0, 5);
      let sh = 2166136261;
      for (let j = 0; j < stem.length; j++) {
        sh ^= stem.charCodeAt(j);
        sh = Math.imul(sh, 16777619);
      }
      const sIdx = 24 + (Math.abs(sh) % span);
      vec[sIdx] += 0.65;
    }
  }

  return normalizeVector(vec);
}

/**
 * Generates an embedding vector using Cloudflare Workers AI (`@cf/baai/bge-m3`)
 * or falls back to `buildLocalSemanticVector`.
 */
export async function generateEmbedding(text, env) {
  const clean = stripHtml(text || '').slice(0, 1200);
  if (env && env.AI && typeof env.AI.run === 'function') {
    try {
      const resp = await env.AI.run(EMBEDDING_MODEL, { text: [clean] });
      const vec = resp && Array.isArray(resp.data) && Array.isArray(resp.data[0])
        ? resp.data[0]
        : (Array.isArray(resp) ? resp : null);
      if (vec && vec.length >= 64) {
        return {
          vector: normalizeVector([...vec]),
          model: EMBEDDING_MODEL,
          dimensions: vec.length
        };
      }
    } catch {
      // Fallback to local semantic vector
    }
  }

  const localVec = buildLocalSemanticVector(clean);
  return {
    vector: localVec,
    model: 'edge-multilingual-128d',
    dimensions: localVec.length
  };
}

/**
 * Converts a job_hash string into a deterministic positive integer ID for Qdrant points.
 */
function hashToQdrantPointId(jobHash) {
  const clean = String(jobHash || '');
  let h = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    h ^= clean.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0) || 1;
}

/**
 *Builds canonical text representation of an opportunity for vector embedding.
 */
export function buildOpportunityEmbeddingText(item) {
  return [
    item.title || '',
    item.company || '',
    item.platform_name || '',
    item.location || '',
    item.tags || '',
    item.ai_summary_es || '',
    item.ai_summary_en || '',
    stripHtml(item.description || '').slice(0, 600)
  ]
    .filter(Boolean)
    .join(' | ');
}

/**
 * Indexes a batch of opportunities into Cloudflare Vectorize (`env.VECTORIZE`)
 * and/or the Raspberry Pi 5 Qdrant Edge Bridge (`env.QDRANT_URL`).
 */
export async function indexOpportunitiesInVectorStore(opportunities, env, maxItems = 25) {
  if (!Array.isArray(opportunities) || opportunities.length === 0) {
    return { indexed_count: 0, backends: [] };
  }

  const slice = opportunities.slice(0, maxItems);
  const backends = [];
  const vectorRecords = [];

  for (const opp of slice) {
    const text = buildOpportunityEmbeddingText(opp);
    const emb = await generateEmbedding(text, env);
    const bol = checkBoliviaRemoteEligibility(opp);
    const id = opp.job_hash || computeJobHash(opp.title, opp.company, opp.url);
    vectorRecords.push({
      id,
      values: emb.vector,
      metadata: {
        job_hash: id,
        title: String(opp.title || '').slice(0, 140),
        company: String(opp.company || '').slice(0, 80),
        platform_name: String(opp.platform_name || '').slice(0, 80),
        track: String(opp.track || '').slice(0, 80),
        bolivia_eligible: bol.eligible ? 1 : 0,
        published_at: String(opp.published_at || '').slice(0, 10)
      }
    });
  }

  // 1. Cloudflare Vectorize (`env.VECTORIZE`)
  if (env && env.VECTORIZE && typeof env.VECTORIZE.upsert === 'function') {
    try {
      await env.VECTORIZE.upsert(vectorRecords);
      backends.push('cloudflare-vectorize');
    } catch {
      // Ignore Vectorize upsert error
    }
  }

  // 2. Raspberry Pi 5 Qdrant Edge Bridge (`env.QDRANT_URL`)
  if (env && env.QDRANT_URL) {
    try {
      const baseUrl = String(env.QDRANT_URL).replace(/\/+$/, '');
      const collection = env.QDRANT_COLLECTION || 'bolivia_remote_jobs';
      const headers = { 'Content-Type': 'application/json' };
      if (env.QDRANT_API_KEY) {
        headers['api-key'] = String(env.QDRANT_API_KEY);
      }
      const points = vectorRecords.map(r => ({
        id: hashToQdrantPointId(r.id),
        vector: r.values,
        payload: r.metadata
      }));
      const resp = await fetch(`${baseUrl}/collections/${collection}/points?wait=true`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ points })
      });
      if (resp.ok) {
        backends.push('qdrant-edge-bridge');
      }
    } catch {
      // Ignore Qdrant bridge network error
    }
  }

  if (backends.length === 0) {
    backends.push('edge-in-memory-index');
  }

  return {
    indexed_count: vectorRecords.length,
    backends
  };
}

/**
 * Semantic deduplication across job postings using vector cosine similarity.
 * Removes cross-platform reposts that describe the same position with >= threshold similarity.
 */
export function deduplicateSemantically(opportunities, similarityThreshold = 0.92) {
  if (!Array.isArray(opportunities) || opportunities.length <= 1) {
    return {
      opportunities: opportunities || [],
      duplicates_removed: 0
    };
  }

  const kept = [];
  const keptVectors = [];
  let duplicatesRemoved = 0;

  for (const opp of opportunities) {
    if (!opp || !opp.title) continue;
    const vec = buildLocalSemanticVector(`${opp.title} ${opp.company} ${opp.description || ''}`);
    let isDuplicate = false;

    for (let i = 0; i < kept.length; i++) {
      const sameCompany =
        String(opp.company || '').toLowerCase().trim() ===
        String(kept[i].company || '').toLowerCase().trim();
      const sim = cosineSimilarity(vec, keptVectors[i]);
      const effectiveThreshold = sameCompany ? Math.min(similarityThreshold, 0.86) : similarityThreshold;
      if (sim >= effectiveThreshold) {
        isDuplicate = true;
        duplicatesRemoved++;
        break;
      }
    }

    if (!isDuplicate) {
      kept.push(opp);
      keptVectors.push(vec);
    }
  }

  return {
    opportunities: kept,
    duplicates_removed: duplicatesRemoved
  };
}

/**
 * Performs hybrid semantic search over all opportunities using:
 *   - Cloudflare Vectorize (`env.VECTORIZE.query`) if bound
 *   - Raspberry Pi 5 Qdrant Bridge (`env.QDRANT_URL`) if configured
 *   - Edge Multilingual Semantic Vectors + 4-axis Bolivia Remote Evaluator
 */
export async function semanticSearchOpportunities(query, opportunities, filters = DEFAULT_FILTERS, env = {}, options = {}) {
  const cleanQuery = stripHtml(query || '').trim();
  if (!cleanQuery) {
    throw new Error('Por favor ingresa una consulta de búsqueda semántica. / Please enter a semantic search query.');
  }

  const topK = Math.min(Math.max(Number(options.topK) || 25, 1), 100);
  const evalResult = evaluateAllOpportunities(opportunities, filters);
  const pool = filters.require_bolivia_remote !== false ? evalResult.surfaced : evalResult.all;

  const externalScoresByHash = new Map();
  let activeBackend = 'edge-multilingual-vectors';

  // Generate query embedding (uses @cf/baai/bge-m3 if env.AI is bound)
  const queryEmb = await generateEmbedding(cleanQuery, env);
  if (queryEmb.model === EMBEDDING_MODEL) {
    activeBackend = 'workers-ai-bge-m3';
  }

  // 1. Query Cloudflare Vectorize if bound
  if (env && env.VECTORIZE && typeof env.VECTORIZE.query === 'function') {
    try {
      const vecMatches = await env.VECTORIZE.query(queryEmb.vector, {
        topK,
        returnMetadata: 'all'
      });
      const matchList = (vecMatches && Array.isArray(vecMatches.matches)) ? vecMatches.matches : [];
      for (const m of matchList) {
        const hash = (m.metadata && m.metadata.job_hash) || m.id;
        if (hash && typeof m.score === 'number') {
          externalScoresByHash.set(hash, Math.max(0, Math.min(1, m.score)));
        }
      }
      if (matchList.length > 0) {
        activeBackend = 'cloudflare-vectorize';
      }
    } catch {
      // Fallback to Qdrant or local semantic scoring
    }
  }

  // 2. Query Qdrant Edge Bridge if configured and Vectorize didn't populate
  if (externalScoresByHash.size === 0 && env && env.QDRANT_URL) {
    try {
      const baseUrl = String(env.QDRANT_URL).replace(/\/+$/, '');
      const collection = env.QDRANT_COLLECTION || 'bolivia_remote_jobs';
      const headers = { 'Content-Type': 'application/json' };
      if (env.QDRANT_API_KEY) {
        headers['api-key'] = String(env.QDRANT_API_KEY);
      }
      const resp = await fetch(`${baseUrl}/collections/${collection}/points/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          vector: queryEmb.vector,
          limit: topK,
          with_payload: true
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        const hits = Array.isArray(data && data.result) ? data.result : [];
        for (const h of hits) {
          const hash = h.payload && h.payload.job_hash;
          if (hash && typeof h.score === 'number') {
            externalScoresByHash.set(hash, Math.max(0, Math.min(1, h.score)));
          }
        }
        if (hits.length > 0) {
          activeBackend = 'qdrant-edge-bridge';
        }
      }
    } catch {
      // Fallback to local semantic scoring
    }
  }

  // 3. Score all candidate opportunities using local cross-lingual vector + optional external vector score
  const localQueryVec = buildLocalSemanticVector(cleanQuery);
  const queryTerms = cleanQuery
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length >= 3);

  const scoredResults = pool.map(opp => {
    const oppText = buildOpportunityEmbeddingText(opp);
    const localOppVec = buildLocalSemanticVector(oppText);
    const localSim = cosineSimilarity(localQueryVec, localOppVec);

    // Lexical overlap boost for exact skill/role matches
    const lowerBlob = oppText.toLowerCase();
    let termHits = 0;
    for (const term of queryTerms) {
      if (lowerBlob.includes(term)) termHits++;
    }
    const lexicalBoost = queryTerms.length > 0 ? (termHits / queryTerms.length) * 0.25 : 0;

    const extSim = externalScoresByHash.has(opp.job_hash)
      ? externalScoresByHash.get(opp.job_hash)
      : null;

    const rawSim = extSim !== null
      ? Math.min(1, extSim * 0.7 + localSim * 0.3 + lexicalBoost)
      : Math.min(1, localSim * 0.85 + lexicalBoost);

    // Scale similarity into an intuitive 0..100 semantic score
    const semanticScore = Math.min(100, Math.round(Math.pow(rawSim, 0.65) * 100));
    const blendedScore = Math.min(100, Math.round(semanticScore * 0.55 + opp.total_score * 0.45));

    return {
      ...opp,
      semantic_similarity: Number(rawSim.toFixed(4)),
      semantic_score: semanticScore,
      blended_score: blendedScore
    };
  });

  scoredResults.sort((a, b) => {
    if (b.blended_score !== a.blended_score) return b.blended_score - a.blended_score;
    return b.semantic_score - a.semantic_score;
  });

  const filteredTop = scoredResults
    .filter(r => r.semantic_score >= 18)
    .slice(0, topK);

  return {
    ok: true,
    query: cleanQuery,
    vector_backend: activeBackend,
    embedding_model: queryEmb.model,
    count: filteredTop.length,
    results: filteredTop
  };
}
