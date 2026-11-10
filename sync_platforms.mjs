/**
 * CLI & Automated Platform Sync Script (sync_platforms.mjs)
 *
 * Exports newly registered custom_* platforms (and their Bolivia-eligible opportunities)
 * from /api/state (or a newly scanned URL) directly into:
 *   1. src/seed_data.js
 *   2. platforms_config.json
 *   3. index.html (rebuilt self-contained bundle)
 *
 * Usage:
 *   npm run sync-platforms
 *   node sync_platforms.mjs --url="https://..." --name="Platform Name" --type="rss_feed"
 */

import fs from 'node:fs';
import path from 'node:path';
import { INITIAL_PLATFORMS, INITIAL_OPPORTUNITIES } from './src/seed_data.js';
import { scanCustomPlatformUrl } from './src/scanner.js';
import { persistCustomPlatformsToDisk } from './src/seed_sync.js';
import { renderAppHtml } from './src/ui.js';

function parseCliArgs(argv) {
  const args = {
    endpoint: 'https://boliviaremote.work',
    url: '',
    name: '',
    type: 'auto',
    track: 'Track F: Curated Remote-First & WFA Job Boards'
  };

  for (const raw of argv.slice(2)) {
    if (raw.startsWith('--endpoint=')) args.endpoint = raw.slice('--endpoint='.length).trim();
    else if (raw.startsWith('--url=')) args.url = raw.slice('--url='.length).trim();
    else if (raw.startsWith('--name=')) args.name = raw.slice('--name='.length).trim();
    else if (raw.startsWith('--type=')) args.type = raw.slice('--type='.length).trim();
    else if (raw.startsWith('--track=')) args.track = raw.slice('--track='.length).trim();
  }
  return args;
}

async function runSync() {
  const args = parseCliArgs(process.argv);
  const baseUrl = args.endpoint.replace(/\/+$/, '');

  const collectedPlatforms = [...INITIAL_PLATFORMS];
  const collectedOpportunities = [...INITIAL_OPPORTUNITIES];

  // 1. If --url is provided, scan & register the new platform first
  if (args.url) {
    console.log(`1. Scanning & registering new platform: ${args.name || args.url} (${args.type})...`);
    const localScan = await scanCustomPlatformUrl({
      url: args.url,
      name: args.name,
      type: args.type,
      track: args.track
    });
    collectedPlatforms.unshift(localScan.platform);
    collectedOpportunities.unshift(...localScan.opportunities);
    console.log(
      `   -> Registered "${localScan.platform.name}" [id=${localScan.platform.id}, type=${localScan.platform.type}] (${localScan.discovered_count} offers discovered, ${localScan.bolivia_eligible_count} Bolivia-eligible).`
    );

    // Also push to live endpoint if reachable
    try {
      await fetch(`${baseUrl}/api/platforms/scan-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: args.url,
          name: args.name,
          type: args.type,
          track: args.track,
          persist: true
        })
      });
    } catch {
      // Ignore if offline
    }
  }

  // 2. Fetch live /api/state from endpoint to capture any other user-registered custom_* platforms
  console.log(`2. Fetching live /api/state from ${baseUrl}/api/state...`);
  try {
    const resp = await fetch(`${baseUrl}/api/state`);
    if (resp.ok) {
      const liveState = await resp.json();
      if (Array.isArray(liveState.platforms)) {
        const seenIds = new Set(collectedPlatforms.map(p => p.id));
        for (const p of liveState.platforms) {
          if (p && p.id && !seenIds.has(p.id)) {
            seenIds.add(p.id);
            collectedPlatforms.push(p);
          }
        }
      }
      if (Array.isArray(liveState.opportunities)) {
        const seenHashes = new Set(collectedOpportunities.map(o => o.job_hash));
        for (const o of liveState.opportunities) {
          if (o && o.job_hash && !seenHashes.has(o.job_hash)) {
            seenHashes.add(o.job_hash);
            collectedOpportunities.push(o);
          }
        }
      }
    }
  } catch (err) {
    console.warn(`   -> Could not reach live endpoint (${err.message}); syncing local state.`);
  }

  // 3. Export custom_* platforms & opportunities into platforms_config.json and src/seed_data.js
  console.log('3. Exporting custom_* platforms into src/seed_data.js and platforms_config.json...');
  const targetDirs = ['.', 'z:/opt/scout-analyst'];
  const syncResult = await persistCustomPlatformsToDisk(
    {
      platforms: collectedPlatforms,
      opportunities: collectedOpportunities
    },
    targetDirs
  );

  console.log(`   -> Custom platforms synced: ${syncResult.custom_platforms_count}`);
  console.log(`   -> Newly added platforms: ${syncResult.newly_added_platforms_count}`);
  console.log(`   -> Newly added Bolivia-eligible opportunities: ${syncResult.newly_added_opportunities_count}`);
  console.log(`   -> Total platforms in seed_data.js & platforms_config.json: ${syncResult.total_platforms_count}`);
  console.log(`   -> Total opportunities in seed_data.js: ${syncResult.total_opportunities_count}`);

  // 4. Rebuild self-contained index.html in both workspaces
  const html = renderAppHtml({
    opportunities: syncResult.merged_opportunities,
    platforms: syncResult.merged_platforms,
    lastScanAt: new Date().toISOString()
  });

  for (const dir of targetDirs) {
    const resolvedDir = path.resolve(dir);
    if (fs.existsSync(resolvedDir)) {
      const indexPath = path.join(resolvedDir, 'index.html');
      fs.writeFileSync(indexPath, html, 'utf8');
      console.log(`   -> Updated ${indexPath}`);
    }
  }

  console.log('SYNC COMPLETED SUCCESSFULLY!');
}

runSync().catch(err => {
  console.error('SYNC FAILED:', err);
  process.exit(1);
});
