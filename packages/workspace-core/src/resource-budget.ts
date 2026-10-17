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

  const ua = customEnv?.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');

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
  readonly storageEstimateProvider?:
    (() => Promise<{ quota?: number | undefined; usage?: number | undefined }>) | undefined;
}

export type BudgetDecision = 'allowed' | 'warning' | 'blocked';

export interface BudgetIssueParams {
  readonly FILE_COUNT_EXCEEDED: {
    readonly fileCount: number;
    readonly limit: number;
    readonly profile: DeviceProfile;
  };
  readonly FILE_TOO_LARGE: {
    readonly fileName: string;
    readonly sizeBytes: number;
    readonly limitBytes: number;
    readonly profile: DeviceProfile;
  };
  readonly TOTAL_SIZE_EXCEEDED: {
    readonly sizeBytes: number;
    readonly limitBytes: number;
    readonly profile: DeviceProfile;
  };
  readonly PAGE_COUNT_EXCEEDED: {
    readonly pageCount: number;
    readonly limit: number;
    readonly profile: DeviceProfile;
  };
  readonly WORKSPACE_STORAGE_EXCEEDED: {
    readonly sizeBytes: number;
    readonly limitBytes: number;
    readonly profile: DeviceProfile;
  };
  readonly BROWSER_QUOTA_EXCEEDED: {
    readonly sizeBytes: number;
    readonly quotaBytes: number;
    readonly profile: DeviceProfile;
  };
  readonly HIGH_RESOURCE_USAGE: { readonly sizeBytes: number; readonly profile: DeviceProfile };
}

export type BudgetIssueCode = keyof BudgetIssueParams;

interface BudgetDetails {
  readonly totalBytes: number;
  readonly fileCount: number;
  readonly totalPages: number;
  readonly limitBytes: number;
  readonly profile: DeviceProfile;
}

type BudgetIssue = {
  [Code in BudgetIssueCode]: {
    readonly decision: Code extends 'HIGH_RESOURCE_USAGE' ? 'warning' : 'blocked';
    readonly code: Code;
    readonly params: BudgetIssueParams[Code];
    readonly details: BudgetDetails;
  };
}[BudgetIssueCode];

export type BudgetEvaluationResult =
  | {
      readonly decision: 'allowed';
      readonly details: BudgetDetails;
      readonly code?: never;
      readonly params?: never;
    }
  | BudgetIssue;

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
      code: 'FILE_COUNT_EXCEEDED',
      params: { fileCount, limit: limits.maxFiles, profile },
      details
    };
  }

  // 2. Individual file size check
  for (const file of options.inputs) {
    if (file.size > limits.maxFileBytes) {
      return {
        decision: 'blocked',
        code: 'FILE_TOO_LARGE',
        params: {
          fileName: file.name ?? '',
          sizeBytes: file.size,
          limitBytes: limits.maxFileBytes,
          profile
        },
        details
      };
    }
  }

  // 3. Total batch bytes check
  if (totalBytes > limits.maxTotalBytes) {
    return {
      decision: 'blocked',
      code: 'TOTAL_SIZE_EXCEEDED',
      params: { sizeBytes: totalBytes, limitBytes: limits.maxTotalBytes, profile },
      details
    };
  }

  // 4. Page count check (if known)
  if (totalPages > limits.maxPages) {
    return {
      decision: 'blocked',
      code: 'PAGE_COUNT_EXCEEDED',
      params: { pageCount: totalPages, limit: limits.maxPages, profile },
      details
    };
  }

  // 5. Workspace storage quota check
  const currentWorkspace = options.currentWorkspaceSizeBytes ?? 0;
  if (currentWorkspace + totalBytes > limits.maxWorkspaceStorageBytes) {
    return {
      decision: 'blocked',
      code: 'WORKSPACE_STORAGE_EXCEEDED',
      params: {
        sizeBytes: currentWorkspace + totalBytes,
        limitBytes: limits.maxWorkspaceStorageBytes,
        profile
      },
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
            code: 'BROWSER_QUOTA_EXCEEDED',
            params: { sizeBytes: estimate.usage + totalBytes, quotaBytes: estimate.quota, profile },
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
    return {
      decision: 'warning',
      code: 'HIGH_RESOURCE_USAGE',
      params: { sizeBytes: totalBytes, profile },
      details
    };
  }

  return {
    decision: 'allowed',
    details
  };
}
