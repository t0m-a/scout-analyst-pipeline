/**
 * Model Context Protocol (MCP) Server over Streamable HTTP (Phase 4)
 * Endpoint: `/mcp` (and discovery manifest at `/.well-known/mcp.json`)
 * Implements JSON-RPC 2.0 methods:
 *   - initialize / notifications/initialized / ping
 *   - tools/list & tools/call
 *   - resources/list & resources/read
 *   - prompts/list & prompts/get
 */

import {
  DEFAULT_FILTERS,
  evaluateAllOpportunities,
  generateResultsMarkdown
} from './evaluator.js';
import { scanCustomPlatformUrl } from './scanner.js';
import { enrichBatchWithAI, matchCvAndGenerateProposal } from './ai_enricher.js';
import {
  semanticSearchOpportunities,
  indexOpportunitiesInVectorStore
} from './vector_store.js';

export const MCP_SERVER_INFO = {
  name: 'bolivia-remote-mcp-server',
  version: '5.8.0',
  description: 'Public Model Context Protocol (MCP) server for finding, evaluating, and applying to 100% remote jobs from Bolivia (UTC-4).'
};

export const MCP_TOOLS = [
  {
    name: 'search_bolivia_remote_jobs',
    description:
      'Evaluates and filters remote job opportunities eligible from Bolivia (UTC-4) using a 100-point rubric across languages, professional categories, experience level, and contract modality.',
    inputSchema: {
      type: 'object',
      properties: {
        languages: {
          type: 'array',
          items: { type: 'string', enum: ['es', 'en', 'pt', 'de'] },
          description: 'Languages spoken by the candidate (e.g. ["es", "en"]). If only ["es"], strictly filters for Spanish roles.'
        },
        position_types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Target category IDs (e.g. ["software_eng", "cloud_devops", "data_bi", "virtual_assistant", "customer_support", "finance_accounting", "languages_translation"]).'
        },
        custom_keywords: {
          type: 'string',
          description: 'Comma-separated skills or tools (e.g. "Python, SQL, React, Excel, AWS").'
        },
        verdict: {
          type: 'string',
          enum: ['ALL', 'APPLY', 'POSSIBLE', 'SKIP', 'GEO'],
          description: 'Filter by evaluation verdict (APPLY >= 78, POSSIBLE 58-77).'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of jobs to return (default: 15, max: 50).'
        }
      }
    }
  },
  {
    name: 'semantic_search_bolivia_jobs',
    description:
      'Performs multilingual vector semantic search (ES/EN/PT) over Bolivia-eligible remote jobs using Cloudflare Vectorize / Qdrant / Edge Multilingual Vectors.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural-language search query in Spanish or English (e.g. "asistente virtual bilingüe atención al cliente" or "Senior Cloud DevOps AWS Terraform").'
        },
        languages: {
          type: 'array',
          items: { type: 'string' },
          description: 'Allowed candidate languages (default: ["es", "en"]).'
        },
        topK: {
          type: 'number',
          description: 'Maximum results to return (default: 10).'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'scan_career_page_url',
    description:
      'Live-scans a custom job board, company career page, RSS/Atom feed, or JSON API URL, extracts job postings, and evaluates 100% remote eligibility from Bolivia.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the job board, RSS feed, or JSON API to scan.'
        },
        name: {
          type: 'string',
          description: 'Optional display name for the platform.'
        },
        type: {
          type: 'string',
          enum: ['auto', 'html_board', 'rss_feed', 'json_api', 'portal_dork'],
          description: 'Scan mode (default: "auto").'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'match_cv_and_generate_proposal',
    description:
      'Analyzes a candidate CV or skills summary using Cloudflare Workers AI (with deterministic edge fallback), identifies top matching Bolivia-remote jobs, and generates a bilingual (Spanish/English) cover letter highlighting UTC-4 and W-8BEN readiness.',
    inputSchema: {
      type: 'object',
      properties: {
        cv_text: {
          type: 'string',
          description: 'Candidate CV summary, work experience, or skills list (minimum 10 characters).'
        },
        target_job_hash: {
          type: 'string',
          description: 'Optional job_hash of a specific opportunity to tailor the cover letter to.'
        }
      },
      required: ['cv_text']
    }
  },
  {
    name: 'list_monitored_platforms',
    description:
      'Lists the 86+ monitored remote job platforms across Tracks A-F (Direct B2B, AI/RLHF, LATAM Networks, Global Portals, Expert Networks, and Remote Job Boards).',
    inputSchema: {
      type: 'object',
      properties: {
        track: {
          type: 'string',
          description: 'Optional track filter (e.g. "Track A", "Track B", "Track C", "Track F").'
        },
        search: {
          type: 'string',
          description: 'Optional keyword filter by platform name or domain.'
        }
      }
    }
  }
];

export const MCP_RESOURCES = [
  {
    uri: 'bolivia://results/markdown',
    name: 'Bolivia 100% Remote Jobs — Live Markdown Report',
    description: 'Real-time evaluated Markdown report of 100% remote job opportunities eligible from Bolivia (UTC-4).',
    mimeType: 'text/markdown'
  },
  {
    uri: 'bolivia://platforms/catalog',
    name: 'Monitored Remote Job Platforms Catalog (JSON)',
    description: 'Complete directory of 86+ global and LATAM remote job platforms monitored by Bolivia Remote Work.',
    mimeType: 'application/json'
  }
];

export const MCP_PROMPTS = [
  {
    name: 'bolivia_remote_job_hunt',
    description: 'Guided workflow for finding the best 100% remote jobs from Bolivia (UTC-4) and drafting tailored applications.',
    arguments: [
      {
        name: 'candidate_profile',
        description: 'Summary of the candidate skills, experience level, and languages.',
        required: true
      }
    ]
  }
];

/**
 * Builds the public MCP discovery manifest returned on `GET /mcp` and `GET /.well-known/mcp.json`.
 */
export function getMcpServerManifest(origin = 'https://boliviaremote.work') {
  return {
    ok: true,
    mcp_version: '2025-03-26',
    transport: 'streamable-http',
    endpoint: `${origin}/mcp`,
    server: MCP_SERVER_INFO,
    tools: MCP_TOOLS,
    resources: MCP_RESOURCES,
    prompts: MCP_PROMPTS,
    client_configuration_example: {
      mcpServers: {
        'bolivia-remote-work': {
          type: 'http',
          url: `${origin}/mcp`
        }
      }
    }
  };
}

function jsonRpcSuccess(id, result) {
  return {
    jsonrpc: '2.0',
    id: id !== undefined ? id : null,
    result
  };
}

function jsonRpcError(id, code, message, data) {
  return {
    jsonrpc: '2.0',
    id: id !== undefined ? id : null,
    error: {
      code,
      message,
      ...(data !== undefined ? { data } : {})
    }
  };
}

/**
 * Executes a single JSON-RPC 2.0 MCP request object.
 */
async function executeMcpRpcObject(rpc, state, env, saveStateFn) {
  if (!rpc || typeof rpc !== 'object' || rpc.jsonrpc !== '2.0' || typeof rpc.method !== 'string') {
    return jsonRpcError(rpc && rpc.id, -32600, 'Invalid JSON-RPC 2.0 Request');
  }

  const { id, method, params = {} } = rpc;

  // Notifications without an id
  if (method === 'notifications/initialized' || method === 'notifications/cancelled') {
    return null;
  }

  if (method === 'ping') {
    return jsonRpcSuccess(id, {});
  }

  if (method === 'initialize') {
    const requestedVersion = (params && params.protocolVersion) || '2025-03-26';
    return jsonRpcSuccess(id, {
      protocolVersion: requestedVersion,
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false }
      },
      serverInfo: MCP_SERVER_INFO
    });
  }

  if (method === 'tools/list') {
    return jsonRpcSuccess(id, { tools: MCP_TOOLS });
  }

  if (method === 'resources/list') {
    return jsonRpcSuccess(id, { resources: MCP_RESOURCES });
  }

  if (method === 'resources/read') {
    const uri = String(params.uri || '');
    if (uri === 'bolivia://results/markdown') {
      const evalResult = evaluateAllOpportunities(state.opportunities, DEFAULT_FILTERS);
      const md = generateResultsMarkdown(evalResult, DEFAULT_FILTERS, 'es', state.platforms.length, state.lastScanAt);
      return jsonRpcSuccess(id, {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: md
          }
        ]
      });
    }
    if (uri === 'bolivia://platforms/catalog') {
      return jsonRpcSuccess(id, {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(state.platforms, null, 2)
          }
        ]
      });
    }
    return jsonRpcError(id, -32602, `Unknown resource URI: ${uri}`);
  }

  if (method === 'prompts/list') {
    return jsonRpcSuccess(id, { prompts: MCP_PROMPTS });
  }

  if (method === 'prompts/get') {
    const name = String(params.name || '');
    if (name !== 'bolivia_remote_job_hunt') {
      return jsonRpcError(id, -32602, `Unknown prompt: ${name}`);
    }
    const profile = (params.arguments && params.arguments.candidate_profile) || 'Remote professional in Bolivia (UTC-4)';
    return jsonRpcSuccess(id, {
      description: 'Bolivia 100% Remote Job Search & Application Assistant',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text:
              `Using the bolivia-remote-mcp-server tools, find the best 100% remote jobs from Bolivia (UTC-4) for this candidate profile:\n\n` +
              `"${profile}"\n\n` +
              `1. Run semantic_search_bolivia_jobs and search_bolivia_remote_jobs.\n` +
              `2. Call match_cv_and_generate_proposal for the top opportunity to draft a tailored application letter.`
          }
        }
      ]
    });
  }

  if (method === 'tools/call') {
    const toolName = String(params.name || '');
    const args = params.arguments || {};

    try {
      if (toolName === 'search_bolivia_remote_jobs') {
        const filters = {
          ...DEFAULT_FILTERS,
          ...(Array.isArray(args.languages) && args.languages.length > 0 ? { languages: args.languages } : {}),
          ...(Array.isArray(args.position_types) ? { position_types: args.position_types } : {}),
          ...(typeof args.custom_keywords === 'string' ? { custom_keywords: args.custom_keywords } : {})
        };
        const evalRes = evaluateAllOpportunities(state.opportunities, filters);
        const verdict = String(args.verdict || 'ALL').toUpperCase();
        let pool = evalRes.surfaced;
        if (verdict === 'APPLY') pool = evalRes.apply;
        else if (verdict === 'POSSIBLE') pool = evalRes.possible;
        else if (verdict === 'SKIP') pool = evalRes.skip;
        else if (verdict === 'GEO') pool = evalRes.geo_excluded;

        const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 50);
        const payload = {
          total_evaluated: evalRes.all.length,
          counts: {
            surfaced: evalRes.surfaced.length,
            apply: evalRes.apply.length,
            possible: evalRes.possible.length,
            skip: evalRes.skip.length,
            geo_excluded: evalRes.geo_excluded.length
          },
          results: pool.slice(0, limit).map(r => ({
            job_hash: r.job_hash,
            title: r.title,
            company: r.company,
            platform_name: r.platform_name,
            total_score: r.total_score,
            verdict: r.verdict,
            location: r.location,
            bolivia_badge: r.bolivia_badge_en,
            compensation_usd: r.compensation_usd || '',
            matched_skills: r.matched_skills,
            url: r.url
          }))
        };
        return jsonRpcSuccess(id, {
          content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
          isError: false
        });
      }

      if (toolName === 'semantic_search_bolivia_jobs') {
        const filters = {
          ...DEFAULT_FILTERS,
          ...(Array.isArray(args.languages) && args.languages.length > 0 ? { languages: args.languages } : {})
        };
        const semRes = await semanticSearchOpportunities(
          args.query,
          state.opportunities,
          filters,
          env,
          { topK: Number(args.topK) || 10 }
        );
        return jsonRpcSuccess(id, {
          content: [{ type: 'text', text: JSON.stringify(semRes, null, 2) }],
          isError: false
        });
      }

      if (toolName === 'scan_career_page_url') {
        const scanRes = await scanCustomPlatformUrl(
          { url: args.url, name: args.name, type: args.type || 'auto' },
          DEFAULT_FILTERS
        );
        scanRes.opportunities = await enrichBatchWithAI(scanRes.opportunities, env, 3);
        await indexOpportunitiesInVectorStore(scanRes.opportunities, env, 10);

        const existingHashes = new Set(state.opportunities.map(o => o.job_hash));
        for (const item of scanRes.opportunities) {
          if (!existingHashes.has(item.job_hash)) {
            existingHashes.add(item.job_hash);
            state.opportunities.unshift(item);
          }
        }
        if (typeof saveStateFn === 'function') {
          await saveStateFn();
        }

        return jsonRpcSuccess(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  ok: true,
                  platform: scanRes.platform,
                  discovered_count: scanRes.discovered_count,
                  bolivia_eligible_count: scanRes.bolivia_eligible_count,
                  opportunities: scanRes.opportunities.slice(0, 15)
                },
                null,
                2
              )
            }
          ],
          isError: false
        });
      }

      if (toolName === 'match_cv_and_generate_proposal') {
        const matchRes = await matchCvAndGenerateProposal(
          {
            cv_text: args.cv_text,
            target_job_hash: args.target_job_hash
          },
          state.opportunities,
          env
        );
        return jsonRpcSuccess(id, {
          content: [{ type: 'text', text: JSON.stringify(matchRes, null, 2) }],
          isError: false
        });
      }

      if (toolName === 'list_monitored_platforms') {
        const trackQ = String(args.track || '').toLowerCase().trim();
        const searchQ = String(args.search || '').toLowerCase().trim();
        const filtered = state.platforms.filter(p => {
          if (trackQ && !String(p.track || '').toLowerCase().includes(trackQ)) return false;
          if (searchQ) {
            const hay = `${p.name} ${p.domain} ${p.notes || ''}`.toLowerCase();
            if (!hay.includes(searchQ)) return false;
          }
          return true;
        });
        return jsonRpcSuccess(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ count: filtered.length, platforms: filtered }, null, 2)
            }
          ],
          isError: false
        });
      }

      return jsonRpcError(id, -32601, `Unknown MCP tool: ${toolName}`);
    } catch (err) {
      return jsonRpcSuccess(id, {
        content: [{ type: 'text', text: `Error executing ${toolName}: ${err.message || String(err)}` }],
        isError: true
      });
    }
  }

  return jsonRpcError(id, -32601, `Method not found: ${method}`);
}

/**
 * Constant-time string comparison to prevent timing side-channel attacks on API keys.
 */
function timingSafeEqualStr(a, b) {
  const strA = String(a || '');
  const strB = String(b || '');
  if (strA.length === 0 || strA.length !== strB.length) return false;
  let diff = 0;
  for (let i = 0; i < strA.length; i++) {
    diff |= strA.charCodeAt(i) ^ strB.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verifies Bearer Token / API Key for private `/mcp` access (Fail-Closed by default).
 * Unless `env.MCP_PUBLIC_ACCESS === 'true'`, authentication is strictly required:
 *   - If `env.MCP_API_KEY` is not set in Cloudflare Worker secrets, all requests are rejected (401).
 *   - When `env.MCP_API_KEY` is set, requests must supply a matching key via:
 *       1. `Authorization: Bearer <MCP_API_KEY>`
 *       2. `X-MCP-API-Key: <MCP_API_KEY>`
 *       3. `?key=<MCP_API_KEY>` or `?api_key=<MCP_API_KEY>` query parameter
 */
export function verifyMcpAuth(request, env, urlObj) {
  const allowPublic = Boolean(env && String(env.MCP_PUBLIC_ACCESS).toLowerCase() === 'true');
  if (allowPublic) {
    return { ok: true, enforced: false };
  }

  const expectedKey = env && typeof env.MCP_API_KEY === 'string' ? env.MCP_API_KEY.trim() : '';
  if (!expectedKey) {
    return { ok: false, enforced: true, reason: 'MCP_API_KEY secret is not configured on the Worker' };
  }

  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization') || '';
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const headerKey = request.headers.get('X-MCP-API-Key') || request.headers.get('x-mcp-api-key') || '';
  const parsedUrl = urlObj || new URL(request.url);
  const queryKey = parsedUrl.searchParams.get('key') || parsedUrl.searchParams.get('api_key') || '';

  const providedKey = (bearerMatch ? bearerMatch[1] : (headerKey || queryKey)).trim();
  if (!providedKey) {
    return { ok: false, enforced: true, reason: 'Missing Bearer token or X-MCP-API-Key' };
  }

  return {
    ok: timingSafeEqualStr(providedKey, expectedKey),
    enforced: true,
    reason: 'Invalid Bearer token or X-MCP-API-Key'
  };
}

/**
 * HTTP Handler for `/mcp`, `/api/mcp`, and `/.well-known/mcp.json`.
 */
export async function handleMcpRequest(request, state, env, ctx, saveStateFn) {
  const url = new URL(request.url);
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, X-MCP-API-Key, Mcp-Session-Id'
  };

  const auth = verifyMcpAuth(request, env, url);
  if (!auth.ok) {
    return new Response(
      JSON.stringify(
        jsonRpcError(null, -32001, 'Unauthorized: Valid Bearer token or X-MCP-API-Key required'),
        null,
        2
      ),
      {
        status: 401,
        headers: {
          ...headers,
          'WWW-Authenticate': 'Bearer realm="bolivia-remote-mcp-server"'
        }
      }
    );
  }

  if (request.method === 'GET') {
    const manifest = getMcpServerManifest(url.origin);
    return new Response(JSON.stringify(manifest, null, 2), { status: 200, headers });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify(jsonRpcError(null, -32700, 'Parse error: Invalid JSON payload')),
      { status: 400, headers }
    );
  }

  if (Array.isArray(body)) {
    const responses = [];
    for (const item of body) {
      const res = await executeMcpRpcObject(item, state, env, saveStateFn);
      if (res !== null) responses.push(res);
    }
    if (responses.length === 0) {
      return new Response(null, { status: 202, headers });
    }
    return new Response(JSON.stringify(responses, null, 2), { status: 200, headers });
  }

  const rpcResponse = await executeMcpRpcObject(body, state, env, saveStateFn);
  if (rpcResponse === null) {
    return new Response(null, { status: 202, headers });
  }
  return new Response(JSON.stringify(rpcResponse, null, 2), { status: 200, headers });
}
