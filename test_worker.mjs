import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import worker from './src/worker.js';

async function runTests() {
  console.log('1. Testing GET / (Spanish Bolivia default UI, BO in title/nav, Manual de Uso)...');
  const reqRoot = new Request('https://bolivia-remote-scout.workers.dev/');
  const respRoot = await worker.fetch(reqRoot, {}, {});
  assert.equal(respRoot.status, 200);
  const html = await respRoot.text();
  assert.ok(html.includes('lang="es-BO"'), 'Default language must be es-BO');
  assert.ok(html.includes('(BO)'), 'Must include (BO) in page title and nav bar');
  assert.ok(html.includes('Bolivia Remoto (BO)'), 'Must include Bolivia Remoto (BO) in nav header');
  assert.ok(html.includes('Buscador y Evaluador de Empleos 100% Remotos desde Bolivia (BO)'), 'Must include Spanish Bolivia banner title with (BO)');
  assert.ok(html.includes('Manual de Uso'), 'Must include Manual de Uso in sidebar');
  assert.ok(html.includes('id="nav-manual"'), 'Must have #nav-manual link in navbar');
  assert.ok(!html.includes('id="nav-report"'), 'Must NOT have id="nav-report" in navbar (removed as requested)');
  assert.ok(html.includes('setUiLanguage(\'en\')'), 'Must include English language switcher');
  assert.ok(html.includes('Agregar y Escanear tu Propia URL de Plataforma'), 'Must include Custom Platform URL scanner');
  assert.ok(!html.includes('Francés'), 'Must not contain French in UI filters');
  assert.ok(!html.includes('French'), 'Must not contain French in UI');
  assert.ok(!html.toLowerCase().includes('thomas simon'), 'Must not contain personal name');
  assert.ok(!html.toLowerCase().includes('tsimon.me'), 'Must not contain personal domain');
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

  console.log('7. Testing zero personal references across all repository files...');
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
    'src/worker.js'
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
    const content = fs.readFileSync(path.resolve(relPath), 'utf8').toLowerCase();
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
