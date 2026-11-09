/**
 * Dynamic Customizable Evaluation & Filtering Engine
 * Replaces personal selection criteria with user-customizable filters:
 *   1. Position Type & Custom Keywords (0-40 pts)
 *   2. 100% Remote from Bolivia Eligibility (0-25 pts + Mandatory Eligibility Filter)
 *   3. Contract Type (Full-Time, Half-Time, Projects, Hourly, Advisory) & Experience Level (0-20 pts)
 *   4. Languages (ES, EN, FR, PT) (0-15 pts)
 */

export const POSITION_CATEGORIES = [
  {
    id: 'software',
    label_es: 'Desarrollo de Software, Web & QA',
    label_en: 'Software, Web Development & QA',
    icon: '💻',
    keywords: [
      'software engineer', 'software developer', 'developer', 'fullstack', 'full-stack',
      'backend', 'front-end', 'frontend', 'react', 'node.js', 'nodejs', 'nest.js',
      'python', 'django', '.net', 'c#', 'java', 'golang', 'rust', 'rails', 'ruby',
      'qa', 'sdet', 'tester', 'testlio', 'testing', 'automation engineer', 'sdk',
      'mobile', 'ios', 'android', 'web', 'api', 'ingeniero de software', 'desarrollador'
    ]
  },
  {
    id: 'cloud_sys',
    label_es: 'Cloud, DevOps, SRE & Sistemas TI',
    label_en: 'Cloud, DevOps, SRE & IT Systems',
    icon: '☁️',
    keywords: [
      'cloud', 'devops', 'sre', 'sysadmin', 'systems engineer', 'system administrator',
      'administrateur systèmes', 'ingénieur cloud', 'azure', 'aws', 'gcp', 'm365',
      'microsoft 365', 'office 365', 'entra', 'intune', 'linux', 'ubuntu', 'debian',
      'rhel', 'kernel', 'kubernetes', 'terraform', 'docker', 'noc', 'msp', 'rmm',
      'psa', 'infrastructure', 'cloudflare', 'vmware', 'hyper-v', 'proxmox', 'powershell',
      'active directory', 'liongard', 'it glue', 'autotask', 'ninjaone', 'acronis', 'veeam'
    ]
  },
  {
    id: 'ai_rlhf',
    label_es: 'Entrenamiento de IA, RLHF & Evaluación',
    label_en: 'AI Training, RLHF & Evaluation',
    icon: '🤖',
    keywords: [
      'ai trainer', 'ai evaluator', 'rlhf', 'prompt', 'context engineer', 'annotation',
      'annotator', 'rater', 'quality assurance rater', 'rubric', 'llm', 'generative ai',
      'ai logic', 'ai coding', 'ai solutions', 'agentic', 'outlier', 'mercor', 'alignerr',
      'mindrift', 'dataannotation', 'imerit', 'entrenador de ia', 'evaluador'
    ]
  },
  {
    id: 'data',
    label_es: 'Datos, SQL, BI & Machine Learning',
    label_en: 'Data Engineering, SQL, BI & ML',
    icon: '📊',
    keywords: [
      'data engineer', 'data analyst', 'data science', 'data scientist', 'database',
      'dba', 'sql', 'postgres', 'multigres', 'analytics', 'pandas', 'machine learning',
      'ml', 'mlops', 'etl', 'bi', 'snowflake', 'databricks', 'rag', 'mcp', 'ollama',
      'langchain', 'datos', 'analista de datos'
    ]
  },
  {
    id: 'cyber',
    label_es: 'Ciberseguridad & Redes',
    label_en: 'Cybersecurity & Networking',
    icon: '🛡️',
    keywords: [
      'security', 'cybersecurity', 'cybersécurité', 'sécurité', 'penetration tester',
      'pentest', 'red team', 'detection', 'response', 'soc', 'siem', 'edr', 'mdr',
      'itdr', 'iam', 'network engineer', 'huntress', 'blackpoint', 'sentinelone',
      'crowdstrike', 'ciberseguridad', 'seguridad'
    ]
  },
  {
    id: 'support',
    label_es: 'Soporte Técnico, Helpdesk & Atención al Cliente',
    label_en: 'Technical Support, Helpdesk & Customer Service',
    icon: '🎧',
    keywords: [
      'support', 'soporte', 'helpdesk', 'help desk', 'service desk', 'customer service',
      'customer solutions', 'customer success', 'tier 1', 'tier 2', 'tier 3', 'tier iii',
      'l1', 'l2', 'dispatch', 'technical assistance', 'troubleshooting', 'consumer support',
      'patient care', 'atención al cliente', 'mesa de ayuda'
    ]
  },
  {
    id: 'product_mgmt',
    label_es: 'Gestión, Producto, Ventas & Consultoría',
    label_en: 'Management, Product, Sales & Consulting',
    icon: '📈',
    keywords: [
      'product manager', 'engineering manager', 'project manager', 'manager', 'director',
      'vice president', 'vp', 'consultant', 'consulting', 'advisor', 'advisory',
      'consultation', 'sales', 'account', 'operations', 'hr', 'talent acquisition',
      'analyst relations', 'growth', 'génération de la demande', 'business central', 'salesforce'
    ]
  },
  {
    id: 'design_other',
    label_es: 'Diseño, Ingeniería CAD/CFD, Redacción & Otros',
    label_en: 'Design, CAD/CFD Engineering, Writing & Other',
    icon: '🎨',
    keywords: [
      'design', 'designer', 'ui', 'ux', 'cad', 'cfd', 'mechanical', 'simulation',
      'technical writer', 'documentation', 'copywriter', 'translation', 'localization',
      'communications', 'financial', 'nurse', 'redacción', 'diseño', 'traducción'
    ]
  }
];

export const LANGUAGE_OPTIONS = [
  { id: 'es', label_es: 'Español', label_en: 'Spanish', flag: '🇧🇴' },
  { id: 'en', label_es: 'Inglés', label_en: 'English', flag: '🇬🇧' },
  { id: 'fr', label_es: 'Francés', label_en: 'French', flag: '🇫🇷' },
  { id: 'pt', label_es: 'Portugués', label_en: 'Portuguese', flag: '🇧🇷' }
];

export const EXPERIENCE_OPTIONS = [
  { id: 'all', label_es: 'Todos los niveles', label_en: 'All levels' },
  { id: 'entry', label_es: 'Inicial / Sin Exp. (0-1 años)', label_en: 'Entry / Intern (0-1 yrs)' },
  { id: 'junior', label_es: 'Junior (1-2 años)', label_en: 'Junior (1-2 yrs)' },
  { id: 'mid', label_es: 'Semi-Senior / Mid (3-5 años)', label_en: 'Mid-Level (3-5 yrs)' },
  { id: 'senior', label_es: 'Senior (5+ años)', label_en: 'Senior (5+ yrs)' },
  { id: 'lead', label_es: 'Lead / Principal / Manager (8+ años)', label_en: 'Lead / Manager (8+ yrs)' }
];

export const CONTRACT_OPTIONS = [
  { id: 'full_time', label_es: 'Tiempo Completo (Full-Time)', label_en: 'Full-Time (40h/wk)', icon: '🏢' },
  { id: 'half_time', label_es: 'Medio Tiempo / Part-Time', label_en: 'Half-Time / Part-Time', icon: '🌗' },
  { id: 'projects', label_es: 'Por Proyectos / Freelance', label_en: 'Projects / Freelance', icon: '📦' },
  { id: 'hourly', label_es: 'Por Horas / Flexible / Asíncrono', label_en: 'Hourly / Flexible / Async', icon: '⏱️' },
  { id: 'advisory', label_es: 'Consultoría / Asesoría', label_en: 'Advisory / Consultation', icon: '🎙️' }
];

export const DEFAULT_FILTERS = {
  ui_lang: 'es',
  require_bolivia_remote: true,
  languages: ['es', 'en'],
  position_types: [],
  custom_keywords: '',
  strict_position_match: false,
  experience_levels: ['all'],
  contract_types: ['full_time', 'half_time', 'projects', 'hourly', 'advisory']
};

/**
 * Checks if an opportunity can be worked 100% remotely from Bolivia (UTC-4).
 */
export function checkBoliviaRemoteEligibility(item) {
  const loc = String(item.location || 'Remote Worldwide').trim();
  const locLow = loc.toLowerCase();
  const titleLow = String(item.title || '').toLowerCase();
  const descLow = String(item.description || '').toLowerCase();
  const tagsLow = String(item.tags || '').toLowerCase();
  const blob = `${titleLow} ${locLow} ${descLow} ${tagsLow}`;

  const hardExclusions = [
    { re: /\b(?:us|usa|united states)\s+only\b/i, es: 'Solo residentes en EE. UU.', en: 'US residents only' },
    { re: /\bmust reside in the (?:us|united states)\b/i, es: 'Exige residencia física en EE. UU.', en: 'Requires physical US residency' },
    { re: /\bu\.s\.-based\b/i, es: 'Exclusivo para contratistas dentro de EE. UU.', en: 'Restricted to U.S.-based contractors' },
    { re: /\bus citizens only\b|\bsecret clearance\b|\bts\/sci\b|\bfedramp\b/i, es: 'Requiere ciudadanía de EE. UU. o autorización federal', en: 'Requires US citizenship or clearance' },
    { re: /\bw-2 only\b/i, es: 'Contrato W-2 exclusivo de EE. UU.', en: 'US W-2 employment only' },
    { re: /\bm[eé]xico only\b/i, es: 'Restringido exclusivamente a México', en: 'Restricted to Mexico only' },
    { re: /\bspeakers in spain\b|\bin spain\b/i, es: 'Requiere residencia en España', en: 'Requires residency in Spain' },
    { re: /\bspeakers in france\b|\bin france\b/i, es: 'Requiere residencia en Francia', en: 'Requires residency in France' },
    { re: /\beligible in bulgaria\b/i, es: 'Restringido a Bulgaria', en: 'Restricted to Bulgaria' },
    { re: /\(africa\)/i, es: 'Restringido a África', en: 'Restricted to Africa' },
    { re: /\(canada\)/i, es: 'Restringido a Canadá', en: 'Restricted to Canada' },
    { re: /\(us\)|\bus remote\b/i, es: 'Remoto exclusivo dentro de EE. UU.', en: 'US-only remote position' },
    { re: /\buk only\b|\bunited kingdom only\b/i, es: 'Restringido a Reino Unido', en: 'UK only' },
    { re: /\beu citizens only\b|\beurope only\b/i, es: 'Restringido a Unión Europea', en: 'EU only' },
    { re: /\bon-site only\b|\bpresencial\b|\bhybrid in\b/i, es: 'No es 100% remoto (presencial/híbrido)', en: 'Not 100% remote (on-site/hybrid)' }
  ];

  for (const rule of hardExclusions) {
    if (rule.re.test(titleLow) || rule.re.test(locLow) || rule.re.test(descLow)) {
      return {
        eligible: false,
        score: 0,
        tier: 'restricted',
        badge_es: '🚫 Restringido Geográficamente',
        badge_en: '🚫 Geo-Restricted',
        reason_es: rule.es,
        reason_en: rule.en
      };
    }
  }

  const strictBlockedLocations = new Set([
    'united states', 'usa', 'u.s.', 'europe', 'uk', 'united kingdom',
    'canada', 'mexico', 'méxico', 'spain', 'france', 'australia', 'germany', 'india'
  ]);
  if (strictBlockedLocations.has(locLow)) {
    return {
      eligible: false,
      score: 0,
      tier: 'restricted',
      badge_es: `🚫 Solo ${loc}`,
      badge_en: `🚫 ${loc} Only`,
      reason_es: `Ubicación restringida a ${loc} (no disponible desde Bolivia).`,
      reason_en: `Location restricted to ${loc} (not available from Bolivia).`
    };
  }

  // Country list that lists many countries but excludes Bolivia / LATAM / Worldwide
  if (
    locLow.includes('united states') &&
    !locLow.includes('bolivia') &&
    !locLow.includes('latam') &&
    !locLow.includes('latin america') &&
    !locLow.includes('south america') &&
    !locLow.includes('worldwide') &&
    !locLow.includes('anywhere')
  ) {
    // Check if it's a multi-country list that at least includes South America (Argentina/Brazil) or if it excludes Bolivia
    if (locLow.includes('argentina') || locLow.includes('brazil')) {
      return {
        eligible: true,
        score: 21,
        tier: 'worldwide',
        badge_es: '🌎 Multi-País / Sudamérica',
        badge_en: '🌎 Multi-Country / South America',
        reason_es: 'Abierto a múltiples países incluyendo Sudamérica / contratistas internacionales.',
        reason_en: 'Open across multiple countries including South America / international contractors.'
      };
    }
    return {
      eligible: false,
      score: 0,
      tier: 'restricted',
      badge_es: '🚫 Restringido a EE. UU.',
      badge_en: '🚫 US Restricted',
      reason_es: 'Ubicación limitada a EE. UU.',
      reason_en: 'Location restricted to the United States.'
    };
  }

  // Tier 1: Explicit Bolivia, LATAM, South America, Americas, or UTC-4 / EST alignment
  if (
    /\b(?:bolivia|latam|latin america|south america|americas|andean|utc-4|est|edt|w-8ben)\b/i.test(blob)
  ) {
    return {
      eligible: true,
      score: 25,
      tier: 'bolivia_latam',
      badge_es: '🇧🇴 Ideal desde Bolivia / LATAM (UTC-4)',
      badge_en: '🇧🇴 Ideal from Bolivia / LATAM (UTC-4)',
      reason_es: '100% remoto con alineación directa para Bolivia, Latinoamérica o zona horaria UTC-4.',
      reason_en: '100% remote with direct eligibility for Bolivia, LATAM, or UTC-4 timezone.'
    };
  }

  // Tier 2: Worldwide / Work From Anywhere / Global Remote
  if (
    /\b(?:worldwide|anywhere|global|international|télétravail|remote)\b/i.test(locLow) ||
    /\b(?:work from anywhere|anywhere in the world|remote worldwide|global remote)\b/i.test(blob)
  ) {
    return {
      eligible: true,
      score: 23,
      tier: 'worldwide',
      badge_es: '🌍 100% Remoto Global (Apto Bolivia)',
      badge_en: '🌍 100% Global Remote (Bolivia Eligible)',
      reason_es: 'Posición 100% remota global ("Work From Anywhere"), apta para postular desde Bolivia.',
      reason_en: '100% global remote ("Work From Anywhere") position, open to applicants from Bolivia.'
    };
  }

  // Tier 3: Timezone overlap (e.g. CET +/- 3 hours or USA/Canada timezones)
  return {
    eligible: true,
    score: 19,
    tier: 'timezone_overlap',
    badge_es: '🕒 Remoto Internacional (Huso Horario)',
    badge_en: '🕒 International Remote (Timezone Overlap)',
    reason_es: `100% remoto internacional con requisito de traslape horario (${loc}).`,
    reason_en: `100% international remote with timezone overlap requirement (${loc}).`
  };
}

/**
 * Infers languages, contract types, experience level, and position categories for an offer.
 */
export function detectOfferAttributes(item) {
  const title = String(item.title || '');
  const desc = String(item.description || '');
  const tags = String(item.tags || '');
  const loc = String(item.location || '');
  const track = String(item.track || '');
  const caveat = String(item.contract_caveat || 'fractional_or_fulltime');

  const blob = `${title} ${desc} ${tags} ${loc} ${track}`.toLowerCase();

  // 1. Languages
  const langs = new Set();
  if (/\b(?:spanish|español|espanol|andean|castellano|bilingual|trilingual)\b/i.test(blob)) {
    langs.add('es');
  }
  if (/\b(?:french|français|francais|francophone|télétravail)\b/i.test(blob) || track.includes('Track D')) {
    langs.add('fr');
  }
  if (/\b(?:portuguese|português|portugues|brazil)\b/i.test(blob)) {
    langs.add('pt');
  }
  // Most international remote descriptions in English require or accept English unless exclusively in FR/ES
  const isFrenchTitle = /\b(?:ingénieur|administrateur|gestionnaire|télétravail)\b/i.test(title);
  const isSpanishTitle = /\b(?:ingeniero|especialista|analista|desarrollador)\b/i.test(title);
  if (!isFrenchTitle && !isSpanishTitle) {
    langs.add('en');
  } else if (/\b(?:english|anglais|inglés|bilingual|trilingual)\b/i.test(blob)) {
    langs.add('en');
  }
  if (langs.size === 0) {
    langs.add('en');
  }

  // 2. Contract Types
  const contracts = new Set();
  if (caveat === 'micro_advisory' || /\b(?:advisory|consultation|60-min|honorarium|expert network|council)\b/i.test(blob)) {
    contracts.add('advisory');
    contracts.add('hourly');
  }
  if (caveat === 'async_flexible' || /\b(?:self-paced|async|asynchronous|per hour|\/hr|hourly|flexible hours)\b/i.test(blob)) {
    contracts.add('hourly');
    contracts.add('projects');
  }
  if (caveat === 'fractional_friendly' || /\b(?:part-time|half-time|20 hours|20h|4 day week|4-day week|fractional|temps partiel)\b/i.test(blob)) {
    contracts.add('half_time');
    contracts.add('projects');
  }
  if (/\b(?:freelance|contract|contractor|project|b2b|independent contractor|w-8ben)\b/i.test(blob)) {
    contracts.add('projects');
  }
  if (caveat === 'full_time_only' || caveat === 'fractional_or_fulltime' || /\b(?:full-time|full time|40 hrs|40h|permanent)\b/i.test(blob)) {
    contracts.add('full_time');
  }
  if (contracts.size === 0) {
    contracts.add('full_time');
  }

  // 3. Experience Level
  let experience = 'mid';
  if (/\b(?:intern|internship|pasante|trainee|entry-level|entry level|sin experiencia)\b/i.test(blob)) {
    experience = 'entry';
  } else if (/\b(?:junior|jr\.?|associate|l1|tier 1|level 1|1\+?\s*years?)\b/i.test(blob)) {
    experience = 'junior';
  } else if (/\b(?:principal|staff|lead|director|vp|vice president|head of|engineering manager|architect|senior manager)\b/i.test(title.toLowerCase())) {
    experience = 'lead';
  } else if (/\b(?:senior|sr\.?|tier 3|tier iii|5\+?\s*years?|6\+?\s*years?|7\+?\s*years?)\b/i.test(blob)) {
    experience = 'senior';
  } else if (/\b(?:ai trainer|rater|annotator|evaluator)\b/i.test(title.toLowerCase()) && !/\bsenior\b/i.test(title.toLowerCase())) {
    experience = 'entry'; // Many AI trainer/rater roles are open to entry/junior/mid domain speakers
  }

  // 4. Position Categories & Matched Skills
  const matchedCategories = [];
  const matchedKeywords = new Set();

  for (const cat of POSITION_CATEGORIES) {
    let catHits = 0;
    for (const kw of cat.keywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');
      if (re.test(blob)) {
        catHits++;
        matchedKeywords.add(kw);
      }
    }
    if (catHits > 0) {
      matchedCategories.push({ id: cat.id, hits: catHits, label_es: cat.label_es, label_en: cat.label_en });
    }
  }

  matchedCategories.sort((a, b) => b.hits - a.hits);

  return {
    languages: Array.from(langs),
    contracts: Array.from(contracts),
    experience,
    categories: matchedCategories.map(c => c.id),
    matchedKeywords: Array.from(matchedKeywords).slice(0, 12)
  };
}

/**
 * Evaluates a single opportunity dynamically against the user's selected filters.
 */
export function evaluateOpportunity(item, rawFilters = {}) {
  const filters = { ...DEFAULT_FILTERS, ...rawFilters };
  const bolivia = checkBoliviaRemoteEligibility(item);
  const attrs = detectOfferAttributes(item);

  const titleLow = String(item.title || '').toLowerCase();
  const descLow = String(item.description || '').toLowerCase();
  const tagsLow = String(item.tags || '').toLowerCase();
  const compLow = String(item.company || '').toLowerCase();
  const blob = `${titleLow} ${compLow} ${tagsLow} ${descLow}`;

  // ---------------------------------------------------------------------------
  // 1. Position Type & Custom Keywords Score (0 - 40 pts)
  // ---------------------------------------------------------------------------
  const selectedPositions = Array.isArray(filters.position_types) ? filters.position_types.filter(Boolean) : [];
  const customKws = String(filters.custom_keywords || '')
    .split(/[,;]+/)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  let positionScore = 0;
  let matchedUserKeywords = [];
  let matchesPositionFilter = true;

  const hasPositionFilter = selectedPositions.length > 0 || customKws.length > 0;

  if (!hasPositionFilter) {
    // Base score varies by how many concrete skills/categories were detected in the offer
    positionScore = Math.min(34, 18 + Math.min(16, attrs.matchedKeywords.length * 3));
  } else {
    let catMatchCount = 0;
    let primaryCategoryMatch = false;
    for (const posId of selectedPositions) {
      if (attrs.categories.includes(posId)) {
        catMatchCount++;
        if (attrs.categories[0] === posId) {
          primaryCategoryMatch = true;
        }
      }
    }

    for (const ukw of customKws) {
      if (blob.includes(ukw)) {
        matchedUserKeywords.push(ukw);
      }
    }

    if (selectedPositions.length > 0 && catMatchCount > 0) {
      const baseCat = primaryCategoryMatch ? 24 : 18;
      positionScore += Math.min(34, baseCat + (catMatchCount - 1) * 4 + Math.min(8, attrs.matchedKeywords.length * 2));
    }
    if (customKws.length > 0 && matchedUserKeywords.length > 0) {
      const kwBonus = Math.min(26, matchedUserKeywords.length * 13);
      positionScore = Math.min(40, Math.max(positionScore, 16) + kwBonus);
    } else if (customKws.length > 0 && matchedUserKeywords.length === 0 && selectedPositions.length > 0 && catMatchCount > 0) {
      // Category matched, but custom keyword wasn't found -> cap in POSSIBLE range
      positionScore = Math.min(22, positionScore);
    }

    if (catMatchCount === 0 && matchedUserKeywords.length === 0) {
      matchesPositionFilter = false;
      positionScore = 6;
    } else {
      positionScore = Math.min(40, positionScore);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Bolivia 100% Remote Eligibility Score (0 - 25 pts)
  // ---------------------------------------------------------------------------
  const boliviaScore = bolivia.score;

  // ---------------------------------------------------------------------------
  // 3. Contract Type (Max 12) & Experience Level (Max 8) -> (0 - 20 pts)
  // ---------------------------------------------------------------------------
  const selectedContracts = Array.isArray(filters.contract_types) && filters.contract_types.length > 0
    ? filters.contract_types
    : ['full_time', 'half_time', 'projects', 'hourly', 'advisory'];

  const contractOverlap = attrs.contracts.filter(c => selectedContracts.includes(c));
  let contractPart = 3;
  if (contractOverlap.length > 0) {
    // Higher score if the offer specifically highlights flexible/project/half-time/explicit modality
    contractPart = attrs.contracts.length > 1 ? 12 : 10;
  }

  const selectedExp = Array.isArray(filters.experience_levels) && filters.experience_levels.length > 0
    ? filters.experience_levels
    : ['all'];

  let expPart = 7;
  if (!selectedExp.includes('all')) {
    if (selectedExp.includes(attrs.experience)) {
      expPart = 8;
    } else if (
      (selectedExp.includes('junior') && attrs.experience === 'entry') ||
      (selectedExp.includes('entry') && attrs.experience === 'junior') ||
      (selectedExp.includes('mid') && (attrs.experience === 'junior' || attrs.experience === 'senior')) ||
      (selectedExp.includes('senior') && (attrs.experience === 'mid' || attrs.experience === 'lead'))
    ) {
      expPart = 5;
    } else {
      expPart = 1;
    }
  }
  const contractExpScore = contractPart + expPart; // Max 20

  // ---------------------------------------------------------------------------
  // 4. Language Match Score (0 - 15 pts)
  // ---------------------------------------------------------------------------
  const selectedLangs = Array.isArray(filters.languages) && filters.languages.length > 0
    ? filters.languages
    : ['es', 'en'];

  const langOverlap = attrs.languages.filter(l => selectedLangs.includes(l));
  let languageScore = 0;
  if (langOverlap.length > 0) {
    // Bonus if offer explicitly welcomes Spanish or multilingual LATAM talent when user speaks ES
    if (selectedLangs.includes('es') && attrs.languages.includes('es')) {
      languageScore = 15;
    } else if (langOverlap.length >= 2) {
      languageScore = 15;
    } else {
      languageScore = 13;
    }
  } else {
    languageScore = 2;
  }

  // ---------------------------------------------------------------------------
  // Total Score & Verdict
  // ---------------------------------------------------------------------------
  let totalScore = positionScore + boliviaScore + contractExpScore + languageScore;

  let verdict = 'SKIP';
  if (!bolivia.eligible) {
    totalScore = Math.min(totalScore, 30);
    verdict = 'SKIP';
  } else if (hasPositionFilter && !matchesPositionFilter) {
    totalScore = Math.min(totalScore, 48);
    verdict = 'SKIP';
  } else if (langOverlap.length === 0) {
    totalScore = Math.min(totalScore, 52);
    verdict = 'SKIP';
  } else if (contractOverlap.length === 0) {
    totalScore = Math.min(totalScore, 54);
    verdict = 'SKIP';
  } else if (!selectedExp.includes('all') && expPart <= 1) {
    totalScore = Math.min(totalScore, 64);
    verdict = totalScore >= 55 ? 'POSSIBLE' : 'SKIP';
  } else if (totalScore >= 78) {
    verdict = 'APPLY';
  } else if (totalScore >= 58) {
    verdict = 'POSSIBLE';
  } else {
    verdict = 'SKIP';
  }

  // Build transparent, helpful notes in Spanish (Bolivia) and English
  const contractLabelsEs = {
    full_time: 'Tiempo Completo',
    half_time: 'Medio Tiempo / Part-Time',
    projects: 'Por Proyectos / Freelance',
    hourly: 'Por Horas / Flexible',
    advisory: 'Consultoría / Asesoría'
  };
  const contractLabelsEn = {
    full_time: 'Full-Time',
    half_time: 'Half-Time / Part-Time',
    projects: 'Projects / Freelance',
    hourly: 'Hourly / Flexible',
    advisory: 'Advisory / Consultation'
  };
  const expLabelsEs = {
    entry: 'Inicial / Sin Exp.',
    junior: 'Junior',
    mid: 'Semi-Senior / Intermedio',
    senior: 'Senior',
    lead: 'Lead / Principal / Manager'
  };
  const expLabelsEn = {
    entry: 'Entry-Level',
    junior: 'Junior',
    mid: 'Mid-Level',
    senior: 'Senior',
    lead: 'Lead / Principal / Manager'
  };

  const cStrEs = attrs.contracts.map(c => contractLabelsEs[c] || c).join(', ');
  const cStrEn = attrs.contracts.map(c => contractLabelsEn[c] || c).join(', ');
  const lStr = attrs.languages.map(l => l.toUpperCase()).join('/');

  const notesEsParts = [bolivia.reason_es];
  const notesEnParts = [bolivia.reason_en];

  notesEsParts.push(`Modalidad: ${cStrEs} · Nivel: ${expLabelsEs[attrs.experience] || 'Intermedio'} · Idiomas: ${lStr}.`);
  notesEnParts.push(`Contract: ${cStrEn} · Level: ${expLabelsEn[attrs.experience] || 'Mid-Level'} · Languages: ${lStr}.`);

  if (matchedUserKeywords.length > 0) {
    notesEsParts.push(`Coincide con tus palabras clave: ${matchedUserKeywords.join(', ')}.`);
    notesEnParts.push(`Matches your keywords: ${matchedUserKeywords.join(', ')}.`);
  }

  const allSkills = Array.from(new Set([...matchedUserKeywords, ...attrs.matchedKeywords]));

  return {
    ...item,
    bolivia_eligible: bolivia.eligible,
    bolivia_badge_es: bolivia.badge_es,
    bolivia_badge_en: bolivia.badge_en,
    verdict,
    total_score: totalScore,
    position_score: positionScore,
    bolivia_score: boliviaScore,
    contract_exp_score: contractExpScore,
    language_score: languageScore,
    detected_languages: attrs.languages,
    detected_contracts: attrs.contracts,
    detected_experience: attrs.experience,
    detected_categories: attrs.categories,
    matched_skills: allSkills.join(', ') || (item.tags || 'remoto'),
    notes_es: notesEsParts.join(' '),
    notes_en: notesEnParts.join(' ')
  };
}

/**
 * Evaluates a list of opportunities and sorts them by score descending.
 */
export function evaluateAllOpportunities(opportunities, filters = {}) {
  const requireBolivia = filters.require_bolivia_remote !== false;
  const evaluated = opportunities.map(opp => evaluateOpportunity(opp, filters));

  evaluated.sort((a, b) => {
    if (a.bolivia_eligible !== b.bolivia_eligible) {
      return a.bolivia_eligible ? -1 : 1;
    }
    if (b.total_score !== a.total_score) {
      return b.total_score - a.total_score;
    }
    return String(b.discovered_at || '').localeCompare(String(a.discovered_at || ''));
  });

  const surfaced = requireBolivia
    ? evaluated.filter(r => r.bolivia_eligible)
    : evaluated;

  const geoExcluded = evaluated.filter(r => !r.bolivia_eligible);

  return {
    surfaced,
    all: evaluated,
    apply: surfaced.filter(r => r.verdict === 'APPLY'),
    possible: surfaced.filter(r => r.verdict === 'POSSIBLE'),
    skip: surfaced.filter(r => r.verdict === 'SKIP'),
    geo_excluded: geoExcluded
  };
}

/**
 * Generates the on-the-fly "Resultados" / "Results" markdown report.
 */
export function generateResultsMarkdown(evalResult, filters = {}, lang = 'es', platformsCount = 73, lastSyncIso = '') {
  const isEs = lang !== 'en';
  const dateStr = new Date().toISOString().slice(0, 10);
  const syncStr = lastSyncIso || new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

  const { apply, possible, skip, geo_excluded } = evalResult;
  const langsSelected = (filters.languages || ['es', 'en']).map(l => l.toUpperCase()).join(', ');
  const contractsSelected = (filters.contract_types || []).join(', ') || (isEs ? 'Todos' : 'All');
  const expSelected = (filters.experience_levels || ['all']).join(', ');
  const customKw = filters.custom_keywords || (isEs ? 'Ninguna (Todas las áreas)' : 'None (All areas)');

  if (isEs) {
    const lines = [
      `# 🇧🇴 Resultados de Ofertas Remotas desde Bolivia — ${dateStr}`,
      `**Plataformas Monitoreadas:** ${platformsCount} Portales Globales y Regionales | **Última Actualización:** ${syncStr} | **Frecuencia:** En vivo + Automático cada 15 min`,
      `**Filtro Base Activo:** 100% Remoto desde Bolivia (UTC-4 / LATAM / Global)`,
      `**Tus Filtros Activos:** Idiomas: \`${langsSelected}\` | Experiencia: \`${expSelected}\` | Contratos: \`${contractsSelected}\` | Palabras Clave: \`${customKw}\``,
      '',
      '## 📊 Resumen de Resultados en Vivo',
      `- **🔥 POSTULAR (Puntaje >= 75):** ${apply.length} ofertas altamente recomendadas`,
      `- **🟡 EXPLORAR (Puntaje 55–74):** ${possible.length} ofertas compatibles / secundarias`,
      `- **⚪ BAJA COINCIDENCIA (< 55 pts):** ${skip.length} ofertas fuera de tus filtros actuales`,
      `- **🚫 BLOQUEADAS POR PAÍS (No aptas desde Bolivia):** ${geo_excluded.length} ofertas filtradas automáticamente`,
      '',
      '## 🔥 Ofertas Principales para Postular (POSTULAR — Puntaje >= 75)'
    ];

    if (apply.length > 0) {
      lines.push(
        '| Puntaje | Plataforma / Empresa | Posición / Oferta | Ubicación / Elegibilidad | Desglose (Pos/Bol/Cont/Idiom) |',
        '| :--- | :--- | :--- | :--- | :--- |'
      );
      for (const r of apply.slice(0, 40)) {
        const bd = `${r.position_score}/${r.bolivia_score}/${r.contract_exp_score}/${r.language_score}`;
        lines.push(
          `| **${r.total_score}/100** | **${r.platform_name}** (${r.company}) | [${r.title}](${r.url}) | ${r.location} | \`${bd}\` |`
        );
      }
    } else {
      lines.push('_No hay ofertas con puntaje >= 75 para la combinación actual de filtros. Prueba ampliando tus filtros de posición o contrato._');
    }

    lines.push('', '## 🟡 Ofertas para Explorar (EXPLORAR — Puntaje 55–74)');
    if (possible.length > 0) {
      lines.push(
        '| Puntaje | Plataforma / Empresa | Posición / Oferta | Ubicación | Notas de Evaluación |',
        '| :--- | :--- | :--- | :--- | :--- |'
      );
      for (const r of possible.slice(0, 35)) {
        lines.push(
          `| **${r.total_score}/100** | **${r.platform_name}** (${r.company}) | [${r.title}](${r.url}) | ${r.location} | ${r.notes_es} |`
        );
      }
    } else {
      lines.push('_No hay ofertas secundarias en este rango._');
    }

    return lines.join('\n') + '\n';
  } else {
    const lines = [
      `# 🇧🇴 Bolivia 100% Remote Job Results — ${dateStr}`,
      `**Monitored Platforms:** ${platformsCount} Global & Regional Portals | **Last Synced:** ${syncStr} | **Schedule:** On-Demand + Every 15 mins`,
      `**Core Filter Active:** 100% Remote Eligible from Bolivia (UTC-4 / LATAM / Worldwide)`,
      `**Your Active Filters:** Languages: \`${langsSelected}\` | Experience: \`${expSelected}\` | Contracts: \`${contractsSelected}\` | Keywords: \`${customKw}\``,
      '',
      '## 📊 On-the-Fly Results Summary',
      `- **🔥 APPLY (Score >= 75):** ${apply.length} high-match remote positions`,
      `- **🟡 POSSIBLE (Score 55–74):** ${possible.length} secondary / compatible positions`,
      `- **⚪ LOW MATCH (< 55 pts):** ${skip.length} positions outside current filter preferences`,
      `- **🚫 GEO-RESTRICTED (Not eligible from Bolivia):** ${geo_excluded.length} positions automatically filtered out`,
      '',
      '## 🔥 Top Positions to Apply (APPLY — Score >= 75)'
    ];

    if (apply.length > 0) {
      lines.push(
        '| Score | Platform / Company | Role / Opportunity | Location / Eligibility | Breakdown (Role/Bol/Cont/Lang) |',
        '| :--- | :--- | :--- | :--- | :--- |'
      );
      for (const r of apply.slice(0, 40)) {
        const bd = `${r.position_score}/${r.bolivia_score}/${r.contract_exp_score}/${r.language_score}`;
        lines.push(
          `| **${r.total_score}/100** | **${r.platform_name}** (${r.company}) | [${r.title}](${r.url}) | ${r.location} | \`${bd}\` |`
        );
      }
    } else {
      lines.push('_No positions scored >= 75 with your current filters. Try broadening your position or contract filters._');
    }

    lines.push('', '## 🟡 Secondary Positions to Explore (POSSIBLE — Score 55–74)');
    if (possible.length > 0) {
      lines.push(
        '| Score | Platform / Company | Role / Opportunity | Location | Evaluation Notes |',
        '| :--- | :--- | :--- | :--- | :--- |'
      );
      for (const r of possible.slice(0, 35)) {
        lines.push(
          `| **${r.total_score}/100** | **${r.platform_name}** (${r.company}) | [${r.title}](${r.url}) | ${r.location} | ${r.notes_en} |`
        );
      }
    } else {
      lines.push('_No secondary positions in this score range._');
    }

    return lines.join('\n') + '\n';
  }
}
