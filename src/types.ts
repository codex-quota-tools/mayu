export type ConnectionState = "connecting" | "online" | "offline" | "unsupported";

export interface QuotaBucket {
  id: string;
  name: string;
  kind: "primary" | "secondary";
  usedPercent: number;
  remainingPercent: number;
  windowMinutes?: number;
  resetsAt?: number;
}

export interface CodexSnapshot {
  connectionState: ConnectionState;
  email?: string;
  planType?: string;
  buckets: QuotaBucket[];
  updatedAt?: number;
  error?: string;
}

export interface WorkBuddySnapshot {
  remainingValue: number;
  totalValue?: number;
  resetAt?: number;
  updatedAt: number;
  note?: string;
}

export interface AccountUsage {
  summary: {
    lifetimeTokens?: number;
    peakDailyTokens?: number;
    longestRunningTurnSec?: number;
    currentStreakDays?: number;
    longestStreakDays?: number;
  };
  dailyUsageBuckets: Array<{ startDate: string; tokens: number }>;
  updatedAt?: number;
  error?: string;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  workbuddyThresholds: number[];
  menuBarPrefix: string;
  profileName: string;
  theme: "system" | "light" | "dark";
}

export interface AppSnapshot {
  codex: CodexSnapshot;
  usage: AccountUsage;
  workbuddy?: WorkBuddySnapshot;
  settings: AppSettings;
}

export interface DeviceLogin {
  verificationUrl: string;
  userCode: string;
}
