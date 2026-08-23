import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  ArrowClockwise, Bell, CalendarBlank, CheckCircle,
  ChartBar, ClockCounterClockwise, Coins, Desktop, Moon, PencilSimple, Power,
  RocketLaunch, SlidersHorizontal, Sun, UserCircle, WifiSlash
} from "@phosphor-icons/react";
import type { AppSnapshot, DeviceLogin, WorkBuddySnapshot } from "./types";
import { formatBeijingDate, formatDate, freshness } from "./lib/format";

const preview: AppSnapshot = {
  codex: {
    connectionState: "online", planType: "Plus", email: "本地预览",
    updatedAt: Math.floor(Date.now() / 1000),
    buckets: [{ id: "codex", name: "Codex 周额度", kind: "primary", usedPercent: 61, remainingPercent: 39, windowMinutes: 10080, resetsAt: Math.floor(Date.now() / 1000) + 86_400 }]
  },
  usage: {
    summary: { lifetimeTokens: 1_200_000, peakDailyTokens: 240_000, longestRunningTurnSec: 3_600, currentStreakDays: 2, longestStreakDays: 5 },
    dailyUsageBuckets: Array.from({ length: 84 }, (_, index) => ({
      startDate: new Date(Date.now() - (83 - index) * 86_400_000).toISOString().slice(0, 10),
      tokens: index > 62 ? [0, 12_000, 48_000, 120_000, 280_000][index % 5] : 0
    })),
    updatedAt: Math.floor(Date.now() / 1000)
  },
  workbuddy: undefined,
  settings: { notificationsEnabled: true, workbuddyThresholds: [1000, 500, 100], menuBarPrefix: "Codex 额度", profileName: "", theme: "dark" }
};

const inTauri = () => "__TAURI_INTERNALS__" in window;

async function notify(title: string, body: string) {
  if (!inTauri()) return;
  let granted = await isPermissionGranted();
  if (!granted) granted = (await requestPermission()) === "granted";
  if (granted) sendNotification({ title, body });
}

function WorkBuddyEditor({ current, onClose, onSaved }: { current?: WorkBuddySnapshot; onClose: () => void; onSaved: () => void }) {
  const [remaining, setRemaining] = useState(current?.remainingValue?.toString() ?? "");
  const [total, setTotal] = useState(current?.totalValue?.toString() ?? "");
  const [resetAt, setResetAt] = useState(current?.resetAt ? new Date(current.resetAt * 1000).toISOString().slice(0, 16) : "");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true);
    if (!inTauri()) { setSaving(false); onClose(); return; }
    await invoke("save_workbuddy", { input: {
      remainingValue: Number(remaining), totalValue: total ? Number(total) : null,
      resetAt: resetAt ? Math.floor(new Date(resetAt).getTime() / 1000) : null
    }});
    setSaving(false); onSaved(); onClose();
  }

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <form className="modal" onMouseDown={event => event.stopPropagation()} onSubmit={submit}>
      <h2>更新 WorkBuddy 积分</h2>
      <p>数据只保存在本机，并始终标记为手动记录。</p>
      <label>剩余积分<input required min="0" step="1" type="number" value={remaining} onChange={e => setRemaining(e.target.value)} placeholder="例如 1850" /></label>
      <label>本期总积分（可选）<input min="1" step="1" type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="例如 4000" /></label>
      <label>重置时间（可选）<input type="datetime-local" value={resetAt} onChange={e => setResetAt(e.target.value)} /></label>
      <div className="modal-actions"><button type="button" className="text-button" onClick={onClose}>取消</button><button className="primary-button" disabled={saving}>{saving ? "保存中…" : "保存"}</button></div>
    </form>
  </div>;
}

function compactNumber(value?: number) {
  if (value === undefined || value === null) return "—";
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}亿`;
  if (value >= 10_000) return `${(value / 10_000).toFixed(1)}万`;
  return value.toLocaleString();
}

function duration(value?: number) {
  if (value === undefined || value === null) return "—";
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  return hours ? `${hours}小时${minutes}分` : `${minutes}分钟`;
}

function ProfileSection({ snapshot, onRefresh, refreshing }: { snapshot: AppSnapshot; onRefresh: () => void; refreshing: boolean }) {
  const { summary, dailyUsageBuckets } = snapshot.usage;
  const usageByDate = new Map(dailyUsageBuckets.map(bucket => [bucket.startDate, bucket.tokens]));
  const peak = Math.max(1, ...dailyUsageBuckets.map(bucket => bucket.tokens));
  const cells = Array.from({ length: 84 }, (_, index) => {
    const day = new Date(); day.setHours(12, 0, 0, 0); day.setDate(day.getDate() - (83 - index));
    const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    const tokens = usageByDate.get(date) ?? 0;
    const level = tokens === 0 ? 0 : Math.max(1, Math.ceil(tokens / peak * 4));
    return <i key={date} className={`heat-${level}`} title={`${date} · ${tokens.toLocaleString()} Token`} />;
  });
  const name = snapshot.settings.profileName || snapshot.codex.email?.split("@")[0] || "Codex 用户";
  const initial = Array.from(name.trim())[0]?.toUpperCase() || "C";
  const metrics = [
    [compactNumber(summary.lifetimeTokens), "累计 Token"],
    [compactNumber(summary.peakDailyTokens), "峰值 Token"],
    [duration(summary.longestRunningTurnSec), "最长任务"],
    [`${summary.currentStreakDays ?? "—"} 天`, "当前连续"],
    [`${summary.longestStreakDays ?? "—"} 天`, "最长连续"]
  ];
  return <section className="profile-inline" aria-label="个人资料详情">
    <header className="profile-header">
      <div className="profile-avatar">{initial}</div>
      <div className="profile-identity"><strong>{name}</strong><span>{snapshot.codex.email || "已连接 Codex"} · {snapshot.codex.planType || "ChatGPT"}</span></div>
      <button className="profile-refresh" onClick={onRefresh} disabled={refreshing} aria-label="同步资料"><ArrowClockwise size={17} className={refreshing ? "spin" : ""} /></button>
    </header>
    <section className="profile-stats">{metrics.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</section>
    <section className="activity-card">
      <div className="activity-title"><span><ChartBar size={17} />Token 活动</span><small>官方同步</small></div>
      <div className="heatmap">{cells}</div>
      <div className="heatmap-legend"><span>12 周</span><span>少 <i className="heat-1" /><i className="heat-2" /><i className="heat-3" /><i className="heat-4" /> 多</span></div>
    </section>
    <p className="profile-source">数据来自 Codex 官方账户接口 · {freshness(snapshot.usage.updatedAt)}</p>
  </section>;
}

export default function App() {
  const [snapshot, setSnapshot] = useState<AppSnapshot>(preview);
  const [refreshing, setRefreshing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(true);
  const [autostart, setAutostart] = useState(true);
  const [thresholdText, setThresholdText] = useState("1000, 500, 100");
  const [menuPrefix, setMenuPrefix] = useState("Codex 额度");
  const [profileName, setProfileName] = useState("");
  const [login, setLogin] = useState<DeviceLogin>();

  const load = useCallback(async () => {
    if (inTauri()) setSnapshot(await invoke<AppSnapshot>("get_app_snapshot"));
  }, []);

  useEffect(() => {
    load(); let unlisten: undefined | (() => void);
    if (inTauri()) {
      listen<AppSnapshot>("snapshot-updated", event => setSnapshot(event.payload)).then(fn => { unlisten = fn; });
      isEnabled().then(async enabledNow => {
        if (!enabledNow) { await enable(); enabledNow = true; }
        setAutostart(enabledNow);
      }).catch(() => undefined);
    }
    return () => unlisten?.();
  }, [load]);

  useEffect(() => {
    let unlistenPanel: undefined | (() => void);
    if (inTauri()) {
      listen("panel-opened", () => {
        setProfileOpen(true);
        setSettingsOpen(false);
      }).then(fn => { unlistenPanel = fn; });
    }
    return () => unlistenPanel?.();
  }, []);

  useEffect(() => {
    setThresholdText(snapshot.settings.workbuddyThresholds.join(", "));
    setMenuPrefix(snapshot.settings.menuBarPrefix);
    setProfileName(snapshot.settings.profileName);
    document.documentElement.dataset.theme = snapshot.settings.theme;
  }, [snapshot.settings]);

  useEffect(() => {
    if (!snapshot.settings.notificationsEnabled || !snapshot.workbuddy) return;
    const crossed = snapshot.settings.workbuddyThresholds.find(value => snapshot.workbuddy!.remainingValue <= value);
    if (!crossed) return;
    const key = `wb:${snapshot.workbuddy.updatedAt}:${crossed}`;
    if (!localStorage.getItem(key)) { localStorage.setItem(key, "1"); void notify("WorkBuddy 积分提醒", `当前记录剩余 ${snapshot.workbuddy.remainingValue.toLocaleString()} 积分`); }
  }, [snapshot.workbuddy, snapshot.settings]);

  useEffect(() => {
    if (!snapshot.settings.notificationsEnabled) return;
    snapshot.codex.buckets.forEach(bucket => {
      const threshold = [0, 10, 20].find(value => bucket.remainingPercent <= value);
      if (threshold === undefined) return;
      const key = `codex:${bucket.id}:${bucket.kind}:${bucket.resetsAt}:${threshold}`;
      if (!localStorage.getItem(key)) { localStorage.setItem(key, "1"); void notify("Codex 额度提醒", `${bucket.name}剩余 ${Math.round(bucket.remainingPercent)}%`); }
    });
  }, [snapshot.codex.buckets, snapshot.settings.notificationsEnabled]);

  const primary = useMemo(() => snapshot.codex.buckets.reduce((best, bucket) => {
    if (!best) return bucket;
    return (bucket.windowMinutes ?? 0) > (best.windowMinutes ?? 0) ? bucket : best;
  }, snapshot.codex.buckets[0]), [snapshot.codex.buckets]);
  const remaining = Math.round(primary?.remainingPercent ?? 0);
  const tone = remaining >= 50 ? "healthy" : remaining >= 20 ? "warning" : "danger";
  const workbuddyPercent = snapshot.workbuddy?.totalValue ? Math.max(0, Math.min(100, snapshot.workbuddy.remainingValue / snapshot.workbuddy.totalValue * 100)) : undefined;

  async function refresh() {
    setRefreshing(true);
    if (!inTauri()) { window.setTimeout(() => setRefreshing(false), 450); return; }
    try { await invoke("refresh_codex"); await load(); } finally { setRefreshing(false); }
  }

  async function beginLogin() {
    const result = await invoke<DeviceLogin>("start_codex_login"); setLogin(result); await openUrl(result.verificationUrl);
  }

  async function saveSettings(overrides: { notificationsEnabled?: boolean; thresholds?: string; menuBarPrefix?: string; profileName?: string; theme?: "system" | "light" | "dark" } = {}) {
    const thresholds = (overrides.thresholds ?? thresholdText).split(",").map(Number).filter(value => Number.isFinite(value) && value >= 0).sort((a, b) => b - a);
    const settings = {
      notificationsEnabled: overrides.notificationsEnabled ?? snapshot.settings.notificationsEnabled,
      workbuddyThresholds: thresholds.length ? thresholds : [1000, 500, 100],
      menuBarPrefix: overrides.menuBarPrefix ?? menuPrefix,
      profileName: overrides.profileName ?? profileName,
      theme: overrides.theme ?? snapshot.settings.theme
    };
    if (!inTauri()) { setSnapshot(current => ({ ...current, settings })); return; }
    await invoke("save_settings", settings);
    await load();
  }

  return <main className="meter-shell">
    {primary ? <section className="quota-section">
      <header className="quota-kicker">
        <span><i />Codex 配额</span>
        <small>{snapshot.codex.connectionState === "online" ? "已连接" : "同步中"}</small>
      </header>
      <div className="quota-layout">
        <div className="quota-summary"><strong className="quota-number">{remaining}%</strong><span className="quota-label">当前额度剩余</span></div>
        <div className="detail-list">
          <div><span><CalendarBlank size={17} />周额度</span><strong>{remaining}%</strong></div>
          <div title="Codex 额度重置时间（北京时间）"><span><ClockCounterClockwise size={17} />北京时间</span><strong>{formatBeijingDate(primary.resetsAt)}</strong></div>
        </div>
      </div>
      <div className={`progress-track ${tone}`} role="progressbar" aria-label="Codex 剩余额度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={remaining}><i key={snapshot.codex.updatedAt} style={{ width: `${remaining}%` }} /></div>
      <div className="quota-footer">
        <span className="updated-at">{freshness(snapshot.codex.updatedAt)}</span>
        <button className="quota-refresh" onClick={refresh} disabled={refreshing} aria-label="立即刷新"><ArrowClockwise size={16} className={refreshing ? "spin" : ""} /></button>
      </div>
    </section> : <section className="connection-empty">
      {snapshot.codex.connectionState === "offline" ? <WifiSlash size={26} /> : <RocketLaunch size={26} />}
      <strong>{snapshot.codex.error || "尚未连接 Codex"}</strong><span>登录后读取官方额度数据</span>
      <button className="primary-button" onClick={beginLogin}>登录 Codex</button>
      {login && <code>{login.userCode}</code>}
    </section>}

    <section className="workbuddy-section">
      <div className="section-title"><span><Coins size={18} weight="duotone" />WorkBuddy 积分</span><small>手动记录</small></div>
      {snapshot.workbuddy ? <>
        <div className="workbuddy-value"><strong>{snapshot.workbuddy.remainingValue.toLocaleString()}</strong><span>积分</span><button className="mini-icon" onClick={() => setEditorOpen(true)} aria-label="更新积分"><PencilSimple size={16} /></button></div>
        {workbuddyPercent !== undefined && <div className="progress-track purple"><i style={{ width: `${workbuddyPercent}%` }} /></div>}
        <p>{snapshot.workbuddy.resetAt ? `重置于 ${formatDate(snapshot.workbuddy.resetAt)}` : freshness(snapshot.workbuddy.updatedAt)}</p>
      </> : <div className="workbuddy-empty"><span>尚未记录余额</span><button onClick={() => setEditorOpen(true)}>记录积分</button></div>}
    </section>

    <div className="action-bar">
      <button onClick={() => setProfileOpen(value => !value)} aria-expanded={profileOpen}><span><UserCircle size={17} />个人资料</span><span>{profileOpen ? "收起" : "展开"}</span></button>
      <button onClick={() => setSettingsOpen(value => !value)}><span><SlidersHorizontal size={17} />设置</span><span>{settingsOpen ? "收起" : "展开"}</span></button>
    </div>
    {settingsOpen && <section className="settings-panel">
      <label>状态栏名称<input maxLength={18} value={menuPrefix} onChange={event => setMenuPrefix(event.target.value)} onBlur={() => saveSettings({ menuBarPrefix: menuPrefix })} placeholder="留空只显示百分比" /></label>
      <label>个人资料名称<input maxLength={18} value={profileName} onChange={event => setProfileName(event.target.value)} onBlur={() => saveSettings({ profileName })} placeholder="例如 Codex 用户" /></label>
      <div className="theme-setting"><span>外观</span><div className="theme-options" role="group" aria-label="外观模式">
        {(["system", "light", "dark"] as const).map(theme => <button key={theme} className={snapshot.settings.theme === theme ? "active" : ""} aria-pressed={snapshot.settings.theme === theme} onClick={() => saveSettings({ theme })}>
          {theme === "system" ? <Desktop size={14} /> : theme === "light" ? <Sun size={14} /> : <Moon size={14} />}{theme === "system" ? "自动" : theme === "light" ? "浅色" : "深色"}
        </button>)}
      </div></div>
      <div className="setting-row"><span><RocketLaunch size={16} />随系统启动</span><button className={`switch ${autostart ? "on" : ""}`} onClick={async () => { autostart ? await disable() : await enable(); setAutostart(!autostart); }}><i /></button></div>
      <div className="setting-row"><span><Bell size={16} />系统通知</span><button className={`switch ${snapshot.settings.notificationsEnabled ? "on" : ""}`} onClick={() => saveSettings({ notificationsEnabled: !snapshot.settings.notificationsEnabled })}><i /></button></div>
      <label>WorkBuddy 提醒阈值<input value={thresholdText} onChange={event => setThresholdText(event.target.value)} onBlur={() => saveSettings({ thresholds: thresholdText })} /></label>
    </section>}

    {profileOpen && <ProfileSection snapshot={snapshot} onRefresh={refresh} refreshing={refreshing} />}
    <footer className="meter-footer"><span><CheckCircle size={14} />每 60 分钟自动刷新</span><button onClick={() => inTauri() && invoke("quit_app")}><Power size={15} />退出</button></footer>
    {editorOpen && <WorkBuddyEditor current={snapshot.workbuddy} onClose={() => setEditorOpen(false)} onSaved={load} />}
  </main>;
}
