export type DeviceProfile = 'desktop' | 'mobile';

export interface PlatformResourceLimits {
  readonly maxFileBytes: number;
  readonly maxTotalBytes: number;
  readonly maxPages: number;
  readonly maxFiles: number;
  readonly maxWorkspaceStorageBytes: number;
}

export const DESKTOP_RESOURCE_BUDGET: PlatformResourceLimits = {
  maxFileBytes: 100 * 1024 * 1024, // 100 MB
  maxTotalBytes: 200 * 1024 * 1024, // 200 MB
  maxPages: 500,
  maxFiles: 20,
  maxWorkspaceStorageBytes: 250 * 1024 * 1024 // 250 MB
};

export const MOBILE_RESOURCE_BUDGET: PlatformResourceLimits = {
  maxFileBytes: 25 * 1024 * 1024, // 25 MB
  maxTotalBytes: 50 * 1024 * 1024, // 50 MB
  maxPages: 100,
  maxFiles: 8,
  maxWorkspaceStorageBytes: 75 * 1024 * 1024 // 75 MB
};

export function detectDeviceProfile(customEnv?: {
  readonly userAgent?: string | undefined;
  readonly screenWidth?: number | undefined;
}): DeviceProfile {
  if (customEnv?.screenWidth !== undefined) {
    return customEnv.screenWidth < 768 ? 'mobile' : 'desktop';
  }

  const ua =
    customEnv?.userAgent ??
    (typeof navigator !== 'undefined' ? navigator.userAgent : '');

  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
    return 'mobile';
  }

  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return 'mobile';
  }

  return 'desktop';
}

export interface EvaluateInputItem {
  readonly size: number;
  readonly name?: string | undefined;
  readonly pageCount?: number | undefined;
}

export interface EvaluateBudgetOptions {
  readonly inputs: readonly EvaluateInputItem[];
  readonly deviceProfile?: DeviceProfile | undefined;
  readonly currentWorkspaceSizeBytes?: number | undefined;
  readonly storageEstimateProvider?: (() => Promise<{ quota?: number | undefined; usage?: number | undefined }>) | undefined;
}

export type BudgetDecision = 'allowed' | 'warning' | 'blocked';

export interface BudgetEvaluationResult {
  readonly decision: BudgetDecision;
  readonly reason?: string | undefined;
  readonly details: {
    readonly totalBytes: number;
    readonly fileCount: number;
    readonly totalPages: number;
    readonly limitBytes: number;
    readonly profile: DeviceProfile;
  };
}

export async function evaluateResourceBudget(
  options: EvaluateBudgetOptions
): Promise<BudgetEvaluationResult> {
  const profile = options.deviceProfile ?? detectDeviceProfile();
  const limits = profile === 'mobile' ? MOBILE_RESOURCE_BUDGET : DESKTOP_RESOURCE_BUDGET;

  const totalBytes = options.inputs.reduce((acc, item) => acc + (item.size || 0), 0);
  const fileCount = options.inputs.length;
  const totalPages = options.inputs.reduce((acc, item) => acc + (item.pageCount || 0), 0);

  const details = {
    totalBytes,
    fileCount,
    totalPages,
    limitBytes: limits.maxTotalBytes,
    profile
  };

  // 1. File count check
  if (fileCount > limits.maxFiles) {
    return {
      decision: 'blocked',
      reason: `Batch contains ${fileCount} files, exceeding the recommended limit of ${limits.maxFiles} files for ${profile} devices.`,
      details
    };
  }

  // 2. Individual file size check
  for (const file of options.inputs) {
    if (file.size > limits.maxFileBytes) {
      const mbSize = (file.size / (1024 * 1024)).toFixed(1);
      const limitMb = limits.maxFileBytes / (1024 * 1024);
      return {
        decision: 'blocked',
        reason: `File "${file.name ?? 'Unknown'}" (${mbSize} MB) exceeds the ${limitMb} MB limit per file for ${profile} devices.`,
        details
      };
    }
  }

  // 3. Total batch bytes check
  if (totalBytes > limits.maxTotalBytes) {
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
    const limitMb = limits.maxTotalBytes / (1024 * 1024);
    return {
      decision: 'blocked',
      reason: `The total batch size (${totalMb} MB) exceeds the maximum safe limit of ${limitMb} MB for ${profile} devices to prevent browser memory crashes.`,
      details
    };
  }

  // 4. Page count check (if known)
  if (totalPages > limits.maxPages) {
    return {
      decision: 'blocked',
      reason: `Total page count (${totalPages}) exceeds the ${limits.maxPages} page capacity limit for ${profile} devices.`,
      details
    };
  }

  // 5. Workspace storage quota check
  const currentWorkspace = options.currentWorkspaceSizeBytes ?? 0;
  if (currentWorkspace + totalBytes > limits.maxWorkspaceStorageBytes) {
    const totalMb = ((currentWorkspace + totalBytes) / (1024 * 1024)).toFixed(1);
    const limitMb = limits.maxWorkspaceStorageBytes / (1024 * 1024);
    return {
      decision: 'blocked',
      reason: `Adding these files would use ${totalMb} MB of local storage, exceeding the ${limitMb} MB workspace limit. Please clear older documents to proceed.`,
      details
    };
  }

  // 6. Browser storage estimate check (if provider given)
  if (options.storageEstimateProvider) {
    try {
      const estimate = await options.storageEstimateProvider();
      if (estimate.quota !== undefined && estimate.usage !== undefined) {
        if (estimate.usage + totalBytes > estimate.quota) {
          return {
            decision: 'blocked',
            reason: 'Your browser disk quota is nearly full. Please free device space before processing.',
            details
          };
        }
      }
    } catch {
      // Ignored if storage estimate fails
    }
  }

  // 7. Warning threshold (> 80% capacity)
  if (
    totalBytes > limits.maxTotalBytes * 0.8 ||
    (totalPages > 0 && totalPages > limits.maxPages * 0.8) ||
    fileCount > limits.maxFiles * 0.8
  ) {
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
    return {
      decision: 'warning',
      reason: `High memory usage predicted (${totalMb} MB). The operation may temporarily slow down your browser.`,
      details
    };
  }

  return {
    decision: 'allowed',
    details
  };
}

