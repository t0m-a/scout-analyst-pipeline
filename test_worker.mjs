import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import worker from './src/worker.js';
import { stripHtml, computeJobHash } from './src/scanner.js';
import { checkBoliviaRemoteEligibility, evaluateAllOpportunities } from './src/evaluator.js';
import { extractCompensationUsd } from './src/ai_enricher.js';
import { buildLocalSemanticVector, cosineSimilarity, deduplicateSemantically } from './src/vector_store.js';

const EMOJI_REGEX = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83d\ud83e][\ud000-\udfff]|[\u200d\u20e3\ufe0f]|[\u2600-\u26ff])/g;

async function runTests() {
  console.log('1. Testing GET / (Spanish Bolivia default UI, clean titles, platform categories, Dark Mode)...');
  const reqRoot = new Request('https://bolivia-remote-scout.workers.dev/');
  const respRoot = await worker.fetch(reqRoot, {}, {});
  assert.equal(respRoot.status, 200);
  const html = await respRoot.text();
  assert.ok(html.includes('lang="es-BO"'), 'Default language must be es-BO');
  assert.ok(html.includes('id="nav-brand-title">Bolivia Remote Work</span>'), 'Must include Bolivia Remote Work without (BO) in navbar brand');
  assert.ok(!html.includes('id="nav-brand-title">Bolivia Remote Work (BO)</span>'), 'Must NOT have (BO) in navbar brand');
  assert.ok(!html.includes('Bolivia Remoto'), 'Must NOT contain Bolivia Remoto anywhere in HTML');
  assert.ok(html.includes('Buscador y Evaluador de Empleos Remotos desde Bolivia'), 'Must include banner title without 100% and without (BO)');
  assert.ok(!html.includes('Buscador y Evaluador de Empleos 100% Remotos desde Bolivia (BO)'), 'Must remove 100% and (BO) from banner title');
  assert.ok(html.includes('id="nav-track-a">B2B Directo &amp; Freelance'), 'Must keep category name and remove Track A prefix in categories list');
  assert.ok(!html.includes('>Track A:'), 'Must NOT include Track A: in category links');
  assert.ok(html.includes('id="btn-theme-toggle"'), 'Must have discrete dark mode theme toggle button');
  assert.ok(html.includes('theme-symbol-moon'), 'Must have discrete moon symbol');
  assert.ok(html.includes('theme-symbol-sun'), 'Must have discrete sun symbol');
  assert.ok(!html.includes('id="theme-toggle-text"'), 'Must remove text label from theme toggle button');
  assert.ok(html.includes('body.dark-mode'), 'Must have dark mode stylesheet rules');
  assert.ok(html.includes('class="banner-header-block"'), 'Must have full-width banner-header-block so title and subtitle do not break');
  assert.ok(html.includes('class="banner-pills banner-actions-row"'), 'Must have banner-pills and banner-actions-row on the same bottom line');
  assert.ok(!html.includes('flex-wrap: nowrap !important'), 'Must not force nowrap so buttons and pills wrap responsively');
  assert.ok(html.includes('text-transform: capitalize'), 'Hamburger menu group headers must keep only the first letter of each word capitalized');
  assert.ok(!html.includes('text-transform: uppercase'), 'Hamburger menu group headers must be decapitalized from uppercase');
  assert.ok(html.includes('id="nav-hdr-tracks">Categorías De Plataformas</span>'), 'Must include Categorías De Plataformas with first letter of each word capitalized');
  assert.ok(html.includes('id="banner-disclaimer"'), 'Must include banner disclaimer below subtitle');
  assert.ok(html.includes('https://www.languagetransfer.org'), 'Must include Language Transfer link in disclaimer');
  assert.ok(html.includes('aprender inglés</a>. Te abre todo un entorno de oportunidades y con <a href="https://www.languagetransfer.org" title="Language Transfer: aprende inglés y más, ¡gratis!" target="_blank" rel="noopener noreferrer">Language Transfer</a>, es <strong>gratis</strong>!'), 'Must include Spanish anchor text, linked Language Transfer, and bold gratis in disclaimer');
  assert.ok(!/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/.test(html), 'Must NOT contain any flag emoji anywhere in HTML');
  assert.ok(!EMOJI_REGEX.test(html), 'Must NOT contain any emoji icons anywhere in HTML (excluding favicon)');
  assert.ok(!html.includes('id="tab-view-report"'), 'Must NOT have id="tab-view-report" in toolbar');
  assert.ok(!html.includes('id="nav-platforms"'), 'Must NOT have id="nav-platforms" in navbar');
  assert.ok(!html.includes('id="nav-hdr-views"'), 'Must NOT have Vistas Principales header in navbar');
  assert.ok(html.includes('Manual de Uso'), 'Must include Manual de Uso in sidebar');
  assert.ok(html.includes('id="nav-manual"'), 'Must have #nav-manual link in navbar');
  assert.ok(!html.includes('id="nav-report"'), 'Must NOT have id="nav-report" in navbar (removed as requested)');
  assert.ok(html.includes('setUiLanguage(\'en\')'), 'Must include English language switcher');
  assert.ok(html.includes('id="sidebar-unfold-btn"'), 'Must have sidebar unfold button');
  assert.ok(html.includes('<body class="sidebar-collapsed">'), 'Navbar must start folded in hamburger menu by default');
  assert.ok(/<div class="navbar-header">[\s\S]*?id="nav-brand-title">Bolivia Remote Work<\/span>[\s\S]*?id="sidebar-unfold-btn"[\s\S]*?<span class="hamburger-label" id="lbl-unfold-nav">Menú<\/span>[\s\S]*?<span class="hamburger-icon">/.test(html), 'Hamburger button must be inside navbar-header on the right with Menú on the left of hamburger icon');
  assert.ok(html.includes('onclick="toggleCategoriesMenu()"'), 'Categories header inside menu must be collapsible');
  assert.ok(html.includes('class="nav-track-item nav-track-folded"'), 'Categories inside menu must start folded');
  assert.ok(html.includes('id="nav-hdr-payments">Información Financiera</span>'), 'Must include Información Financiera section header under Categorías de Plataformas');
  assert.ok(html.includes('href="https://www.airtm.com/"'), 'Must include AirTM link');
  assert.ok(html.includes('href="https://www.payoneer.com/"'), 'Must include Payoneer link');
  assert.ok(html.includes('href="https://wise.com/"'), 'Must include Wise link');
  assert.ok(html.includes('href="https://tipalti.com/"'), 'Must include Tipalti link');
  assert.ok(html.includes('href="https://dolarboliviahoy.com/"'), 'Must include dolarboliviahoy.com link');
  assert.ok(html.includes('Las empresas suelen liquidar mediante plataformas de nómina global como <strong>AirTM. Wise, Payoneer o Tipalti</strong>. Desde estas cuentas puedes transferir vía SWIFT O transferancia ACH hacia tu cuenta bancaria boliviana en Boliviano o en USD, usar tarjetas de débito internacionales, o liquidar honorarios a través de pasarelas reguladas entre tus cuentas globales y locales.'), 'Must include exact payment description paragraph');
  assert.ok(html.includes('@media only screen and (max-width: 820px)'), 'Must include tablet responsive media query');
  assert.ok(html.includes('@media only screen and (max-width: 640px)'), 'Must include mobile responsive media query');
  assert.ok(html.includes('overflow-wrap: break-word'), 'Must enforce proper text wrapping');
  assert.ok(html.includes('Designed, engineered and hosted by <a href="mailto:contact@tsimon.me">Thomas M. Simon</a>'), 'Must include footer attribution with mailto link');
  assert.ok(html.includes('https://tsimon.me'), 'Must include footer attribution link to tsimon.me');
  assert.ok(html.includes('title="Thomas Mathieu Simon  · Cloud Systems Architect · NOC &amp; AI Engineer"'), 'Must include title attribute on tsimon.me link');
  assert.ok(html.includes('body.sidebar-collapsed #main-doc'), 'Must expand main-doc when collapsed');
  assert.ok(html.includes('body.sidebar-collapsed .top-banner'), 'Must expand sections to full width when collapsed');
  assert.ok(html.includes('body.view-manual-active .top-banner'), 'Must have CSS hiding preliminary sections when manual view is active');
  assert.ok(html.includes('id="man-btn-back"'), 'Must include back to results button in manual view');
  assert.ok(html.includes('Agregar y Escanear tu Propia URL de Plataforma'), 'Must include Custom Platform URL scanner');
  assert.ok(html.includes('id="ai-cv-panel"'), 'Must include Phase 2 AI CV Matcher & Cover Letter Generator panel');
  assert.ok(html.includes('openAiProposalForJob'), 'Must include per-card AI Cover Letter trigger');
  assert.ok(html.includes('rel="icon" type="image/svg+xml"'), 'Must have SVG favicon in head');
  assert.ok(html.includes('data:image/svg+xml'), 'Must have embedded data URI for offline support');
  assert.ok(!html.includes('Francés'), 'Must not contain French in UI filters');
  assert.ok(!html.includes('French'), 'Must not contain French in UI');
  const htmlNoFooter = html.replace(/<footer[\s\S]*?<\/footer>/gi, '').replace(/footerText:[\s\S]*?<\/a>'/gi, '').toLowerCase();
  assert.ok(!htmlNoFooter.includes('thomas simon'), 'Must not contain personal name outside footer attribution');
  assert.ok(!htmlNoFooter.includes('tsimon.me'), 'Must not contain personal domain outside footer attribution');
  assert.ok(!html.toLowerCase().includes('burnout'), 'Must not contain burnout safety references');
  assert.ok(!html.toLowerCase().includes('proposals ready'), 'Must not contain pre-populated proposals');

  // Compile and execute all inline <script> blocks in node:vm to catch any syntax/escaping errors
  const allScripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(allScripts.length, 3, 'Must contain 3 script blocks (theme init, JSON payload, main client logic)');
  const domElements = {};
  const getMockEl = (id) => {
    if (!domElements[id]) {
      domElements[id] = {
        id,
        textContent: id === 'initial-payload' ? allScripts[1][1] : '',
        innerHTML: '',
        value: '',
        checked: false,
        disabled: false,
        style: {},
        classList: { add() {}, remove() {}, toggle() { return false; } },
        setAttribute() {},
        getAttribute() { return ''; },
        querySelector() { return getMockEl('sub-' + id); },
        scrollIntoView() {}
      };
    }
    return domElements[id];
  };
  const vmSandbox = {
    window: { matchMedia: () => ({ matches: false }), scrollTo() {} },
    document: {
      title: '',
      documentElement: { lang: 'es-BO', classList: { add() {}, remove() {}, toggle() {} } },
      body: { classList: { add() {}, remove() {}, toggle() { return false; } } },
      getElementById: (id) => getMockEl(id),
      querySelector: (sel) => getMockEl(sel),
      querySelectorAll: () => []
    },
    localStorage: { getItem: () => null, setItem: () => {} },
    navigator: { clipboard: { writeText: async () => {} } },
    fetch: async () => ({ ok: true, json: async () => ({}) }),
    setInterval: () => {},
    setTimeout: () => {},
    URL,
    Blob: class {},
    console
  };
  vm.createContext(vmSandbox);
  new vm.Script(allScripts[0][1], { filename: 'theme-init.js' }).runInContext(vmSandbox);
  new vm.Script(allScripts[2][1], { filename: 'client-main.js' }).runInContext(vmSandbox);
  assert.ok(domElements['chips-languages'].innerHTML.includes('toggleLanguageChip'), 'Must render interactive language chips on load');
  assert.ok(domElements['chips-experience'].innerHTML.includes('toggleExperienceChip'), 'Must render interactive experience chips on load');
  assert.ok(domElements['chips-contracts'].innerHTML.includes('toggleContractChip'), 'Must render interactive contract chips on load');
  assert.ok(domElements['chips-positions'].innerHTML.includes('togglePositionChip'), 'Must render interactive position chips on load');
  assert.ok(domElements['resultsCardsContainer'].innerHTML.includes('opp-card'), 'Must render job cards on load');
  assert.equal(typeof vmSandbox.window.toggleSidebar, 'function', 'Menu button handler toggleSidebar must be bound');
  assert.equal(typeof vmSandbox.window.renderScanFeedback, 'function', 'renderScanFeedback must be bound');
  assert.equal(typeof vmSandbox.window.closeScanFeedback, 'function', 'closeScanFeedback must be bound');

  // Verify #scan-feedback-box display:flex fix, verdict badges, DEAD LEAD, and close button
  vmSandbox.window.renderScanFeedback('Remotive', { apply: 6, possible: 9, skip: 3, geo: 6 }, false);
  assert.equal(domElements['scan-feedback-box'].style.display, 'flex', '#scan-feedback-box must set style.display = flex when visible');
  assert.ok(domElements['scan-feedback-box'].innerHTML.includes('Remotive'), 'Must show Platform Name');
  assert.ok(domElements['scan-feedback-box'].innerHTML.includes('POSTULAR: 6'), 'Must show POSTULAR badge count');
  assert.ok(domElements['scan-feedback-box'].innerHTML.includes('EXPLORAR: 9'), 'Must show EXPLORAR badge count');
  assert.ok(domElements['scan-feedback-box'].innerHTML.includes('BAJA COINCIDENCIA: 3'), 'Must show BAJA COINCIDENCIA badge count');
  assert.ok(domElements['scan-feedback-box'].innerHTML.includes('BLOQUEADAS PA&Iacute;S: 6'), 'Must show BLOQUEADAS PAIS badge count');
  assert.ok(domElements['scan-feedback-box'].innerHTML.includes('closeScanFeedback()'), 'Must include close button');

  vmSandbox.window.renderScanFeedback('BrokenBoard', { apply: 0, possible: 0, skip: 0, geo: 0 }, true);
  assert.equal(domElements['scan-feedback-box'].style.display, 'flex', '#scan-feedback-box must set style.display = flex on DEAD LEAD');
  assert.ok(domElements['scan-feedback-box'].className.includes('error'), 'DEAD LEAD must use error class');
  assert.ok(domElements['scan-feedback-box'].innerHTML.includes('BrokenBoard'), 'Must show Platform Name on DEAD LEAD');
  assert.ok(domElements['scan-feedback-box'].innerHTML.includes('DEAD LEAD'), 'Must show DEAD LEAD badge');

  vmSandbox.window.closeScanFeedback();
  assert.equal(domElements['scan-feedback-box'].style.display, 'none', 'closeScanFeedback must hide #scan-feedback-box');

  console.log('2. Testing GET /api/state (85 platforms + 137 opportunities)...');
  const reqState = new Request('https://bolivia-remote-scout.workers.dev/api/state');
  const respState = await worker.fetch(reqState, {}, {});
  assert.equal(respState.status, 200);
  const stateData = await respState.json();
  assert.equal(stateData.schedule, '*/15 * * * *');
  assert.ok(stateData.platforms_count >= 85, `Expected >= 85 platforms, got ${stateData.platforms_count}`);
  assert.ok(stateData.opportunities_count >= 137, `Expected >= 137 opportunities, got ${stateData.opportunities_count}`);

  console.log('3. Testing POST /api/evaluate with Spanish-only filter (strict language weighting)...');
  const reqEvalEs = new Request('https://bolivia-remote-scout.workers.dev/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        ui_lang: 'es',
        require_bolivia_remote: true,
        languages: ['es']
      }
    })
  });
  const respEvalEs = await worker.fetch(reqEvalEs, {}, {});
  assert.equal(respEvalEs.status, 200);
  const evalEsData = await respEvalEs.json();
  assert.equal(evalEsData.ok, true);
  assert.ok(evalEsData.counts.surfaced > 0, 'Must surface Spanish offers');
  assert.ok(evalEsData.counts.skip > 0, 'English-only offers must be marked as skip');
  for (const opp of evalEsData.results) {
    assert.ok(
      opp.detected_languages.includes('es'),
      `Surfaced offer "${opp.title}" must be detected as Spanish-compatible, but got [${opp.detected_languages.join(', ')}]`
    );
  }

  console.log('4. Testing POST /api/evaluate with Virtual Assistant, Coordinator, and Languages/Translation roles...');
  const reqEvalVA = new Request('https://bolivia-remote-scout.workers.dev/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        ui_lang: 'es',
        require_bolivia_remote: true,
        position_types: ['virtual_assistant', 'operations_coord', 'languages_translation']
      }
    })
  });
  const respEvalVA = await worker.fetch(reqEvalVA, {}, {});
  assert.equal(respEvalVA.status, 200);
  const evalVAData = await respEvalVA.json();
  assert.equal(evalVAData.ok, true);
  assert.ok(evalVAData.counts.apply > 0, 'Must surface matching VA, Coordinator, and Languages/Translation roles as APPLY');
  assert.ok(evalVAData.results.some(r => (r.detected_categories || []).includes('languages_translation')), 'Must detect languages_translation category');

  console.log('5. Testing GET /api/results.md in ES and EN...');
  const respMdEs = await worker.fetch(new Request('https://bolivia-remote-scout.workers.dev/api/results.md?lang=es'), {}, {});
  const mdEs = await respMdEs.text();
  assert.ok(mdEs.includes('Resultados de Empleos Remotos desde Bolivia (BO)'));
  assert.ok(mdEs.includes('POSTULAR (Puntaje >= 78):'));
  assert.ok(mdEs.includes('EXPLORAR (Puntaje 58–77):'));

  const respMdEn = await worker.fetch(new Request('https://bolivia-remote-scout.workers.dev/api/results.md?lang=en'), {}, {});
  const mdEn = await respMdEn.text();
  assert.ok(mdEn.includes('Bolivia (BO) 100% Remote Job Results'));
  assert.ok(mdEn.includes('APPLY (Score >= 78):'));
  assert.ok(mdEn.includes('POSSIBLE (Score 58–77):'));

  console.log('5b. Testing Phase 1 fixes (entity-encoded HTML stripping, geo-leak blocking, deduplication, score distribution)...');
  assert.equal(
    stripHtml('&lt;p&gt; &lt;strong&gt;Headquarters:&lt;/strong&gt; Remote &lt;/p&gt;'),
    'Headquarters: Remote',
    'stripHtml must decode &lt; and &gt; before stripping HTML tags'
  );
  assert.equal(
    checkBoliviaRemoteEligibility({ title: 'Senior Back-end Developer', location: 'Europe, USA, Canada, Australia, Singapore, Mexico, Saudi Arabia', description: '' }).eligible,
    false,
    'Must block multi-country location list that excludes Bolivia/LATAM/Worldwide'
  );
  assert.equal(
    checkBoliviaRemoteEligibility({ title: 'Tech Lead Rails Engineer', location: 'USA, Canada, USA timezones', description: '' }).eligible,
    false,
    'Must block USA, Canada, USA timezones'
  );
  assert.equal(
    checkBoliviaRemoteEligibility({ title: 'Quality Assurance Rater - German speakers in Germany', location: 'Global', description: '' }).eligible,
    false,
    'Must block country-specific speaker requirement outside Bolivia'
  );
  assert.equal(
    checkBoliviaRemoteEligibility({ title: 'English to Maltese Review Lead', location: 'Anywhere', description: '' }).eligible,
    false,
    'Must block rare non-target language translation pairs'
  );
  assert.equal(
    checkBoliviaRemoteEligibility({ title: 'Security Engineer', location: 'Anywhere in the World', description: 'Headquarters: Remote-Friendly (Travel Required) | San Francisco, CA' }).eligible,
    false,
    'Must block Remote-Friendly (Travel Required) roles'
  );

  const dupSample = [
    { job_hash: computeJobHash('Senior DevOps Engineer', 'Lemon.io', 'https://a.com/1'), title: 'Senior DevOps Engineer', company: 'Lemon.io', location: 'LATAM', url: 'https://a.com/1', description: 'Azure Cloud DevOps Python' },
    { job_hash: computeJobHash('Senior DevOps Engineer', 'Lemon.io', 'https://b.com/2'), title: 'Senior DevOps Engineer', company: 'Lemon.io', location: 'LATAM', url: 'https://b.com/2', description: 'Azure Cloud DevOps Python' }
  ];
  const dedupEval = evaluateAllOpportunities(dupSample, {});
  assert.equal(dedupEval.all.length, 1, 'Must deduplicate cross-platform reposts with identical (title, company)');

  console.log('6. Testing POST /api/platforms/scan-url (Custom URL addition & evaluation)...');
  const reqScanUrl = new Request('https://bolivia-remote-scout.workers.dev/api/platforms/scan-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss',
      name: 'WWR DevOps Custom Feed',
      type: 'rss_feed'
    })
  });
  const respScanUrl = await worker.fetch(reqScanUrl, {}, {});
  assert.equal(respScanUrl.status, 200);
  const scanUrlData = await respScanUrl.json();
  assert.equal(scanUrlData.ok, true);
  assert.ok(scanUrlData.platform.id.includes('weworkremotely'));
  assert.equal(typeof scanUrlData.dead_lead, 'boolean', 'scan-url must return dead_lead boolean');
  assert.ok(scanUrlData.verdict_counts && typeof scanUrlData.verdict_counts.apply === 'number', 'scan-url must return verdict_counts');

  console.log('6b. Testing GET /api/platforms/sync (Export custom_* platforms)...');
  const respSync = await worker.fetch(new Request('https://bolivia-remote-scout.workers.dev/api/platforms/sync'), {}, {});
  assert.equal(respSync.status, 200);
  const syncData = await respSync.json();
  assert.equal(syncData.ok, true);
  assert.ok(syncData.custom_platforms_count >= 1, 'Must export at least 1 custom_* platform');
  assert.ok(syncData.custom_platforms.some(p => p.id.startsWith('custom_')), 'Must include custom_* platform record');

  console.log('6c. Testing Phase 2 Cloudflare Workers AI (POST /api/ai/match-cv, POST /api/ai/enrich) & D1 (env.DB) bindings...');
  assert.equal(
    extractCompensationUsd({ title: 'Senior Cloud Engineer', description: 'Compensation: $4,500 - $6,500/mo USD contractor' }),
    '$4,500 - $6,500/mo',
    'Must extract USD range compensation accurately'
  );

  // Test POST /api/ai/match-cv with deterministic fallback (no env.AI)
  const reqCvFallback = new Request('https://bolivia-remote-scout.workers.dev/api/ai/match-cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cv_text: 'Senior Python, SQL, React, Azure and DevOps engineer with 6 years of remote experience in LATAM.'
    })
  });
  const respCvFallback = await worker.fetch(reqCvFallback, {}, {});
  assert.equal(respCvFallback.status, 200);
  const cvFallbackData = await respCvFallback.json();
  assert.equal(cvFallbackData.ok, true);
  assert.equal(cvFallbackData.ai_engine, 'edge-deterministic-analyzer');
  assert.ok(cvFallbackData.detected_profile.matched_skills.includes('python'), 'Must detect python skill from CV');
  assert.ok(cvFallbackData.proposal_es.includes('UTC-4'), 'Spanish cover letter must highlight Bolivia UTC-4 advantage');
  assert.ok(cvFallbackData.proposal_en.includes('W-8BEN'), 'English cover letter must highlight W-8BEN contractor readiness');

  // Test POST /api/ai/match-cv with mocked Cloudflare Workers AI binding (`env.AI`)
  const mockAiEnv = {
    AI: {
      async run(model, opts) {
        return {
          response: JSON.stringify({
            analysis_es: 'Análisis IA desde Cloudflare Workers: Perfil Senior Cloud & Python ideal para UTC-4.',
            analysis_en: 'Workers AI Analysis: Senior Cloud & Python profile ideal for UTC-4.',
            proposal_es: 'Estimado equipo: Postulación generada con Llama 3.1 desde Bolivia (UTC-4).',
            proposal_en: 'Dear Hiring Team: Application generated with Llama 3.1 from Bolivia (UTC-4).'
          })
        };
      }
    }
  };
  const reqCvAi = new Request('https://bolivia-remote-scout.workers.dev/api/ai/match-cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cv_text: 'Cloud Architect & DevOps Engineer with Python, Terraform, Kubernetes, and SQL.'
    })
  });
  const respCvAi = await worker.fetch(reqCvAi, mockAiEnv, {});
  assert.equal(respCvAi.status, 200);
  const cvAiData = await respCvAi.json();
  assert.equal(cvAiData.ok, true);
  assert.ok(cvAiData.ai_engine.includes('llama-3.1'), 'Must use Workers AI Llama model when env.AI is bound');
  assert.ok(cvAiData.analysis_es.includes('Cloudflare Workers'), 'Must return AI-generated Spanish analysis');

  // Test POST /api/ai/enrich with mocked `env.AI` and `env.DB` (Cloudflare D1)
  let d1StatementsExecuted = 0;
  const mockD1Env = {
    AI: {
      async run() {
        return {
          response: JSON.stringify({
            bolivia_eligible: true,
            company: 'Acme Global Cloud',
            compensation_usd: '$5,000/mo',
            summary_es: 'Rol 100% remoto verificado con IA para Bolivia.',
            summary_en: '100% remote role verified by AI for Bolivia.'
          })
        };
      }
    },
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            return {
              async run() {
                d1StatementsExecuted++;
                return { success: true };
              }
            };
          },
          async run() {
            d1StatementsExecuted++;
            return { success: true };
          },
          async all() {
            return { results: [] };
          }
        };
      }
    }
  };
  const reqEnrich = new Request('https://bolivia-remote-scout.workers.dev/api/ai/enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ max_items: 2 })
  });
  const respEnrich = await worker.fetch(reqEnrich, mockD1Env, {});
  assert.equal(respEnrich.status, 200);
  const enrichData = await respEnrich.json();
  assert.equal(enrichData.ok, true);
  assert.equal(enrichData.ai_enabled, true);
  assert.equal(enrichData.enriched_count, 2);
  assert.equal(enrichData.opportunities[0].ai_verified, 1);
  assert.equal(enrichData.opportunities[0].compensation_usd, '$5,000/mo');
  assert.ok(d1StatementsExecuted > 0, 'Must persist enriched opportunities to Cloudflare D1 (env.DB)');

  console.log('6d. Testing Phase 3 Vectorial Database (Semantic Search, Cross-Lingual Embeddings, Vectorize & Semantic Deduplication)...');
  const esVec = buildLocalSemanticVector('asistente virtual atención al cliente soporte administrativo agenda');
  const enMatchVec = buildLocalSemanticVector('Bilingual Executive Virtual Assistant & Customer Support Specialist');
  const unrelatedVec = buildLocalSemanticVector('Senior Kernel Rust Embedded Firmware Engineer');
  assert.ok(
    cosineSimilarity(esVec, enMatchVec) > cosineSimilarity(esVec, unrelatedVec),
    'Cross-lingual Spanish query must have higher cosine similarity with English Virtual Assistant role than unrelated role'
  );

  // Test semantic deduplication
  const semDupRes = deduplicateSemantically([
    { title: 'Senior Cloud DevOps Engineer (AWS / Terraform)', company: 'Acme Cloud', description: 'Manage AWS Kubernetes Terraform CI/CD pipelines remotely from LATAM.' },
    { title: 'Sr. Cloud & DevOps Engineer - AWS/Terraform', company: 'Acme Cloud', description: 'Manage AWS Kubernetes Terraform CI/CD pipelines remotely from LATAM.' },
    { title: 'Bilingual Virtual Assistant', company: 'Virtual Latinos', description: 'Executive assistant and customer support in Spanish and English.' }
  ]);
  assert.equal(semDupRes.duplicates_removed, 1, 'Must semantically deduplicate near-identical role at same company');
  assert.equal(semDupRes.opportunities.length, 2);

  // Test GET /api/search/semantic with local multilingual vector engine
  const respSemLocal = await worker.fetch(
    new Request('https://bolivia-remote-scout.workers.dev/api/search/semantic?q=asistente+virtual+atencion+al+cliente+espanol&limit=5'),
    {},
    {}
  );
  assert.equal(respSemLocal.status, 200);
  const semLocalData = await respSemLocal.json();
  assert.equal(semLocalData.ok, true);
  assert.equal(semLocalData.vector_backend, 'edge-multilingual-vectors');
  assert.ok(semLocalData.results.length > 0, 'Semantic search must return ranked results');
  assert.ok(typeof semLocalData.results[0].semantic_score === 'number', 'Results must include semantic_score');
  assert.ok(typeof semLocalData.results[0].blended_score === 'number', 'Results must include blended_score');

  // Test POST /api/search/semantic & POST /api/vectors/index with mocked Cloudflare Vectorize (`env.VECTORIZE`) & BGE-M3 (`env.AI`)
  let vectorizeUpsertedCount = 0;
  const mockVectorEnv = {
    AI: {
      async run(model, input) {
        return { data: [new Array(128).fill(0.08)] };
      }
    },
    VECTORIZE: {
      async upsert(records) {
        vectorizeUpsertedCount += records.length;
        return { count: records.length };
      },
      async query(vec, opts) {
        return {
          matches: [
            { id: stateData.opportunities[0].job_hash, score: 0.94, metadata: { job_hash: stateData.opportunities[0].job_hash } }
          ]
        };
      }
    }
  };

  const respVecIndex = await worker.fetch(
    new Request('https://bolivia-remote-scout.workers.dev/api/vectors/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ max_items: 4, deduplicate: true })
    }),
    mockVectorEnv,
    {}
  );
  assert.equal(respVecIndex.status, 200);
  const vecIndexData = await respVecIndex.json();
  assert.equal(vecIndexData.ok, true);
  assert.equal(vecIndexData.indexed_count, 4);
  assert.ok(vecIndexData.backends.includes('cloudflare-vectorize'), 'Must report cloudflare-vectorize backend');
  assert.equal(vectorizeUpsertedCount, 4);

  const respSemVec = await worker.fetch(
    new Request('https://bolivia-remote-scout.workers.dev/api/search/semantic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Senior Cloud Engineer Python AWS', topK: 5 })
    }),
    mockVectorEnv,
    {}
  );
  assert.equal(respSemVec.status, 200);
  const semVecData = await respSemVec.json();
  assert.equal(semVecData.ok, true);
  assert.equal(semVecData.vector_backend, 'cloudflare-vectorize');
  assert.equal(semVecData.embedding_model, '@cf/baai/bge-m3');

  console.log('6e. Testing Phase 4 Streamable HTTP MCP Server (/mcp and /.well-known/mcp.json)...');
  const respMcpManifest = await worker.fetch(new Request('https://bolivia-remote-scout.workers.dev/.well-known/mcp.json'), {}, {});
  assert.equal(respMcpManifest.status, 200);
  const mcpManifest = await respMcpManifest.json();
  assert.equal(mcpManifest.ok, true);
  assert.equal(mcpManifest.transport, 'streamable-http');
  assert.equal(mcpManifest.tools.length, 5);

  // JSON-RPC initialize
  const respMcpInit = await worker.fetch(
    new Request('https://bolivia-remote-scout.workers.dev/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26' } })
    }),
    {},
    {}
  );
  assert.equal(respMcpInit.status, 200);
  const mcpInitData = await respMcpInit.json();
  assert.equal(mcpInitData.jsonrpc, '2.0');
  assert.equal(mcpInitData.id, 1);
  assert.equal(mcpInitData.result.serverInfo.name, 'bolivia-remote-mcp-server');

  // JSON-RPC tools/list
  const respMcpTools = await worker.fetch(
    new Request('https://bolivia-remote-scout.workers.dev/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' })
    }),
    {},
    {}
  );
  const mcpToolsData = await respMcpTools.json();
  assert.equal(mcpToolsData.result.tools.length, 5);

  // JSON-RPC tools/call (search_bolivia_remote_jobs)
  const respMcpCallSearch = await worker.fetch(
    new Request('https://bolivia-remote-scout.workers.dev/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'search_bolivia_remote_jobs',
          arguments: { languages: ['es', 'en'], verdict: 'APPLY', limit: 3 }
        }
      })
    }),
    {},
    {}
  );
  const mcpCallSearchData = await respMcpCallSearch.json();
  assert.equal(mcpCallSearchData.result.isError, false);
  const parsedToolOut = JSON.parse(mcpCallSearchData.result.content[0].text);
  assert.ok(Array.isArray(parsedToolOut.results) && parsedToolOut.results.length > 0, 'MCP search_bolivia_remote_jobs must return evaluated APPLY jobs');

  // JSON-RPC resources/read (bolivia://results/markdown)
  const respMcpRes = await worker.fetch(
    new Request('https://bolivia-remote-scout.workers.dev/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 4,
        method: 'resources/read',
        params: { uri: 'bolivia://results/markdown' }
      })
    }),
    {},
    {}
  );
  const mcpResData = await respMcpRes.json();
  assert.ok(mcpResData.result.contents[0].text.includes('POSTULAR (Puntaje >= 78):'), 'MCP resource must return live Markdown report');

  // Test Private MCP Bearer Token / API Key Protection (env.MCP_API_KEY)
  const lockedMcpEnv = { MCP_API_KEY: 'bolivia-secret-token-2026' };
  const respMcpUnauth = await worker.fetch(
    new Request('https://bolivia-remote-scout.workers.dev/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 10, method: 'ping' })
    }),
    lockedMcpEnv,
    {}
  );
  assert.equal(respMcpUnauth.status, 401, 'MCP server must reject unauthenticated request when MCP_API_KEY is set');

  const respMcpWrongKey = await worker.fetch(
    new Request('https://bolivia-remote-scout.workers.dev/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer wrong-token'
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 11, method: 'ping' })
    }),
    lockedMcpEnv,
    {}
  );
  assert.equal(respMcpWrongKey.status, 401, 'MCP server must reject invalid Bearer token');

  const respMcpValidBearer = await worker.fetch(
    new Request('https://bolivia-remote-scout.workers.dev/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer bolivia-secret-token-2026'
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 12, method: 'ping' })
    }),
    lockedMcpEnv,
    {}
  );
  assert.equal(respMcpValidBearer.status, 200, 'MCP server must allow valid Authorization: Bearer token');

  const respMcpValidQueryKey = await worker.fetch(
    new Request('https://bolivia-remote-scout.workers.dev/.well-known/mcp.json?key=bolivia-secret-token-2026'),
    lockedMcpEnv,
    {}
  );
  assert.equal(respMcpValidQueryKey.status, 200, 'MCP server must allow valid ?key= query parameter');

  console.log('7. Testing GET /favicon.svg and /favicon.ico (Earth with Bolivian flag colors)...');
  const respFavSvg = await worker.fetch(new Request('https://bolivia-remote-scout.workers.dev/favicon.svg'), {}, {});
  assert.equal(respFavSvg.status, 200);
  assert.equal(respFavSvg.headers.get('Content-Type'), 'image/svg+xml');
  const favSvgText = await respFavSvg.text();
  assert.ok(favSvgText.includes('<svg'), 'Must return valid SVG');
  assert.ok(favSvgText.includes('bol-red'), 'Must contain Bolivian red');
  assert.ok(favSvgText.includes('bol-yellow'), 'Must contain Bolivian yellow');
  assert.ok(favSvgText.includes('bol-green'), 'Must contain Bolivian green');

  const respFavIco = await worker.fetch(new Request('https://bolivia-remote-scout.workers.dev/favicon.ico'), {}, {});
  assert.equal(respFavIco.status, 200);

  console.log('8. Testing zero personal references across all repository files...');
  const filesToCheck = [
    'README.md',
    'master_profile.json',
    'platforms_config.json',
    'scout_agent.py',
    'analyst_agent.py',
    'add_platforms.py',
    'index.html',
    'src/seed_data.js',
    'src/evaluator.js',
    'src/scanner.js',
    'src/ai_enricher.js',
    'src/vector_store.js',
    'src/mcp.js',
    'src/ui.js',
    'src/worker.js',
    'src/favicon.js'
  ];
  const forbiddenTerms = [
    'thomas simon',
    'tsimon.me',
    'pi.tsimon.me',
    'rag.tsimon.me',
    'simon_thomas@outlook.fr',
    '734 62133',
    'tsimonfreelance',
    'cnam france',
    'orange telecom',
    'teamlogic',
    'burnout',
    'low-fuel',
    'french',
    'français',
    'francophone'
  ];

  for (const relPath of filesToCheck) {
    const rawContent = fs.readFileSync(path.resolve(relPath), 'utf8');
    const flagMatches = rawContent.match(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g);
    assert.ok(!flagMatches, `Forbidden flag emoji found in ${relPath}`);
    const emojiMatches = rawContent.match(EMOJI_REGEX);
    assert.ok(!emojiMatches, `Forbidden emoji icon found in ${relPath}: ${emojiMatches?.join(' ')}`);
    const content = (relPath === 'src/ui.js' || relPath === 'index.html')
      ? rawContent.replace(/Designed, engineered and hosted by[\s\S]*?tsimon\.me<\/a>/gi, '').toLowerCase()
      : rawContent.toLowerCase();
    for (const term of forbiddenTerms) {
      assert.ok(!content.includes(term), `Forbidden personal term "${term}" found in ${relPath}`);
    }
  }

  console.log('ALL TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
