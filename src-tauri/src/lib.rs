mod codex;
mod models;

use std::{fs, path::PathBuf, sync::Arc, time::{SystemTime, UNIX_EPOCH}};
use codex::{CodexHandle, Request};
use models::{AppSettings, AppSnapshot, DeviceLogin, PersistedData, WorkBuddyInput, WorkBuddySnapshot};
use tauri::{menu::{Menu, MenuItem}, tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent}, AppHandle, Emitter, Manager, PhysicalPosition, Rect, State, WindowEvent};
use tokio::sync::{oneshot, Mutex};

#[derive(Clone)]
pub struct SharedState { pub snapshot: Arc<Mutex<AppSnapshot>>, pub data_path: PathBuf }

struct RuntimeState { shared: SharedState, codex: CodexHandle }

fn now() -> i64 { SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64 }

fn data_path() -> PathBuf {
    let dir = dirs::data_local_dir().unwrap_or_else(std::env::temp_dir).join("CodexQuotaTracker");
    let _ = fs::create_dir_all(&dir); dir.join("data.json")
}

fn load_data(path: &PathBuf) -> AppSnapshot {
    let mut persisted = fs::read_to_string(path).ok().and_then(|v| serde_json::from_str::<PersistedData>(&v).ok()).unwrap_or_default();
    if persisted.settings.menu_bar_prefix == "Codex" {
        persisted.settings.menu_bar_prefix = "Codex 额度".into();
    }
    AppSnapshot { workbuddy: persisted.workbuddy, settings: persisted.settings, ..Default::default() }
}

#[allow(clippy::too_many_arguments)]
fn anchored_coordinates(
    anchor_x: f64,
    anchor_y: f64,
    tray_width: f64,
    tray_height: f64,
    window_width: f64,
    window_height: f64,
    monitor_x: f64,
    monitor_y: f64,
    monitor_width: f64,
    monitor_height: f64,
    margin: f64,
) -> (i32, i32) {
    let desired_x = anchor_x + tray_width / 2.0 - window_width / 2.0;
    let desired_y = anchor_y + tray_height + margin;
    let min_x = monitor_x + margin;
    let max_x = monitor_x + monitor_width - window_width - margin;
    let max_y = monitor_y + monitor_height - window_height - margin;
    (
        desired_x.clamp(min_x, max_x.max(min_x)).round() as i32,
        desired_y.min(max_y.max(monitor_y + tray_height)).round() as i32,
    )
}

fn show_anchored(app: &AppHandle, tray_rect: Rect) {
    let Some(window) = app.get_webview_window("main") else { return; };
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
        return;
    }

    let scale = window.scale_factor().unwrap_or(1.0);
    let anchor = tray_rect.position.to_physical::<f64>(scale);
    let tray_size = tray_rect.size.to_physical::<f64>(scale);
    if let Ok(window_size) = window.outer_size() {
        let mut target = (
            (anchor.x + tray_size.width / 2.0 - window_size.width as f64 / 2.0).round() as i32,
            (anchor.y + tray_size.height + 8.0 * scale).round() as i32,
        );

        if let Ok(monitors) = window.available_monitors() {
            if let Some(monitor) = monitors.iter().find(|monitor| {
                let pos = monitor.position();
                let size = monitor.size();
                anchor.x >= pos.x as f64 && anchor.x < (pos.x as f64 + size.width as f64)
                    && anchor.y >= pos.y as f64 && anchor.y < (pos.y as f64 + size.height as f64)
            }) {
                let pos = monitor.position();
                let size = monitor.size();
                target = anchored_coordinates(
                    anchor.x, anchor.y, tray_size.width, tray_size.height,
                    window_size.width as f64, window_size.height as f64,
                    pos.x as f64, pos.y as f64, size.width as f64, size.height as f64,
                    8.0 * scale,
                );
            }
        }
        let _ = window.set_position(PhysicalPosition::new(target.0, target.1));
    }
    let _ = window.show();
    let _ = window.set_focus();
    let _ = app.emit("panel-opened", ());
}

async fn persist(shared: &SharedState) -> Result<(), String> {
    let data = shared.snapshot.lock().await;
    let persisted = PersistedData { workbuddy: data.workbuddy.clone(), settings: data.settings.clone() };
    fs::write(&shared.data_path, serde_json::to_vec_pretty(&persisted).map_err(|e| e.to_string())?).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_app_snapshot(state: State<'_, RuntimeState>) -> Result<AppSnapshot, String> { Ok(state.shared.snapshot.lock().await.clone()) }

#[tauri::command]
async fn refresh_codex(state: State<'_, RuntimeState>) -> Result<(), String> {
    let (tx, rx) = oneshot::channel(); state.codex.tx.send(Request::Refresh(tx)).map_err(|_| "Codex 后台未运行".to_string())?; rx.await.map_err(|_| "Codex 后台未响应".to_string())?
}

#[tauri::command]
async fn start_codex_login(state: State<'_, RuntimeState>) -> Result<DeviceLogin, String> {
    let (tx, rx) = oneshot::channel(); state.codex.tx.send(Request::Login(tx)).map_err(|_| "Codex 后台未运行".to_string())?; rx.await.map_err(|_| "Codex 后台未响应".to_string())?
}

#[tauri::command]
async fn save_workbuddy(app: AppHandle, state: State<'_, RuntimeState>, input: WorkBuddyInput) -> Result<(), String> {
    if !input.remaining_value.is_finite() || input.remaining_value < 0.0 { return Err("剩余积分必须是非负数".into()); }
    if input.total_value.is_some_and(|v| !v.is_finite() || v <= 0.0 || v < input.remaining_value) { return Err("总积分必须大于或等于剩余积分".into()); }
    { let mut data = state.shared.snapshot.lock().await; data.workbuddy = Some(WorkBuddySnapshot { remaining_value: input.remaining_value, total_value: input.total_value, reset_at: input.reset_at, updated_at: now(), note: None }); }
    persist(&state.shared).await?; codex::publish(&app, &state.shared).await; Ok(())
}

#[tauri::command]
async fn save_settings(app: AppHandle, state: State<'_, RuntimeState>, notifications_enabled: bool, workbuddy_thresholds: Vec<f64>, menu_bar_prefix: String, profile_name: String, theme: String) -> Result<(), String> {
    if workbuddy_thresholds.iter().any(|v| !v.is_finite() || *v < 0.0) { return Err("提醒阈值必须是非负数".into()); }
    let theme = match theme.as_str() { "light" | "dark" | "system" => theme, _ => "system".into() };
    { let mut data = state.shared.snapshot.lock().await; data.settings = AppSettings { notifications_enabled, workbuddy_thresholds, menu_bar_prefix: menu_bar_prefix.trim().chars().take(18).collect(), profile_name: profile_name.trim().chars().take(18).collect(), theme }; }
    persist(&state.shared).await?; codex::publish(&app, &state.shared).await; Ok(())
}

#[tauri::command]
fn quit_app(app: AppHandle) { app.exit(0); }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            let path = data_path();
            let shared = SharedState { snapshot: Arc::new(Mutex::new(load_data(&path))), data_path: path };
            let codex = codex::start(app.handle().clone(), shared.clone());
            app.manage(RuntimeState { shared, codex });
            let open = MenuItem::with_id(app, "open", "打开跟踪器", true, None::<&str>)?;
            let refresh = MenuItem::with_id(app, "refresh", "立即刷新 Codex", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open, &refresh, &quit])?;
            let mut tray = TrayIconBuilder::with_id("main-tray").tooltip("Codex 额度 --%").title("Codex 额度 --%");
            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            tray.menu(&menu).show_menu_on_left_click(false).on_menu_event(|app,event| match event.id.as_ref() {
                "open" => { if let Some(w)=app.get_webview_window("main") { let _=w.show(); let _=w.set_focus(); let _=app.emit("panel-opened", ()); } },
                "refresh" => { let state=app.state::<RuntimeState>(); let tx=state.codex.tx.clone(); tauri::async_runtime::spawn(async move { let (reply,_)=oneshot::channel(); let _=tx.send(Request::Refresh(reply)); }); },
                "quit" => app.exit(0), _ => {}
            }).on_tray_icon_event(|tray,event| if let TrayIconEvent::Click { rect, button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event { show_anchored(tray.app_handle(), rect); }).build(app)?;
            Ok(())
        })
        .on_window_event(|window,event| match event {
            WindowEvent::CloseRequested { api, .. } => { api.prevent_close(); let _=window.hide(); },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![get_app_snapshot, refresh_codex, start_codex_login, save_workbuddy, save_settings, quit_app])
        .run(tauri::generate_context!())
        .expect("failed to run Codex Quota Tracker");
}

#[cfg(test)]
mod tests {
    use super::anchored_coordinates;

    #[test]
    fn centers_panel_below_status_item() {
        assert_eq!(
            anchored_coordinates(1200.0, 0.0, 220.0, 48.0, 780.0, 1200.0, 0.0, 0.0, 3024.0, 1964.0, 16.0),
            (920, 64)
        );
    }

    #[test]
    fn keeps_panel_inside_active_display() {
        assert_eq!(
            anchored_coordinates(2950.0, 0.0, 100.0, 48.0, 780.0, 1200.0, 0.0, 0.0, 3024.0, 1964.0, 16.0),
            (2228, 64)
        );
        assert_eq!(
            anchored_coordinates(-1500.0, 0.0, 100.0, 48.0, 780.0, 1200.0, -1728.0, 0.0, 1728.0, 1117.0, 16.0),
            (-1712, 48)
        );
    }
}
