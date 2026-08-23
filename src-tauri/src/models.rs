use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuotaBucket {
    pub id: String,
    pub name: String,
    pub kind: String,
    pub used_percent: f64,
    pub remaining_percent: f64,
    pub window_minutes: Option<u64>,
    pub resets_at: Option<i64>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexSnapshot {
    pub connection_state: String,
    pub email: Option<String>,
    pub plan_type: Option<String>,
    pub buckets: Vec<QuotaBucket>,
    pub updated_at: Option<i64>,
    pub error: Option<String>,
}

impl Default for CodexSnapshot {
    fn default() -> Self {
        Self { connection_state: "connecting".into(), email: None, plan_type: None, buckets: vec![], updated_at: None, error: None }
    }
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageSummary {
    pub lifetime_tokens: Option<u64>,
    pub peak_daily_tokens: Option<u64>,
    pub longest_running_turn_sec: Option<u64>,
    pub current_streak_days: Option<u64>,
    pub longest_streak_days: Option<u64>,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyUsageBucket {
    pub start_date: String,
    pub tokens: u64,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountUsage {
    pub summary: UsageSummary,
    pub daily_usage_buckets: Vec<DailyUsageBucket>,
    pub updated_at: Option<i64>,
    pub error: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkBuddySnapshot {
    pub remaining_value: f64,
    pub total_value: Option<f64>,
    pub reset_at: Option<i64>,
    pub updated_at: i64,
    pub note: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(default)]
pub struct AppSettings {
    pub notifications_enabled: bool,
    pub workbuddy_thresholds: Vec<f64>,
    pub menu_bar_prefix: String,
    pub profile_name: String,
    pub theme: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            notifications_enabled: true,
            workbuddy_thresholds: vec![1000.0, 500.0, 100.0],
            menu_bar_prefix: "Codex 额度".into(),
            profile_name: String::new(),
            theme: "system".into(),
        }
    }
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSnapshot {
    pub codex: CodexSnapshot,
    pub usage: AccountUsage,
    pub workbuddy: Option<WorkBuddySnapshot>,
    pub settings: AppSettings,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkBuddyInput {
    pub remaining_value: f64,
    pub total_value: Option<f64>,
    pub reset_at: Option<i64>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceLogin { pub verification_url: String, pub user_code: String }

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct PersistedData {
    pub workbuddy: Option<WorkBuddySnapshot>,
    pub settings: AppSettings,
}
