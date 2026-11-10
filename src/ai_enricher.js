/**
 * Cloudflare Workers AI Enrichment, Compensation Extractor & CV/Cover-Letter Assistant (Phase 2)
 * Uses `env.AI` (@cf/meta/llama-3.1-8b-instruct-fast / @cf/meta/llama-3.3-70b-instruct-fp8-fast)
 * with deterministic edge fallback when running locally or without an active Workers AI binding.
 */

import {
  POSITION_CATEGORIES,
  DEFAULT_FILTERS,
  checkBoliviaRemoteEligibility,
  detectOfferAttributes,
  evaluateAllOpportunities
} from './evaluator.js';
import { stripHtml } from './scanner.js';

const DEFAULT_FAST_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';
const DEFAULT_FALLBACK_MODEL = '@cf/meta/llama-3.1-8b-instruct';

/**
 * Extracts USD hourly, daily, monthly, or annual compensation from raw job text.
 */
export function extractCompensationUsd(item) {
  if (item.compensation_usd && String(item.compensation_usd).trim()) {
    return String(item.compensation_usd).trim();
  }
  const blob = `${item.title || ''} ${item.description || ''} ${item.notes || ''}`;

  const rangeMatch = blob.match(
    /\$\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*[kK]?\s*(?:-|–|to)\s*\$?\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*[kK]?\s*(?:\/\s*(?:hr|hour|hora|mo|month|mes|yr|year|año)|per\s+(?:hour|month|year)|USD)?/i
  );
  if (rangeMatch) {
    return rangeMatch[0].replace(/\s+/g, ' ').trim();
  }

  const singleRateMatch = blob.match(
    /\$\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*[kK]?\s*(?:\/\s*(?:hr|hour|hora|mo|month|mes|yr|year|study|call)|per\s+(?:hour|month|year|study))/i
  );
  if (singleRateMatch) {
    return singleRateMatch[0].replace(/\s+/g, ' ').trim();
  }

  return '';
}

/**
 * Deterministic bilingual summary generator used when env.AI is not bound or for instant enrichment.
 */
export function buildDeterministicSummaries(item) {
  const bol = checkBoliviaRemoteEligibility(item);
  const attrs = detectOfferAttributes(item);
  const comp = extractCompensationUsd(item);
  const compEs = comp ? ` Remuneración referencial: ${comp}.` : '';
  const compEn = comp ? ` Estimated pay: ${comp}.` : '';
  const skills = attrs.matchedKeywords.slice(0, 5).join(', ');
  const skillsEs = skills ? ` Habilidades clave: ${skills}.` : '';
  const skillsEn = skills ? ` Key skills: ${skills}.` : '';

  const summaryEs =
    `Vacante en ${item.company || item.platform_name} (${bol.badge_es}).` +
    skillsEs +
    compEs;
  const summaryEn =
    `Role at ${item.company || item.platform_name} (${bol.badge_en}).` +
    skillsEn +
    compEn;

  return {
    compensation_usd: comp,
    ai_summary_es: summaryEs.trim(),
    ai_summary_en: summaryEn.trim()
  };
}

/**
 * Safely invokes Cloudflare Workers AI (`env.AI.run`) and parses JSON output.
 */
async function runWorkersAiJson(env, messages, maxTokens = 450) {
  if (!env || !env.AI || typeof env.AI.run !== 'function') {
    return null;
  }

  const models = [DEFAULT_FAST_MODEL, DEFAULT_FALLBACK_MODEL];
  for (const model of models) {
    try {
      const resp = await env.AI.run(model, {
        messages,
        max_tokens: maxTokens,
        temperature: 0.1
      });
      const rawText = typeof resp === 'string'
        ? resp
        : (resp && (resp.response || resp.result || JSON.stringify(resp))) || '';
      const jsonMatch = String(rawText).match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Try next model or fallback
    }
  }
  return null;
}

/**
 * Enriches a single job opportunity using Cloudflare Workers AI (with deterministic fallback).
 */
export async function enrichOpportunityWithAI(item, env) {
  const base = buildDeterministicSummaries(item);
  const detBol = checkBoliviaRemoteEligibility(item);

  const enriched = {
    ...item,
    compensation_usd: item.compensation_usd || base.compensation_usd,
    ai_summary_es: item.ai_summary_es || base.ai_summary_es,
    ai_summary_en: item.ai_summary_en || base.ai_summary_en,
    ai_verified: item.ai_verified || 0
  };

  if (!env || !env.AI || typeof env.AI.run !== 'function') {
    return enriched;
  }

  const sysPrompt =
    'You are an expert Latin America & Bolivia (UTC-4) remote work analyst. ' +
    'Given a job posting, return ONLY a valid JSON object with keys: ' +
    '{"bolivia_eligible": boolean, "company": string, "compensation_usd": string, "summary_es": string, "summary_en": string}. ' +
    'Set bolivia_eligible=false if the role requires US/EU/UK/Canada/specific foreign physical residency, W-2, security clearance, or on-site travel. ' +
    'Set bolivia_eligible=true if open to Bolivia, LATAM, South America, Americas, or Global/Worldwide contractors.';

  const userPrompt =
    `Title: ${stripHtml(item.title)}\n` +
    `Company: ${stripHtml(item.company)}\n` +
    `Platform: ${stripHtml(item.platform_name)}\n` +
    `Location: ${stripHtml(item.location)}\n` +
    `Description: ${stripHtml(item.description).slice(0, 900)}`;

  const aiJson = await runWorkersAiJson(env, [
    { role: 'system', content: sysPrompt },
    { role: 'user', content: userPrompt }
  ], 350);

  if (aiJson && typeof aiJson === 'object') {
    if (typeof aiJson.company === 'string' && aiJson.company.trim().length > 1 && aiJson.company.trim().length < 60) {
      if (enriched.company === enriched.platform_name) {
        enriched.company = stripHtml(aiJson.company.trim());
      }
    }
    if (typeof aiJson.compensation_usd === 'string' && aiJson.compensation_usd.trim()) {
      enriched.compensation_usd = stripHtml(aiJson.compensation_usd.trim()).slice(0, 60);
    }
    if (typeof aiJson.summary_es === 'string' && aiJson.summary_es.trim()) {
      enriched.ai_summary_es = stripHtml(aiJson.summary_es.trim()).slice(0, 280);
    }
    if (typeof aiJson.summary_en === 'string' && aiJson.summary_en.trim()) {
      enriched.ai_summary_en = stripHtml(aiJson.summary_en.trim()).slice(0, 280);
    }
    if (aiJson.bolivia_eligible === false && detBol.eligible) {
      enriched.location = `${enriched.location} (US Only / Geo-Restricted)`;
    }
    enriched.ai_verified = 1;
  }

  return enriched;
}

/**
 * Enriches a batch of newly discovered opportunities during ingestion scans.
 */
export async function enrichBatchWithAI(items, env, maxAiCalls = 5) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const results = [];
  for (let i = 0; i < items.length; i++) {
    if (i < maxAiCalls && env && env.AI) {
      results.push(await enrichOpportunityWithAI(items[i], env));
    } else {
      const det = buildDeterministicSummaries(items[i]);
      results.push({
        ...items[i],
        compensation_usd: items[i].compensation_usd || det.compensation_usd,
        ai_summary_es: items[i].ai_summary_es || det.ai_summary_es,
        ai_summary_en: items[i].ai_summary_en || det.ai_summary_en,
        ai_verified: items[i].ai_verified || 0
      });
    }
  }
  return results;
}

/**
 * Analyzes a user's CV / profile text, matches it against the job catalog, and generates a tailored bilingual cover letter.
 */
export async function matchCvAndGenerateProposal(payload, opportunities, env) {
  const cvText = stripHtml(payload.cv_text || '').slice(0, 4000);
  if (!cvText || cvText.length < 10) {
    throw new Error('Por favor ingresa tu resumen de CV, experiencia o habilidades (mínimo 10 caracteres). / Please enter your CV summary or skills.');
  }

  const targetHash = String(payload.target_job_hash || '').trim();
  const baseFilters = { ...DEFAULT_FILTERS, ...(payload.filters || {}) };

  // Detect categories & skills directly from the user's CV text
  const cvPseudoItem = {
    title: cvText.slice(0, 300),
    description: cvText,
    tags: '',
    location: 'Bolivia',
    contract_caveat: 'fractional_or_fulltime'
  };
  const cvAttrs = detectOfferAttributes(cvPseudoItem);

  // Merge CV-detected categories and keywords into evaluation filters
  const mergedCategories = Array.from(
    new Set([...(baseFilters.position_types || []), ...cvAttrs.categories.slice(0, 4)])
  );
  const mergedKeywords = Array.from(
    new Set([
      ...String(baseFilters.custom_keywords || '').split(/[,;]+/).map(s => s.trim()).filter(Boolean),
      ...cvAttrs.matchedKeywords.slice(0, 8)
    ])
  ).join(', ');

  const effectiveFilters = {
    ...baseFilters,
    position_types: mergedCategories,
    custom_keywords: mergedKeywords
  };

  const evalResult = evaluateAllOpportunities(opportunities, effectiveFilters);
  const topMatches = evalResult.surfaced.slice(0, 6);

  let targetJob = null;
  if (targetHash) {
    targetJob = evalResult.all.find(o => o.job_hash === targetHash) || null;
  }
  if (!targetJob && topMatches.length > 0) {
    targetJob = topMatches[0];
  }

  const catLabelsEs = cvAttrs.categories
    .map(cid => POSITION_CATEGORIES.find(c => c.id === cid)?.label_es)
    .filter(Boolean);
  const catLabelsEn = cvAttrs.categories
    .map(cid => POSITION_CATEGORIES.find(c => c.id === cid)?.label_en)
    .filter(Boolean);

  const skillsList = cvAttrs.matchedKeywords.length > 0
    ? cvAttrs.matchedKeywords.join(', ')
    : (mergedKeywords || 'Trabajo Remoto, Comunicación, Gestión Digital');

  const jobTitle = targetJob ? targetJob.title : 'Especialista Remoto Internacional';
  const jobCompany = targetJob ? targetJob.company : 'Empresa Contratante';
  const jobUrl = targetJob ? targetJob.url : '';

  // Deterministic tailored bilingual cover letters & analysis (used if env.AI is offline or as baseline)
  let analysisEs =
    `Perfil detectado: Nivel ${cvAttrs.experience.toUpperCase()} con afinidad en ${catLabelsEs.join(' · ') || 'Operaciones y Tecnología Remota'}. ` +
    `Habilidades identificadas: ${skillsList}. ` +
    `Ventaja competitiva desde Bolivia: Zona horaria UTC-4 (100% compatible con EST/EDT de EE. UU. y Canadá) y contratación directa internacional (W-8BEN / Contractor sin requerir patrocinio de visa).`;

  let analysisEn =
    `Detected Profile: ${cvAttrs.experience.toUpperCase()} level matching ${catLabelsEn.join(' · ') || 'Remote Operations & Tech'}. ` +
    `Identified skills: ${skillsList}. ` +
    `Bolivia Remote Advantage: UTC-4 timezone (direct overlap with US EST/EDT) and frictionless international independent contractor setup (W-8BEN, zero visa sponsorship required).`;

  let proposalEs =
    `Asunto: Postulación a ${jobTitle} — ${jobCompany} (Remoto UTC-4 / LATAM)\n\n` +
    `Estimado equipo de selección de ${jobCompany},\n\n` +
    `Le escribo para presentar mi postulación a la posición de ${jobTitle}. Cuento con experiencia comprobada en ${skillsList}, trabajando en entornos 100% remotos y distribuidos.\n\n` +
    `Puntos clave que aporto al rol:\n` +
    `- Dominio práctico en: ${skillsList}.\n` +
    `- Alineación horaria total desde Bolivia (UTC-4 / mismo huso horario que EST/EDT) para colaboración síncrona y asíncrona.\n` +
    `- Disponibilidad inmediata bajo modalidad de contratista internacional independiente (W-8BEN).\n\n` +
    `Quedo a su entera disposición para coordinar una entrevista técnica o práctica.\n\n` +
    `Atentamente,\n[Tu Nombre Completo]`;

  let proposalEn =
    `Subject: Application for ${jobTitle} — ${jobCompany} (Remote UTC-4 / Americas)\n\n` +
    `Dear ${jobCompany} Hiring Team,\n\n` +
    `I am writing to apply for the ${jobTitle} position. My background includes hands-on experience across ${skillsList}, delivering reliable results in distributed remote environments.\n\n` +
    `Key value I bring to your team:\n` +
    `- Core competencies aligned with your stack: ${skillsList}.\n` +
    `- Full US Eastern Timezone alignment (UTC-4 from Bolivia) for seamless real-time collaboration and async execution.\n` +
    `- Immediate readiness as an international independent contractor (W-8BEN compliant, no visa sponsorship required).\n\n` +
    `Thank you for your time and consideration. I look forward to discussing how I can contribute to ${jobCompany}.\n\n` +
    `Best regards,\n[Your Full Name]`;

  let usedWorkersAi = false;

  if (env && env.AI && typeof env.AI.run === 'function') {
    const sysPrompt =
      'You are an executive remote career coach for applicants based in Bolivia (UTC-4). ' +
      'Given the candidate CV summary and the target remote job, return ONLY a valid JSON object with keys: ' +
      '{"analysis_es": string, "analysis_en": string, "proposal_es": string, "proposal_en": string}. ' +
      'Highlight the candidate matching skills, UTC-4 timezone overlap with US/Americas, and W-8BEN contractor readiness.';

    const userPrompt =
      `Candidate CV / Skills:\n${cvText.slice(0, 1500)}\n\n` +
      `Target Job: ${jobTitle} at ${jobCompany}\n` +
      `Job Description: ${targetJob ? stripHtml(targetJob.description).slice(0, 700) : 'Global remote position'}`;

    const aiOut = await runWorkersAiJson(env, [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: userPrompt }
    ], 700);

    if (aiOut && typeof aiOut === 'object') {
      if (typeof aiOut.analysis_es === 'string' && aiOut.analysis_es.trim()) {
        analysisEs = stripHtml(aiOut.analysis_es.trim());
      }
      if (typeof aiOut.analysis_en === 'string' && aiOut.analysis_en.trim()) {
        analysisEn = stripHtml(aiOut.analysis_en.trim());
      }
      if (typeof aiOut.proposal_es === 'string' && aiOut.proposal_es.trim()) {
        proposalEs = aiOut.proposal_es.trim();
      }
      if (typeof aiOut.proposal_en === 'string' && aiOut.proposal_en.trim()) {
        proposalEn = aiOut.proposal_en.trim();
      }
      usedWorkersAi = true;
    }
  }

  return {
    ok: true,
    ai_engine: usedWorkersAi ? DEFAULT_FAST_MODEL : 'edge-deterministic-analyzer',
    detected_profile: {
      categories: cvAttrs.categories,
      category_labels_es: catLabelsEs,
      category_labels_en: catLabelsEn,
      matched_skills: cvAttrs.matchedKeywords,
      experience: cvAttrs.experience,
      languages: cvAttrs.languages
    },
    target_job: targetJob
      ? {
          job_hash: targetJob.job_hash,
          title: targetJob.title,
          company: targetJob.company,
          platform_name: targetJob.platform_name,
          total_score: targetJob.total_score,
          url: jobUrl
        }
      : null,
    top_matches: topMatches.map(m => ({
      job_hash: m.job_hash,
      title: m.title,
      company: m.company,
      platform_name: m.platform_name,
      total_score: m.total_score,
      verdict: m.verdict,
      location: m.location,
      url: m.url
    })),
    analysis_es: analysisEs,
    analysis_en: analysisEn,
    proposal_es: proposalEs,
    proposal_en: proposalEn
  };
}
