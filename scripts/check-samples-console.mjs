#!/usr/bin/env node
import { access, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.SAMPLES_BASE_URL || 'http://localhost:3030',
    settleMs: Number(process.env.SAMPLES_SETTLE_MS || 500),
    concurrency: undefined,
    limit: undefined,
    pattern: undefined,
    report: undefined,
    browserPath: undefined
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === '--base-url' && next) {
      args.baseUrl = next;
      i++;
    } else if (arg === '--settle-ms' && next) {
      args.settleMs = Number(next);
      i++;
    } else if (arg === '--concurrency' && next) {
      args.concurrency = Number(next);
      i++;
    } else if (arg === '--limit' && next) {
      args.limit = Number(next);
      i++;
    } else if (arg === '--pattern' && next) {
      args.pattern = next;
      i++;
    } else if (arg === '--report' && next) {
      args.report = next;
      i++;
    } else if (arg === '--browser-path' && next) {
      args.browserPath = next;
      i++;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node scripts/check-samples-console.mjs [options]\n\nOptions:\n  --base-url <url>     Base URL for the running utils app (default: http://localhost:3030)\n  --limit <n>          Only inspect the first n samples\n  --pattern <regex>    Only inspect sample paths matching the regex\n  --settle-ms <n>      Wait this long after load before reading console output (default: 500)\n  --concurrency <n>    Number of sample pages to check in parallel (default: 1)\n  --browser-path <p>   Explicit Chromium/Chrome executable path\n  --report <path>      Write a JSON report to this file\n  -h, --help           Show this help\n`);

      process.exit(0);
    }
  }

  return args;
}

async function fileExists(pathname) {
  try {
    await access(pathname, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveBrowserPath(explicitPath) {
  const candidates = [
    explicitPath,
    process.env.PLAYWRIGHT_CHROMIUM_PATH,
    process.env.CHROMIUM_PATH
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (await fileExists(candidate)) return candidate;
  }

  return undefined;
}

async function collectSamplePaths(baseUrl) {
  const response = await fetch(new URL('/samples/list-samples', baseUrl));
  if (!response.ok) {
    throw new Error(`Failed to load sample list: ${response.status} ${response.statusText}`);
  }

  const samples = await response.json();
  if (!Array.isArray(samples)) {
    throw new Error('Unexpected sample list payload: expected an array');
  }

  return samples
    .map(sample => sample?.path)
    .filter(Boolean);
}

async function checkSample(context, baseUrl, path, settleMs) {
  const page = await context.newPage();
  const url = new URL('/samples/view', baseUrl);
  url.searchParams.set('path', path);

  const errors = [];
  const warnings = [];
  const onConsole = message => {
    const text = message.text();
    if (message.type() === 'error') {
      errors.push(text);
    } else if (message.type() === 'warning') {
      warnings.push(text);
    }
  };
  const onPageError = error => {
    errors.push(error.message);
  };

  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  try {
    await page.goto(url.toString(), { waitUntil: 'load', timeout: 60_000 });
    await page.waitForTimeout(settleMs);
  } catch (error) {
    errors.push(`navigation: ${error.message}`);
  } finally {
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
    await page.close().catch(() => {});
  }

  return {
    path,
    url: url.toString(),
    errors,
    warnings,
    title: await page.title().catch(() => '')
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const browserPath = await resolveBrowserPath(args.browserPath);

  const concurrency = Math.max(1, Number(args.concurrency || process.env.SAMPLES_CONCURRENCY || 1));
  const launchOptions = {
    headless: true
  };

  if (browserPath) {
    launchOptions.executablePath = browserPath;
  }

  if (process.env.CI || typeof process.getuid === 'function' && process.getuid() === 0) {
    launchOptions.args = ['--no-sandbox'];
  }

  const browser = await chromium.launch(launchOptions);

  try {
    const allPaths = await collectSamplePaths(args.baseUrl);
    const matcher = args.pattern ? new RegExp(args.pattern) : null;
    const selectedPaths = allPaths
      .filter(path => !matcher || matcher.test(path))
      .slice(0, args.limit ? Math.max(0, args.limit) : undefined);

    console.log(`Found ${allPaths.length} sample pages. Checking ${selectedPaths.length} sample pages with concurrency ${concurrency}.`);

    const contexts = await Promise.all(
      Array.from({ length: concurrency }, () => browser.newContext({
        ignoreHTTPSErrors: true
      }))
    );

    const results = new Array(selectedPaths.length);
    let nextIndex = 0;

    const worker = async context => {
      while (true) {
        const index = nextIndex++;
        if (index >= selectedPaths.length) {
          return;
        }

        const path = selectedPaths[index];
        const result = await checkSample(context, args.baseUrl, path, args.settleMs);
        results[index] = result;

        const status = result.errors.length ? 'FAIL' : 'ok';
        console.log(`[${index + 1}/${selectedPaths.length}] ${status} ${path}`);
        if (result.errors.length) {
          for (const error of result.errors) {
            console.log(`  error: ${error}`);
          }
        }
      }
    };

    try {
      await Promise.all(contexts.map(context => worker(context)));
    } finally {
      await Promise.all(contexts.map(context => context.close().catch(() => {})));
    }

    const completedResults = results.filter(Boolean);
    const failures = completedResults.filter(result => result.errors.length > 0);
    const summary = {
      baseUrl: args.baseUrl,
      checked: completedResults.length,
      failures: failures.length,
      results: completedResults
    };

    if (args.report) {
      const reportPath = resolve(args.report);
      await writeFile(reportPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
      console.log(`Wrote report to ${reportPath}`);
    }

    if (failures.length) {
      console.error(`\nFound console/page errors in ${failures.length} sample(s).`);
      process.exitCode = 1;
    } else {
      console.log('\nNo console/page errors found.');
    }
  } finally {
    await browser.close().catch(() => {});
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
