/**
 * Dynamic Customizable Evaluation & Filtering Engine (v5.1.0)
 * Replaces personal selection criteria with user-customizable filters:
 *   1. Position Type & Custom Keywords (0-35 pts)
 *   2. 100% Remote from Bolivia Eligibility (0-25 pts + Mandatory Eligibility Filter)
 *   3. Contract Type & Experience Level (0-20 pts)
 *   4. Language Match (0-20 pts + Strict Language Filtering when 'es' is selected)
 */

export const POSITION_CATEGORIES = [
  {
    id: 'virtual_assistant',
    label_es: 'Asistencia Virtual, Administración & Data Entry',
    label_en: 'Virtual Assistant, Admin & Data Entry',
    icon: '📋',
    keywords: [
      'virtual assistant', 'asistente virtual', 'executive assistant', 'asistente ejecutivo',
      'administrative assistant', 'asistente administrativo', 'data entry', 'ingreso de datos',
      'back office', 'secretaria', 'asistente personal', 'personal assistant', 'transcription',
      'transcriptor', 'office manager', 'asistente remoto', 'remote assistant', 'revisión de datos',
      'asistente bilingüe', 'virtual latinos', 'asistente'
    ]
  },
  {
    id: 'operations_coord',
    label_es: 'Coordinación, Operaciones & Gestión de Proyectos',
    label_en: 'Coordination, Operations & Project Management',
    icon: '📁',
    keywords: [
      'coordinator', 'coordinador', 'project coordinator', 'coordinador de proyectos',
      'operations coordinator', 'coordinador de operaciones', 'operations manager',
      'project manager', 'scrum master', 'operations associate', 'logistics coordinator',
      'coordinador de equipo', 'community coordinator', 'program coordinator', 'gestor de proyectos',
      'coordinación', 'operaciones', 'gestión'
    ]
  },
  {
    id: 'customer_support',
    label_es: 'Atención al Cliente, Helpdesk & Soporte Remoto',
    label_en: 'Customer Support, Helpdesk & Client Care',
    icon: '🎧',
    keywords: [
      'customer support', 'atención al cliente', 'customer service', 'servicio al cliente',
      'soporte', 'helpdesk', 'help desk', 'service desk', 'chat support', 'soporte por chat',
      'soporte técnico', 'technical support', 'customer success', 'customer experience',
      'agente de soporte', 'call center', 'contact center', 'dispatch', 'tier 1', 'tier 2',
      'tier 3', 'troubleshooting', 'asistencia técnica', 'soporte remoto'
    ]
  },
  {
    id: 'sales_bdr',
    label_es: 'Ventas, BDR, SDR & Prospección Comercial',
    label_en: 'Sales, BDR, SDR & Business Development',
    icon: '💼',
    keywords: [
      'sales', 'ventas', 'sdr', 'bdr', 'sales development representative', 'business development',
      'appointment setter', 'ejecutivo de cuentas', 'account executive', 'asesor comercial',
      'televentas', 'inside sales', 'lead generation', 'cold outreach', 'prospección',
      'ventas b2b', 'vendedor', 'closer', 'representante comercial', 'comercial'
    ]
  },
  {
    id: 'marketing_content',
    label_es: 'Marketing Digital, Redes Sociales & Redacción',
    label_en: 'Digital Marketing, Social Media & Content Writing',
    icon: '📱',
    keywords: [
      'marketing', 'digital marketing', 'social media', 'community manager', 'redes sociales',
      'copywriter', 'redactor', 'content writer', 'creador de contenido', 'seo', 'email marketing',
      'copywriting', 'content manager', 'moderador', 'content moderator', 'traductor',
      'translator', 'traducción', 'comunicaciones', 'communications', 'growth'
    ]
  },
  {
    id: 'hr_recruiting',
    label_es: 'Recursos Humanos, Reclutamiento & Talento',
    label_en: 'Human Resources, Recruitment & Talent',
    icon: '👥',
    keywords: [
      'recruiter', 'reclutador', 'talent acquisition', 'recursos humanos', 'human resources',
      'hr', 'rrhh', 'sourcer', 'talent scout', 'people operations', 'hr coordinator',
      'hr assistant', 'asistente de recursos humanos', 'atracción de talento'
    ]
  },
  {
    id: 'finance_accounting',
    label_es: 'Contabilidad, Finanzas & Bookkeeping',
    label_en: 'Accounting, Finance & Bookkeeping',
    icon: '💰',
    keywords: [
      'bookkeeper', 'bookkeeping', 'contabilidad', 'contador', 'accountant', 'accounting',
      'finanzas', 'finance', 'asistente contable', 'billing', 'facturación',
      'cuentas por cobrar', 'cuentas por pagar', 'quickbooks', 'xero', 'analista financiero',
      'financial analyst', 'conciliaciones', 'impuestos'
    ]
  },
  {
    id: 'design_media',
    label_es: 'Diseño Gráfico, UI/UX & Edición Multimedia',
    label_en: 'Graphic Design, UI/UX & Multimedia Editing',
    icon: '🎨',
    keywords: [
      'designer', 'diseñador', 'diseño gráfico', 'graphic design', 'ui/ux', 'ux/ui',
      'video editor', 'editor de video', 'motion graphics', 'figma', 'canva', 'photoshop',
      'illustrator', 'creativo', 'animator', 'diseñador web', 'web designer', 'multimedia'
    ]
  },
  {
    id: 'ai_rlhf',
    label_es: 'Entrenamiento de IA, RLHF & Evaluación',
    label_en: 'AI Training, RLHF & Model Evaluation',
    icon: '🤖',
    keywords: [
      'ai trainer', 'entrenador de ia', 'ai evaluator', 'evaluador de ia', 'rlhf', 'prompt',
      'prompt engineer', 'anotador', 'annotator', 'annotation', 'rater', 'quality assurance rater',
      'rubric', 'llm', 'generative ai', 'ia generativa', 'ai logic', 'ai coding', 'outlier',
      'mercor', 'alignerr', 'dataannotation', 'mindrift', 'context engineer'
    ]
  },
  {
    id: 'software',
    label_es: 'Desarrollo de Software, Web & QA',
    label_en: 'Software, Web Development & QA',
    icon: '💻',
    keywords: [
      'software engineer', 'desarrollador', 'developer', 'programador', 'fullstack', 'full-stack',
      'backend', 'frontend', 'front-end', 'react', 'node.js', 'nodejs', 'python', 'django',
      'javascript', 'typescript', 'php', 'wordpress', 'c#', '.net', 'java', 'golang',
      'qa', 'sdet', 'tester', 'testlio', 'testing', 'mobile', 'ios', 'android', 'ingeniero de software'
    ]
  },
  {
    id: 'cloud_sys',
    label_es: 'Cloud, DevOps, Infraestructura & Soporte TI',
    label_en: 'Cloud, DevOps, Infrastructure & IT Support',
    icon: '☁️',
    keywords: [
      'cloud', 'devops', 'sre', 'sysadmin', 'administrador de sistemas', 'systems engineer',
      'azure', 'aws', 'gcp', 'm365', 'microsoft 365', 'entra', 'intune', 'linux', 'ubuntu',
      'debian', 'kubernetes', 'docker', 'terraform', 'noc', 'msp', 'soporte ti', 'it support',
      'powershell', 'infrastructure', 'cloudflare', 'redes'
    ]
  },
  {
    id: 'data',
    label_es: 'Datos, SQL, BI & Automatización No-Code',
    label_en: 'Data, SQL, BI & No-Code Automation',
    icon: '📊',
    keywords: [
      'data analyst', 'analista de datos', 'data engineer', 'sql', 'power bi', 'tableau',
      'excel', 'google sheets', 'database', 'dba', 'postgres', 'analytics', 'pandas',
      'machine learning', 'bi', 'zapier', 'make', 'scraping', 'web scraping', 'etl', 'datos'
    ]
  }
];

export const LANGUAGE_OPTIONS = [
  { id: 'es', label_es: 'Español', label_en: 'Spanish' },
  { id: 'en', label_es: 'Inglés', label_en: 'English' },
  { id: 'pt', label_es: 'Portugués', label_en: 'Portuguese' }
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

  if (
    locLow.includes('united states') &&
    !locLow.includes('bolivia') &&
    !locLow.includes('latam') &&
    !locLow.includes('latin america') &&
    !locLow.includes('south america') &&
    !locLow.includes('worldwide') &&
    !locLow.includes('anywhere')
  ) {
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

  if (
    /\b(?:bolivia|latam|latin america|south america|americas|andean|utc-4|est|edt|w-8ben|hispano|latinoam[eé]rica|sudam[eé]rica)\b/i.test(blob)
  ) {
    return {
      eligible: true,
      score: 25,
      tier: 'bolivia_latam',
      badge_es: 'Ideal desde Bolivia / LATAM (UTC-4)',
      badge_en: 'Ideal from Bolivia / LATAM (UTC-4)',
      reason_es: '100% remoto con alineación directa para Bolivia, Latinoamérica o zona horaria UTC-4.',
      reason_en: '100% remote with direct eligibility for Bolivia, LATAM, or UTC-4 timezone.'
    };
  }

  if (
    /\b(?:worldwide|anywhere|global|international|remote)\b/i.test(locLow) ||
    /\b(?:work from anywhere|anywhere in the world|remote worldwide|global remote|100% remoto|remoto)\b/i.test(blob)
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
 * Robustly detects languages, contract types, experience level, and position categories.
 */
export function detectOfferAttributes(item) {
  const title = String(item.title || '');
  const desc = String(item.description || '');
  const tags = String(item.tags || '');
  const loc = String(item.location || '');
  const track = String(item.track || '');
  const caveat = String(item.contract_caveat || 'fractional_or_fulltime');

  const blob = `${title} ${desc} ${tags} ${loc} ${track}`.toLowerCase();
  const textSample = `${title} ${desc}`.toLowerCase();

  // 1. Language Detection
  const langs = new Set();

  // Spanish vocabulary & markers
  const spanishMarkers = /\b(?:spanish|español|espanol|castellano|hispano|andean|latam|bilingüe|bilingue|hablante nativo|hablante de español|spanish speaker|spanish-speaking|fluent in spanish|spanish required)\b/i;
  const spanishGrammarMarkers = /\b(?:requisitos|experiencia|funciones|trabajo|remoto|puesto|vacante|empresa|buscamos|conocimientos|habilidades|ofrecemos|beneficios|postular|años|modalidad|horario|responsabilidades|asistente|coordinador|desarrollador|inglés)\b/i;

  const isSpanishWritten = spanishGrammarMarkers.test(textSample);
  const mentionsSpanish = spanishMarkers.test(blob);

  if (isSpanishWritten || mentionsSpanish) {
    langs.add('es');
  }

  // Portuguese markers
  if (/\b(?:portuguese|português|portugues|brasileiro|brasil)\b/i.test(blob)) {
    langs.add('pt');
  }

  // English markers
  const englishGrammarMarkers = /\b(?:the|and|with|for|requirements|responsibilities|looking for|we are|skills|experience|bachelor|fluent|english required|proficiency in english)\b/i;
  const isEnglishWritten = englishGrammarMarkers.test(textSample);
  const mentionsEnglish = /\b(?:english|inglés|ingles)\b/i.test(blob);

  if (isEnglishWritten || mentionsEnglish || !isSpanishWritten) {
    langs.add('en');
  }

  if (langs.size === 0) {
    langs.add('en');
  }

  // Primary language
  let primaryLanguage = 'en';
  if (isSpanishWritten || (mentionsSpanish && !isEnglishWritten)) {
    primaryLanguage = 'es';
  }

  // 2. Contract Types
  const contracts = new Set();
  if (caveat === 'micro_advisory' || /\b(?:advisory|consultation|60-min|honorarium|expert network|council|asesor[ií]a|consultor[ií]a)\b/i.test(blob)) {
    contracts.add('advisory');
    contracts.add('hourly');
  }
  if (caveat === 'async_flexible' || /\b(?:self-paced|async|asynchronous|per hour|\/hr|hourly|flexible hours|por horas|flexible|as[ií]ncrono)\b/i.test(blob)) {
    contracts.add('hourly');
    contracts.add('projects');
  }
  if (caveat === 'fractional_friendly' || /\b(?:part-time|half-time|20 hours|20h|4 day week|4-day week|fractional|medio tiempo|media jornada)\b/i.test(blob)) {
    contracts.add('half_time');
    contracts.add('projects');
  }
  if (/\b(?:freelance|contract|contractor|project|b2b|independent contractor|w-8ben|proyectos|por proyecto)\b/i.test(blob)) {
    contracts.add('projects');
  }
  if (caveat === 'full_time_only' || caveat === 'fractional_or_fulltime' || /\b(?:full-time|full time|40 hrs|40h|permanent|tiempo completo|jornada completa)\b/i.test(blob)) {
    contracts.add('full_time');
  }
  if (contracts.size === 0) {
    contracts.add('full_time');
  }

  // 3. Experience Level
  let experience = 'mid';
  if (/\b(?:intern|internship|pasante|trainee|entry-level|entry level|sin experiencia|inicial|entry|beginner)\b/i.test(blob)) {
    experience = 'entry';
  } else if (/\b(?:junior|jr\.?|associate|l1|tier 1|level 1|1\+?\s*years?|1\+?\s*año)\b/i.test(blob)) {
    experience = 'junior';
  } else if (/\b(?:principal|staff|lead|director|vp|vice president|head of|engineering manager|architect|senior manager|líder|director|jefe)\b/i.test(title.toLowerCase())) {
    experience = 'lead';
  } else if (/\b(?:senior|sr\.?|tier 3|tier iii|5\+?\s*years?|5\+?\s*años|6\+?\s*years?|7\+?\s*years?)\b/i.test(blob)) {
    experience = 'senior';
  } else if (/\b(?:asistente virtual|virtual assistant|data entry|atención al cliente|chat support|anotador|rater)\b/i.test(title.toLowerCase()) && !/\bsenior\b/i.test(title.toLowerCase())) {
    experience = 'entry';
  }

  // 4. Position Categories
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
    primaryLanguage,
    contracts: Array.from(contracts),
    experience,
    categories: matchedCategories.map(c => c.id),
    matchedKeywords: Array.from(matchedKeywords).slice(0, 12)
  };
}

/**
 * Evaluates an opportunity dynamically against the user's selected filters.
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
  // 1. Position Type & Custom Keywords Score (0 - 35 pts)
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
    positionScore = Math.min(32, 20 + Math.min(12, attrs.matchedKeywords.length * 2));
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
      positionScore += Math.min(32, baseCat + (catMatchCount - 1) * 3 + Math.min(6, attrs.matchedKeywords.length));
    }
    if (customKws.length > 0 && matchedUserKeywords.length > 0) {
      const kwBonus = Math.min(22, matchedUserKeywords.length * 11);
      positionScore = Math.min(35, Math.max(positionScore, 16) + kwBonus);
    } else if (customKws.length > 0 && matchedUserKeywords.length === 0 && selectedPositions.length > 0 && catMatchCount > 0) {
      positionScore = Math.min(20, positionScore);
    }

    if (catMatchCount === 0 && matchedUserKeywords.length === 0) {
      matchesPositionFilter = false;
      positionScore = 5;
    } else {
      positionScore = Math.min(35, positionScore);
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
  const contractExpScore = contractPart + expPart;

  // ---------------------------------------------------------------------------
  // 4. Language Match Score (0 - 20 pts)
  // ---------------------------------------------------------------------------
  const selectedLangs = Array.isArray(filters.languages) && filters.languages.length > 0
    ? filters.languages
    : ['es', 'en'];

  const langOverlap = attrs.languages.filter(l => selectedLangs.includes(l));
  let languageScore = 0;
  const isOnlySpanishSelected = selectedLangs.length === 1 && selectedLangs[0] === 'es';
  const hasSpanish = attrs.languages.includes('es');

  if (langOverlap.length > 0) {
    if (isOnlySpanishSelected && hasSpanish) {
      // User only wants Spanish: give full bonus for Spanish offers
      languageScore = attrs.primaryLanguage === 'es' ? 20 : 17;
    } else if (langOverlap.length >= 2) {
      languageScore = 20;
    } else {
      languageScore = 15;
    }
  } else {
    languageScore = 0;
  }

  // ---------------------------------------------------------------------------
  // Total Score & Verdict
  // ---------------------------------------------------------------------------
  let totalScore = positionScore + boliviaScore + contractExpScore + languageScore;

  let verdict = 'SKIP';
  let disqualifyReasonEs = '';
  let disqualifyReasonEn = '';

  if (!bolivia.eligible) {
    totalScore = Math.min(totalScore, 25);
    verdict = 'SKIP';
    disqualifyReasonEs = bolivia.reason_es;
    disqualifyReasonEn = bolivia.reason_en;
  } else if (isOnlySpanishSelected && !hasSpanish) {
    // HARD PENALTY: User specifically selected ONLY Spanish, but this offer is English-only/first
    totalScore = Math.min(totalScore, 30);
    verdict = 'SKIP';
    disqualifyReasonEs = 'Requiere inglés (la oferta está en inglés y no coincide con tu selección de solo Español).';
    disqualifyReasonEn = 'Requires English (job is English-first and does not match your Spanish-only selection).';
  } else if (langOverlap.length === 0) {
    totalScore = Math.min(totalScore, 35);
    verdict = 'SKIP';
    disqualifyReasonEs = 'Idioma incompatible con tus filtros seleccionados.';
    disqualifyReasonEn = 'Language incompatible with your selected filters.';
  } else if (hasPositionFilter && !matchesPositionFilter) {
    totalScore = Math.min(totalScore, 48);
    verdict = 'SKIP';
    disqualifyReasonEs = 'Posición fuera de las áreas seleccionadas.';
    disqualifyReasonEn = 'Role outside your selected job categories.';
  } else if (contractOverlap.length === 0) {
    totalScore = Math.min(totalScore, 50);
    verdict = 'SKIP';
    disqualifyReasonEs = 'Modalidad de contrato no coincide con tus filtros.';
    disqualifyReasonEn = 'Contract modality does not match your filters.';
  } else if (totalScore >= 75) {
    verdict = 'APPLY';
  } else if (totalScore >= 55) {
    verdict = 'POSSIBLE';
  } else {
    verdict = 'SKIP';
  }

  // Build helpful notes
  const contractLabelsEs = {
    full_time: 'Tiempo Completo',
    half_time: 'Medio Tiempo',
    projects: 'Por Proyectos',
    hourly: 'Por Horas / Asíncrono',
    advisory: 'Consultoría / Asesoría'
  };
  const contractLabelsEn = {
    full_time: 'Full-Time',
    half_time: 'Half-Time',
    projects: 'Projects / Freelance',
    hourly: 'Hourly / Async',
    advisory: 'Advisory / Consultation'
  };
  const expLabelsEs = {
    entry: 'Inicial / Sin Exp.',
    junior: 'Junior',
    mid: 'Semi-Senior / Intermedio',
    senior: 'Senior',
    lead: 'Lead / Manager'
  };
  const expLabelsEn = {
    entry: 'Entry-Level',
    junior: 'Junior',
    mid: 'Mid-Level',
    senior: 'Senior',
    lead: 'Lead / Manager'
  };

  const cStrEs = attrs.contracts.map(c => contractLabelsEs[c] || c).join(', ');
  const cStrEn = attrs.contracts.map(c => contractLabelsEn[c] || c).join(', ');
  const lStr = attrs.languages.map(l => l.toUpperCase()).join('/');

  const notesEsParts = [bolivia.reason_es];
  const notesEnParts = [bolivia.reason_en];

  if (disqualifyReasonEs) {
    notesEsParts.push(disqualifyReasonEs);
    notesEnParts.push(disqualifyReasonEn);
  } else {
    notesEsParts.push(`Modalidad: ${cStrEs} · Nivel: ${expLabelsEs[attrs.experience] || 'Intermedio'} · Idiomas: ${lStr}.`);
    notesEnParts.push(`Contract: ${cStrEn} · Level: ${expLabelsEn[attrs.experience] || 'Mid-Level'} · Languages: ${lStr}.`);
  }

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
    primary_language: attrs.primaryLanguage,
    detected_contracts: attrs.contracts,
    detected_experience: attrs.experience,
    detected_categories: attrs.categories,
    matched_skills: allSkills.join(', ') || (item.tags || 'remoto'),
    notes_es: notesEsParts.join(' '),
    notes_en: notesEnParts.join(' ')
  };
}

/**
 * Evaluates all opportunities and sorts them by score descending.
 */
export function evaluateAllOpportunities(opportunities, filters = {}) {
  const requireBolivia = filters.require_bolivia_remote !== false;
  const isOnlySpanishSelected = Array.isArray(filters.languages) &&
    filters.languages.length === 1 &&
    filters.languages[0] === 'es';

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

  const geoExcluded = evaluated.filter(r => !r.bolivia_eligible);

  // When 'es' is exclusively selected, exclude offers that do NOT have Spanish from surfaced
  const surfaced = evaluated.filter(r => {
    if (requireBolivia && !r.bolivia_eligible) return false;
    if (isOnlySpanishSelected && !(r.detected_languages || []).includes('es')) {
      return false;
    }
    return true;
  });

  return {
    surfaced,
    all: evaluated,
    apply: surfaced.filter(r => r.verdict === 'APPLY'),
    possible: surfaced.filter(r => r.verdict === 'POSSIBLE'),
    skip: evaluated.filter(r => r.verdict === 'SKIP' && r.bolivia_eligible),
    geo_excluded: geoExcluded
  };
}

/**
 * Generates the on-the-fly "Resultados" / "Results" markdown report.
 */
export function generateResultsMarkdown(evalResult, filters = {}, lang = 'es', platformsCount = 85, lastSyncIso = '') {
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
      `# Resultados de Empleos Remotos desde Bolivia (BO) — ${dateStr}`,
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
      `# Bolivia (BO) 100% Remote Job Results — ${dateStr}`,
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
