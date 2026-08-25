use std::{collections::HashMap, path::{Path, PathBuf}, process::Stdio, sync::Arc, time::{Duration, SystemTime, UNIX_EPOCH}};
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager};
use tokio::{io::{AsyncBufReadExt, AsyncWriteExt, BufReader}, process::Command, sync::{mpsc, oneshot, Mutex}, time::{interval, sleep, timeout}};
use crate::{models::{DailyUsageBucket, DeviceLogin, QuotaBucket, UsageSummary}, SharedState};

pub enum Request {
    Refresh(oneshot::Sender<Result<(), String>>),
    Login(oneshot::Sender<Result<DeviceLogin, String>>),
}

#[derive(Clone)]
pub struct CodexHandle { pub tx: mpsc::UnboundedSender<Request> }

fn now() -> i64 { SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64 }

fn preferred_bucket(buckets: &[QuotaBucket]) -> Option<&QuotaBucket> {
    buckets.iter().reduce(|best, bucket| {
        if bucket.window_minutes.unwrap_or_default() > best.window_minutes.unwrap_or_default() { bucket } else { best }
    })
}

fn codex_binary(app: &AppHandle) -> PathBuf {
    let exe = std::env::current_exe().unwrap_or_default();
    let sibling = exe.parent().unwrap_or(Path::new(".")).join(if cfg!(windows) { "codex.exe" } else { "codex" });
    if sibling.exists() { return sibling; }
    if let Ok(resource) = app.path().resource_dir() {
        let candidate = resource.join(if cfg!(windows) { "codex.exe" } else { "codex" });
        if candidate.exists() { return candidate; }
    }
    #[cfg(target_os = "macos")]
    {
        let chatgpt = PathBuf::from("/Applications/ChatGPT.app/Contents/Resources/codex");
        if chatgpt.exists() { return chatgpt; }
    }
    PathBuf::from(if cfg!(windows) { "codex.exe" } else { "codex" })
}

pub(crate) async fn publish(app: &AppHandle, state: &SharedState) {
    let snapshot = state.snapshot.lock().await.clone();
    if let Some(tray) = app.tray_by_id("main-tray") {
        let percent = preferred_bucket(&snapshot.codex.buckets).map(|b| format!("{:.0}%", b.remaining_percent)).unwrap_or_else(|| "--%".into());
        let prefix = snapshot.settings.menu_bar_prefix.trim();
        let primary = if prefix.is_empty() { percent.clone() } else { format!("{} {}", prefix, percent) };
        let wb = snapshot.workbuddy.as_ref().map(|w| format!(" · WorkBuddy {:.0}", w.remaining_value)).unwrap_or_default();
        let _ = tray.set_tooltip(Some(format!("{}{}", primary, wb)));
        #[cfg(target_os = "macos")]
        {
            let _ = tray.set_title(Some(primary));
        }
    }
    let _ = app.emit("snapshot-updated", snapshot);
}

async fn set_error(app: &AppHandle, state: &SharedState, error: String) {
    { let mut data = state.snapshot.lock().await; data.codex.connection_state = "offline".into(); data.codex.error = Some(error); }
    publish(app, state).await;
}

fn window_bucket(id: &str, name: &str, kind: &str, value: &Value) -> Option<QuotaBucket> {
    let used = value.get("usedPercent")?.as_f64()?;
    Some(QuotaBucket {
        id: id.into(), name: if name.is_empty() { if id == "codex" { "Codex 额度".into() } else { id.into() } } else { name.into() },
        kind: kind.into(), used_percent: used, remaining_percent: (100.0 - used).clamp(0.0, 100.0),
        window_minutes: value.get("windowDurationMins").and_then(Value::as_u64), resets_at: value.get("resetsAt").and_then(Value::as_i64),
    })
}

async fn apply_account(state: &SharedState, result: &Value) {
    if let Some(account) = result.get("account") {
        let mut data = state.snapshot.lock().await;
        data.codex.email = account.get("email").and_then(Value::as_str).map(str::to_owned);
        data.codex.plan_type = account.get("planType").and_then(Value::as_str).map(str::to_owned);
        if account.is_null() { data.codex.error = Some("尚未登录 ChatGPT 账号".into()); }
    }
}

async fn apply_limits(app: &AppHandle, state: &SharedState, result: &Value) {
    let root = result.get("rateLimitsByLimitId").or_else(|| result.get("rateLimits"));
    let mut buckets = vec![];
    if let Some(Value::Object(map)) = root {
        let is_single = map.contains_key("primary");
        let entries: Vec<(&str, &Value)> = if is_single { vec![(map.get("limitId").and_then(Value::as_str).unwrap_or("codex"), root.unwrap())] } else { map.iter().map(|(k,v)| (k.as_str(),v)).collect() };
        for (id, item) in entries {
            let name = item.get("limitName").and_then(Value::as_str).unwrap_or(if id == "codex" { "Codex 额度" } else { id });
            if let Some(v) = item.get("primary").and_then(|v| window_bucket(id, name, "primary", v)) { buckets.push(v); }
            if let Some(v) = item.get("secondary").and_then(|v| window_bucket(id, name, "secondary", v)) { buckets.push(v); }
        }
    }
    { let mut data = state.snapshot.lock().await; data.codex.buckets = buckets; data.codex.updated_at = Some(now()); data.codex.connection_state = "online".into(); data.codex.error = None; }
    publish(app, state).await;
}

async fn apply_usage(app: &AppHandle, state: &SharedState, result: &Value) {
    let summary = result.get("summary").unwrap_or(&Value::Null);
    let parsed_summary = UsageSummary {
        lifetime_tokens: summary.get("lifetimeTokens").and_then(Value::as_u64),
        peak_daily_tokens: summary.get("peakDailyTokens").and_then(Value::as_u64),
        longest_running_turn_sec: summary.get("longestRunningTurnSec").and_then(Value::as_u64),
        current_streak_days: summary.get("currentStreakDays").and_then(Value::as_u64),
        longest_streak_days: summary.get("longestStreakDays").and_then(Value::as_u64),
    };
    let buckets = result.get("dailyUsageBuckets").and_then(Value::as_array).map(|items| {
        items.iter().filter_map(|item| Some(DailyUsageBucket {
            start_date: item.get("startDate")?.as_str()?.to_owned(),
            tokens: item.get("tokens").and_then(Value::as_u64).unwrap_or(0),
        })).collect()
    }).unwrap_or_default();
    {
        let mut data = state.snapshot.lock().await;
        data.usage.summary = parsed_summary;
        data.usage.daily_usage_buckets = buckets;
        data.usage.updated_at = Some(now());
        data.usage.error = None;
    }
    publish(app, state).await;
}

async fn write_line(stdin: &mut tokio::process::ChildStdin, value: &Value) -> Result<(), String> {
    stdin.write_all(format!("{}\n", value).as_bytes()).await.map_err(|e| e.to_string())
}

pub fn start(app: AppHandle, state: SharedState) -> CodexHandle {
    let (tx, mut rx) = mpsc::unbounded_channel();
    let app_for_task = app.clone();
    tauri::async_runtime::spawn(async move {
        let mut backoff = 2u64;
        loop {
            let binary = codex_binary(&app_for_task);
            let mut child = match Command::new(&binary).args(["app-server", "--stdio"]).stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::null()).spawn() {
                Ok(child) => child,
                Err(error) => { set_error(&app_for_task, &state, format!("无法启动 Codex：{error}")).await; sleep(Duration::from_secs(backoff)).await; backoff = (backoff * 2).min(60); continue; }
            };
            backoff = 2;
            let mut stdin = child.stdin.take().unwrap();
            let mut lines = BufReader::new(child.stdout.take().unwrap()).lines();
            let _ = write_line(&mut stdin, &json!({"method":"initialize","id":1,"params":{"clientInfo":{"name":"codex_quota_tracker","title":"Codex Quota Tracker","version":"0.1.8"}}})).await;
            let _ = write_line(&mut stdin, &json!({"method":"initialized","params":{}})).await;
            let _ = write_line(&mut stdin, &json!({"method":"account/read","id":2,"params":{"refreshToken":false}})).await;
            let _ = write_line(&mut stdin, &json!({"method":"account/rateLimits/read","id":3})).await;
            let _ = write_line(&mut stdin, &json!({"method":"account/usage/read","id":4})).await;
            let mut purposes: HashMap<u64, &'static str> = HashMap::from([(2,"account"),(3,"limits"),(4,"usage")]);
            let pending: Arc<Mutex<HashMap<u64, oneshot::Sender<Result<Value,String>>>>> = Arc::new(Mutex::new(HashMap::new()));
            let mut next_id = 10u64;
            let mut hourly = interval(Duration::from_secs(3600)); hourly.tick().await;
            loop {
                tokio::select! {
                    message = lines.next_line() => match message {
                        Ok(Some(line)) => if let Ok(value) = serde_json::from_str::<Value>(&line) {
                            if let Some(id) = value.get("id").and_then(Value::as_u64) {
                                if let Some(reply) = pending.lock().await.remove(&id) {
                                    let _ = reply.send(if let Some(error) = value.get("error") { Err(error.to_string()) } else { Ok(value.get("result").cloned().unwrap_or(Value::Null)) });
                                } else if let Some(purpose) = purposes.remove(&id) {
                                    if let Some(result) = value.get("result") { match purpose { "account" => apply_account(&state, result).await, "usage" => apply_usage(&app_for_task, &state, result).await, _ => apply_limits(&app_for_task, &state, result).await } }
                                }
                            } else if value.get("method").and_then(Value::as_str) == Some("account/rateLimits/updated") {
                                if let Some(params) = value.get("params") { apply_limits(&app_for_task, &state, params).await; }
                            } else if value.get("method").and_then(Value::as_str) == Some("account/updated") {
                                let _ = write_line(&mut stdin, &json!({"method":"account/read","id":next_id,"params":{"refreshToken":false}})).await; purposes.insert(next_id,"account"); next_id += 1;
                                let _ = write_line(&mut stdin, &json!({"method":"account/rateLimits/read","id":next_id})).await; purposes.insert(next_id,"limits"); next_id += 1;
                                let _ = write_line(&mut stdin, &json!({"method":"account/usage/read","id":next_id})).await; purposes.insert(next_id,"usage"); next_id += 1;
                            }
                        },
                        _ => break,
                    },
                    Some(request) = rx.recv() => match request {
                        Request::Refresh(reply) => {
                            let id = next_id; next_id += 1;
                            let (tx2, rx2) = oneshot::channel();
                            pending.lock().await.insert(id, tx2);
                            let sent = write_line(&mut stdin, &json!({"method":"account/rateLimits/read","id":id})).await;
                            let usage_id = next_id; next_id += 1;
                            purposes.insert(usage_id, "usage");
                            let usage_sent = write_line(&mut stdin, &json!({"method":"account/usage/read","id":usage_id})).await;
                            if sent.is_err() || usage_sent.is_err() {
                                let _ = reply.send(Err(sent.err().or_else(|| usage_sent.err()).unwrap_or_else(|| "刷新失败".into())));
                            } else {
                                let app2 = app_for_task.clone();
                                let state2 = state.clone();
                                tauri::async_runtime::spawn(async move {
                                    match timeout(Duration::from_secs(15), rx2).await {
                                        Ok(Ok(Ok(result))) => { apply_limits(&app2, &state2, &result).await; let _ = reply.send(Ok(())); },
                                        Ok(Ok(Err(error))) => { let _ = reply.send(Err(error)); },
                                        Ok(Err(_)) => { let _ = reply.send(Err("Codex 连接已关闭".into())); },
                                        Err(_) => { let _ = reply.send(Err("刷新超时，请检查 Codex 连接".into())); },
                                    }
                                });
                            }
                        },
                        Request::Login(reply) => { let id=next_id; next_id+=1; let (tx2,rx2)=oneshot::channel(); pending.lock().await.insert(id,tx2); let _=write_line(&mut stdin,&json!({"method":"account/login/start","id":id,"params":{"type":"chatgptDeviceCode"}})).await; tauri::async_runtime::spawn(async move { let result=match rx2.await { Ok(Ok(v))=>match (v.get("verificationUrl").and_then(Value::as_str),v.get("userCode").and_then(Value::as_str)){(Some(url),Some(code))=>Ok(DeviceLogin{verification_url:url.into(),user_code:code.into()}),_=>Err("登录响应缺少设备码".into())}, Ok(Err(e))=>Err(e), Err(_)=>Err("Codex 连接已关闭".into())}; let _=reply.send(result); }); }
                    },
                    _ = hourly.tick() => { let id=next_id; next_id+=1; purposes.insert(id,"limits"); let _=write_line(&mut stdin,&json!({"method":"account/rateLimits/read","id":id})).await; let usage_id=next_id; next_id+=1; purposes.insert(usage_id,"usage"); let _=write_line(&mut stdin,&json!({"method":"account/usage/read","id":usage_id})).await; }
                }
            }
            set_error(&app_for_task, &state, "Codex 连接中断，正在重连".into()).await;
            sleep(Duration::from_secs(backoff)).await; backoff = (backoff * 2).min(60);
        }
    });
    CodexHandle { tx }
}

#[cfg(test)]
mod tests {
    use super::preferred_bucket;
    use crate::models::QuotaBucket;

    fn bucket(id: &str, remaining_percent: f64, window_minutes: u64) -> QuotaBucket {
        QuotaBucket {
            id: id.into(),
            name: id.into(),
            kind: "primary".into(),
            used_percent: 100.0 - remaining_percent,
            remaining_percent,
            window_minutes: Some(window_minutes),
            resets_at: None,
        }
    }

    #[test]
    fn tray_prefers_the_same_longest_window_as_the_panel() {
        let buckets = vec![bucket("five-hour", 82.0, 300), bucket("weekly", 39.0, 10_080)];
        assert_eq!(preferred_bucket(&buckets).map(|item| item.id.as_str()), Some("weekly"));
        assert!(preferred_bucket(&[]).is_none());
    }
}
