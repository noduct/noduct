import { describe, expect, it } from 'vitest';
import {
  DESKTOP_RESOURCE_BUDGET,
  detectDeviceProfile,
  evaluateResourceBudget,
  MOBILE_RESOURCE_BUDGET
} from './index';

describe('ResourceBudget & Memory Protection', () => {
  it('exports valid platform limits constants', () => {
    expect(DESKTOP_RESOURCE_BUDGET.maxFileBytes).toBe(100 * 1024 * 1024);
    expect(MOBILE_RESOURCE_BUDGET.maxFileBytes).toBe(25 * 1024 * 1024);
  });

  it('detects device profile from screenWidth and userAgent heuristics', () => {
    expect(detectDeviceProfile({ screenWidth: 400 })).toBe('mobile');
    expect(detectDeviceProfile({ screenWidth: 1200 })).toBe('desktop');
    expect(
      detectDeviceProfile({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
      })
    ).toBe('mobile');
    expect(
      detectDeviceProfile({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      })
    ).toBe('desktop');
  });

  it('allows processing when batch is well within limits', async () => {
    const result = await evaluateResourceBudget({
      inputs: [
        { size: 5 * 1024 * 1024, name: 'doc1.pdf', pageCount: 10 },
        { size: 10 * 1024 * 1024, name: 'doc2.pdf', pageCount: 20 }
      ],
      deviceProfile: 'desktop'
    });

    expect(result.decision).toBe('allowed');
    expect(result.code).toBeUndefined();
    expect(result.details.totalBytes).toBe(15 * 1024 * 1024);
    expect(result.details.fileCount).toBe(2);
    expect(result.details.totalPages).toBe(30);
  });

  it('blocks files that exceed individual file size limit', async () => {
    // 30 MB file on Mobile (limit: 25 MB)
    const mobileResult = await evaluateResourceBudget({
      inputs: [{ size: 30 * 1024 * 1024, name: 'large.pdf' }],
      deviceProfile: 'mobile'
    });

    expect(mobileResult.decision).toBe('blocked');
    expect(mobileResult).toMatchObject({
      code: 'FILE_TOO_LARGE',
      params: {
        fileName: 'large.pdf',
        sizeBytes: 30 * 1024 * 1024,
        limitBytes: 25 * 1024 * 1024,
        profile: 'mobile'
      }
    });

    // 120 MB file on Desktop (limit: 100 MB)
    const desktopResult = await evaluateResourceBudget({
      inputs: [{ size: 120 * 1024 * 1024, name: 'huge.pdf' }],
      deviceProfile: 'desktop'
    });

    expect(desktopResult.decision).toBe('blocked');
    expect(desktopResult).toMatchObject({
      code: 'FILE_TOO_LARGE',
      params: {
        fileName: 'huge.pdf',
        sizeBytes: 120 * 1024 * 1024,
        limitBytes: 100 * 1024 * 1024,
        profile: 'desktop'
      }
    });
  });

  it('blocks total batch size exceeding platform ceilings', async () => {
    // 60 MB total on Mobile (limit: 50 MB)
    const mobileResult = await evaluateResourceBudget({
      inputs: [{ size: 20 * 1024 * 1024 }, { size: 20 * 1024 * 1024 }, { size: 20 * 1024 * 1024 }],
      deviceProfile: 'mobile'
    });

    expect(mobileResult.decision).toBe('blocked');
    expect(mobileResult).toMatchObject({
      code: 'TOTAL_SIZE_EXCEEDED',
      params: { sizeBytes: 60 * 1024 * 1024, limitBytes: 50 * 1024 * 1024, profile: 'mobile' }
    });

    // 250 MB total on Desktop (limit: 200 MB)
    const desktopResult = await evaluateResourceBudget({
      inputs: [{ size: 90 * 1024 * 1024 }, { size: 90 * 1024 * 1024 }, { size: 70 * 1024 * 1024 }],
      deviceProfile: 'desktop'
    });

    expect(desktopResult.decision).toBe('blocked');
    expect(desktopResult).toMatchObject({
      code: 'TOTAL_SIZE_EXCEEDED',
      params: { sizeBytes: 250 * 1024 * 1024, limitBytes: 200 * 1024 * 1024, profile: 'desktop' }
    });
  });

  it('blocks when file count exceeds capacity', async () => {
    // 10 files on mobile (limit: 8)
    const files = Array.from({ length: 10 }, () => ({ size: 1024 }));
    const result = await evaluateResourceBudget({
      inputs: files,
      deviceProfile: 'mobile'
    });

    expect(result.decision).toBe('blocked');
    expect(result).toMatchObject({
      code: 'FILE_COUNT_EXCEEDED',
      params: { fileCount: 10, limit: 8, profile: 'mobile' }
    });
  });

  it('blocks when page count exceeds capacity', async () => {
    // 150 pages on mobile (limit: 100)
    const result = await evaluateResourceBudget({
      inputs: [{ size: 1024, pageCount: 150 }],
      deviceProfile: 'mobile'
    });

    expect(result.decision).toBe('blocked');
    expect(result).toMatchObject({
      code: 'PAGE_COUNT_EXCEEDED',
      params: { pageCount: 150, limit: 100, profile: 'mobile' }
    });
  });

  it('blocks when total workspace storage limit would be breached', async () => {
    // 60 MB currently in workspace + 20 MB new on Mobile (limit: 75 MB)
    const result = await evaluateResourceBudget({
      inputs: [{ size: 20 * 1024 * 1024 }],
      currentWorkspaceSizeBytes: 60 * 1024 * 1024,
      deviceProfile: 'mobile'
    });

    expect(result.decision).toBe('blocked');
    expect(result).toMatchObject({
      code: 'WORKSPACE_STORAGE_EXCEEDED',
      params: { sizeBytes: 80 * 1024 * 1024, limitBytes: 75 * 1024 * 1024, profile: 'mobile' }
    });
  });

  it('returns warning when resource consumption is high (> 80% of capacity)', async () => {
    // Two 21 MB files on mobile (each < 25 MB unit limit, total 42 MB > 40 MB batch warning threshold)
    const result = await evaluateResourceBudget({
      inputs: [
        { size: 21 * 1024 * 1024, name: 'part1.pdf' },
        { size: 21 * 1024 * 1024, name: 'part2.pdf' }
      ],
      deviceProfile: 'mobile'
    });

    expect(result.decision).toBe('warning');
    expect(result).toMatchObject({
      code: 'HIGH_RESOURCE_USAGE',
      params: { sizeBytes: 42 * 1024 * 1024, profile: 'mobile' }
    });
  });

  it('checks browser storage estimate provider', async () => {
    const result = await evaluateResourceBudget({
      inputs: [{ size: 10 * 1024 * 1024 }],
      deviceProfile: 'desktop',
      storageEstimateProvider: async () => ({
        quota: 20 * 1024 * 1024,
        usage: 15 * 1024 * 1024 // 15 + 10 = 25 MB > 20 MB quota
      })
    });

    expect(result.decision).toBe('blocked');
    expect(result).toMatchObject({
      code: 'BROWSER_QUOTA_EXCEEDED',
      params: { sizeBytes: 25 * 1024 * 1024, quotaBytes: 20 * 1024 * 1024, profile: 'desktop' }
    });
  });
});
