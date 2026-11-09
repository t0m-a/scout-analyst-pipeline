import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import worker from './src/worker.js';

const EMOJI_REGEX = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83d\ud83e][\ud000-\udfff]|[\u200d\u20e3\ufe0f]|[\u2600-\u26ff])/g;

async function runTests() {
  console.log('1. Testing GET / (Spanish Bolivia default UI, clean titles, platform categories, Dark Mode)...');
  const reqRoot = new Request('https://bolivia-remote-scout.workers.dev/');
  const respRoot = await worker.fetch(reqRoot, {}, {});
  assert.equal(respRoot.status, 200);
  const html = await respRoot.text();
  assert.ok(html.includes('lang="es-BO"'), 'Default language must be es-BO');
  assert.ok(html.includes('id="nav-brand-title">Bolivia Remoto</span>'), 'Must include Bolivia Remoto without (BO) in navbar brand');
  assert.ok(!html.includes('id="nav-brand-title">Bolivia Remoto (BO)</span>'), 'Must NOT have (BO) in navbar brand');
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
  assert.ok(html.includes('flex-wrap: nowrap !important'), 'Button group must not wrap to two lines');
  assert.ok(html.includes('id="banner-disclaimer"'), 'Must include banner disclaimer below subtitle');
  assert.ok(html.includes('https://www.languagetransfer.org'), 'Must include Language Transfer link in disclaimer');
  assert.ok(html.includes('aprender inglés'), 'Must include Spanish anchor text in disclaimer');
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
  assert.ok(html.includes('Designed, engineered and hosted by <a href="mailto:contact@tsimon.me">Thomas M. Simon</a>'), 'Must include footer attribution with mailto link');
  assert.ok(html.includes('https://tsimon.me'), 'Must include footer attribution link to tsimon.me');
  assert.ok(html.includes('title="Thomas Mathieu Simon  · Cloud Systems Architect · NOC &amp; AI Engineer"'), 'Must include title attribute on tsimon.me link');
  assert.ok(html.includes('body.sidebar-collapsed #main-doc'), 'Must expand main-doc when collapsed');
  assert.ok(html.includes('body.sidebar-collapsed .top-banner'), 'Must expand sections to full width when collapsed');
  assert.ok(html.includes('body.view-manual-active .top-banner'), 'Must have CSS hiding preliminary sections when manual view is active');
  assert.ok(html.includes('id="man-btn-back"'), 'Must include back to results button in manual view');
  assert.ok(html.includes('Agregar y Escanear tu Propia URL de Plataforma'), 'Must include Custom Platform URL scanner');
  assert.ok(html.includes('rel="icon" type="image/svg+xml"'), 'Must have SVG favicon in head');
  assert.ok(html.includes('data:image/svg+xml'), 'Must have embedded data URI for offline support');
  assert.ok(!html.includes('Francés'), 'Must not contain French in UI filters');
  assert.ok(!html.includes('French'), 'Must not contain French in UI');
  const htmlNoFooter = html.replace(/<footer[\s\S]*?<\/footer>/gi, '').replace(/footerText:[\s\S]*?<\/a>'/gi, '').toLowerCase();
  assert.ok(!htmlNoFooter.includes('thomas simon'), 'Must not contain personal name outside footer attribution');
  assert.ok(!htmlNoFooter.includes('tsimon.me'), 'Must not contain personal domain outside footer attribution');
  assert.ok(!html.toLowerCase().includes('burnout'), 'Must not contain burnout safety references');
  assert.ok(!html.toLowerCase().includes('proposals ready'), 'Must not contain pre-populated proposals');

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

  console.log('4. Testing POST /api/evaluate with Virtual Assistant and Coordinator roles...');
  const reqEvalVA = new Request('https://bolivia-remote-scout.workers.dev/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        ui_lang: 'es',
        require_bolivia_remote: true,
        position_types: ['virtual_assistant', 'operations_coord']
      }
    })
  });
  const respEvalVA = await worker.fetch(reqEvalVA, {}, {});
  assert.equal(respEvalVA.status, 200);
  const evalVAData = await respEvalVA.json();
  assert.equal(evalVAData.ok, true);
  assert.ok(evalVAData.counts.apply > 0, 'Must surface matching VA and Coordinator roles as APPLY');

  console.log('5. Testing GET /api/results.md in ES and EN...');
  const respMdEs = await worker.fetch(new Request('https://bolivia-remote-scout.workers.dev/api/results.md?lang=es'), {}, {});
  const mdEs = await respMdEs.text();
  assert.ok(mdEs.includes('Resultados de Empleos Remotos desde Bolivia (BO)'));

  const respMdEn = await worker.fetch(new Request('https://bolivia-remote-scout.workers.dev/api/results.md?lang=en'), {}, {});
  const mdEn = await respMdEn.text();
  assert.ok(mdEn.includes('Bolivia (BO) 100% Remote Job Results'));

  console.log('6. Testing POST /api/platforms/scan-url (Custom URL addition & evaluation)...');
  const reqScanUrl = new Request('https://bolivia-remote-scout.workers.dev/api/platforms/scan-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss',
      name: 'WWR Custom Test Feed',
      type: 'rss_feed'
    })
  });
  const respScanUrl = await worker.fetch(reqScanUrl, {}, {});
  assert.equal(respScanUrl.status, 200);
  const scanUrlData = await respScanUrl.json();
  assert.equal(scanUrlData.ok, true);
  assert.ok(scanUrlData.platform.id.includes('weworkremotely'));

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
