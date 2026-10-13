import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const reportDirectory = new URL('../lighthouse-report/', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1');
const reports = (await readdir(reportDirectory)).filter((file) => file.endsWith('.report.json'));
const parsed = await Promise.all(reports.map(async (file) => ({ file, modified: (await stat(join(reportDirectory, file))).mtimeMs, report: JSON.parse(await readFile(join(reportDirectory, file), 'utf8')) })));
const latest = [...parsed].sort((a, b) => b.modified - a.modified).slice(0, 4).sort((a, b) => a.report.finalDisplayedUrl.localeCompare(b.report.finalDisplayedUrl));
for (const { report } of latest) {
  console.log(JSON.stringify({
    url: report.finalDisplayedUrl,
    performance: report.categories.performance.score * 100,
    accessibility: report.categories.accessibility.score * 100,
    bestPractices: report.categories['best-practices'].score * 100,
    seo: report.categories.seo.score * 100,
    fcpMs: Math.round(report.audits['first-contentful-paint'].numericValue),
    lcpMs: Math.round(report.audits['largest-contentful-paint'].numericValue),
    tbtMs: Math.round(report.audits['total-blocking-time'].numericValue),
    cls: report.audits['cumulative-layout-shift'].numericValue,
    transferredBytes: Math.round(report.audits['total-byte-weight'].numericValue)
  }));
}
