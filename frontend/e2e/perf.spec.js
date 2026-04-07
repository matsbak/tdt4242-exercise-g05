import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Performance test
 * - Measures API POST response times (page.request.post) and page navigation times (page.goto)
 * - Runs multiple iterations, computes p50 and p95
 * - Writes results to `performance-results.json` in the current working directory
 *
 * Usage:
 * - Configure iterations via environment variables:
 *     PERF_API_ITERATIONS (default 20)
 *     PERF_NAV_ITERATIONS (default 10)
 *
 * Notes / best practices implemented:
 * - Warm-up runs are performed and excluded from recorded samples.
 * - Multiple iterations are used and percentiles (p95) are measured rather than single runs.
 * - Test will fail if measured p95 >= 500 ms. You can change the threshold if needed.
 */

function percentile(sortedNumbers, p) {
  if (!sortedNumbers.length) return 0;
  const rank = p / 100 * (sortedNumbers.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return sortedNumbers[lower];
  const weight = rank - lower;
  return sortedNumbers[lower] * (1 - weight) + sortedNumbers[upper] * weight;
}

async function writeResults(results) {
  const outPath = path.resolve(process.cwd(), 'performance-results.json');
  await fs.promises.writeFile(outPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log('Saved performance results to', outPath);
}

test.describe('Performance: API and navigation', () => {
  const API_ENDPOINT = '/api/assignments/101/submit';
  const NAV_URL = '/';
  const API_THRESHOLD_MS = 500;
  const NAV_THRESHOLD_MS = 500;

  const API_ITER = Number(process.env.PERF_API_ITERATIONS || 20);
  const NAV_ITER = Number(process.env.PERF_NAV_ITERATIONS || 10);
  const WARMUP_API = 2;
  const WARMUP_NAV = 1;

  test('API POST p95 < 500ms (measured with page.request)', async ({ page }) => {
    // Warm up application and request fixtures
    await page.goto('/', { waitUntil: 'networkidle' }).catch(() => null);
    await page.request.get('/api/health').catch(() => null);

    // Warm-up API calls (do not record)
    for (let i = 0; i < WARMUP_API; i++) {
      try {
        await page.request.post(API_ENDPOINT, {
          data: {
            student_id: `perf_warm_${i}`,
            ai_declaration: 'warmup',
            ai_logs: [],
            confirmed_automatic_logs: false,
          },
        });
      } catch {
        // ignore warm-up errors
      }
    }

    const apiTimings = [];
    for (let i = 0; i < API_ITER; i++) {
      const payload = {
        student_id: `perf_test_${i}`,
        ai_declaration: 'performance test',
        ai_logs: [],
        confirmed_automatic_logs: false,
      };

      const t0 = Date.now();
      const response = await page.request.post(API_ENDPOINT, { data: payload });
      const t1 = Date.now();
      const elapsed = t1 - t0;

      // Record timing even if status != 2xx (so you can see failing cases)
      apiTimings.push({
        iteration: i,
        ms: elapsed,
        status: response.status(),
      });

      // small delay to avoid overwhelming server
      await new Promise((r) => setTimeout(r, 50));
    }

    // compute stats
    const times = apiTimings.map((r) => r.ms).sort((a, b) => a - b);
    const p50 = percentile(times, 50);
    const p95 = percentile(times, 95);
    const max = Math.max(...times);

    const result = {
      type: 'api_post',
      endpoint: API_ENDPOINT,
      iterations: API_ITER,
      raw: apiTimings,
      stats: {
        p50,
        p95,
        max,
        unit: 'ms',
      },
      threshold_ms: API_THRESHOLD_MS,
      pass: p95 < API_THRESHOLD_MS,
    };

    // persist partially (so nav can append)
    await writeResults({ api: result });

    // Assert on p95
    expect(result.pass).toBe(true);
  });

  test('Navigation/load p95 < 500ms', async ({ page }) => {
    // Warm up
    await page.goto(NAV_URL, { waitUntil: 'load' }).catch(() => null);

    // Warm-up navigations
    for (let i = 0; i < WARMUP_NAV; i++) {
      try {
        await page.goto(NAV_URL, { waitUntil: 'load' });
      } catch {
        // ignore
      }
    }

    const navTimings = [];
    for (let i = 0; i < NAV_ITER; i++) {
      const t0 = Date.now();
      await page.goto(NAV_URL, { waitUntil: 'load' });
      const t1 = Date.now();
      const elapsed = t1 - t0;

      // Additionally gather an in-page navigation timing entry if available
      const perfEntry = await page.evaluate(() => {
        const n = performance.getEntriesByType('navigation')[0];
        if (!n) return null;
        return {
          domContentLoaded: n.domContentLoadedEventEnd,
          load: n.loadEventEnd,
          type: n.type,
        };
      }).catch(() => null);

      navTimings.push({
        iteration: i,
        ms: elapsed,
        perfEntry,
      });

      // small delay between navigations
      await new Promise((r) => setTimeout(r, 100));
    }

    const times = navTimings.map((r) => r.ms).sort((a, b) => a - b);
    const p50 = percentile(times, 50);
    const p95 = percentile(times, 95);
    const max = Math.max(...times);

    // Read previously saved partial results (if any) and append
    const outPath = path.resolve(process.cwd(), 'performance-results.json');
    let existing = {};
    try {
      const content = await fs.promises.readFile(outPath, 'utf-8');
      existing = JSON.parse(content || '{}');
    } catch {
      existing = {};
    }

    const navResult = {
      type: 'navigation',
      url: NAV_URL,
      iterations: NAV_ITER,
      raw: navTimings,
      stats: {
        p50,
        p95,
        max,
        unit: 'ms',
      },
      threshold_ms: NAV_THRESHOLD_MS,
      pass: p95 < NAV_THRESHOLD_MS,
    };

    const final = {
      timestamp: new Date().toISOString(),
      api: existing.api || null,
      navigation: navResult,
    };

    await writeResults(final);

    // Assert on p95
    expect(navResult.pass).toBe(true);
  });
});
