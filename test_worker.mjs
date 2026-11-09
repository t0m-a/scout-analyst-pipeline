import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import worker from './src/worker.js';

async function runTests() {
  console.log('1. Testing GET / (Spanish Bolivia default UI)...');
  const reqRoot = new Request('https://bolivia-remote-scout.workers.dev/');
  const respRoot = await worker.fetch(reqRoot, {}, {});
  assert.equal(respRoot.status, 200);
  const html = await respRoot.text();
  assert.ok(html.includes('lang="es-BO"'), 'Default language must be es-BO');
  assert.ok(html.includes('Buscador y Evaluador de Empleos 100% Remotos desde Bolivia'), 'Must include Spanish Bolivia banner title');
  assert.ok(html.includes('setUiLanguage(\'en\')'), 'Must include English language switcher');
  assert.ok(html.includes('Agregar y Escanear tu Propia URL de Plataforma'), 'Must include Custom Platform URL scanner');
  assert.ok(!html.toLowerCase().includes('thomas simon'), 'Must not contain personal name');
  assert.ok(!html.toLowerCase().includes('tsimon.me'), 'Must not contain personal domain');
  assert.ok(!html.toLowerCase().includes('burnout'), 'Must not contain burnout safety references');
  assert.ok(!html.toLowerCase().includes('proposals ready'), 'Must not contain pre-populated proposals');

  console.log('2. Testing GET /api/state (73 platforms + 121 opportunities)...');
  const reqState = new Request('https://bolivia-remote-scout.workers.dev/api/state');
  const respState = await worker.fetch(reqState, {}, {});
  assert.equal(respState.status, 200);
  const stateData = await respState.json();
  assert.equal(stateData.schedule, '*/15 * * * *');
  assert.ok(stateData.platforms_count >= 73);
  assert.ok(stateData.opportunities_count >= 121);

  console.log('3. Testing POST /api/evaluate with custom filters...');
  const reqEval = new Request('https://bolivia-remote-scout.workers.dev/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        ui_lang: 'es',
        require_bolivia_remote: true,
        languages: ['es', 'en'],
        position_types: ['software', 'cloud_sys'],
        custom_keywords: 'python, azure',
        experience_levels: ['mid', 'senior'],
        contract_types: ['half_time', 'projects', 'hourly']
      }
    })
  });
  const respEval = await worker.fetch(reqEval, {}, {});
  assert.equal(respEval.status, 200);
  const evalData = await respEval.json();
  assert.equal(evalData.ok, true);
  assert.ok(evalData.counts.surfaced > 0);
  assert.ok(evalData.counts.geo_excluded > 0, 'Must filter out non-Bolivia-eligible offers');
  assert.ok(evalData.markdown.includes('Resultados de Ofertas Remotas desde Bolivia'));

  console.log('4. Testing GET /api/results.md in ES and EN...');
  const respMdEs = await worker.fetch(new Request('https://bolivia-remote-scout.workers.dev/api/results.md?lang=es'), {}, {});
  const mdEs = await respMdEs.text();
  assert.ok(mdEs.includes('Resultados de Ofertas Remotas desde Bolivia'));

  const respMdEn = await worker.fetch(new Request('https://bolivia-remote-scout.workers.dev/api/results.md?lang=en'), {}, {});
  const mdEn = await respMdEn.text();
  assert.ok(mdEn.includes('Bolivia 100% Remote Job Results'));

  console.log('5. Testing POST /api/platforms/scan-url (Custom URL addition & evaluation)...');
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

  console.log('6. Testing zero personal references across all repository files...');
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
    'low-fuel'
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
