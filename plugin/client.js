/* ==== 01-head.js ==== */
/**
 * Skin Studio — Client half.
 *
 * One self-contained client module: wallpaper stage, theme tokens, music player,
 * desktop pet, chat avatars/bubbles and the two-act intro animation.
 * Authoring sources live in src/ and are concatenated into client.js by tools/build.mjs.
 */
window.__ModuleLoader__.load({
  id: 'dsh-skin-studio',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const useState = React.useState;
    const useEffect = React.useEffect;
    const useRef = React.useRef;
    const useMemo = React.useMemo;
    const useCallback = React.useCallback;

    const SETTINGS_KEY = 'skin-studio-settings';
    const QUOTES_KEY = 'pet-quotes';
    const EMOJIS_KEY = 'pet-emojis';
    const DB_NAME = 'skin-studio-db';
    const STORE_NAME = 'files';
    const DB_VERSION = 1;

    /* 开发期错误上报已移除 */

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const uid = () =>
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'f-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    function hexToRgba(hex, alpha) {
      const text = String(hex || '').replace('#', '');
      const full = text.length === 3 ? text.split('').map((c) => c + c).join('') : text;
      const int = parseInt(full || '000000', 16);
      const r = (int >> 16) & 255;
      const g = (int >> 8) & 255;
      const b = int & 255;
      return 'rgba(' + r + ',' + g + ',' + b + ',' + clamp(alpha, 0, 1).toFixed(3) + ')';
    }

    function fmtDuration(seconds) {
      if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
      const whole = Math.floor(seconds);
      const m = Math.floor(whole / 60);
      const s = whole % 60;
      return m + ':' + String(s).padStart(2, '0');
    }

    function fmtBytes(bytes) {
      if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
      const units = ['B', 'KB', 'MB', 'GB'];
      let index = 0;
      let value = bytes;
      while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index += 1;
      }
      return value.toFixed(value < 10 && index > 0 ? 1 : 0) + ' ' + units[index];
    }

    function pad(n) {
      return String(n).padStart(2, '0');
    }

    function clockText(date, format) {
      const hh = pad(date.getHours());
      const mm = pad(date.getMinutes());
      const ss = pad(date.getSeconds());
      if (format === 'HH:mm:ss') return hh + ':' + mm + ':' + ss;
      if (format === 'hh:mm') {
        const hour12 = date.getHours() % 12 || 12;
        return pad(hour12) + ':' + mm;
      }
      return hh + ':' + mm;
    }

    function dateText(date) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日 ' + weekdays[date.getDay()];
    }

    function readJson(key, fallback) {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return parsed == null ? fallback : parsed;
      } catch (error) {
        return fallback;
      }
    }

    function writeJson(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        return false;
      }
    }

    function hasOwn(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key);
    }

/* ==== 02-css.js ==== */
    const CSS = String.raw`
/* ============================ Skin Studio base ============================ */
:root{--dsss-accent:#3ddc97;--dsss-accent-soft:rgba(61,220,151,.16);}
html:has(body[data-dsss-wp]){background:transparent !important;}
/* 壁纸层显隐由壁纸开关兜底：没开壁纸就一律不显示，避免状态没同步时壁纸残留在界面上 */
#dsss-stage{display:none !important;}
body[data-dsss-wp] #dsss-stage{display:block !important;}
body[data-dsss-wp]{
  --dsw-alias-bg-base:transparent !important;
  --dsw-alias-bg-layer-1:transparent !important;
  --dsw-alias-bg-layer-2:transparent !important;
  --dsw-alias-bg-layer-3:transparent !important;
  --dsw-alias-bg-layer-4:transparent !important;
  --dsw-alias-bg-module-platform:transparent !important;
  --dsw-alias-button-tool-bar-fill:transparent !important;
  --dsw-alias-button-ghost-active-fill:transparent !important;
  --dsw-alias-menu-group-header-fill:transparent !important;
  --dsw-alias-interactive-bg-hover:transparent !important;
  --dsw-alias-interactive-bg-active:transparent !important;
  --dsw-specific-sidebar-fill:transparent !important;
  background:transparent !important;
}
/* 新会话页 / 工作区：内层卡片、列表、开关底板一律不吃壁纸 */
body[data-dsss-wp] [data-slot="root"],
body[data-dsss-wp] [data-slot="workspace"],
body[data-dsss-wp] [data-slot="new-chat"],
body[data-dsss-wp] [data-slot="conversation"],
body[data-dsss-wp] [data-slot="conversation.header"],
body[data-dsss-wp] [data-slot="sidebar"],
body[data-dsss-wp] [data-composer-card],
body[data-dsss-wp] [role="switch"]:not(.dsss-switch),
body[data-dsss-wp] [data-switch]:not(.dsss-switch),
body[data-dsss-wp] [class*="switch"]:not(.dsss-switch){
  background-color:transparent !important;
}
body[data-dsss-wp] #root{background:transparent !important;opacity:var(--dsss-ui-opacity,1);transition:opacity .45s ease;}
body[data-dsss-wp][data-dsss-blur] [data-slot="sidebar"],
body[data-dsss-wp][data-dsss-blur] [data-slot="conversation.header"],
body[data-dsss-wp][data-dsss-blur] [data-composer-card]{
  backdrop-filter:blur(var(--dsss-blur,0px)) saturate(1.15);-webkit-backdrop-filter:blur(var(--dsss-blur,0px)) saturate(1.15);}
/* 输入框背景色自定义 */
[data-composer-card]{
  background-color:var(--dsss-composer-bg,#1e1e1e) !important;
  background-image:var(--dsss-composer-bg-image,none) !important;
  background-size:cover !important;
  background-position:center !important;
  border-radius:16px !important;
  position: relative !important;
  overflow: hidden !important;
}
.dsss-composer-bg-video{
  position:absolute !important;
  inset:0 !important;
  width:100% !important;
  height:100% !important;
  object-fit:cover !important;
  border-radius:16px !important;
  pointer-events:none !important;
  z-index:0 !important;
}
/* 聊天区域背景图 */
[data-conversation-scroll]{
  background-color:var(--dsss-chat-bg,transparent) !important;
  background-image:var(--dsss-chat-bg-image,none) !important;
  background-size:cover !important;
  background-position:center !important;
  position: relative !important;
  overflow: hidden !important;
}
/* 气泡背景图 */
[data-chat-flow] div[class*='bubble'], [data-chat-flow] div[class*='Bubble'], [data-chat-flow] div[class*='message-content'], [data-chat-flow] div[class*='MessageContent'], [data-chat-flow] div[class*='chat-message']{
  background-image:var(--dsss-user-bubble-bg-image,none) !important;
  background-size:cover !important;
  background-position:center !important;
}
.dsss-bubble-bg-video{
  position:absolute !important;
  inset:0 !important;
  width:100% !important;
  height:100% !important;
  object-fit:cover !important;
  pointer-events:none !important;
  z-index:0 !important;
}
.dsss-chat-bg-video{
  position:absolute !important;
  inset:0 !important;
  width:100% !important;
  height:100% !important;
  object-fit:cover !important;
  pointer-events:none !important;
  z-index:0 !important;
}
/* 侧边栏背景色自定义 */
[data-slot="sidebar"] > :first-child{
  background-color:var(--dsss-sidebar-bg,transparent) !important;
  background-image:var(--dsss-sidebar-bg-image,none) !important;
  background-size:cover !important;
  background-position:center !important;
  position: relative !important;
  overflow: hidden !important;
}
.dsss-sidebar-bg-video{
  position:absolute !important;
  inset:0 !important;
  width:100% !important;
  height:100% !important;
  object-fit:cover !important;
  pointer-events:none !important;
  z-index:0 !important;
}
[data-slot="sidebar"]{
  --dsw-specific-sidebar-fill: var(--dsss-sidebar-bg) !important;
  --dsw-alias-brand-primary: var(--dsss-sidebar-bg) !important;
  --dsw-alias-interactive-bg-hover: var(--dsss-sidebar-bg) !important;
  --dsw-alias-interactive-bg-active: var(--dsss-sidebar-bg) !important;
  --dsw-alias-interactive-bg-hover-solid: var(--dsss-sidebar-bg) !important;
  --dsw-alias-button-info-fill: var(--dsss-sidebar-bg) !important;
  --dsw-alias-state-business-primary: var(--dsss-sidebar-bg) !important;
  --dsw-specific-selector: var(--dsss-sidebar-bg) !important;
  background:var(--dsss-sidebar-bg,transparent) !important;
}
/* 新会话按钮单独背景 */
button[class*='newSession']{
  position: relative !important;
  background: var(--dsss-new-session-bg, var(--dsss-session-item-bg, var(--dsss-sidebar-bg))) !important;
  background-image: var(--dsss-new-session-bg-image, none) !important;
  background-size: cover !important;
  background-position: center !important;
}
button[class*='newSession'] > *:not(video){
  position: relative !important;
  z-index: 1 !important;
}
/* 工作区文件夹条目单独背景 */
[data-slot="sidebar"] [class*='projectRow']{
  position: relative !important;
  background: var(--dsss-workspace-folder-bg, var(--dsss-session-item-bg, var(--dsss-sidebar-bg))) !important;
  background-image: var(--dsss-workspace-folder-bg-image, none) !important;
  background-size: cover !important;
  background-position: center !important;
}
[data-slot="sidebar"] [class*='projectRow'] > *:not(video){
  position: relative !important;
  z-index: 1 !important;
}
/* 展开的会话子条目背景（工作区行另走 --dsss-workspace-folder-bg，这里不抢） */
[data-slot="sidebar"] nav button,
[data-slot="sidebar"] [class*='navItem'],
[data-slot="sidebar"] [class*='menuItem'],
[data-slot="sidebar"] [class*='sessionRow'],
[data-slot="sidebar"] [class*='wnFoaW_slot']{
  position: relative !important;
  background: var(--dsss-session-item-bg, var(--dsss-sidebar-bg)) !important;
  background-image: var(--dsss-session-item-bg-image, none) !important;
  background-size: cover !important;
  background-position: center !important;
  overflow: hidden !important;
}
[data-slot="sidebar"] [class*='wnFoaW_slot'] > *:not(video){
  position: relative !important;
  z-index: 1 !important;
}
[data-slot="sidebar"] svg, [data-slot="sidebar"] path{
  color: var(--dsss-sidebar-bg) !important;
  fill: var(--dsss-sidebar-bg) !important;
}
/* 开场幕是不透明的全屏层，直接盖住主界面；这里只让主界面的动效更柔一点（不能把 #root 设为透明，
   否则同一 #root 里的开场层也会一起消失） */
body[data-dsss-intro] #root{transition:opacity .6s ease;}

/* 顶部栏和所有全局文字统一用主题文字色 */
[class*='header'], [class*='topBar'], [class*='TitleBar'] { color: var(--dsw-alias-label-primary) !important; }
[class*='header'] svg, [class*='topBar'] svg, [class*='TitleBar'] svg { fill: var(--dsw-alias-label-primary) !important; }

#dsss-stage{position:fixed;inset:0;z-index:-2;overflow:hidden;pointer-events:none;background:#05070c;}
#dsss-stage>*{position:absolute;inset:0;}
#dsss-stage .dsss-wp-media{background-position:center;background-size:cover;background-repeat:no-repeat;transition:filter .35s ease,opacity .5s ease;image-rendering:auto;-webkit-transform:translateZ(0);transform:translateZ(0);}
#dsss-stage .dsss-wp-media video{width:100%;height:100%;object-fit:cover;display:block;image-rendering:auto;}
#dsss-stage .dsss-wp-mask{background:#05070c;opacity:.3;transition:opacity .3s ease;}

/* ============================ floating launcher ============================ */
#dsss-launcher{position:fixed;z-index:2147482000;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;pointer-events:auto;user-select:none;
  background:linear-gradient(150deg,rgba(255,255,255,.18),rgba(255,255,255,.04));
  border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(16px) saturate(1.3);-webkit-backdrop-filter:blur(16px) saturate(1.3);
  box-shadow:0 12px 30px rgba(0,0,0,.42),0 0 0 1px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.28);
  transition:transform .22s cubic-bezier(.2,.9,.2,1),box-shadow .22s,opacity .3s;color:#fff;font-size:20px;}
#dsss-launcher:hover{transform:translateY(-2px) scale(1.05);box-shadow:0 16px 36px rgba(0,0,0,.5),0 0 22px var(--dsss-accent-soft),inset 0 1px 0 rgba(255,255,255,.32);}
#dsss-launcher:active{transform:scale(.96);}
#dsss-launcher[data-dragging="true"]{cursor:grabbing;transform:scale(1.04);}
#dsss-launcher svg{width:26px;height:26px;display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5));}
#dsss-launcher[data-hidden="true"]{opacity:0;pointer-events:none;transform:scale(.6);}

/* ============================ settings panel ============================ */
#dsss-panel{position:fixed;z-index:2147482100;width:min(860px,calc(100vw - 40px));height:min(620px,calc(100vh - 60px));left:50%;top:50%;
  transform:translate(-50%,-48%) scale(.94);opacity:0;pointer-events:none;display:flex;flex-direction:column;overflow:hidden;border-radius:20px;color:var(--dsw-alias-label-primary,#eef1f6);
  background:radial-gradient(120% 140% at 0% 0%,rgba(255,255,255,.10),rgba(255,255,255,.03) 45%,rgba(0,0,0,.16)),rgba(20,22,28,.82);
  border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(28px) saturate(1.4);-webkit-backdrop-filter:blur(28px) saturate(1.4);
  box-shadow:0 40px 100px rgba(0,0,0,.55),0 0 0 1px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.14);
  transition:opacity .22s ease,transform .3s cubic-bezier(.2,.9,.2,1);font-size:13px;}
#dsss-panel[data-open="true"]{opacity:1;transform:translate(-50%,-50%) scale(1);pointer-events:auto;}
#dsss-panel *{box-sizing:border-box;}

.dsss-head{display:flex;align-items:center;gap:12px;padding:16px 20px 14px;border-bottom:1px solid rgba(255,255,255,.08);flex:none;}
.dsss-logo{width:34px;height:34px;border-radius:11px;flex:none;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(145deg,var(--dsss-accent),rgba(61,220,151,.25));box-shadow:0 6px 18px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.4);}
.dsss-logo svg{width:20px;height:20px;color:#06120d;}
.dsss-head-copy{display:flex;flex-direction:column;gap:2px;min-width:0;}
.dsss-title{font-size:14.5px;font-weight:600;letter-spacing:.2px;line-height:1.2;}
.dsss-subtitle{font-size:11.5px;color:var(--dsw-alias-label-secondary,rgba(255,255,255,.55));opacity:.9;}
.dsss-head-spacer{flex:1;}
.dsss-close{width:30px;height:30px;border-radius:9px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:inherit;
  display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .18s,transform .18s;}
.dsss-close:hover{background:rgba(255,255,255,.14);transform:rotate(90deg);}
.dsss-close svg{width:14px;height:14px;}

.dsss-body{flex:1;display:flex;min-height:0;}
.dsss-rail{width:132px;flex:none;padding:12px 10px;display:flex;flex-direction:column;gap:4px;border-right:1px solid rgba(255,255,255,.07);overflow-y:auto;}
.dsss-tab{display:flex;align-items:center;gap:9px;width:100%;padding:9px 10px;border-radius:10px;border:0;background:transparent;color:inherit;
  font:inherit;font-size:12.8px;cursor:pointer;text-align:left;opacity:.78;transition:background .18s,opacity .18s,transform .18s;}
.dsss-tab:hover{background:rgba(255,255,255,.07);opacity:1;}
.dsss-tab[data-active="true"]{background:var(--dsss-accent-soft);opacity:1;box-shadow:inset 0 0 0 1px rgba(61,220,151,.22);}
.dsss-tab[data-active="true"] .dsss-tab-emoji{transform:scale(1.12);}
.dsss-tab-emoji{font-size:15px;line-height:1;transition:transform .2s;}
.dsss-content{flex:1;min-width:0;overflow-y:auto;padding:18px 22px 26px;scroll-behavior:smooth;}

/* thin custom scrollbars */
.dsss-content::-webkit-scrollbar,.dsss-rail::-webkit-scrollbar,.dsss-list::-webkit-scrollbar{width:7px;height:7px;}
.dsss-content::-webkit-scrollbar-thumb,.dsss-rail::-webkit-scrollbar-thumb,.dsss-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.16);border-radius:99px;}
.dsss-content::-webkit-scrollbar-thumb:hover,.dsss-rail::-webkit-scrollbar-thumb:hover,.dsss-list::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.28);}
.dsss-content::-webkit-scrollbar-track,.dsss-list::-webkit-scrollbar-track{background:transparent;}

.dsss-section{margin-bottom:18px;}
.dsss-section-head{display:flex;align-items:baseline;gap:8px;margin:0 0 10px;}
.dsss-section-title{font-size:12.5px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;opacity:.75;}
.dsss-section-note{font-size:11px;color:var(--dsw-alias-label-secondary,rgba(255,255,255,.5));opacity:.8;}
.dsss-card{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.075);border-radius:14px;padding:14px 16px;margin-bottom:10px;
  transition:background .2s,border-color .2s;}
.dsss-card:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.11);}
.dsss-row{display:flex;align-items:center;gap:12px;min-height:30px;padding:5px 0;}
.dsss-row+.dsss-row{border-top:1px solid rgba(255,255,255,.05);}
.dsss-row-copy{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.dsss-label{font-size:13px;line-height:1.35;}
.dsss-hint{font-size:11px;line-height:1.35;color:var(--dsw-alias-label-secondary,rgba(255,255,255,.5));opacity:.75;}
.dsss-value{font-size:11.5px;color:var(--dsw-alias-label-secondary,rgba(255,255,255,.6));min-width:42px;text-align:right;font-variant-numeric:tabular-nums;}
.dsss-row-control{display:flex;align-items:center;gap:8px;flex:none;}

/* slider */
.dsss-slider{-webkit-appearance:none;appearance:none;width:150px;height:4px;border-radius:99px;background:rgba(255,255,255,.14);outline:none;cursor:pointer;
  transition:opacity .2s;}
.dsss-slider::-webkit-slider-runnable-track{height:4px;border-radius:99px;background:linear-gradient(to right,var(--dsss-accent) 0%,var(--dsss-accent) var(--dsss-fill,50%),rgba(255,255,255,.14) var(--dsss-fill,50%),rgba(255,255,255,.14) 100%);}
.dsss-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:13px;height:13px;margin-top:-4.5px;border-radius:50%;background:#fff;
  box-shadow:0 0 0 3px rgba(255,255,255,.12),0 2px 6px rgba(0,0,0,.4);transition:box-shadow .18s,transform .18s;}
.dsss-slider:hover::-webkit-slider-thumb{box-shadow:0 0 0 5px var(--dsss-accent-soft),0 2px 8px rgba(0,0,0,.4);}
.dsss-slider:active::-webkit-slider-thumb{transform:scale(1.1);}
.dsss-slider.wide{width:210px;}

/* switch */
.dsss-switch{position:relative;width:38px;height:22px;border-radius:99px;background:rgba(255,255,255,.16);border:0;cursor:pointer;padding:0;flex:none;
  transition:background .22s ease,box-shadow .22s ease;}
.dsss-switch[data-on="true"]{background:var(--dsss-accent);box-shadow:0 0 14px var(--dsss-accent-soft);}
.dsss-switch i{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .22s cubic-bezier(.2,.9,.2,1);box-shadow:0 1px 3px rgba(0,0,0,.4);}
.dsss-switch[data-on="true"] i{transform:translateX(16px);}

/* buttons */
.dsss-btn{display:inline-flex;align-items:center;gap:7px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);
  color:inherit;font:inherit;font-size:12.5px;padding:7px 12px;cursor:pointer;transition:background .18s,transform .15s,border-color .18s;}
.dsss-btn:hover{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.2);}
.dsss-btn:active{transform:scale(.97);}
.dsss-btn.primary{background:var(--dsss-accent);border-color:transparent;color:#04150e;font-weight:600;box-shadow:0 6px 18px var(--dsss-accent-soft);}
.dsss-btn.primary:hover{filter:brightness(1.06);}
.dsss-btn.ghost{background:transparent;}
.dsss-btn.danger{border-color:rgba(255,107,107,.45);background:rgba(255,107,107,.14);color:#ffb3b3;}
.dsss-btn.danger:hover{background:rgba(255,107,107,.24);}
.dsss-btn[disabled]{opacity:.45;cursor:not-allowed;}
.dsss-btn svg{width:14px;height:14px;}

/* swatches / segmented */
.dsss-swatches{display:flex;flex-wrap:wrap;gap:9px;}
.dsss-swatch{width:26px;height:26px;border-radius:9px;border:2px solid transparent;cursor:pointer;padding:0;position:relative;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.25),0 3px 8px rgba(0,0,0,.3);transition:transform .16s,border-color .16s;}
.dsss-swatch:hover{transform:translateY(-2px) scale(1.06);}
.dsss-swatch[data-on="true"]{border-color:#fff;transform:scale(1.08);}
.dsss-seg{display:inline-flex;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:2px;gap:2px;}
.dsss-seg button{border:0;background:transparent;color:inherit;font:inherit;font-size:12px;padding:5px 10px;border-radius:8px;cursor:pointer;opacity:.75;transition:background .18s,opacity .18s;}
.dsss-seg button:hover{opacity:1;}
.dsss-seg button[data-on="true"]{background:rgba(255,255,255,.14);opacity:1;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);}
.dsss-color{width:28px;height:26px;padding:0;border:1px solid rgba(255,255,255,.18);border-radius:8px;background:transparent;cursor:pointer;}

/* wallpaper grid */
.dsss-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:10px;max-height:320px;overflow-y:auto;padding-right:4px;}
.dsss-grid::-webkit-scrollbar{width:7px;height:7px;}
.dsss-grid::-webkit-scrollbar-thumb{background:rgba(255,255,255,.16);border-radius:99px;}
.dsss-grid::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.28);}
.dsss-grid::-webkit-scrollbar-track{background:transparent;}
.dsss-thumb{position:relative;aspect-ratio:16/9;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);
  cursor:pointer;transition:transform .2s,border-color .2s,box-shadow .2s;}
.dsss-thumb:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.28);box-shadow:0 10px 24px rgba(0,0,0,.4);}
.dsss-thumb[data-on="true"]{border-color:var(--dsss-accent);box-shadow:0 0 0 2px var(--dsss-accent-soft),0 10px 24px rgba(0,0,0,.4);}
.dsss-thumb img,.dsss-thumb video{width:100%;height:100%;object-fit:cover;display:block;}
.dsss-thumb-bar{position:absolute;inset:auto 0 0 0;display:flex;align-items:center;gap:4px;padding:6px 7px;
  background:linear-gradient(to top,rgba(0,0,0,.72),rgba(0,0,0,0));opacity:0;transform:translateY(6px);transition:opacity .2s,transform .2s;}
.dsss-thumb:hover .dsss-thumb-bar,.dsss-thumb[data-on="true"] .dsss-thumb-bar{opacity:1;transform:translateY(0);}
.dsss-thumb-name{flex:1;min-width:0;font-size:10.5px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.9;}
.dsss-icon-btn{width:22px;height:22px;border-radius:7px;border:0;background:rgba(0,0,0,.35);color:#fff;display:flex;align-items:center;justify-content:center;
  cursor:pointer;font-size:11px;line-height:1;padding:0;transition:background .16s,transform .16s;}
.dsss-icon-btn:hover{background:rgba(0,0,0,.6);transform:scale(1.08);}
.dsss-icon-btn[data-on="true"]{color:#ffd76a;}
.dsss-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:26px 16px;border:1px dashed rgba(255,255,255,.16);
  border-radius:14px;color:rgba(255,255,255,.55);font-size:12px;text-align:center;}
.dsss-empty .emoji{font-size:22px;opacity:.85;}

/* music list */
.dsss-list{display:flex;flex-direction:column;gap:6px;max-height:236px;overflow-y:auto;padding-right:4px;}
.dsss-track{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid transparent;
  transition:background .18s,border-color .18s;}
.dsss-track:hover{background:rgba(255,255,255,.08);}
.dsss-track[data-on="true"]{background:var(--dsss-accent-soft);border-color:rgba(61,220,151,.3);}
.dsss-track-index{width:20px;flex:none;font-size:11px;opacity:.55;text-align:center;font-variant-numeric:tabular-nums;}
.dsss-track-name{flex:1;min-width:0;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dsss-track[data-on="true"] .dsss-track-name{color:var(--dsss-accent);}
.dsss-track-actions{display:flex;gap:4px;flex:none;}

/* mini player */
#dsss-mini{position:fixed;z-index:2147482050;width:236px;border-radius:16px;padding:12px 14px;pointer-events:auto;cursor:grab;user-select:none;
  background:rgba(18,20,26,.86);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(22px) saturate(1.4);-webkit-backdrop-filter:blur(22px) saturate(1.4);
  box-shadow:0 20px 50px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.14);color:#eef1f6;font-size:12px;
  transition:opacity .25s ease,transform .25s cubic-bezier(.2,.9,.2,1);}
#dsss-mini[data-open="false"]{opacity:0;transform:translateY(10px) scale(.96);pointer-events:none;}
#dsss-mini[data-dragging="true"]{cursor:grabbing;}
.dsss-mini-bg{position:absolute;inset:0;border-radius:inherit;overflow:hidden;z-index:0;pointer-events:none;}
.dsss-mini-bg video,.dsss-mini-bg img{width:100%;height:100%;object-fit:cover;}
.dsss-mini-bg::after{content:"";position:absolute;inset:0;background:rgba(10,12,18,.55);}
.dsss-mini-inner{position:relative;z-index:1;}
.dsss-mini-top{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.dsss-mini-disc{width:34px;height:34px;border-radius:50%;flex:none;background:conic-gradient(from 0deg,var(--dsss-accent),#2b6f5c,var(--dsss-accent));
  display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 5px rgba(0,0,0,.35);overflow:hidden;object-fit:cover;}
img.dsss-mini-disc{box-shadow:inset 0 0 0 2px rgba(255,255,255,.2);}
.dsss-mini-disc[data-playing="true"]{animation:dsss-spin 6s linear infinite;}
.dsss-mini-disc::after{content:"";width:6px;height:6px;border-radius:50%;background:#0b0d11;}
@keyframes dsss-spin{to{transform:rotate(360deg);}}
.dsss-mini-copy{flex:1;min-width:0;}
.dsss-mini-title{font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dsss-mini-sub{font-size:10.5px;opacity:.6;}
.dsss-mini-controls{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:6px;}
.dsss-mini-controls button{width:26px;height:26px;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;
  transition:background .16s,transform .16s;padding:0;}
.dsss-mini-controls button:hover{background:rgba(255,255,255,.18);transform:scale(1.06);}
.dsss-mini-controls button.primary{width:32px;height:32px;background:var(--dsss-accent);color:#04150e;}
.dsss-vol{display:flex;align-items:center;gap:8px;margin-top:8px;padding:6px 8px;background:rgba(255,255,255,.06);border-radius:8px;color:#fff;}
.dsss-mini-list{margin-top:8px;max-height:160px;overflow-y:auto;background:rgba(0,0,0,.25);border-radius:8px;color:#fff;}
.dsss-mini-list div{cursor:pointer;}
.dsss-mini-list div:hover{background:rgba(255,255,255,.12);}
.dsss-progress{height:4px;border-radius:99px;background:rgba(255,255,255,.14);overflow:hidden;margin-top:8px;cursor:pointer;position:relative;}
.dsss-progress i{display:block;height:100%;width:0;background:var(--dsss-accent);border-radius:99px;transition:width .18s linear;}

/* desktop pet */
#dsss-pet{position:fixed;z-index:2147481900;pointer-events:auto;user-select:none;touch-action:none;
  transition:opacity .3s ease,filter .3s ease;}
#dsss-pet[data-dragging="true"]{cursor:grabbing;}
#dsss-pet-img{width:100%;height:100%;object-fit:contain;cursor:grab;display:block;filter:drop-shadow(0 10px 18px rgba(0,0,0,.45));
  transition:transform .2s cubic-bezier(.2,.9,.2,1);}
#dsss-pet[data-bounce="true"] #dsss-pet-img{animation:dsss-pet-bounce .6s ease;}
@keyframes dsss-pet-bounce{0%{transform:translateY(0) scale(1);}30%{transform:translateY(-9px) scale(1.06,.96);}55%{transform:translateY(0) scale(.96,1.05);}75%{transform:translateY(-3px) scale(1.02,.99);}100%{transform:translateY(0) scale(1);}}
.dsss-pet-float{animation:dsss-pet-float 5.5s ease-in-out infinite;}
@keyframes dsss-pet-float{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
#dsss-pet-bubble{position:absolute;bottom:calc(100% - 2px);left:50%;transform:translate(-50%,8px) scale(.92);transform-origin:bottom center;
  min-width:64px;max-width:220px;padding:9px 13px;border-radius:14px;background:rgba(22,24,30,.94);border:1px solid rgba(255,255,255,.14);
  color:#f2f4f8;font-size:12.5px;line-height:1.45;text-align:center;opacity:0;pointer-events:none;
  box-shadow:0 12px 30px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.12);transition:opacity .26s ease,transform .26s cubic-bezier(.2,.9,.2,1);white-space:pre-wrap;}
#dsss-pet-bubble[data-show="true"]{opacity:1;transform:translate(-50%,0) scale(1);}
#dsss-pet-bubble::after{content:"";position:absolute;left:50%;bottom:-5px;width:9px;height:9px;background:rgba(22,24,30,.94);
  border-right:1px solid rgba(255,255,255,.14);border-bottom:1px solid rgba(255,255,255,.14);transform:translateX(-50%) rotate(45deg);border-radius:0 0 2px 0;}
#dsss-pet-slit{position:fixed;z-index:2147481899;right:0;top:50%;transform:translateY(-50%);width:16px;height:64px;border-radius:10px 0 0 10px;
  background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.18);border-right:0;backdrop-filter:blur(10px);pointer-events:auto;cursor:pointer;
  display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(255,255,255,.8);transition:width .2s ease,background .2s ease;overflow:hidden;}
#dsss-pet-slit:hover{width:24px;background:rgba(255,255,255,.2);}

/* context menu */
#dsss-menu{position:fixed;z-index:2147483000;min-width:172px;padding:6px;border-radius:12px;pointer-events:auto;
  background:rgba(24,26,32,.92);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  box-shadow:0 18px 44px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.12);color:#eef1f6;font-size:12.5px;
  opacity:0;transform:scale(.96) translateY(-4px);transform-origin:top left;transition:opacity .15s ease,transform .15s ease;}
#dsss-menu[data-open="true"]{opacity:1;transform:scale(1) translateY(0);}
.dsss-menu-item{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border:0;border-radius:8px;background:transparent;color:inherit;
  font:inherit;font-size:12.5px;text-align:left;cursor:pointer;transition:background .14s;}
.dsss-menu-item:hover{background:rgba(255,255,255,.1);}
.dsss-menu-item .ico{width:16px;text-align:center;opacity:.85;}

/* clock */
#dsss-clock{position:fixed;z-index:2147481800;pointer-events:auto;cursor:grab;user-select:none;text-align:center;color:#fff;
  padding:10px 16px;border-radius:14px;background:rgba(12,14,18,.34);border:1px solid rgba(255,255,255,.12);
  backdrop-filter:blur(14px) saturate(1.3);-webkit-backdrop-filter:blur(14px) saturate(1.3);
  box-shadow:0 12px 30px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.16);transition:opacity .3s ease,transform .2s ease;}
#dsss-clock:hover{transform:translateY(-1px);}
#dsss-clock-time{font-size:26px;font-weight:600;letter-spacing:.5px;font-variant-numeric:tabular-nums;line-height:1.1;text-shadow:0 2px 10px rgba(0,0,0,.5);}
#dsss-clock-date{font-size:10.5px;opacity:.7;margin-top:2px;}

/* toast */
#dsss-toast{position:fixed;z-index:2147483400;left:50%;bottom:42px;transform:translate(-50%,14px);opacity:0;pointer-events:none;
  padding:9px 16px;border-radius:11px;background:rgba(20,22,28,.94);border:1px solid rgba(255,255,255,.16);color:#eef1f6;font-size:12.5px;
  box-shadow:0 14px 34px rgba(0,0,0,.5);transition:opacity .22s ease,transform .22s ease;max-width:70vw;}
#dsss-toast[data-show="true"]{opacity:1;transform:translate(-50%,0);}

/* modal */
.dsss-modal-mask{position:fixed;inset:0;z-index:2147483600;background:rgba(4,6,10,.6);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;
  pointer-events:auto;animation:dsss-fade .2s ease;}
.dsss-modal{width:min(380px,calc(100vw - 48px));border-radius:18px;padding:20px 22px;background:rgba(24,26,32,.96);border:1px solid rgba(255,255,255,.16);
  box-shadow:0 30px 70px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.14);color:#eef1f6;animation:dsss-pop .24s cubic-bezier(.2,.9,.2,1);}
.dsss-modal h3{margin:0 0 8px;font-size:15px;}
.dsss-modal p{margin:0 0 18px;font-size:12.5px;line-height:1.6;opacity:.78;}
.dsss-modal-actions{display:flex;justify-content:flex-end;gap:8px;}
@keyframes dsss-fade{from{opacity:0;}to{opacity:1;}}
@keyframes dsss-pop{from{opacity:0;transform:scale(.94);}to{opacity:1;transform:scale(1);}}

/* intro */
#dsss-intro{position:fixed;inset:0;z-index:2147483600;background:#05070c;display:flex;align-items:center;justify-content:center;cursor:pointer;
  pointer-events:auto;overflow:hidden;transition:opacity .7s ease;}
#dsss-intro[data-closing="true"]{opacity:0;pointer-events:none;}
.dsss-intro-act{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .85s ease;}
.dsss-intro-act[data-on="true"]{opacity:1;}
.dsss-intro-logo{width:132px;height:132px;transform:scale(.86);opacity:0;transition:transform 1.6s cubic-bezier(.16,.84,.24,1),opacity 1s ease;
  filter:drop-shadow(0 0 40px rgba(61,220,151,.35));}
.dsss-intro-logo[data-on="true"]{transform:scale(1);opacity:1;}
.dsss-intro-video{width:100%;height:100%;object-fit:cover;}
.dsss-intro-hint{position:absolute;bottom:34px;left:50%;transform:translateX(-50%);font-size:11.5px;letter-spacing:2px;color:rgba(255,255,255,.4);
  animation:dsss-pulse 2.4s ease-in-out infinite;}
@keyframes dsss-pulse{0%,100%{opacity:.3;}50%{opacity:.85;}}

/* ============================ chat decoration ============================ */
body[data-dsss-chat] [data-chat-flow-kind="user"],
body[data-dsss-chat] [data-chat-flow-kind="assistant-step"]{position:relative;}
body[data-dsss-chat] [data-chat-flow-kind="user"]{padding-right:calc(var(--dsss-av-size,38px) + 10px);}
body[data-dsss-chat] [data-chat-flow-kind="assistant-step"]{padding-left:calc(var(--dsss-av-size,38px) + 10px);}
body[data-dsss-chat] [data-we-avatar-row] > .we-avatar{display:none !important;}
body[data-dsss-chat] [data-chat-flow-kind="user"]::after,
body[data-dsss-chat] [data-chat-flow-kind="assistant-step"]::before{
  content:"";position:absolute;top:0;width:var(--dsss-av-size,38px);height:var(--dsss-av-size,38px);border-radius:50%;
  background-color:rgba(255,255,255,.08);background-size:cover;background-position:center;background-repeat:no-repeat;
  border:var(--dsss-av-border,2px) solid var(--dsss-av-frame,transparent);
  box-shadow:0 0 var(--dsss-av-glow,10px) var(--dsss-av-glow-color,transparent),0 4px 12px rgba(0,0,0,.35);
  transition:border-color .25s ease,box-shadow .25s ease,background-image .25s ease;flex:none;z-index:1;}
body[data-dsss-chat] [data-chat-flow-kind="user"]::after{right:0;background-image:var(--dsss-av-user,linear-gradient(145deg,#3ddc97,#1d4d3b));}
body[data-dsss-chat] [data-chat-flow-kind="assistant-step"]::before{left:0;background-image:var(--dsss-av-ai,linear-gradient(145deg,#7c8cff,#33396b));
  border-color:var(--dsss-av-frame-ai,transparent);box-shadow:0 0 var(--dsss-av-glow,10px) var(--dsss-av-glow-ai,transparent),0 4px 12px rgba(0,0,0,.35);}
body[data-dsss-chat] [data-chat-flow-kind="user"] [data-slot="conversation.chat.node"] > .LOmM4q_userRow{filter:none;}

/* ai bubble */
body[data-dsss-chat][data-dsss-ai-bubble] [data-chat-flow-kind="assistant-step"] [data-slot="conversation.chat.node"] > div:first-child{
  background:var(--dsss-ai-bubble,rgba(255,255,255,.06));border-radius:16px;padding:10px 14px;border:1px solid var(--dsss-ai-bubble-border,rgba(255,255,255,.08));
  transition:background .25s ease;box-shadow:0 6px 18px rgba(0,0,0,.18);}
`;

/* ==== 03-store.js ==== */
    /* ------------------------------------------------------------------ *
     * 03 · 默认设置 / 本地存储 / IndexedDB 文件库
     * ------------------------------------------------------------------ */

    const ACCENTS = [
      { id: 'green', color: '#3ddc97' },
      { id: 'mint', color: '#5ce1c0' },
      { id: 'teal', color: '#2dd4bf' },
      { id: 'cyan', color: '#22d3ee' },
      { id: 'sky', color: '#38bdf8' },
      { id: 'blue', color: '#5b9cff' },
      { id: 'indigo', color: '#818cf8' },
      { id: 'purple', color: '#a97bff' },
      { id: 'violet', color: '#c084fc' },
      { id: 'magenta', color: '#e879f9' },
      { id: 'pink', color: '#ff7bb0' },
      { id: 'rose', color: '#fb7185' },
      { id: 'red', color: '#ff6b6b' },
      { id: 'orange', color: '#ffa24d' },
      { id: 'amber', color: '#fbbf24' },
      { id: 'gold', color: '#ffd76a' },
      { id: 'lime', color: '#a3e635' },
      { id: 'emerald', color: '#34d399' },
      { id: 'slate', color: '#94a3b8' },
      { id: 'white', color: '#e5e7eb' }
    ];

    const TEXT_COLORS = [
      '#ffffff', '#0f172a', '#f87171', '#fb923c', '#facc15',
      '#4ade80', '#60a5fa', '#a78bfa', '#f472b6'
    ];

    const DEFAULT_SETTINGS = {
      wallpaper: {
        enabled: true,
        current: null,
        favorites: [],
        overlay: 30,
        blur: 0,
        fit: 'cover',
        sound: { enabled: false, fileId: null, random: false, volume: 40, intervalMin: 5 }
      },
      music: { tracks: [], current: null, volume: 70, mini: false, mode: 'list', coverId: null, bgId: null, bgType: null },
      layout: { launcher: null, clock: null, mini: null },
      appearance: {
        accent: '#3ddc97',
        textColor: '',
        uiOpacity: 100,
        fontSize: 100,
        composerBg: '#1e1e1e',
        composerNoFill: false,
        composerBgId: null,
        composerBgType: null,
        sidebarBg: '#000000',
        sidebarNoFill: false,
        sidebarBgId: null,
        sidebarBgType: null,
        chatBgId: null,
        chatBgType: null,
        userBubbleBg: null,
        aiBubbleBg: null,
        userBubbleBgId: null,
        userBubbleBgType: null,
        aiBubbleBgId: null,
        aiBubbleBgType: null,
        clock: { enabled: false, format: 'HH:mm', showDate: true, size: 26, opacity: 100, bgColor: '#000000', bgNoFill: false, bgId: null, bgType: null }
      },
      chat: {
        enabled: false,
        userAvatar: null,
        aiAvatar: null,
        frameWidth: 2,
        glow: 10,
        userFrame: '#3ddc97',
        aiFrame: '#7c8cff',
        bubbleColor: '#3ddc97',
        bubbleOpacity: 18,
        bubbleNoFill: false,
        aiBubble: false,
        aiBubbleColor: '#7c8cff',
        aiBubbleNoFill: false
      },
      intro: { enabled: false, logo: null, video: null, logoText: 'Skin Studio' },
      pet: {
        enabled: true,
        visible: true,
        docked: false,
        size: 110,
        opacity: 100,
        msgMs: 4000,
        textChance: 60,
        popEmojiChance: 40,
        auto: true,
        autoMin: 3,
        emoji: null,
        collision: false,
        wander: false,
        instances: []
      }
    };

    const DEFAULT_QUOTES = [
      { type: 'text', text: '今天也要元气满满哦～' },
      { type: 'text', text: '休息一下，喝口水吧 💧' },
      { type: 'text', text: '你已经很努力啦，摸摸头' },
      { type: 'text', text: '要不要听首歌放松一下？🎵' },
      { type: 'text', text: '窗外的风景，也想被看见呢' },
      { type: 'text', text: '我一直在你身边陪着你～' },
      { type: 'text', text: '再忙也要记得吃饭呀 🍚' },
      { type: 'text', text: '深呼吸，一切都会好起来的' }
    ];

    function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

    function deepMerge(base, patch) {
      const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
      if (!isObj(patch)) return out;
      Object.keys(patch).forEach(function (k) {
        const bv = out[k], pv = patch[k];
        if (isObj(bv) && isObj(pv)) out[k] = deepMerge(bv, pv);
        else if (pv !== undefined) out[k] = pv;
      });
      return out;
    }

    function loadSettings() {
      let raw = null;
      try { raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null'); } catch (e) { raw = null; }
      const merged = deepMerge(DEFAULT_SETTINGS, isObj(raw) ? raw : {});
      // 兼容：轨道列表永远是数组
      if (!Array.isArray(merged.music.tracks)) merged.music.tracks = [];
      if (!Array.isArray(merged.wallpaper.favorites)) merged.wallpaper.favorites = [];
      // 兼容：多宠物实例列表，老版本只有一个 pet.x/pet.y，迁移成 instances
      if (!Array.isArray(merged.pet.instances) || !merged.pet.instances.length) {
        const oldX = merged.pet.x, oldY = merged.pet.y;
        merged.pet.instances = [{
          id: 'pet-' + Date.now().toString(36),
          x: typeof oldX === 'number' ? oldX : null,
          y: typeof oldY === 'number' ? oldY : null,
          skinId: merged.pet.emoji || null
        }];
      }
      return merged;
    }

    let saveTimer = 0;
    function saveSettings(s) {
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) { /* 忽略配额错误 */ }
    }
    function saveSettingsSoon(s) {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(function () { saveTimer = 0; saveSettings(s); }, 220);
    }

    function loadList(key, fallback) {
      try {
        const v = JSON.parse(localStorage.getItem(key) || 'null');
        if (!Array.isArray(v)) return fallback.slice();
        // 语录迁移：旧版是纯字符串数组，统一包成 {type:'text', text:...}
        if (key === QUOTES_KEY) {
          return v.map(function (item) {
            if (item && typeof item === 'object') return item;
            return { type: 'text', text: String(item) };
          });
        }
        return v;
      } catch (e) { return fallback.slice(); }
    }
    function saveList(key, list) {
      try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) { /* ignore */ }
    }

    /* ---------------------------- IndexedDB ---------------------------- */

    let dbPromise = null;
    function openDb() {
      if (dbPromise) return dbPromise;
      dbPromise = new Promise(function (resolve, reject) {
        let req;
        try { req = indexedDB.open(DB_NAME, DB_VERSION); }
        catch (e) { reject(e); return; }
        req.onupgradeneeded = function () {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('kind', 'kind', { unique: false });
          }
        };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error || new Error('indexedDB open failed')); };
      });
      return dbPromise;
    }

    function tx(mode) {
      return openDb().then(function (db) {
        return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
      });
    }

    function idbPut(record) {
      return tx('readwrite').then(function (store) {
        return new Promise(function (resolve, reject) {
          const r = store.put(record);
          r.onsuccess = function () { resolve(record); };
          r.onerror = function () { reject(r.error); };
        });
      });
    }

    function idbGet(id) {
      if (!id) return Promise.resolve(null);
      return tx('readonly').then(function (store) {
        return new Promise(function (resolve, reject) {
          const r = store.get(id);
          r.onsuccess = function () { resolve(r.result || null); };
          r.onerror = function () { reject(r.error); };
        });
      });
    }

    function idbAll() {
      return tx('readonly').then(function (store) {
        return new Promise(function (resolve, reject) {
          const r = store.getAll();
          r.onsuccess = function () { resolve(r.result || []); };
          r.onerror = function () { reject(r.error); };
        });
      });
    }

    function idbDelete(id) {
      if (!id) return Promise.resolve();
      return tx('readwrite').then(function (store) {
        return new Promise(function (resolve, reject) {
          const r = store.delete(id);
          r.onsuccess = function () { resolve(); };
          r.onerror = function () { reject(r.error); };
        });
      });
    }

    function idbClear() {
      return tx('readwrite').then(function (store) {
        return new Promise(function (resolve, reject) {
          const r = store.clear();
          r.onsuccess = function () { resolve(); };
          r.onerror = function () { reject(r.error); };
        });
      });
    }

    /* --------------------- blob URL 缓存（按记录 id） --------------------- */

    const urlCache = new Map();

    function blobUrlFor(id) {
      if (!id) return Promise.resolve('');
      if (urlCache.has(id)) return Promise.resolve(urlCache.get(id));
      return idbGet(id).then(function (rec) {
        if (!rec || !rec.blob) return '';
        const url = URL.createObjectURL(rec.blob);
        urlCache.set(id, url);
        return url;
      }).catch(function () { return ''; });
    }

    function forgetUrl(id) {
      if (urlCache.has(id)) {
        try { URL.revokeObjectURL(urlCache.get(id)); } catch (e) { /* ignore */ }
        urlCache.delete(id);
      }
    }

    function resetUrlCache() {
      urlCache.forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) { /* ignore */ } });
      urlCache.clear();
    }

    function importFile(file, kind) {
      const rec = {
        id: uid('f'),
        name: file.name || ('file-' + Date.now()),
        mime: file.type || 'application/octet-stream',
        size: file.size || 0,
        kind: kind,
        blob: file,
        addedAt: Date.now()
      };
      return idbPut(rec).then(function () { return rec; });
    }

    function pickFiles(opts) {
      return new Promise(function (resolve) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = opts.accept || '';
        input.multiple = !!opts.multiple;
        input.style.position = 'fixed';
        input.style.left = '-9999px';
        input.style.opacity = '0';
        document.body.appendChild(input);
        let done = false;
        const finish = function (files) {
          if (done) return;
          done = true;
          try { input.remove(); } catch (e) { /* ignore */ }
          resolve(files || []);
        };
        input.addEventListener('change', function () {
          finish(Array.prototype.slice.call(input.files || []));
        });
        // 用户取消时不会触发 change；拿回焦点的宽限后清理
        window.addEventListener('focus', function onFocus() {
          window.removeEventListener('focus', onFocus);
          setTimeout(function () { finish([]); }, 800);
        }, { once: true });
        input.click();
      });
    }

/* ==== 04-ui-kit.js ==== */
    /* ------------------------------------------------------------------ *
     * 04 · 基础 UI 组件（开关 / 滑块 / 行 / 卡片 / 提示 / 确认框）
     * ------------------------------------------------------------------ */

    let toastImpl = null;
    function toast(msg) { if (toastImpl) toastImpl(msg); }

    let confirmImpl = null;
    function confirmDialog(opts) {
      if (!confirmImpl) return Promise.resolve(window.confirm(opts.message || ''));
      return confirmImpl(opts);
    }

    function Switch(props) {
      return h('button', {
        type: 'button',
        className: 'dsss-switch',
        'data-on': props.on ? 'true' : 'false',
        role: 'switch',
        'aria-checked': props.on ? 'true' : 'false',
        title: props.title || '',
        onClick: function (e) { e.stopPropagation(); props.onChange(!props.on); }
      }, h('i', null));
    }

    function Slider(props) {
      const min = props.min == null ? 0 : props.min;
      const max = props.max == null ? 100 : props.max;
      const step = props.step == null ? 1 : props.step;
      const v = props.value == null ? min : props.value;
      const pct = max === min ? 0 : ((v - min) / (max - min)) * 100;
      return h('input', {
        type: 'range',
        className: 'dsss-slider' + (props.wide ? ' wide' : ''),
        min: min, max: max, step: step, value: v,
        style: { '--dsss-fill': pct + '%' },
        onChange: function (e) { props.onChange(Number(e.target.value)); }
      });
    }

    function Row(props) {
      return h('div', { className: 'dsss-row' },
        h('div', { className: 'dsss-row-copy' },
          h('div', { className: 'dsss-label' }, props.label),
          props.hint ? h('div', { className: 'dsss-hint' }, props.hint) : null
        ),
        h('div', { className: 'dsss-row-control' }, props.children)
      );
    }

    function Section(props) {
      return h('div', { className: 'dsss-section' },
        h('div', { className: 'dsss-section-head' },
          h('div', { className: 'dsss-section-title' }, props.title),
          props.note ? h('div', { className: 'dsss-section-note' }, props.note) : null
        ),
        props.children
      );
    }

    function Card(props) {
      return h('div', { className: 'dsss-card' }, props.children);
    }

    function Btn(props) {
      return h('button', {
        type: 'button',
        className: 'dsss-btn' + (props.kind ? ' ' + props.kind : ''),
        disabled: !!props.disabled,
        title: props.title || '',
        onClick: props.onClick
      }, props.icon ? h('span', { 'aria-hidden': 'true' }, props.icon) : null, props.children);
    }

    function Seg(props) {
      return h('div', { className: 'dsss-seg' },
        props.options.map(function (opt) {
          return h('button', {
            key: opt.value,
            type: 'button',
            'data-on': String(props.value) === String(opt.value) ? 'true' : 'false',
            onClick: function () { props.onChange(opt.value); }
          }, opt.label);
        })
      );
    }

    function Empty(props) {
      return h('div', { className: 'dsss-empty' },
        h('div', { className: 'emoji' }, props.emoji || '📂'),
        h('div', null, props.text)
      );
    }

    function IconClose() {
      return h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.2, 'stroke-linecap': 'round' },
        h('path', { d: 'M6 6l12 12M18 6L6 18' }));
    }

    function IconSpark() {
      return h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' },
        h('path', { d: 'M12 2.6l2.1 5.5 5.5 2.1-5.5 2.1-2.1 5.5-2.1-5.5L4.4 10.2l5.5-2.1z' }),
        h('path', { d: 'M18.6 15.4l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z', opacity: '.7' }));
    }

    function ToastHost() {
      const [msg, setMsg] = useState('');
      const [show, setShow] = useState(false);
      const timer = useRef(0);
      useEffect(function () {
        toastImpl = function (m) {
          setMsg(String(m));
          setShow(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(function () { setShow(false); }, 2200);
        };
        return function () { toastImpl = null; if (timer.current) clearTimeout(timer.current); };
      }, []);
      return h('div', { id: 'dsss-toast', 'data-show': show ? 'true' : 'false' }, msg);
    }

    function DialogHost() {
      const [state, setState] = useState(null);
      const resolver = useRef(null);
      useEffect(function () {
        confirmImpl = function (opts) {
          return new Promise(function (resolve) {
            resolver.current = resolve;
            setState(opts || {});
          });
        };
        return function () { confirmImpl = null; };
      }, []);
      const close = function (v) {
        const r = resolver.current;
        resolver.current = null;
        setState(null);
        if (r) r(v);
      };
      if (!state) return null;
      return h('div', { className: 'dsss-modal-mask', onMouseDown: function (e) { if (e.target === e.currentTarget) close(false); } },
        h('div', { className: 'dsss-modal' },
          h('h3', null, state.title || '确认'),
          h('p', null, state.message || ''),
          h('div', { className: 'dsss-modal-actions' },
            h('button', { className: 'dsss-btn ghost', type: 'button', onClick: function () { close(false); } }, state.cancelText || '取消'),
            h('button', {
              className: 'dsss-btn ' + (state.danger ? 'danger' : 'primary'),
              type: 'button',
              onClick: function () { close(true); }
            }, state.okText || '确定')
          )
        )
      );
    }

/* ==== 05-media.js ==== */
    /* ------------------------------------------------------------------ *
     * 05 · 媒体：blob URL、音乐播放器、壁纸声音
     * ------------------------------------------------------------------ */

    function useBlobUrl(id) {
      const [url, setUrl] = useState('');
      useEffect(function () {
        let alive = true;
        if (!id) { setUrl(''); return function () { alive = false; }; }
        blobUrlFor(id).then(function (u) { if (alive) setUrl(u); });
        return function () { alive = false; };
      }, [id]);
      return url;
    }

    function useAudioEl() {
      const ref = useRef(null);
      const [st, setSt] = useState({ playing: false, time: 0, dur: 0 });
      useEffect(function () {
        const a = new Audio();
        a.preload = 'auto';
        ref.current = a;
        const sync = function () {
          setSt({ playing: !a.paused && !a.ended, time: a.currentTime || 0, dur: isFinite(a.duration) ? a.duration : 0 });
        };
        const events = ['timeupdate', 'durationchange', 'play', 'pause', 'ended', 'loadedmetadata', 'volumechange'];
        events.forEach(function (ev) { a.addEventListener(ev, sync); });
        return function () {
          events.forEach(function (ev) { a.removeEventListener(ev, sync); });
          try { a.pause(); } catch (e) { /* ignore */ }
          try { a.removeAttribute('src'); a.load(); } catch (e) { /* ignore */ }
          ref.current = null;
        };
      }, []);
      return [ref, st];
    }

    /* 音乐播放器：播放/暂停/上一首/下一首/进度 */
    function useMusic(settings, setPath) {
      const [audioRef, st] = useAudioEl();
      const intent = useRef(false);
      const loadToken = useRef(0);
      const tracks = settings.music.tracks;
      const currentId = settings.music.current;
      const index = tracks.findIndex(function (t) { return t.id === currentId; });

      useEffect(function () {
        const a = audioRef.current;
        if (!a) return;
        if (!currentId) {
          try { a.pause(); } catch (e) { /* ignore */ }
          a.removeAttribute('src');
          try { a.load(); } catch (e) { /* ignore */ }
          return;
        }
        const token = ++loadToken.current;
        blobUrlFor(currentId).then(function (u) {
          if (!u || token !== loadToken.current) return;
          if (a.getAttribute('src') === u) return;
          a.src = u;
          try { a.load(); } catch (e) { /* ignore */ }
          if (intent.current) a.play().catch(function () { /* ignore */ });
        });
      }, [currentId]);

      useEffect(function () {
        const a = audioRef.current;
        if (a) a.volume = clamp(settings.music.volume / 100, 0, 1);
      }, [settings.music.volume]);

      useEffect(function () {
        const a = audioRef.current;
        if (!a) return;
        const onEnded = function () {
          const mode = settings.music.mode || 'list';
          if (mode === 'single') {
            // 单曲循环：重新播
            intent.current = true;
            a.currentTime = 0;
            a.play().catch(function () {});
            return;
          }
          if (tracks.length > 1) {
            let nextIdx;
            if (mode === 'shuffle') {
              nextIdx = Math.floor(Math.random() * tracks.length);
              if (nextIdx === index) nextIdx = (nextIdx + 1) % tracks.length;
            } else {
              nextIdx = (index + 1) % tracks.length;
            }
            intent.current = true;
            setPath('music.current', tracks[nextIdx].id);
          } else {
            intent.current = false;
          }
        };
        a.addEventListener('ended', onEnded);
        return function () { a.removeEventListener('ended', onEnded); };
      }, [tracks, index, setPath, settings.music.mode]);

      const playTrack = useCallback(function (id) {
        intent.current = true;
        if (settings.music.current === id) {
          const a = audioRef.current;
          if (a) a.play().catch(function () { /* ignore */ });
        } else {
          setPath('music.current', id);
        }
      }, [settings.music.current, setPath]);

      const toggle = useCallback(function () {
        const a = audioRef.current;
        if (!a) return;
        if (!settings.music.current && tracks.length) {
          intent.current = true;
          setPath('music.current', tracks[0].id);
          return;
        }
        if (a.paused) {
          intent.current = true;
          a.play().catch(function () { toast('音频无法播放，文件可能已失效'); });
        } else {
          intent.current = false;
          a.pause();
        }
      }, [settings.music.current, tracks, setPath]);

      const step = useCallback(function (dir) {
        if (!tracks.length) return;
        const mode = settings.music.mode || 'list';
        let nextIdx;
        if (mode === 'shuffle') {
          nextIdx = Math.floor(Math.random() * tracks.length);
          if (nextIdx === index && tracks.length > 1) nextIdx = (nextIdx + 1) % tracks.length;
        } else {
          const base = index < 0 ? 0 : index;
          nextIdx = (base + dir + tracks.length) % tracks.length;
        }
        intent.current = true;
        setPath('music.current', tracks[nextIdx].id);
      }, [tracks, index, setPath, settings.music.mode]);

      const seek = useCallback(function (ratio) {
        const a = audioRef.current;
        if (!a || !isFinite(a.duration)) return;
        a.currentTime = clamp(ratio, 0, 1) * a.duration;
      }, [audioRef]);

      return {
        playing: st.playing,
        time: st.time,
        dur: st.dur,
        index: index,
        currentId: currentId,
        playTrack: playTrack,
        toggle: toggle,
        next: function () { step(1); },
        prev: function () { step(-1); },
        seek: seek
      };
    }

    /* 壁纸声音：可循环或按间隔随机播放；音乐播放时自动暂停 */
    function useAmbience(settings, musicPlaying) {
      const [audioRef] = useAudioEl();
      const s = settings.wallpaper.sound;
      useEffect(function () {
        const a = audioRef.current;
        if (!a) return;
        let timer = 0;
        let alive = true;
        const clearTimer = function () { if (timer) { clearTimeout(timer); timer = 0; } };

        const stop = function () {
          clearTimer();
          try { a.pause(); } catch (e) { /* ignore */ }
          try { a.currentTime = 0; } catch (e) { /* ignore */ }
        };

        if (!s.enabled || !s.fileId || musicPlaying) { stop(); return stop; }

        a.volume = clamp(s.volume / 100, 0, 1);
        a.loop = !s.random;

        blobUrlFor(s.fileId).then(function (u) {
          if (!alive || !u) return;
          if (a.getAttribute('src') !== u) {
            a.src = u;
            try { a.load(); } catch (e) { /* ignore */ }
          }
          a.play().catch(function () { /* 自动播放可能被拦截，忽略 */ });
        });

        const onEnded = function () {
          if (!alive) return;
          if (!s.random) return; // loop 会自动重播
          const gap = Math.max(0, Number(s.intervalMin) || 0) * 60000;
          clearTimer();
          timer = setTimeout(function () {
            if (!alive) return;
            try { a.currentTime = 0; } catch (e) { /* ignore */ }
            a.play().catch(function () { /* ignore */ });
          }, Math.max(600, gap));
        };
        a.addEventListener('ended', onEnded);

        return function () {
          alive = false;
          a.removeEventListener('ended', onEnded);
          stop();
        };
      }, [s.enabled, s.fileId, s.random, s.volume, s.intervalMin, musicPlaying, audioRef]);
    }

/* ==== 06-tabs.js ==== */
    /* ------------------------------------------------------------------ *
     * 06 · 六个标签页
     * ------------------------------------------------------------------ */

    function fileOf(files, id) {
      if (!id) return null;
      for (let i = 0; i < files.length; i++) if (files[i].id === id) return files[i];
      return null;
    }

    // 图片裁剪：直接在页面里加全屏遮罩，不用 window.open（Electron 会拦截）
    function showCropper(file, onDone) {
      // 视频/GIF 不裁剪，直接用
      if ((file.type || '').indexOf('video/') === 0 || /\.gif$/i.test(file.name || '')) { onDone(file); return; }
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          // 创建全屏遮罩
          const mask = document.createElement('div');
          mask.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:15px;font-family:sans-serif;color:#fff';
          const wrap = document.createElement('div');
          wrap.style.cssText = 'position:relative;border:2px solid #3ddc97;cursor:crosshair;max-width:90vw;max-height:70vh';
          const im = document.createElement('img');
          im.src = e.target.result;
          im.style.cssText = 'display:block;max-width:90vw;max-height:70vh;user-select:none';
          const sel = document.createElement('div');
          sel.style.cssText = 'position:absolute;border:2px dashed #fff;background:rgba(61,220,151,0.2);display:none;pointer-events:none';
          wrap.appendChild(im);
          wrap.appendChild(sel);
          const btns = document.createElement('div');
          btns.style.cssText = 'display:flex;gap:10px';
          const okBtn = document.createElement('button');
          okBtn.textContent = '裁剪并使用';
          okBtn.style.cssText = 'padding:8px 20px;border:none;border-radius:6px;cursor:pointer;background:#3ddc97;color:#000;font-size:14px';
          const origBtn = document.createElement('button');
          origBtn.textContent = '不裁剪，用原图';
          origBtn.style.cssText = 'padding:8px 20px;border:none;border-radius:6px;cursor:pointer;background:#555;color:#fff;font-size:14px';
          const cancelBtn = document.createElement('button');
          cancelBtn.textContent = '取消';
          cancelBtn.style.cssText = 'padding:8px 20px;border:none;border-radius:6px;cursor:pointer;background:#555;color:#fff;font-size:14px';
          btns.appendChild(okBtn);
          btns.appendChild(origBtn);
          btns.appendChild(cancelBtn);
          const tip = document.createElement('div');
          tip.textContent = '在图片上拖动画框选择裁剪区域';
          tip.style.cssText = 'font-size:12px;color:#aaa';
          mask.appendChild(wrap);
          mask.appendChild(btns);
          mask.appendChild(tip);
          document.body.appendChild(mask);

          let sx=0, sy=0, ex=0, ey=0, drawing=false;
          im.onmousedown = function(ev) {
            const r = im.getBoundingClientRect();
            sx = ev.clientX - r.left; sy = ev.clientY - r.top;
            drawing = true; sel.style.display='block';
          };
          mask.onmousemove = function(ev) {
            if(!drawing) return;
            const r = im.getBoundingClientRect();
            ex = ev.clientX - r.left; ey = ev.clientY - r.top;
            const x = Math.min(sx,ex), y = Math.min(sy,ey);
            const w = Math.abs(ex-sx), h = Math.abs(ey-sy);
            sel.style.left=x+'px'; sel.style.top=y+'px'; sel.style.width=w+'px'; sel.style.height=h+'px';
          };
          mask.onmouseup = function() { drawing=false; };
          okBtn.onclick = function() {
            const r = im.getBoundingClientRect();
            const scaleX = img.naturalWidth / r.width;
            const scaleY = img.naturalHeight / r.height;
            const x = Math.min(sx,ex)*scaleX, y = Math.min(sy,ey)*scaleY;
            const w = Math.abs(ex-sx)*scaleX, h = Math.abs(ey-sy)*scaleY;
            mask.remove();
            if(w < 10 || h < 10) { onDone(file); return; }
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            c.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
            c.toBlob(function(blob) {
              const f = new File([blob], 'cropped.png', {type:'image/png'});
              onDone(f);
            });
          };
          origBtn.onclick = function() { mask.remove(); onDone(file); };
          cancelBtn.onclick = function() { mask.remove(); };
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    /* ------------------------------ 缩略图 ------------------------------ */

    function Thumb(props) {
      const rec = props.rec;
      const url = useBlobUrl(rec.id);
      const isVideo = (rec.mime || '').indexOf('video') === 0;
      return h('div', {
        className: 'dsss-thumb',
        'data-on': props.active ? 'true' : 'false',
        title: rec.name,
        onClick: function () { props.onPick(rec); }
      },
        !url ? h('div', { className: 'dsss-empty', style: { border: '0', height: '100%' } }, h('div', { className: 'emoji' }, '⏳'))
          : isVideo
            ? h('video', { src: url, muted: true, playsInline: true, preload: 'metadata' })
            : h('img', { src: url, alt: rec.name, loading: 'lazy' }),
        h('div', { className: 'dsss-thumb-bar' },
          h('div', { className: 'dsss-thumb-name' }, rec.name),
          h('button', {
            className: 'dsss-icon-btn',
            type: 'button',
            'data-on': props.fav ? 'true' : 'false',
            title: props.fav ? '取消收藏' : '收藏',
            onClick: function (e) { e.stopPropagation(); props.onFav(rec); }
          }, props.fav ? '★' : '☆'),
          h('button', {
            className: 'dsss-icon-btn',
            type: 'button',
            title: '删除',
            onClick: function (e) { e.stopPropagation(); props.onDelete(rec); }
          }, '✕')
        )
      );
    }

    /* ------------------------------ 壁纸库 ------------------------------ */

    function WallpaperTab(props) {
      const s = props.settings.wallpaper;
      const files = props.files;
      const list = files.filter(function (f) { return f.kind === 'wallpaper'; });
      const favs = s.favorites || [];
      const soundFiles = files.filter(function (f) { return f.kind === 'wallpaper-sound'; });
      const soundRec = fileOf(files, s.sound.fileId);

      const importWallpapers = function () {
        pickFiles({ accept: 'image/*,video/*', multiple: true }).then(function (fs) {
          if (!fs.length) return;
          let chain = Promise.resolve();
          let added = 0;
          fs.forEach(function (f) {
            chain = chain.then(function () {
              return new Promise(function(resolve) {
                showCropper(f, function(cropped) {
                  importFile(cropped, 'wallpaper').then(function () { added++; resolve(); });
                });
              });
            });
          });
          chain.then(function () {
            props.refresh();
            toast('已添加 ' + added + ' 个壁纸');
          });
        });
      };

      const importSound = function () {
        pickFiles({ accept: 'audio/*', multiple: false }).then(function (fs) {
          if (!fs.length) return;
          importFile(fs[0], 'wallpaper-sound').then(function (rec) {
            props.refresh();
            props.setPath('wallpaper.sound.fileId', rec.id);
            toast('壁纸声音已设为 ' + rec.name);
          });
        });
      };

      const sorted = list.slice().sort(function (a, b) {
        const fa = favs.indexOf(a.id) >= 0 ? 0 : 1, fb = favs.indexOf(b.id) >= 0 ? 0 : 1;
        if (fa !== fb) return fa - fb;
        return (b.addedAt || 0) - (a.addedAt || 0);
      });

      return h('div', null,
        h(Section, { title: '壁纸', note: '仅保存在本机' },
          h(Card, null,
            h(Row, { label: '启用壁纸', hint: '关闭后恢复默认背景，所有设置仍会保留' },
              h(Switch, { on: s.enabled, onChange: function (v) { props.setPath('wallpaper.enabled', v); } })),
            h(Row, { label: '壁纸填充', hint: '图片与视频都按此方式铺满窗口' },
              h(Seg, {
                value: s.fit,
                options: [{ value: 'cover', label: '铺满' }, { value: 'contain', label: '完整' }, { value: 'fill', label: '拉伸' }],
                onChange: function (v) { props.setPath('wallpaper.fit', v); }
              }))
          ),
          h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' } },
            h(Btn, { kind: 'primary', icon: '＋', onClick: importWallpapers }, '导入壁纸'),
            h(Btn, {
              icon: '↺',
              disabled: !s.current,
              onClick: function () { props.setPath('wallpaper.current', null); }
            }, '清除当前')
          )
        ),

        h(Section, { title: '我的壁纸', note: list.length ? list.length + ' 个文件 · 点击应用' : '' },
          list.length
            ? h('div', { className: 'dsss-grid' },
                sorted.map(function (rec) {
                  return h(Thumb, {
                    key: rec.id,
                    rec: rec,
                    active: s.current === rec.id,
                    fav: favs.indexOf(rec.id) >= 0,
                    onPick: function (r) {
                      props.setPath('wallpaper.current', r.id);
                      if (!s.enabled) props.setPath('wallpaper.enabled', true);
                    },
                    onFav: function (r) {
                      props.update(function (draft) {
                        const arr = draft.wallpaper.favorites;
                        const i = arr.indexOf(r.id);
                        if (i >= 0) arr.splice(i, 1); else arr.push(r.id);
                      });
                    },
                    onDelete: function (r) {
                      confirmDialog({ title: '删除壁纸', message: '确定要删除「' + r.name + '」吗？此操作不可恢复。', okText: '删除', danger: true })
                        .then(function (ok) {
                          if (!ok) return;
                          idbDelete(r.id).then(function () {
                            forgetUrl(r.id);
                            props.update(function (draft) {
                              if (draft.wallpaper.current === r.id) draft.wallpaper.current = null;
                              draft.wallpaper.favorites = (draft.wallpaper.favorites || []).filter(function (x) { return x !== r.id; });
                            });
                            props.refresh();
                            toast('已删除');
                          });
                        });
                    }
                  });
                })
              )
            : h(Empty, { emoji: '🖼️', text: '还没有壁纸，点上面的「导入壁纸」添加图片或视频' })
        ),

        h(Section, { title: '氛围', note: '让文字更清晰' },
          h(Card, null,
            h(Row, { label: '遮罩浓度', hint: '压暗壁纸，提高正文可读性' },
              h(Slider, { value: s.overlay, min: 0, max: 100, onChange: function (v) { props.setPath('wallpaper.overlay', v); } }),
              h('span', { className: 'dsss-value' }, s.overlay + '%')),
            h(Row, { label: '毛玻璃', hint: '侧栏与面板背后的背景模糊' },
              h(Slider, { value: s.blur, min: 0, max: 30, onChange: function (v) { props.setPath('wallpaper.blur', v); } }),
              h('span', { className: 'dsss-value' }, s.blur + 'px'))
          )
        ),

        h(Section, { title: '壁纸声音', note: '音乐播放时自动暂停' },
          h(Card, null,
            h(Row, { label: '播放壁纸声音', hint: soundRec ? '当前：' + soundRec.name : '选择一段本地音频作为环境音' },
              h(Switch, { on: s.sound.enabled, onChange: function (v) { props.setPath('wallpaper.sound.enabled', v); } })),
            h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' } },
              h(Btn, { icon: '🎵', onClick: importSound }, soundRec ? '更换音频' : '选择音频'),
              soundRec ? h(Btn, {
                icon: '✕',
                onClick: function () { props.setPath('wallpaper.sound.fileId', null); }
              }, '移除') : null
            ),
            soundRec ? h('div', { style: { marginTop: '10px' } },
              h(Row, { label: '随机播放', hint: '每次播完等待间隔后再随机重播' },
                h(Switch, { on: s.sound.random, onChange: function (v) { props.setPath('wallpaper.sound.random', v); } })),
              h(Row, { label: '音量', hint: '环境音大小，播放音乐时自动暂停' },
                h(Slider, { value: s.sound.volume, min: 0, max: 100, onChange: function (v) { props.setPath('wallpaper.sound.volume', v); } }),
                h('span', { className: 'dsss-value' }, s.sound.volume + '%')),
              h(Row, { label: '播放间隔', hint: s.sound.random ? '随机模式下的静默时长' : '循环模式不需要间隔' },
                h(Slider, {
                  value: s.sound.intervalMin, min: 1, max: 60, step: 1,
                  onChange: function (v) { props.setPath('wallpaper.sound.intervalMin', v); }
                }),
                h('span', { className: 'dsss-value' }, s.sound.intervalMin + ' 分'))
            ) : null,
            soundFiles.length > 1 ? h('div', { className: 'dsss-hint', style: { marginTop: '8px' } }, '提示：' + soundFiles.length + ' 个音频可用，切换需重新选择') : null
          )
        )
      );
    }

    /* ------------------------------ 音乐库 ------------------------------ */

    function MusicTab(props) {
      const s = props.settings.music;
      const music = props.music;
      const tracks = s.tracks || [];

      const importTracks = function () {
        pickFiles({ accept: 'audio/*', multiple: true }).then(function (fs) {
          if (!fs.length) return;
          let chain = Promise.resolve();
          const metas = [];
          fs.forEach(function (f) {
            chain = chain.then(function () {
              return importFile(f, 'music').then(function (rec) {
                metas.push({ id: rec.id, name: rec.name, size: rec.size, addedAt: rec.addedAt });
              });
            });
          });
          chain.then(function () {
            props.update(function (draft) { draft.music.tracks = draft.music.tracks.concat(metas); });
            props.refresh();
            toast('已导入 ' + metas.length + ' 首音乐');
          });
        });
      };

      const importBg = function () {
        pickFiles({ accept: 'video/*,image/*', multiple: false }).then(function (fs) {
          if (!fs.length) return;
          const f = fs[0];
          const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(f.name) || (f.type || '').indexOf('video/') === 0;
          importFile(f, 'music-bg').then(function (rec) {
            props.update(function (draft) {
              draft.music.bgId = rec.id;
              draft.music.bgType = isVideo ? 'video' : 'image';
            });
            toast('已设置小窗' + (isVideo ? '动态' : '静态') + '背景');
          });
        });
      };

      const importCover = function () {
        pickFiles({ accept: 'image/*', multiple: false }).then(function (fs) {
          if (!fs.length) return;
          importFile(fs[0], 'music-cover').then(function (rec) {
            props.setPath('music.coverId', rec.id);
            toast('已设置音乐小窗封面');
          });
        });
      };

      const remove = function (rec) {
        confirmDialog({ title: '移出音乐库', message: '确定移除「' + rec.name + '」吗？', okText: '移除', danger: true })
          .then(function (ok) {
            if (!ok) return;
            idbDelete(rec.id).then(function () {
              forgetUrl(rec.id);
              props.update(function (draft) {
                draft.music.tracks = draft.music.tracks.filter(function (t) { return t.id !== rec.id; });
                if (draft.music.current === rec.id) draft.music.current = null;
              });
              props.refresh();
              toast('已移除');
            });
          });
      };

      return h('div', null,
        h(Section, { title: '音乐库', note: tracks.length ? tracks.length + ' 首' : '' },
          h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' } },
            h(Btn, { kind: 'primary', icon: '＋', onClick: importTracks }, '导入本地音乐'),
            h(Btn, { icon: music.playing ? '❚❚' : '▶', disabled: !tracks.length, onClick: music.toggle },
              music.playing ? '暂停' : '播放'),
            h(Btn, { icon: '⏮', disabled: !tracks.length, onClick: music.prev, title: '上一首' }, '上一首'),
            h(Btn, { icon: '⏭', disabled: !tracks.length, onClick: music.next, title: '下一首' }, '下一首'),
            h(Btn, {
              icon: s.mode === 'single' ? '🔂' : s.mode === 'shuffle' ? '🔀' : '🔁',
              onClick: function () {
                const next = s.mode === 'list' ? 'single' : s.mode === 'single' ? 'shuffle' : 'list';
                props.setPath('music.mode', next);
              },
              title: s.mode === 'single' ? '单曲循环' : s.mode === 'shuffle' ? '随机播放' : '列表循环'
            }, s.mode === 'single' ? '单曲循环' : s.mode === 'shuffle' ? '随机播放' : '列表循环')
          ),
          tracks.length
            ? h('div', { className: 'dsss-list' },
                tracks.map(function (t, i) {
                  return h('div', {
                    key: t.id,
                    className: 'dsss-track',
                    'data-on': music.currentId === t.id ? 'true' : 'false',
                    onDoubleClick: function () { music.playTrack(t.id); }
                  },
                    h('div', { className: 'dsss-track-index' }, music.currentId === t.id && music.playing ? '♪' : String(i + 1)),
                    h('div', { className: 'dsss-track-name', title: t.name }, t.name),
                    h('div', { className: 'dsss-track-actions' },
                      h('button', {
                        className: 'dsss-icon-btn',
                        type: 'button',
                        title: music.playing && music.currentId === t.id ? '暂停' : '播放',
                        onClick: function () {
                          if (music.currentId === t.id) music.toggle(); else music.playTrack(t.id);
                        }
                      }, music.playing && music.currentId === t.id ? '❚❚' : '▶'),
                      h('button', { className: 'dsss-icon-btn', type: 'button', title: '移除', onClick: function () { remove(t); } }, '✕')
                    )
                  );
                })
              )
            : h(Empty, { emoji: '🎵', text: '还没有音乐，导入本地音频后即可在这里播放' })
        ),

        h(Section, { title: '播放器', note: '导入后不会自动播放' },
          h(Card, null,
            h(Row, { label: '音量', hint: '音乐库整体音量' },
              h(Slider, { value: s.volume, min: 0, max: 100, onChange: function (v) { props.setPath('music.volume', v); } }),
              h('span', { className: 'dsss-value' }, s.volume + '%')),
            h(Row, { label: '悬浮小窗', hint: '在桌面右下方常驻迷你播放器' },
              h(Switch, { on: s.mini, onChange: function (v) { props.setPath('music.mini', v); } })),
            h(Row, { label: '小窗封面图标', hint: '上传图片当唱片封面，留空用默认渐变唱片' },
              h(Btn, { icon: '🖼', onClick: importCover }, s.coverId ? '更换封面' : '选封面'),
              s.coverId ? h(Btn, { icon: '✕', onClick: function () { props.setPath('music.coverId', null); } }, '清除') : null),
            h(Row, { label: '小窗背景皮肤', hint: '视频自动循环播放，图片静态；盖一层半透明黑底保证文字可读' },
              h(Btn, { icon: '🎬', onClick: importBg }, s.bgId ? '更换背景' : '选背景'),
              s.bgId ? h(Btn, { icon: '✕', onClick: function () { props.update(function (d) { d.music.bgId = null; d.music.bgType = null; }); } }, '清除') : null),
            h(Row, { label: '播放模式', hint: '列表循环 / 单曲循环 / 随机播放' },
              h(Btn, {
                icon: s.mode === 'single' ? '🔂' : s.mode === 'shuffle' ? '🔀' : '🔁',
                onClick: function () {
                  const next = s.mode === 'list' ? 'single' : s.mode === 'single' ? 'shuffle' : 'list';
                  props.setPath('music.mode', next);
                }
              }, s.mode === 'single' ? '单曲循环' : s.mode === 'shuffle' ? '随机播放' : '列表循环')),
            h(Row, { label: '正在播放', hint: tracks.length ? (music.currentId ? tracks[music.index >= 0 ? music.index : 0].name : '未选择') : '音乐库为空' },
              h('span', { className: 'dsss-value', style: { minWidth: '56px' } },
                music.dur ? fmtDuration(music.time) + ' / ' + fmtDuration(music.dur) : '--:--'))
          )
        )
      );
    }

    /* ------------------------------ 外观 ------------------------------ */

    function AvatarPicker(props) {
      const url = useBlobUrl(props.id);
      const pick = function () {
        pickFiles({ accept: 'image/*', multiple: false }).then(function (fs) {
          if (!fs.length) return;
          showCropper(fs[0], function(cropped) {
            importFile(cropped, props.kind).then(function (rec) {
              props.onChange(rec.id);
              props.refresh();
              toast('头像已更新');
            });
          });
        });
      };
      return h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
        h('div', {
          style: {
            width: '42px', height: '42px', borderRadius: '50%', flex: 'none', overflow: 'hidden',
            background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', opacity: .95
          }
        }, url ? h('img', { src: url, alt: '', style: { width: '100%', height: '100%', objectFit: 'cover' } }) : (props.fallback || '🙂')),
        h(Btn, { icon: '🖼', onClick: pick }, url ? '更换' : '选择'),
        props.id ? h(Btn, { icon: '✕', onClick: function () { props.onChange(null); } }, '移除') : null
      );
    }

    function AppearanceTab(props) {
      const s = props.settings.appearance;
      const chat = props.settings.chat;
      const intro = props.settings.intro;

      const importClockBg = function () {
        pickFiles({ accept: 'video/*,image/*', multiple: false }).then(function (fs) {
          if (!fs.length) return;
          const f = fs[0];
          const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(f.name) || (f.type || '').indexOf('video/') === 0;
          importFile(f, 'clock-bg').then(function (rec) {
            props.update(function (draft) {
              draft.appearance.clock.bgId = rec.id;
              draft.appearance.clock.bgType = isVideo ? 'video' : 'image';
            });
            toast('已设置时钟' + (isVideo ? '动态' : '静态') + '背景');
          });
        });
      };

      return h('div', null,
        h(Section, { title: '主题色', note: '按钮、高亮与边框随之变化' },
          h(Card, null,
            h('div', { className: 'dsss-swatches' },
              ACCENTS.map(function (a) {
                return h('button', {
                  key: a.id,
                  type: 'button',
                  className: 'dsss-swatch',
                  title: a.id,
                  'data-on': s.accent.toLowerCase() === a.color.toLowerCase() ? 'true' : 'false',
                  style: { background: a.color },
                  onClick: function () { props.setPath('appearance.accent', a.color); }
                });
              }),
              h('input', {
                type: 'color',
                className: 'dsss-color',
                title: '自定义颜色',
                value: s.accent,
                onChange: function (e) { props.setPath('appearance.accent', e.target.value); }
              })
            )
          )
        ),

        h(Section, { title: '字体颜色', note: '留空则跟随主题默认色' },
          h(Card, null,
            h('div', { className: 'dsss-swatches' },
              TEXT_COLORS.map(function (col) {
                return h('button', {
                  key: col,
                  type: 'button',
                  className: 'dsss-swatch',
                  title: col,
                  'data-on': (s.textColor || '').toLowerCase() === col.toLowerCase() ? 'true' : 'false',
                  style: { background: col },
                  onClick: function () { props.setPath('appearance.textColor', s.textColor === col ? '' : col); }
                });
              }),
              h('input', {
                type: 'color',
                className: 'dsss-color',
                title: '自定义字体颜色',
                value: s.textColor || '#ffffff',
                onChange: function (e) { props.setPath('appearance.textColor', e.target.value); }
              }),
              s.textColor ? h(Btn, { icon: '↺', onClick: function () { props.setPath('appearance.textColor', ''); } }, '恢复默认') : null
            )
          )
        ),

        h(Section, { title: '界面' },
          h(Card, null,
            h(Row, { label: '重置全部外观', hint: '一键恢复所有颜色、透明度、背景图到默认状态，所有自定义全部清空' },
              h(Btn, { icon: '🔄', danger: true, onClick: function () {
                if (confirm('确定要重置所有外观设置吗？所有自定义颜色、透明度、背景图都会恢复默认。')) {
                  props.update(function(d) {
                    d.appearance = { accent: '#4a90e2', textColor: '#1f2329', borderColor: '#4a90e2', bubbleColor: '#4a90e2', aiBubbleColor: '#7c8cff', composerBg: '#1e1e1e', composerOpacity: 85, sidebarBg: '#000000', sidebarOpacity: 60, sessionItemEnabled: false, newSessionEnabled: false, workspaceFolderEnabled: false };
                  });
                  toast('已重置全部外观设置');
                }
              } }, '重置全部')
            ),
            h(Row, { label: '主色调' },
              h('input', { type: 'color', className: 'dsss-color', value: s.accent || '#4a90e2', onChange: function (e) { props.setPath('appearance.accent', e.target.value); } })
            ),
            h(Row, { label: '外观预设' },
              h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
                h('div', { title: '少女粉', onClick: function() {
                    props.setPath('appearance.accent', '#ff6b9d');
                    props.setPath('appearance.composerBg', '#ffd1dc');
                    props.setPath('appearance.composerNoFill', false);
                    props.setPath('appearance.sidebarBg', '#ffb6c1');
                    props.setPath('appearance.sidebarNoFill', false);
                    props.setPath('appearance.textColor', '#4a1942');
                    props.setPath('appearance.borderColor', '#ff8fb3');
                    props.setPath('chat.bubbleColor', '#ff9eb5');
                    props.setPath('chat.aiBubbleColor', '#fff0f3');
                    toast('已切换：少女粉');
                  }, style: { width: 28, height: 28, borderRadius: 6, background: '#ff6b9d', cursor: 'pointer', border: '2px solid #333' } }),
                h('div', { title: '深海蓝', onClick: function() {
                    props.setPath('appearance.accent', '#2980b9');
                    props.setPath('appearance.composerBg', '#1e3a5f');
                    props.setPath('appearance.composerNoFill', false);
                    props.setPath('appearance.sidebarBg', '#0f1e3d');
                    props.setPath('appearance.sidebarNoFill', false);
                    props.setPath('appearance.textColor', '#e8f0ff');
                    props.setPath('appearance.borderColor', '#3498db');
                    props.setPath('chat.bubbleColor', '#4a90e2');
                    props.setPath('chat.aiBubbleColor', '#e8f0ff');
                    toast('已切换：深海蓝');
                  }, style: { width: 28, height: 28, borderRadius: 6, background: '#2980b9', cursor: 'pointer', border: '2px solid #333' } }),
                h('div', { title: '森林绿', onClick: function() {
                    props.setPath('appearance.accent', '#27ae60');
                    props.setPath('appearance.composerBg', '#2d5a3d');
                    props.setPath('appearance.composerNoFill', false);
                    props.setPath('appearance.sidebarBg', '#1a3d2a');
                    props.setPath('appearance.sidebarNoFill', false);
                    props.setPath('appearance.textColor', '#e8ffe8');
                    props.setPath('appearance.borderColor', '#2ecc71');
                    props.setPath('chat.bubbleColor', '#5cb85c');
                    props.setPath('chat.aiBubbleColor', '#e8ffe8');
                    toast('已切换：森林绿');
                  }, style: { width: 28, height: 28, borderRadius: 6, background: '#27ae60', cursor: 'pointer', border: '2px solid #333' } }),
                h('div', { title: '紫罗兰', onClick: function() {
                    props.setPath('appearance.accent', '#8e44ad');
                    props.setPath('appearance.composerBg', '#4a3a6b');
                    props.setPath('appearance.composerNoFill', false);
                    props.setPath('appearance.sidebarBg', '#2d2044');
                    props.setPath('appearance.sidebarNoFill', false);
                    props.setPath('appearance.textColor', '#f3e8ff');
                    props.setPath('appearance.borderColor', '#9b59b6');
                    props.setPath('chat.bubbleColor', '#9b59b6');
                    props.setPath('chat.aiBubbleColor', '#f3e8ff');
                    toast('已切换：紫罗兰');
                  }, style: { width: 28, height: 28, borderRadius: 6, background: '#8e44ad', cursor: 'pointer', border: '2px solid #333' } }),
                h('div', { title: '暖橙', onClick: function() {
                    props.setPath('appearance.accent', '#e67e22');
                    props.setPath('appearance.composerBg', '#d35400');
                    props.setPath('appearance.composerNoFill', false);
                    props.setPath('appearance.sidebarBg', '#8b3a00');
                    props.setPath('appearance.sidebarNoFill', false);
                    props.setPath('appearance.textColor', '#fff3e0');
                    props.setPath('appearance.borderColor', '#f39c12');
                    props.setPath('chat.bubbleColor', '#e67e22');
                    props.setPath('chat.aiBubbleColor', '#fff3e0');
                    toast('已切换：暖橙');
                  }, style: { width: 28, height: 28, borderRadius: 6, background: '#e67e22', cursor: 'pointer', border: '2px solid #333' } }),
                h('div', { title: '暗夜黑', onClick: function() {
                    props.setPath('appearance.accent', '#666666');
                    props.setPath('appearance.composerBg', '#222222');
                    props.setPath('appearance.composerNoFill', false);
                    props.setPath('appearance.sidebarBg', '#111111');
                    props.setPath('appearance.sidebarNoFill', false);
                    props.setPath('appearance.textColor', '#eeeeee');
                    props.setPath('appearance.borderColor', '#444444');
                    props.setPath('chat.bubbleColor', '#444444');
                    props.setPath('chat.aiBubbleColor', '#2d2d2d');
                    toast('已切换：暗夜黑');
                  }, style: { width: 28, height: 28, borderRadius: 6, background: '#222222', cursor: 'pointer', border: '2px solid #333' } }),
                h('div', { title: '樱花紫', onClick: function() {
                    props.setPath('appearance.accent', '#9b59b6');
                    props.setPath('appearance.composerBg', '#9b59b6');
                    props.setPath('appearance.composerNoFill', false);
                    props.setPath('appearance.sidebarBg', '#6c3483');
                    props.setPath('appearance.sidebarNoFill', false);
                    props.setPath('appearance.textColor', '#f4ecf7');
                    props.setPath('appearance.borderColor', '#af7ac5');
                    props.setPath('chat.bubbleColor', '#bb8fce');
                    props.setPath('chat.aiBubbleColor', '#f4ecf7');
                    toast('已切换：樱花紫');
                  }, style: { width: 28, height: 28, borderRadius: 6, background: '#9b59b6', cursor: 'pointer', border: '2px solid #333' } }),
                h('div', { title: '奶白浅', onClick: function() {
                    props.setPath('appearance.accent', '#95a5a6');
                    props.setPath('appearance.composerBg', '#f5f5f5');
                    props.setPath('appearance.composerNoFill', false);
                    props.setPath('appearance.sidebarBg', '#e0e0e0');
                    props.setPath('appearance.sidebarNoFill', false);
                    props.setPath('appearance.textColor', '#333333');
                    props.setPath('appearance.borderColor', '#bdc3c7');
                    props.setPath('chat.bubbleColor', '#ffffff');
                    props.setPath('chat.aiBubbleColor', '#fafafa');
                    toast('已切换：奶白浅');
                  }, style: { width: 28, height: 28, borderRadius: 6, background: '#f5f5f5', cursor: 'pointer', border: '2px solid #333' } })
              )
            ),
            h(Row, { label: '界面透明度', hint: '整体淡入淡出，壁纸透出更多' },
              h(Slider, { value: s.uiOpacity, min: 50, max: 100, onChange: function (v) { props.setPath('appearance.uiOpacity', v); } }),
              h('span', { className: 'dsss-value' }, s.uiOpacity + '%')),
            h(Row, { label: '字体大小', hint: '聊天气泡与正文的字号' },
              h(Slider, { value: s.fontSize, min: 85, max: 130, onChange: function (v) { props.setPath('appearance.fontSize', v); } }),
              h('span', { className: 'dsss-value' }, s.fontSize + '%')),
            h(Row, { label: '输入框颜色', hint: '底部发消息那个输入框的背景色，自动带 85% 半透明' },
              h('input', { type: 'color', className: 'dsss-color', value: s.composerBg || '#1e1e1e', onChange: function (e) { props.setPath('appearance.composerBg', e.target.value); } })),
            h(Row, { label: '输入框背景图', hint: '可以放静态图或动态 GIF/视频，选完图自动弹出裁剪' },
              h(Btn, { icon: '🖼', onClick: function () {
                pickFiles({ accept: 'video/*,image/*', multiple: false }).then(function (fs) {
                  if (!fs.length) return;
                  const f = fs[0];
                  const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(f.name) || (f.type || '').indexOf('video/') === 0;
                  showCropper(f, function(cropped) {
                    importFile(cropped, 'composer-bg').then(function (rec) {
                      props.update(function (draft) {
                        draft.appearance.composerBgId = rec.id;
                        draft.appearance.composerBgType = isVideo ? 'video' : 'image';
                      });
                      toast('已设置输入框' + (isVideo ? '视频' : '图片/GIF') + '背景');
                    });
                  });
                });
              } }, s.composerBgId ? '更换背景' : '选背景'),
              s.composerBgId ? h(Btn, { icon: '✕', onClick: function () { props.update(function (d) { d.appearance.composerBgId = null; d.appearance.composerBgType = null; }); } }, '清除') : null),
            h(Row, { label: '关闭输入框底色', hint: '开了之后输入框恢复 DSH 默认样式' },
              h(Switch, { on: !!s.composerNoFill, onChange: function (v) { props.setPath('appearance.composerNoFill', v); } })),
            h(Row, { label: '输入框透明度', hint: '输入框底色的不透明度，100%完全实心，0%全透明' },
              h(Slider, { value: s.composerOpacity != null ? s.composerOpacity : 85, min: 0, max: 100, onChange: function (v) { props.setPath('appearance.composerOpacity', v); } }),
              h('span', { className: 'dsss-value' }, (s.composerOpacity != null ? s.composerOpacity : 85) + '%')),
            h(Row, { label: '侧边栏颜色', hint: '左边那栏（新会话/插件/工作区）的背景色' },
              h('input', { type: 'color', className: 'dsss-color', value: s.sidebarBg || '#000000', onChange: function (e) { props.setPath('appearance.sidebarBg', e.target.value); } })),
            h(Row, { label: '侧边栏透明度', hint: '侧边栏底色的不透明度，100%完全实心，0%全透明' },
              h(Slider, { value: s.sidebarOpacity != null ? s.sidebarOpacity : 60, min: 0, max: 100, onChange: function (v) { props.setPath('appearance.sidebarOpacity', v); } }),
              h('span', { className: 'dsss-value' }, (s.sidebarOpacity != null ? s.sidebarOpacity : 60) + '%')),
            h(Row, { label: '侧边栏背景图', hint: '可以放静态图或动态 GIF/视频，选完图自动弹出裁剪' },
              h(Btn, { icon: '🖼', onClick: function () {
                pickFiles({ accept: 'video/*,image/*', multiple: false }).then(function (fs) {
                  if (!fs.length) return;
                  const f = fs[0];
                  const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(f.name) || (f.type || '').indexOf('video/') === 0;
                  showCropper(f, function(cropped) {
                    importFile(cropped, 'sidebar-bg').then(function (rec) {
                      props.update(function (draft) {
                        draft.appearance.sidebarBgId = rec.id;
                        draft.appearance.sidebarBgType = isVideo ? 'video' : 'image';
                      });
                      toast('已设置侧边栏' + (isVideo ? '视频' : '图片/GIF') + '背景');
                    });
                  });
                });
              } }, s.sidebarBgId ? '更换背景' : '选背景'),
              s.sidebarBgId ? h(Btn, { icon: '✕', onClick: function () { props.update(function (d) { d.appearance.sidebarBgId = null; d.appearance.sidebarBgType = null; }); } }, '清除') : null),
            h(Row, { label: '关闭侧边栏底色', hint: '开了之后侧边栏恢复 DSH 默认样式' },
              h(Switch, { on: !!s.sidebarNoFill, onChange: function (v) { props.setPath('appearance.sidebarNoFill', v); } })),
            h(Row, { label: '自定义会话条目', hint: '给工作区/会话列表条目单独设底色和背景图，开了才生效' },
              h(Switch, { on: !!s.sessionItemEnabled, onChange: function (v) { props.setPath('appearance.sessionItemEnabled', v); } })),
            s.sessionItemEnabled ? h(Row, { label: '会话条目底色', hint: '每个列表条目的背景颜色' },
              h('input', { type: 'color', className: 'dsss-color', value: s.sessionItemBg || '#2a3a5e', onChange: function (e) { props.setPath('appearance.sessionItemBg', e.target.value); } })) : null,
            s.sessionItemEnabled ? h(Row, { label: '会话条目透明度', hint: '底色不透明度，0%全透明' },
              h(Slider, { value: s.sessionItemOpacity != null ? s.sessionItemOpacity : 80, min: 0, max: 100, onChange: function (v) { props.setPath('appearance.sessionItemOpacity', v); } }),
              h('span', { className: 'dsss-value' }, (s.sessionItemOpacity != null ? s.sessionItemOpacity : 80) + '%')) : null,
            s.sessionItemEnabled ? h(Row, { label: '会话条目背景图', hint: '工作区/会话列表每一条的背景，可以放静态图/GIF/视频动态壁纸' },
              h(Btn, { icon: '🖼', onClick: function () {
                pickFiles({ accept: 'video/*,image/*', multiple: false }).then(function (fs) {
                  if (!fs.length) return;
                  const f = fs[0];
                  const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(f.name) || (f.type || '').indexOf('video/') === 0;
                  showCropper(f, function(cropped) {
                    importFile(cropped, 'session-item-bg').then(function (rec) {
                      props.update(function (draft) {
                        draft.appearance.sessionItemBgId = rec.id;
                        draft.appearance.sessionItemBgType = isVideo ? 'video' : 'image';
                      });
                      toast('已设置会话条目' + (isVideo ? '视频' : '图片/GIF') + '背景');
                    });
                  });
                });
              } }, s.sessionItemBgId ? '更换背景' : '选背景'),
              s.sessionItemBgId ? h(Btn, { icon: '✕', onClick: function () { props.update(function (d) { d.appearance.sessionItemBgId = null; d.appearance.sessionItemBgType = null; }); } }, '清除') : null) : null,
            h(Row, { label: '自定义新会话按钮', hint: '单独给最上面的新会话按钮设底色和透明度' },
              h(Switch, { on: !!s.newSessionEnabled, onChange: function (v) { props.setPath('appearance.newSessionEnabled', v); } })),
            s.newSessionEnabled ? h(Row, { label: '新会话按钮底色', hint: '新会话按钮的背景颜色' },
              h('input', { type: 'color', className: 'dsss-color', value: s.newSessionBg || '#4a7acc', onChange: function (e) { props.setPath('appearance.newSessionBg', e.target.value); } })) : null,
            s.newSessionEnabled ? h(Row, { label: '新会话按钮透明度', hint: '新会话底色不透明度' },
              h(Slider, { value: s.newSessionOpacity != null ? s.newSessionOpacity : 80, min: 0, max: 100, onChange: function (v) { props.setPath('appearance.newSessionOpacity', v); } }),
              h('span', { className: 'dsss-value' }, (s.newSessionOpacity != null ? s.newSessionOpacity : 80) + '%')) : null,
            s.newSessionEnabled ? h(Row, { label: '新会话按钮背景图', hint: '静态图/GIF/视频动态壁纸' },
              h(Btn, { icon: '🖼', onClick: function () {
                pickFiles({ accept: 'video/*,image/*', multiple: false }).then(function (fs) {
                  if (!fs.length) return;
                  const f = fs[0];
                  const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(f.name) || (f.type || '').indexOf('video/') === 0;
                  showCropper(f, function(cropped) {
                    importFile(cropped, 'newsession-bg').then(function (rec) {
                      props.update(function (draft) {
                        draft.appearance.newSessionBgId = rec.id;
                        draft.appearance.newSessionBgType = isVideo ? 'video' : 'image';
                      });
                      toast('已设置新会话按钮' + (isVideo ? '视频' : '图片/GIF') + '背景');
                    });
                  });
                });
              } }, s.newSessionBgId ? '更换背景' : '选背景'),
              s.newSessionBgId ? h(Btn, { icon: '✕', onClick: function () { props.update(function (d) { d.appearance.newSessionBgId = null; d.appearance.newSessionBgType = null; }); } }, '清除') : null) : null,
            h(Row, { label: '自定义工作区文件夹', hint: '单独给工作区根文件夹条目设底色和透明度' },
              h(Switch, { on: !!s.workspaceFolderEnabled, onChange: function (v) { props.setPath('appearance.workspaceFolderEnabled', v); } })),
            s.workspaceFolderEnabled ? h(Row, { label: '文件夹底色', hint: '工作区根文件夹条目的背景颜色' },
              h('input', { type: 'color', className: 'dsss-color', value: s.workspaceFolderBg || '#3a5a9e', onChange: function (e) { props.setPath('appearance.workspaceFolderBg', e.target.value); } })) : null,
            s.workspaceFolderEnabled ? h(Row, { label: '文件夹透明度', hint: '文件夹底色不透明度' },
              h(Slider, { value: s.workspaceFolderOpacity != null ? s.workspaceFolderOpacity : 70, min: 0, max: 100, onChange: function (v) { props.setPath('appearance.workspaceFolderOpacity', v); } }),
              h('span', { className: 'dsss-value' }, (s.workspaceFolderOpacity != null ? s.workspaceFolderOpacity : 70) + '%')) : null,
            s.workspaceFolderEnabled ? h(Row, { label: '文件夹背景图', hint: '静态图/GIF/视频动态壁纸' },
              h(Btn, { icon: '🖼', onClick: function () {
                pickFiles({ accept: 'video/*,image/*', multiple: false }).then(function (fs) {
                  if (!fs.length) return;
                  const f = fs[0];
                  const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(f.name) || (f.type || '').indexOf('video/') === 0;
                  showCropper(f, function(cropped) {
                    importFile(cropped, 'workspace-folder-bg').then(function (rec) {
                      props.update(function (draft) {
                        draft.appearance.workspaceFolderBgId = rec.id;
                        draft.appearance.workspaceFolderBgType = isVideo ? 'video' : 'image';
                      });
                      toast('已设置文件夹' + (isVideo ? '视频' : '图片/GIF') + '背景');
                    });
                  });
                });
              } }, s.workspaceFolderBgId ? '更换背景' : '选背景'),
              s.workspaceFolderBgId ? h(Btn, { icon: '✕', onClick: function () { props.update(function (d) { d.appearance.workspaceFolderBgId = null; d.appearance.workspaceFolderBgType = null; }); } }, '清除') : null) : null
          )
        ),

        h(Section, { title: '时钟' },
          h(Card, null,
            h(Row, { label: '显示时钟', hint: '悬浮在屏幕顶部，可拖动' },
              h(Switch, { on: s.clock.enabled, onChange: function (v) { props.setPath('appearance.clock.enabled', v); } })),
            s.clock.enabled ? h(Row, { label: '时间格式', hint: '24 小时制 / 12 小时制 / 带秒' },
              h(Seg, {
                value: s.clock.format,
                options: [{ value: 'HH:mm', label: '24 时' }, { value: 'hh:mm', label: '12 时' }, { value: 'HH:mm:ss', label: '含秒' }],
                onChange: function (v) { props.setPath('appearance.clock.format', v); }
              })) : null,
            s.clock.enabled ? h(Row, { label: '显示日期', hint: '在时间下方显示今天星期几和日期' },
              h(Switch, { on: s.clock.showDate, onChange: function (v) { props.setPath('appearance.clock.showDate', v); } })) : null,
            s.clock.enabled ? h(Row, { label: '时钟大小', hint: '时间数字字号，日期会按比例跟着缩放' },
              h(Slider, { value: s.clock.size, min: 14, max: 60, onChange: function (v) { props.setPath('appearance.clock.size', v); } }),
              h('span', { className: 'dsss-value' }, s.clock.size + 'px')) : null,
            s.clock.enabled ? h(Row, { label: '时钟透明度', hint: '调淡后时钟不会太挡壁纸，和大小互不影响' },
              h(Slider, { value: s.clock.opacity, min: 20, max: 100, onChange: function (v) { props.setPath('appearance.clock.opacity', v); } }),
              h('span', { className: 'dsss-value' }, s.clock.opacity + '%')) : null,
            s.clock.enabled ? h(Row, { label: '无底色', hint: '关掉后时钟直接浮在壁纸上，没有背景块' },
              h(Switch, { on: !!s.clock.bgNoFill, onChange: function (v) { props.setPath('appearance.clock.bgNoFill', v); } })) : null,
            s.clock.enabled && !s.clock.bgNoFill ? h(Row, { label: '时钟底色', hint: '时间背后那块半透明背景的颜色' },
              h('input', { type: 'color', className: 'dsss-color', value: s.clock.bgColor || '#000000', onChange: function (e) { props.setPath('appearance.clock.bgColor', e.target.value); } })) : null,
            s.clock.enabled ? h(Row, { label: '时钟背景图', hint: '可以选视频自动循环播放或静态图片，盖在底色上面，自动压暗保证文字可读' },
              h(Btn, { icon: '🖼️', onClick: importClockBg }, s.clock.bgId ? '更换背景' : '选背景'),
              s.clock.bgId ? h(Btn, { icon: '✕', onClick: function () { props.update(function (d) { d.appearance.clock.bgId = null; d.appearance.clock.bgType = null; }); } }, '清除') : null) : null
          )
        ),

        h(Section, { title: '聊天头像', note: '用户与 AI 分开设置' },
          h(Card, null,
            h(Row, { label: '启用聊天装饰', hint: '为消息行加上头像与自定义气泡' },
              h(Switch, { on: chat.enabled, onChange: function (v) { props.setPath('chat.enabled', v); } })),
            h(Row, { label: '用户头像', hint: '显示在消息右侧' },
              h(AvatarPicker, {
                id: chat.userAvatar, kind: 'user-avatar', fallback: '🙂',
                onChange: function (v) { props.setPath('chat.userAvatar', v); },
                refresh: props.refresh
              })),
            h(Row, { label: 'AI 头像', hint: '显示在消息左侧' },
              h(AvatarPicker, {
                id: chat.aiAvatar, kind: 'ai-avatar', fallback: '🤖',
                onChange: function (v) { props.setPath('chat.aiAvatar', v); },
                refresh: props.refresh
              })),
            h(Row, { label: '头像边框粗细', hint: '头像外圈描边宽度，0 为无边框' },
              h(Slider, { value: chat.frameWidth, min: 0, max: 6, onChange: function (v) { props.setPath('chat.frameWidth', v); } }),
              h('span', { className: 'dsss-value' }, chat.frameWidth + 'px')),
            h(Row, { label: '头像发光', hint: '边框外的柔光强度' },
              h(Slider, { value: chat.glow, min: 0, max: 30, onChange: function (v) { props.setPath('chat.glow', v); } }),
              h('span', { className: 'dsss-value' }, chat.glow + 'px')),
            h(Row, { label: '用户头像框', hint: '同时作用于发光颜色' },
              h('input', {
                type: 'color', className: 'dsss-color', value: chat.userFrame,
                onChange: function (e) { props.setPath('chat.userFrame', e.target.value); }
              })),
            h(Row, { label: 'AI 头像框', hint: '与用户头像框颜色独立设置' },
              h('input', {
                type: 'color', className: 'dsss-color', value: chat.aiFrame,
                onChange: function (e) { props.setPath('chat.aiFrame', e.target.value); }
              }))
          )
        ),

        h(Section, { title: '聊天气泡' },
          h(Card, null,
            h(Row, { label: '我的气泡颜色', hint: '你发送消息的气泡底色' },
              h('input', {
                type: 'color', className: 'dsss-color', value: chat.bubbleColor,
                onChange: function (e) { props.setPath('chat.bubbleColor', e.target.value); }
              })),
            h(Row, { label: '气泡透明度', hint: '0% 为完全实心；打开"无底色"则直接透明' },
              h(Slider, { value: chat.bubbleOpacity, min: 0, max: 100, onChange: function (v) { props.setPath('chat.bubbleOpacity', v); } }),
              h('span', { className: 'dsss-value' }, chat.bubbleOpacity + '%')),
            h(Row, { label: '无底色（我的气泡）', hint: '打开后你的消息气泡完全透明，只显示文字' },
              h(Switch, { on: chat.bubbleNoFill, onChange: function (v) { props.setPath('chat.bubbleNoFill', v); } })),
            h(Row, { label: 'AI 气泡底色', hint: '为助手回复加一层浅色底' },
              h(Switch, { on: chat.aiBubble, onChange: function (v) { props.setPath('chat.aiBubble', v); } })),
            chat.aiBubble ? h(Row, { label: 'AI 气泡颜色', hint: '与你的气泡颜色独立设置' },
              h('input', {
                type: 'color', className: 'dsss-color', value: chat.aiBubbleColor,
                onChange: function (e) { props.setPath('chat.aiBubbleColor', e.target.value); }
              })) : null,
            chat.aiBubble ? h(Row, { label: '无底色（AI 气泡）', hint: '打开后 AI 回复气泡完全透明' },
              h(Switch, { on: chat.aiBubbleNoFill, onChange: function (v) { props.setPath('chat.aiBubbleNoFill', v); } })) : null
          )
        ),

        h(Section, { title: '开场动画', note: '默认关闭' },
          h(Card, null,
            h(Row, { label: '启用开场动画', hint: '刷新页面后播放两幕动画，点击任意位置跳过' },
              h(Switch, { on: intro.enabled, onChange: function (v) { props.setPath('intro.enabled', v); } })),
            h(Row, { label: '第一幕 Logo', hint: '未选择时使用插件默认标志' },
              h(AvatarPicker, {
                id: intro.logo, kind: 'intro-logo', fallback: '✦',
                onChange: function (v) { props.setPath('intro.logo', v); },
                refresh: props.refresh
              })),
            h(Row, { label: '第二幕视频', hint: '与 Logo 交叉叠化，不会硬切' },
              h(AvatarPicker, {
                id: intro.video, kind: 'intro-video', fallback: '🎬',
                onChange: function (v) { props.setPath('intro.video', v); },
                refresh: props.refresh
              }))
          )
        )
      );
    }

    /* ------------------------------ 宠物 ------------------------------ */

    function PetTab(props) {
      const raw = props.settings.pet || {};
      const p = {
        enabled: raw.enabled != null ? raw.enabled : true,
        visible: raw.visible != null ? raw.visible : true,
        size: raw.size || 110,
        opacity: raw.opacity || 100,
        docked: !!raw.docked,
        auto: raw.auto != null ? raw.auto : true,
        autoMin: raw.autoMin || 5,
        msgMs: raw.msgMs || 4000,
        textChance: raw.textChance != null ? raw.textChance : 60,
        popEmojiChance: raw.popEmojiChance != null ? raw.popEmojiChance : 40,
        instances: Array.isArray(raw.instances) ? raw.instances : [],
        emoji: raw.emoji || null
      };
      const quotes = Array.isArray(props.quotes) ? props.quotes : [];
      const emojis = Array.isArray(props.emojis) ? props.emojis : [];
      const [draft, setDraft] = useState('');

      const addQuote = function () {
        const v = draft.trim();
        if (!v) return;
        props.setQuotes(quotes.concat([{ type: 'text', text: v }]));
        setDraft('');
      };

      const addQuoteImage = function () {
        pickFiles({ accept: 'image/*', multiple: true }).then(function (fs) {
          if (!fs.length) return;
          let chain = Promise.resolve();
          const items = [];
          fs.forEach(function (f) {
            chain = chain.then(function () {
              return importFile(f, 'pet-quote').then(function (rec) { items.push({ type: 'image', id: rec.id }); });
            });
          });
          chain.then(function () {
            props.setQuotes(quotes.concat(items));
            props.refresh();
            toast('已添加 ' + items.length + ' 张表情包到语录');
          });
        });
      };

      const importEmoji = function () {
        pickFiles({ accept: 'image/*', multiple: true }).then(function (fs) {
          if (!fs.length) return;
          let chain = Promise.resolve();
          const ids = [];
          fs.forEach(function (f) {
            chain = chain.then(function () {
              return new Promise(function(resolve) {
                showCropper(f, function(cropped) {
                  importFile(cropped, 'pet-emoji').then(function (rec) { ids.push(rec.id); resolve(); });
                });
              });
            });
          });
          chain.then(function () {
            props.setEmojis(emojis.concat(ids));
            props.refresh();
            if (!p.emoji && ids.length) props.setPath('pet.emoji', ids[0]);
            toast('已添加 ' + ids.length + ' 个皮肤');
          });
        });
      };

      return h('div', null,
        h(Section, { title: '桌面宠物', note: '默认显示在右下角' },
          h(Card, null,
            h(Row, { label: '显示宠物', hint: '关闭后可通过 Ctrl+Alt+P 重新显示' },
              h(Switch, { on: p.enabled, onChange: function (v) { props.setPath('pet.enabled', v); if (v) props.setPath('pet.visible', true); } })),
            h(Row, { label: '大小', hint: '宠物图片整体尺寸，拖动宠物可换位置' },
              h(Slider, { value: p.size, min: 60, max: 220, onChange: function (v) { props.setPath('pet.size', v); } }),
              h('span', { className: 'dsss-value' }, p.size + 'px')),
            h(Row, { label: '透明度', hint: '调淡后宠物不会太挡视线' },
              h(Slider, { value: p.opacity, min: 20, max: 100, onChange: function (v) { props.setPath('pet.opacity', v); } }),
              h('span', { className: 'dsss-value' }, p.opacity + '%')),
            h(Row, { label: '贴边隐藏', hint: '收进屏幕右缘，只留一枚半透明小图标' },
              h(Switch, { on: p.docked, onChange: function (v) { props.setPath('pet.docked', v); } }))
          )
        ),

        h(Section, { title: '互动' },
          h(Card, null,
            h(Row, { label: '自动随机消息', hint: '每隔一段时间自己说句话' },
              h(Switch, { on: p.auto, onChange: function (v) { props.setPath('pet.auto', v); } })),
            h(Row, { label: '消息间隔', hint: '自动说话的平均间隔，单位秒，实际会随机飘移，支持1~600秒自定义' },
              h('input', { type: 'number', min: 1, max: 600, className: 'dsss-num', value: p.autoMin, onChange: function(e) {
                const v = parseInt(e.target.value) || 5;
                props.setPath('pet.autoMin', Math.max(1, Math.min(600, v)));
              } }),
              h('span', { className: 'dsss-value' }, '秒')),
            h(Row, { label: '消息停留', hint: '点宠物后气泡保留几秒再消失' },
              h(Slider, { value: p.msgMs / 1000, min: 2, max: 15, onChange: function (v) { props.setPath('pet.msgMs', v * 1000); } }),
              h('span', { className: 'dsss-value' }, Math.round(p.msgMs / 1000) + ' 秒')),
            h(Row, { label: '文字出现概率', hint: '点宠物/自动消息时，出文字的概率；和表情包概率相加决定比例' },
              h(Slider, { value: p.textChance, min: 0, max: 100, onChange: function (v) { props.setPath('pet.textChance', v); } }),
              h('span', { className: 'dsss-value' }, p.textChance + '%')),
            h(Row, { label: '表情包出现概率', hint: '点宠物/自动消息时，弹出图片表情包的概率；每次只出一种，不打架' },
              h(Slider, { value: p.popEmojiChance, min: 0, max: 100, onChange: function (v) { props.setPath('pet.popEmojiChance', v); } }),
              h('span', { className: 'dsss-value' }, p.popEmojiChance + '%'))
          )
        ),

        h(Section, { title: '语录 / 表情包', note: quotes.length + ' 条 · 文字与图片混排，编号连续' },
          h(Card, null,
            h('div', { className: 'dsss-list', style: { maxHeight: '200px' } },
              quotes.length
                ? quotes.map(function (q, i) {
                    return h(QuoteRow, {
                      key: i, index: i, item: q,
                      onDelete: function () { props.setQuotes(quotes.filter(function (_, j) { return j !== i; })); }
                    });
                  })
                : h('div', { className: 'dsss-hint' }, '还没有内容，下面加一句文字或一张表情包')
            ),
            h('div', { style: { display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' } },
              h('input', {
                className: 'dsss-input',
                placeholder: '写一句宠物会说的话…',
                value: draft,
                onChange: function (e) { setDraft(e.target.value); },
                onKeyDown: function (e) { if (e.key === 'Enter') addQuote(); },
                style: {
                  flex: '1 1 180px', minWidth: 0, padding: '8px 11px', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)',
                  color: 'inherit', font: 'inherit', fontSize: '12.5px', outline: 'none'
                }
              }),
              h(Btn, { kind: 'primary', icon: '＋', onClick: addQuote }, '加文字'),
              h(Btn, { icon: '🖼️', onClick: addQuoteImage }, '加表情包')
            )
          )
        ),

        h(Section, { title: '宠物皮肤库', note: emojis.length ? emojis.length + ' 张皮肤 · 点击缩略图切换' : '导入图片作为宠物皮肤' },
          h(Card, null,
            h('div', { style: { display: 'flex', gap: '8px', marginBottom: '10px' } },
              h(Btn, { kind: 'primary', icon: '＋', onClick: importEmoji }, '导入皮肤图片'),
              p.emoji ? h(Btn, { icon: '✕', onClick: function () { props.setPath('pet.emoji', null); } }, '恢复默认小猫') : null
            ),
            emojis.length
              ? h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' } },
                  emojis.map(function (id) {
                    const myId = props.skinTargetId;
                    const myInst = myId ? ((p.instances || []).find(function (x) { return x.id === myId; }) || {}) : null;
                    const active = myInst ? myInst.skinId === id : p.emoji === id;
                    const pickFn = props.onPickSkin || function (v) { props.setPath('pet.emoji', v); };
                    return h(EmojiChip, { key: id, id: id, active: active, onPick: function () { pickFn(active ? null : id); }, onDelete: function () { props.setEmojis(emojis.filter(function (x) { return x !== id; })); } });
                  })
                )
              : h('div', { className: 'dsss-hint' }, '导入 PNG / JPG / GIF 后，点缩略图即可把宠物换成那张常驻形象')
          )
        )
      );
    }

    function QuoteRow(props) {
      const item = props.item || { type: 'text', text: '' };
      const url = useBlobUrl(item && item.type === 'image' ? item.id : null);
      const body = item.type === 'image'
        ? h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            h('img', { src: url || '', alt: '', style: { width: '28px', height: '28px', objectFit: 'cover', borderRadius: '6px' } }),
            h('span', { style: { opacity: .6, fontSize: '11px' } }, '表情包图片'))
        : h('div', { className: 'dsss-track-name', title: String(item.text || '') }, String(item.text || ''));
      return h('div', { className: 'dsss-track' },
        h('div', { className: 'dsss-track-index' }, String(props.index + 1)),
        body,
        h('div', { className: 'dsss-track-actions' },
          h('button', {
            className: 'dsss-icon-btn', type: 'button', title: '删除',
            onClick: props.onDelete
          }, '✕'))
      );
    }

    function EmojiChip(props) {
      const url = useBlobUrl(props.id);
      return h('div', {
        style: {
          position: 'relative', width: '84px', height: '84px', borderRadius: '12px', overflow: 'hidden',
          border: '2px solid ' + (props.active ? 'var(--dsss-accent)' : 'rgba(255,255,255,.14)'),
          background: 'rgba(255,255,255,.06)', cursor: 'pointer'
        },
        onClick: props.onPick
      },
        url ? h('img', { src: url, alt: '', style: { width: '100%', height: '100%', objectFit: 'cover' } }) : null,
        props.active ? h('div', {
          style: {
            position: 'absolute', right: '4px', bottom: '4px', width: '20px', height: '20px',
            borderRadius: '50%', background: 'var(--dsss-accent)', color: '#06120d',
            fontSize: '13px', lineHeight: '20px', textAlign: 'center', fontWeight: 700
          }
        }, '✓') : null,
        h('button', {
          type: 'button',
          title: '删除此皮肤',
          onClick: function (e) { e.stopPropagation(); idbDelete(props.id).then(function () { forgetUrl(props.id); props.onDelete(); }); },
          style: {
            position: 'absolute', top: '2px', right: '2px', width: '18px', height: '18px', borderRadius: '50%',
            border: 0, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: '10px', lineHeight: '18px',
            padding: 0, cursor: 'pointer'
          }
        }, '✕')
      );
    }

    /* ------------------------------ 设置 ------------------------------ */

    function SettingsTab(props) {
      const resetAll = function () {
        confirmDialog({
          title: '重置全部设置',
          message: '将清空壁纸、音乐、头像、宠物语录与所有偏好，并恢复到初始状态。此操作不可撤销，确定继续吗？',
          okText: '重置',
          danger: true
        }).then(function (ok) {
          if (!ok) return;
          props.onReset();
        });
      };

      return h('div', null,
        h(Section, { title: '数据' },
          h(Card, null,
            h(Row, { label: '存储占用', hint: '壁纸、音乐与头像都保存在浏览器 IndexedDB 中' },
              h('span', { className: 'dsss-value', style: { minWidth: '64px' } }, fmtBytes(props.usage || 0))),
            h(Row, { label: '清理孤儿文件', hint: '删除已经没有引用的图片与音频' },
              h(Btn, { icon: '🧹', onClick: props.onClean }, '立即清理'))
          )
        ),
        h(Section, { title: '危险操作' },
          h(Card, null,
            h(Row, { label: '重置全部', hint: '设置、壁纸、音乐、头像与表情全部清除' },
              h(Btn, { kind: 'danger', icon: '⟲', onClick: resetAll }, '重置'))
          )
        ),
        h(Section, { title: '快捷键' },
          h(Card, null,
            h(Row, { label: 'Ctrl + Alt + P', hint: '显示或隐藏桌面宠物' }),
            h(Row, { label: 'Ctrl + Alt + S', hint: '打开或关闭设置面板' }),
            h(Row, { label: '右键', hint: '在悬浮球或宠物上打开快捷菜单' })
          )
        )
      );
    }

    /* ------------------------------ 关于 ------------------------------ */

    function AboutTab() {
      return h('div', null,
        h(Section, { title: '关于 Skin Studio' },
          h(Card, null,
            h('div', { style: { display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' } },
              h('div', { className: 'dsss-logo', style: { width: '48px', height: '48px', borderRadius: '14px' } },
                h(IconSpark, null)),
              h('div', null,
                h('div', { style: { fontSize: '15px', fontWeight: 600 } }, 'Skin Studio'),
                h('div', { className: 'dsss-hint' }, 'v1.0.0 · 桌面美化套件'))
            ),
            h('p', { style: { margin: '0 0 12px', fontSize: '12.5px', lineHeight: 1.7, opacity: .8 } },
              '为 DeepSeek Harness 打造的壁纸与桌面伴侣：透明壁纸、主题配色、音乐库、桌面宠物、聊天气泡与开场动画。全部数据只保存在本机，不上传任何服务器。'),
            h(Row, { label: '项目主页', hint: '源码与更新说明' },
              h('a', {
                href: 'https://github.com/Wstarkl849/dsh-skin-studio-srv13',
                target: '_blank', rel: 'noreferrer',
                style: { color: 'var(--dsss-accent)', fontSize: '12.5px', textDecoration: 'none' }
              }, 'github.com/Wstarkl849/dsh-skin-studio-srv13 →'))
          )
        ),
        h(Section, { title: '小提示' },
          h(Card, null,
            h(Row, { label: '壁纸透明', hint: '启用壁纸后 DSH 的背景会透明化，壁纸层在窗口最底层' }),
            h(Row, { label: '音乐不自动播放', hint: '导入的音乐需要手动点击播放，避免打扰' }),
            h(Row, { label: '与其它壁纸插件共存', hint: '若同时启用了别的壁纸插件，建议先关闭其中一个' })
          )
        )
      );
    }

/* ==== 07-runtime.js ==== */
    /* ------------------------------------------------------------------ *
     * 07 · 悬浮控件：启动球 / 时钟 / 迷你播放器 / 宠物 / 菜单 / 开场
     * ------------------------------------------------------------------ */

    const DEFAULT_PET_SVG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
      '<defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#8ef0c4"/><stop offset="1" stop-color="#3ddc97"/></linearGradient>' +
      '<radialGradient id="g" cx="50%" cy="42%" r="60%">' +
      '<stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="60" cy="104" rx="30" ry="6" fill="#000" opacity=".22"/>' +
      '<path d="M27 44c-2-12-1-20 1-24 5 2 11 8 15 15" fill="url(#b)" stroke="#1c4b3a" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M93 44c2-12 1-20-1-24-5 2-11 8-15 15" fill="url(#b)" stroke="#1c4b3a" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M60 26c19 0 33 14 33 32s-14 30-33 30-33-12-33-30 14-32 33-32z" fill="url(#b)" stroke="#1c4b3a" stroke-width="2.6"/>' +
      '<path d="M60 26c19 0 33 14 33 32s-14 30-33 30-33-12-33-30 14-32 33-32z" fill="url(#g)"/>' +
      '<ellipse cx="47" cy="56" rx="4.6" ry="5.6" fill="#153a2c"/><ellipse cx="73" cy="56" rx="4.6" ry="5.6" fill="#153a2c"/>' +
      '<circle cx="48.4" cy="54" r="1.6" fill="#fff"/><circle cx="74.4" cy="54" r="1.6" fill="#fff"/>' +
      '<ellipse cx="38" cy="66" rx="6" ry="3.6" fill="#ff9db1" opacity=".55"/><ellipse cx="82" cy="66" rx="6" ry="3.6" fill="#ff9db1" opacity=".55"/>' +
      '<path d="M56 66c1.6 2.4 6.4 2.4 8 0" fill="none" stroke="#153a2c" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M60 69v4" stroke="#153a2c" stroke-width="2" stroke-linecap="round"/></svg>'
    );

    /* ------------------------------ 时钟 ------------------------------ */

    function Clock(props) {
      const [now, setNow] = useState(new Date());
      const cfg = props.settings.appearance.clock;
      useEffect(function () {
        const t = setInterval(function () { setNow(new Date()); }, 1000);
        return function () { clearInterval(t); };
      }, []);
      const pos = props.pos || { x: 24, y: 24 };
      const startDrag = function (e) {
        e.preventDefault();
        const sx = e.clientX, sy = e.clientY, ox = pos.x, oy = pos.y;
        let last = null;
        const move = function (ev) {
          last = { x: Math.max(0, Math.min(window.innerWidth - 120, ox + ev.clientX - sx)), y: Math.max(0, Math.min(window.innerHeight - 60, oy + ev.clientY - sy)) };
          props.onMove(last);
        };
        const up = function () {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          if (last && props.onCommit) props.onCommit(last);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      };
      const clockSize = Number(cfg.size) || 26;
      const clockOpacity = (Number(cfg.opacity) == null ? 100 : Number(cfg.opacity)) / 100;
      const bgNoFill = !!cfg.bgNoFill;
      const bgUrl = useBlobUrl(cfg.bgId);
      function hexToRgba(hex, alpha) {
        if (!hex || hex[0] !== '#' || hex.length < 7) return 'rgba(0,0,0,.35)';
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + (alpha == null ? 0.35 : alpha) + ')';
      }
      const hasBg = !!cfg.bgId && !!bgUrl;
      const clockBg = bgNoFill ? 'transparent' : (hasBg ? 'transparent' : hexToRgba(cfg.bgColor, 0.4));
      return h('div', {
        id: 'dsss-clock',
        style: { left: pos.x + 'px', top: pos.y + 'px', opacity: clockOpacity, background: clockBg, borderRadius: bgNoFill ? '0' : '12px', padding: bgNoFill ? '0' : '10px 16px', backdropFilter: bgNoFill ? 'none' : 'blur(8px)', overflow: hasBg ? 'hidden' : 'visible', position: 'fixed' },
        onPointerDown: startDrag
      },
        hasBg ? h('div', { style: { position: 'absolute', inset: 0, zIndex: 0 } },
          cfg.bgType === 'video'
            ? h(VideoBg, { src: bgUrl })
            : h('img', { src: bgUrl, alt: '', style: { width: '100%', height: '100%', objectFit: 'cover' } })
        ) : null,
        hasBg ? h('div', { style: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1 } }) : null,
        h('div', { style: { position: hasBg ? 'relative' : 'static', zIndex: hasBg ? 2 : 'auto' } },
          h('div', { id: 'dsss-clock-time', style: { fontSize: clockSize + 'px' } }, clockText(now, cfg.format)),
          cfg.showDate ? h('div', { id: 'dsss-clock-date', style: { fontSize: Math.max(8, clockSize * 0.4) + 'px' } }, dateText(now)) : null
        )
      );
    }

    /* ---------------------------- 迷你播放器 ---------------------------- */

    function VideoBg(props) {
      const ref = useRef(null);
      useEffect(function () {
        const v = ref.current;
        if (!v) return;
        v.muted = true;
        const p = v.play();
        if (p && p.catch) p.catch(function () {});
      }, [props.src]);
      return h('video', { ref: ref, src: props.src, loop: true, autoplay: true, muted: true, playsInline: true });
    }

    function MiniPlayer(props) {
      const music = props.music;
      const settings = props.settings;
      const tracks = settings.music.tracks || [];
      const rec = tracks[music.index >= 0 ? music.index : 0];
      const pos = props.pos || { x: window.innerWidth - 272, y: window.innerHeight - 160 };
      const ratio = music.dur ? music.time / music.dur : 0;
      const mode = settings.music.mode || 'list';
      const volume = settings.music.volume != null ? settings.music.volume : 80;
      const coverUrl = useBlobUrl(settings.music.coverId);
      const bgUrl = useBlobUrl(settings.music.bgId);
      const bgType = settings.music.bgType;
      const [showVol, setShowVol] = useState(false);
      const [showList, setShowList] = useState(false);

      const modeIcon = mode === 'single' ? '🔂' : mode === 'shuffle' ? '🔀' : '🔁';
      const modeLabel = mode === 'single' ? '单曲循环' : mode === 'shuffle' ? '随机播放' : '列表循环';
      const cycleMode = function () {
        const next = mode === 'list' ? 'single' : mode === 'single' ? 'shuffle' : 'list';
        props.onSetPath('music.mode', next);
      };

      const startDrag = function (e) {
        if (e.target.closest('button') || e.target.closest('.dsss-progress') || e.target.closest('.dsss-mini-list') || e.target.closest('.dsss-vol')) return;
        e.preventDefault();
        const sx = e.clientX, sy = e.clientY, ox = pos.x, oy = pos.y;
        let last = null;
        const move = function (ev) {
          last = {
            x: Math.max(8, Math.min(window.innerWidth - 120, ox + ev.clientX - sx)),
            y: Math.max(8, Math.min(window.innerHeight - 60, oy + ev.clientY - sy))
          };
          props.onMove(last);
        };
        const up = function () {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          if (last && props.onCommit) props.onCommit(last);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      };

      return h('div', {
        id: 'dsss-mini',
        'data-open': props.open ? 'true' : 'false',
        style: { left: pos.x + 'px', top: pos.y + 'px' },
        onPointerDown: startDrag
      },
        bgUrl ? h('div', { className: 'dsss-mini-bg' },
          bgType === 'video'
            ? h(VideoBg, { src: bgUrl })
            : h('img', { src: bgUrl, alt: '' })
        ) : null,
        h('div', { className: 'dsss-mini-inner' },
        h('div', { className: 'dsss-mini-top' },
          coverUrl
            ? h('img', { src: coverUrl, alt: '', className: 'dsss-mini-disc', 'data-playing': music.playing ? 'true' : 'false', style: { objectFit: 'cover' } })
            : h('div', { className: 'dsss-mini-disc', 'data-playing': music.playing ? 'true' : 'false' }),
          h('div', { className: 'dsss-mini-copy' },
            h('div', { className: 'dsss-mini-title' }, rec ? rec.name : '音乐库为空'),
            h('div', { className: 'dsss-mini-sub' }, rec && music.dur ? fmtDuration(music.time) + ' / ' + fmtDuration(music.dur) : 'Skin Studio')
          )
        ),
        h('div', { className: 'dsss-progress', onClick: function (e) {
          const r = e.currentTarget.getBoundingClientRect();
          music.seek((e.clientX - r.left) / r.width);
        } }, h('i', { style: { width: (ratio * 100).toFixed(1) + '%' } })),
        h('div', { className: 'dsss-mini-controls' },
          h('button', { type: 'button', title: modeLabel, onClick: cycleMode }, modeIcon),
          h('button', { type: 'button', title: '上一首', onClick: music.prev }, '⏮'),
          h('button', { className: 'primary', type: 'button', title: music.playing ? '暂停' : '播放', onClick: music.toggle },
            music.playing ? '❚❚' : '▶'),
          h('button', { type: 'button', title: '下一首', onClick: music.next }, '⏭'),
          h('button', { type: 'button', title: showVol ? '隐藏音量' : '音量', onClick: function () { setShowVol(!showVol); setShowList(false); } }, volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊'),
          h('button', { type: 'button', title: showList ? '关闭列表' : '播放列表', onClick: function () { setShowList(!showList); setShowVol(false); } }, '☰'),
          h('button', { type: 'button', title: '隐藏小窗', onClick: props.onClose }, '✕')
        ),
        showVol ? h('div', { className: 'dsss-vol' },
          h('span', { style: { fontSize: '11px', opacity: .6 } }, '音量'),
          h('input', {
            type: 'range', min: 0, max: 100, value: volume,
            style: { flex: 1, accentColor: 'var(--dsss-accent)' },
            onChange: function (e) { props.onSetPath('music.volume', parseInt(e.target.value, 10)); }
          }),
          h('span', { style: { fontSize: '11px', width: '32px', textAlign: 'right' } }, volume + '%')
        ) : null,
        showList ? h('div', { className: 'dsss-mini-list' },
          h('div', { style: { fontSize: '11px', opacity: .6, padding: '4px 8px' } }, '播放列表（' + tracks.length + ' 首）'),
          tracks.map(function (t, i) {
            return h('div', {
              key: t.id,
              onClick: function () { music.playTrack(t.id); },
              style: {
                padding: '6px 10px', fontSize: '12px', cursor: 'pointer',
                background: i === music.index ? 'rgba(255,255,255,.1)' : 'transparent',
                borderRadius: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }
            }, (i + 1) + '. ' + t.name);
          })
        ) : null
        )
      );
    }

    /* ------------------------------ 宠物 ------------------------------ */

    function Pet(props) {
      const raw = props.settings.pet || {};
      const p = {
        size: raw.size || 110,
        opacity: raw.opacity || 100,
        msgMs: raw.msgMs || 4000,
        auto: raw.auto != null ? raw.auto : true,
        autoMin: raw.autoMin || 5,
        textChance: raw.textChance != null ? raw.textChance : 60,
        popEmojiChance: raw.popEmojiChance != null ? raw.popEmojiChance : 40,
        emoji: raw.emoji || null
      };
      const rawInst = props.instance || {};
      const instance = { id: rawInst.id || 'pet-0', x: rawInst.x != null ? rawInst.x : 100, y: rawInst.y != null ? rawInst.y : 100, skinId: rawInst.skinId || null };
      const quotes = Array.isArray(props.quotes) ? props.quotes : [];
      const emojis = Array.isArray(props.emojis) ? props.emojis : [];
      const [pos, setPos] = useState(null);
      const [pop, setPop] = useState(null);
      const [showMsg, setShowMsg] = useState(false);
      const [bouncing, setBouncing] = useState(false);
      const dragState = useRef(null);
      const msgTimer = useRef(0);
      const autoTimer = useRef(0);
      const skinId = instance.skinId || p.emoji;
      const emojiUrl = useBlobUrl(skinId || null);
      const popImgUrl = useBlobUrl(pop && pop.type === 'image' ? pop.id : null);

      // 初始位置
      useEffect(function () {
        if (pos) return;
        const size = p.size;
        const x = instance.x == null ? Math.max(12, window.innerWidth - size - 34) : instance.x;
        const y = instance.y == null ? Math.max(12, window.innerHeight - size - 96) : instance.y;
        setPos({ x: x, y: y });
      }, [p.size, instance.x, instance.y, pos]);

      // 上报位置给父组件（用于碰撞检测和持久化）
      useEffect(function () {
        if (pos && props.onPos) props.onPos(instance.id, pos);
      }, [pos, instance.id]);

      useEffect(function () {
        if (!pos) return;
        const onResize = function () {
          setPos(function (cur) {
            if (!cur) return cur;
            return {
              x: Math.max(0, Math.min(window.innerWidth - p.size, cur.x)),
              y: Math.max(0, Math.min(window.innerHeight - p.size, cur.y))
            };
          });
        };
        window.addEventListener('resize', onResize);
        return function () { window.removeEventListener('resize', onResize); };
      }, [pos, p.size]);

      const say = useCallback(function () {
        let textItems = quotes.filter(function (q) { return q && q.type === 'text'; });
        let imgItems = quotes.filter(function (q) { return q && q.type === 'image'; });
        // 语录库空了用默认内置句
        if (!textItems.length) {
          textItems = [
            { id: '__default1', type: 'text', text: '在摸鱼~' },
            { id: '__default2', type: 'text', text: '需要我帮忙吗？' },
            { id: '__default3', type: 'text', text: '今天也要开心哦' },
            { id: '__default4', type: 'text', text: '嘿嘿~' },
            { id: '__default5', type: 'text', text: '别太累啦' }
          ];
        }
        const tP = Math.max(0, Number(p.textChance) || 0);
        const iP = Math.max(0, Number(p.popEmojiChance) || 0);
        let pool;
        if (tP + iP <= 0) pool = textItems.length ? textItems : imgItems;
        else if (!textItems.length) pool = imgItems;
        else if (!imgItems.length) pool = textItems;
        else pool = Math.random() * (tP + iP) < tP ? textItems : imgItems;
        if (!pool || !pool.length) return;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        setPop(pick);
        setShowMsg(true);
        setBouncing(true);
        setTimeout(function () { setBouncing(false); }, 620);
        if (msgTimer.current) clearTimeout(msgTimer.current);
        msgTimer.current = setTimeout(function () { setShowMsg(false); }, Math.max(1200, p.msgMs));
      }, [quotes, p.msgMs, p.textChance, p.popEmojiChance]);

      // 自动随机消息（每个宠物独立定时器）
      useEffect(function () {
        if (!p.enabled || !p.visible || !p.auto) return;
        let cancelled = false;
        const base = Math.max(1, Number(p.autoMin) || 5) * 1000;
        const schedule = function () {
          const jitter = base * (0.5 + Math.random());
          autoTimer.current = setTimeout(function () {
            if (cancelled) return;
            say();
            schedule();
          }, jitter);
        };
        say();
        schedule();
        return function () { cancelled = true; if (autoTimer.current) clearTimeout(autoTimer.current); };
      }, [p.enabled, p.visible, p.auto, p.autoMin, say]);

      useEffect(function () {
        return function () { if (msgTimer.current) clearTimeout(msgTimer.current); };
      }, []);

      if (!pos) return null;

      const onPointerDown = function (e) {
        if (e.button === 2) return;
        e.preventDefault();
        dragState.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, moved: false, last: pos, trail: [] };
        const move = function (ev) {
          const d = dragState.current;
          if (!d) return;
          const dx = ev.clientX - d.sx, dy = ev.clientY - d.sy;
          if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
          if (!d.moved) return;
          d.last = {
            x: Math.max(0, Math.min(window.innerWidth - p.size, d.ox + dx)),
            y: Math.max(0, Math.min(window.innerHeight - p.size, d.oy + dy))
          };
          // 记录最近几次移动速度，用于松手时扔出去
          d.trail.push({ x: ev.clientX, y: ev.clientY, t: performance.now() });
          if (d.trail.length > 6) d.trail.shift();
          setPos(d.last);
        };
        const up = function () {
          const d = dragState.current;
          dragState.current = null;
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          if (!d) return;
          // 计算松手时的投掷速度（最近 trail 的平均速度）
          let vx = 0, vy = 0;
          if (d.trail.length >= 2) {
            const a = d.trail[0], b = d.trail[d.trail.length - 1];
            const dt = Math.max(1, b.t - a.t);
            vx = (b.x - a.x) / dt * 16;  // 换算成 px/frame（60fps）
            vy = (b.y - a.y) / dt * 16;
          }
          if (d.moved && props.onCommitPos) props.onCommitPos(instance.id, d.last, { vx: vx, vy: vy });
          else say();
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      };

      const bubbleInner = pop && pop.type === 'image' && popImgUrl
        ? h('img', { src: popImgUrl, alt: '', draggable: false, style: { maxWidth: '180px', maxHeight: '180px', borderRadius: '8px', display: 'block' } })
        : (pop && pop.type === 'text' ? pop.text : '');

      return h('div', {
        key: instance.id,
        id: 'dsss-pet',
        'data-instance': instance.id,
        'data-bounce': bouncing ? 'true' : 'false',
        style: {
          left: pos.x + 'px',
          top: pos.y + 'px',
          width: p.size + 'px',
          height: p.size + 'px',
          opacity: p.opacity / 100
        },
        onContextMenu: function (e) { e.preventDefault(); props.openMenu(e, instance.id); }
      },
        h('div', { id: 'dsss-pet-bubble', 'data-show': showMsg ? 'true' : 'false' }, bubbleInner),
        h('img', {
          id: 'dsss-pet-img',
          className: bouncing ? '' : 'dsss-pet-float',
          src: emojiUrl || DEFAULT_PET_SVG,
          alt: '宠物',
          draggable: false,
          onPointerDown: onPointerDown,
          onClick: function (e) { e.stopPropagation(); }
        })
      );
    }

    function PetSlit(props) {
      return h('div', {
        id: 'dsss-pet-slit',
        title: '点一下把宠物叫回来',
        onClick: props.onClick
      }, '🐾');
    }

    /* ------------------------------ 快捷菜单 ------------------------------ */

    const MENU_ITEMS = [
      { id: 'music', label: '显示 / 隐藏音乐', icon: '🎵' },
      { id: 'settings', label: '打开设置', icon: '⚙️' },
      { id: 'pet', label: '显示 / 隐藏宠物', icon: '🐾' },
      { id: 'clone', label: '复制这个宠物', icon: '➕' },
      { id: 'delete', label: '删除这个宠物', icon: '🗑️' },
      { id: 'keepone', label: '只留一个', icon: '✂️' },
      { id: 'collision', label: '宠物碰撞开关', icon: '💥' },
      { id: 'wander', label: '宠物随机游走', icon: '🚶' },
      { id: 'skin', label: '换这个宠物的皮肤', icon: '🎨' }
    ];

    function ContextMenu(props) {
      const menu = props.menu;
      if (!menu) return null;
      const w = 200, hgt = MENU_ITEMS.length * 38 + 12;
      const x = Math.min(menu.x, window.innerWidth - w - 8);
      const y = Math.min(menu.y, window.innerHeight - hgt - 8);
      return h('div', {
        id: 'dsss-menu',
        'data-open': 'true',
        style: { left: x + 'px', top: y + 'px' },
        onPointerDown: function (e) { e.stopPropagation(); }
      },
        MENU_ITEMS.map(function (item) {
          return h('button', {
            key: item.id,
            type: 'button',
            className: 'dsss-menu-item',
            onClick: function () { props.onPick(item.id); }
          }, h('span', { className: 'ico' }, item.icon), h('span', null, item.label));
        })
      );
    }

    /* ------------------------------ 启动球 ------------------------------ */

    function Launcher(props) {
      const pos = props.pos;
      const drag = useRef(null);
      const moved = useRef(false);

      const onPointerDown = function (e) {
        if (e.button === 2) return;
        e.preventDefault();
        drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
        moved.current = false;
        let last = null;
        const move = function (ev) {
          const d = drag.current;
          if (!d) return;
          const dx = ev.clientX - d.sx, dy = ev.clientY - d.sy;
          if (Math.abs(dx) + Math.abs(dy) > 4) moved.current = true;
          last = {
            x: Math.max(4, Math.min(window.innerWidth - 56, d.ox + dx)),
            y: Math.max(4, Math.min(window.innerHeight - 56, d.oy + dy))
          };
          props.onMove(last);
        };
        const up = function () {
          drag.current = null;
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          if (!moved.current) props.onClick();
          else if (last && props.onCommit) props.onCommit(last);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      };

      return h('div', {
        id: 'dsss-launcher',
        style: { left: pos.x + 'px', top: pos.y + 'px' },
        title: 'Skin Studio（右键打开菜单）',
        onPointerDown: onPointerDown,
        onContextMenu: function (e) { e.preventDefault(); props.openMenu(e); }
      }, h(IconSpark, null));
    }

    /* ------------------------------ 开场动画 ------------------------------ */

    function Intro(props) {
      const [act, setAct] = useState(1);
      const [closing, setClosing] = useState(false);
      const [logoOn, setLogoOn] = useState(false);
      const videoRef = useRef(null);
      const logoUrl = useBlobUrl(props.logo);
      const videoUrl = useBlobUrl(props.video);
      const finished = useRef(false);

      const close = useCallback(function () {
        if (finished.current) return;
        finished.current = true;
        setClosing(true);
        setTimeout(function () { props.onDone(); }, 720);
      }, [props]);

      useEffect(function () {
        const raf = requestAnimationFrame(function () { setLogoOn(true); });
        const t1 = setTimeout(function () { setAct(2); }, 1500);
        return function () { cancelAnimationFrame(raf); clearTimeout(t1); };
      }, []);

      useEffect(function () {
        if (act !== 2) return;
        // 第二幕开始才播放视频，避免第一幕期间就播到一半
        const v = videoRef.current;
        if (v) {
          try { v.currentTime = 0; } catch (err) { /* ignore */ }
          const p = v.play();
          if (p && p.catch) p.catch(function () {});
        }
        const t = setTimeout(close, 2400);
        return function () { clearTimeout(t); };
      }, [act, close]);

      return h('div', {
        id: 'dsss-intro',
        'data-closing': closing ? 'true' : 'false',
        onClick: close
      },
        h('div', { className: 'dsss-intro-act', 'data-on': act === 1 ? 'true' : 'false' },
          logoUrl
            ? h('img', { className: 'dsss-intro-logo', 'data-on': logoOn ? 'true' : 'false', src: logoUrl, alt: '' })
            : h('div', { className: 'dsss-intro-logo', 'data-on': logoOn ? 'true' : 'false', style: { display: 'flex', alignItems: 'center', justifyContent: 'center' } },
                h('div', { style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dsss-accent)' } },
                  h(IconSpark, null)))
        ),
        h('div', { className: 'dsss-intro-act', 'data-on': act === 2 ? 'true' : 'false' },
          videoUrl
            ? h('video', {
                ref: videoRef,
                className: 'dsss-intro-video',
                src: videoUrl,
                autoPlay: true,
                muted: true,
                playsInline: true,
                onEnded: close
              })
            : h('div', { style: { fontSize: '38px', letterSpacing: '10px', fontWeight: 300, opacity: .9 } }, props.logoText || 'SKIN STUDIO')
        ),
        h('div', { className: 'dsss-intro-hint' }, '点击任意位置跳过')
      );
    }

/* ==== 08-app.js ==== */
    /* ------------------------------------------------------------------ *
     * 08 · 主组件
     * ------------------------------------------------------------------ */

    const TABS = [
      { id: 'wallpaper', emoji: '🏠', label: '壁纸库' },
      { id: 'music', emoji: '🎵', label: '音乐库' },
      { id: 'appearance', emoji: '🎨', label: '外观' },
      { id: 'pet', emoji: '🐱', label: '宠物' },
      { id: 'settings', emoji: '⚙️', label: '设置' },
      { id: 'about', emoji: 'ℹ️', label: '关于' }
    ];

    function varsCss(s, urls) {
      const a = s.appearance, c = s.chat;
      const fontPx = (14 * a.fontSize) / 100;
      const delta = fontPx - 14;
      const alpha = c.bubbleNoFill ? 1 : (1 - c.bubbleOpacity / 100);
      const aiAlpha = 0.16;
      const userImg = urls.user ? 'url("' + urls.user + '")' : 'linear-gradient(145deg,#3ddc97,#1d4d3b)';
      const aiImg = urls.ai ? 'url("' + urls.ai + '")' : 'linear-gradient(145deg,#7c8cff,#33396b)';
      const composerBgImg = urls.composer ? 'url("' + urls.composer + '")' : 'none';
      const sidebarBgImg = urls.sidebar ? 'url("' + urls.sidebar + '")' : 'none';
      const newSessionBgImg = urls.newSession ? 'url("' + urls.newSession + '")' : 'none';
      const workspaceFolderBgImg = urls.workspaceFolder ? 'url("' + urls.workspaceFolder + '")' : 'none';
      const sessionItemBgImg = urls.sessionItem ? 'url("' + urls.sessionItem + '")' : 'none';
      const chatBgImg = urls.chat ? 'url("' + urls.chat + '")' : 'none';
      const userBubbleBgImg = urls.userBubble ? 'url("' + urls.userBubble + '")' : 'none';
      const aiBubbleBgImg = urls.aiBubble ? 'url("' + urls.aiBubble + '")' : 'none';
      const textColorRule = a.textColor ? '--dsw-alias-label-primary:' + a.textColor + ' !important;--dsw-alias-label-secondary:' + hexToRgba(a.textColor, 0.65) + ' !important;' : '';
      const borderColor = a.borderColor || a.accent || '#4a90e2';
      const borderRule = '--dsw-alias-border-color:' + borderColor + ' !important;--dsw-alias-border-color-strong:' + borderColor + ' !important;--dsw-alias-divider-color:' + hexToRgba(borderColor, 0.3) + ' !important;';
      const aiBubbleRule = (c.aiBubble && !c.aiBubbleNoFill) ? '--dsss-ai-bubble:' + hexToRgba(c.aiBubbleColor || '#7c8cff', aiAlpha) + ' !important;' : '--dsss-ai-bubble:rgba(255,255,255,0);';
      return [
        ':root,html,body{',
        '--dsss-accent:' + a.accent + ';',
        '--dsss-accent-soft:' + hexToRgba(a.accent, 0.16) + ';',
        '--dsw-alias-brand-primary:' + a.accent + ' !important;',
        '--dsw-alias-button-primary-fill:' + a.accent + ' !important;',
        '--dsw-alias-button-primary-hover:' + hexToRgba(a.accent, 0.85) + ' !important;',
        '--dsw-alias-interactive-bg-hover:' + hexToRgba(a.accent, 0.15) + ' !important;',
        '--dsw-alias-interactive-bg-active:' + hexToRgba(a.accent, 0.25) + ' !important;',
        '--dsw-alias-state-business-primary:' + a.accent + ' !important;',
        textColorRule,
        borderRule,
        '--dsss-ui-opacity:' + (a.uiOpacity / 100).toFixed(3) + ';',
        '--dsh-content-font-size:' + fontPx.toFixed(2) + 'px;',
        '--dsh-content-font-delta:' + delta.toFixed(2) + 'px;',
        '--dsss-composer-bg:' + (a.composerNoFill ? 'unset' : hexToRgba(a.composerBg || '#1e1e1e', (a.composerOpacity != null ? a.composerOpacity : 85)/100)) + ';',
        '--dsss-composer-bg-image:' + (a.composerBgType === 'video' ? 'none' : composerBgImg) + ';',
        '--dsss-sidebar-bg:' + (a.sidebarNoFill ? 'unset' : hexToRgba(a.sidebarBg || '#000000', (a.sidebarOpacity != null ? a.sidebarOpacity : 60)/100)) + ';',
        '--dsss-sidebar-bg-image:' + (a.sidebarBgType === 'video' ? 'none' : sidebarBgImg) + ';',
        '--dsss-session-item-bg:' + (a.sessionItemEnabled ? hexToRgba(a.sessionItemBg || '#4a7acc', (a.sessionItemOpacity != null ? a.sessionItemOpacity : 80)/100) : 'unset') + ';',
        '--dsss-session-item-bg-image:' + (a.sessionItemEnabled && a.sessionItemBgType !== 'video' ? sessionItemBgImg : 'none') + ';',
        '--dsss-new-session-bg:' + (a.newSessionEnabled ? hexToRgba(a.newSessionBg || '#4a7acc', (a.newSessionOpacity != null ? a.newSessionOpacity : 80)/100) : 'var(--dsss-session-item-bg)') + ';',
        '--dsss-new-session-bg-image:' + (a.newSessionEnabled && a.newSessionBgType !== 'video' ? newSessionBgImg : 'none') + ';',
        '--dsss-workspace-folder-bg:' + (a.workspaceFolderEnabled ? hexToRgba(a.workspaceFolderBg || '#4a7acc', (a.workspaceFolderOpacity != null ? a.workspaceFolderOpacity : 80)/100) : 'var(--dsss-session-item-bg)') + ';',
        '--dsss-workspace-folder-bg-image:' + (a.workspaceFolderEnabled && a.workspaceFolderBgType !== 'video' ? workspaceFolderBgImg : 'none') + ';',
        '--dsss-chat-bg-image:' + (a.chatBgType === 'video' ? 'none' : chatBgImg) + ';',
        '--dsss-user-bubble-bg-image:' + (a.userBubbleBgType === 'video' ? 'none' : userBubbleBgImg) + ';',
        '--dsss-ai-bubble-bg-image:' + (a.aiBubbleBgType === 'video' ? 'none' : aiBubbleBgImg) + ';',
        '--dsss-blur:' + (s.wallpaper.blur || 0) + 'px;',
        '--dsss-av-size:38px;',
        '--dsss-av-border:' + c.frameWidth + 'px;',
        '--dsss-av-frame:' + c.userFrame + ';',
        '--dsss-av-frame-ai:' + c.aiFrame + ';',
        '--dsss-av-glow:' + c.glow + 'px;',
        '--dsss-av-glow-color:' + hexToRgba(c.userFrame, 0.5) + ';',
        '--dsss-av-glow-ai:' + hexToRgba(c.aiFrame, 0.5) + ';',
        '--dsss-av-user:' + userImg + ';',
        '--dsss-av-ai:' + aiImg + ';',
        '--dsw-specific-bubble:' + hexToRgba(c.bubbleColor, alpha) + ' !important;',
        aiBubbleRule,
        '}'
      ].join('\n');
    }

    /* 多处挂载时共享同一份设置：否则两个实例各持一份 state，开关与壁纸层会互相打架 */
    const SETTINGS_STORE = { state: null, subs: [] };
    function settingsStoreGet() {
      if (!SETTINGS_STORE.state) SETTINGS_STORE.state = loadSettings();
      return SETTINGS_STORE.state;
    }
    function settingsStoreCommit(next) {
      SETTINGS_STORE.state = next;
      saveSettingsSoon(next);
      SETTINGS_STORE.subs.slice().forEach(function (fn) {
        try { fn(next); } catch (e) { /* ignore */ }
      });
    }

    function SkinStudio(props) {
      const [settings, setSettings] = useState(settingsStoreGet);
      const settingsRef = useRef(settings);
      settingsRef.current = settings;

      const [fileList, setFileList] = useState([]);
      const [quotes, setQuotesState] = useState(function () { return loadList(QUOTES_KEY, DEFAULT_QUOTES); });
      const [emojis, setEmojisState] = useState(function () { return loadList(EMOJIS_KEY, []); });
      const [panelOpen, setPanelOpen] = useState(false);
      const [tab, setTab] = useState('wallpaper');
      const [menu, setMenu] = useState(null);
      const [showIntro, setShowIntro] = useState(function () { return !!settingsRef.current.intro.enabled; });
      const [usage, setUsage] = useState(0);
      const varsRef = useRef(null);
      const stageRef = useRef({ root: null, media: null, mask: null, video: null });

      const setPath = useCallback(function (path, value) {
        const next = JSON.parse(JSON.stringify(settingsStoreGet()));
        const parts = String(path).split('.');
        let o = next;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!isObj(o[parts[i]])) o[parts[i]] = {};
          o = o[parts[i]];
        }
        o[parts[parts.length - 1]] = value;
        settingsStoreCommit(next);
      }, []);

      const update = useCallback(function (mutator) {
        const next = JSON.parse(JSON.stringify(settingsStoreGet()));
        mutator(next);
        settingsStoreCommit(next);
      }, []);

      useEffect(function () {
        const fn = function (next) { setSettings(next); };
        SETTINGS_STORE.subs.push(fn);
        setSettings(settingsStoreGet());
        return function () {
          const i = SETTINGS_STORE.subs.indexOf(fn);
          if (i >= 0) SETTINGS_STORE.subs.splice(i, 1);
        };
      }, []);

      const setQuotes = useCallback(function (list) {
        setQuotesState(list);
        saveList(QUOTES_KEY, list);
      }, []);

      const setEmojis = useCallback(function (list) {
        setEmojisState(list);
        saveList(EMOJIS_KEY, list);
      }, []);

      const refreshFiles = useCallback(function () {
        idbAll().then(function (all) {
          setFileList(all);
          let total = 0;
          all.forEach(function (f) { total += f.size || 0; });
          setUsage(total);
        }).catch(function () { setFileList([]); });
      }, []);

      useEffect(function () { refreshFiles(); }, [refreshFiles]);

      /* ---------------- 自愈：设置与 IndexedDB 里的文件对齐 ----------------
         文件还在、设置里却没了引用（清过缓存、误触重置、换设备同步设置等），
         或设置里引用的文件已被删除时，自动把能对上的接回去，避免用户重新导入。 */

      const healedRef = useRef(false);

      useEffect(function () {
        if (healedRef.current || !fileList.length) return;
        healedRef.current = true;
        const ids = new Set(fileList.map(function (f) { return f.id; }));

        function latest(kind) {
          const hit = fileList.filter(function (f) { return f.kind === kind; })
            .sort(function (a, b) { return (b.addedAt || 0) - (a.addedAt || 0); });
          return hit.length ? hit[0].id : null;
        }

        update(function (s) {
          if (s.wallpaper.current && !ids.has(s.wallpaper.current)) {
            s.wallpaper.current = null;
            s.wallpaper.enabled = false;
          }
          if (s.chat.userAvatar && !ids.has(s.chat.userAvatar)) s.chat.userAvatar = latest('user-avatar');
          if (s.chat.aiAvatar && !ids.has(s.chat.aiAvatar)) s.chat.aiAvatar = latest('ai-avatar');
          if (s.intro.logo && !ids.has(s.intro.logo)) s.intro.logo = latest('intro-logo');
          if (s.intro.video && !ids.has(s.intro.video)) s.intro.video = latest('intro-video');

          const known = (s.music.tracks || []).filter(function (id) { return ids.has(id); });
          const extra = fileList.filter(function (f) { return f.kind === 'music' && known.indexOf(f.id) < 0; })
            .sort(function (a, b) { return (a.addedAt || 0) - (b.addedAt || 0); })
            .map(function (f) { return f.id; });
          const tracks = known.concat(extra);
          if (tracks.length !== (s.music.tracks || []).length) s.music.tracks = tracks;
          if (s.music.current && !ids.has(s.music.current)) s.music.current = null;
          s.pet.emoji = s.pet.emoji && ids.has(s.pet.emoji) ? s.pet.emoji : latest('pet-emoji');
          /* 壁纸声音只保留仍然存在的文件 */
          if (s.wallpaper.sound.fileId && !ids.has(s.wallpaper.sound.fileId)) s.wallpaper.sound.fileId = latest('wallpaper-sound');
        });
      }, [fileList, update]);

      /* ------------------------- 媒体 URL ------------------------- */

      const wpRec = fileOf(fileList, settings.wallpaper.current);
      const wpUrl = useBlobUrl(settings.wallpaper.current && wpRec ? settings.wallpaper.current : null);
      const composerBgUrl = useBlobUrl(settings.appearance.composerBgId);
      const sidebarBgUrl = useBlobUrl(settings.appearance.sidebarBgId);
      const newSessionBgUrl = useBlobUrl(settings.appearance.newSessionBgId);
      const workspaceFolderBgUrl = useBlobUrl(settings.appearance.workspaceFolderBgId);
      const sessionItemBgUrl = useBlobUrl(settings.appearance.sessionItemBgId);
      const chatBgUrl = useBlobUrl(settings.appearance.chatBgId);
      const userBubbleBgUrl = useBlobUrl(settings.appearance.userBubbleBgId);
      const aiBubbleBgUrl = useBlobUrl(settings.appearance.aiBubbleBgId);
      const userAvUrl = useBlobUrl(settings.chat.userAvatar);
      const aiAvUrl = useBlobUrl(settings.chat.aiAvatar);
      const introLogoUrl = useBlobUrl(settings.intro.logo);

      const music = useMusic(settings, setPath);
      useAmbience(settings, music.playing);
      const skinTargetId = useRef(null);

      /* ------------------------- 写入动态变量 ------------------------- */

      useEffect(function () {
        if (!varsRef.current) return;
        varsRef.current.textContent = varsCss(settings, { user: userAvUrl, ai: aiAvUrl, composer: composerBgUrl, sidebar: sidebarBgUrl, newSession: newSessionBgUrl, workspaceFolder: workspaceFolderBgUrl, sessionItem: sessionItemBgUrl, chat: chatBgUrl, userBubble: userBubbleBgUrl, aiBubble: aiBubbleBgUrl });
      }, [settings, userAvUrl, aiAvUrl, composerBgUrl, sidebarBgUrl, newSessionBgUrl, workspaceFolderBgUrl, sessionItemBgUrl, chatBgUrl, userBubbleBgUrl, aiBubbleBgUrl]);

      // 插入动态背景视频（可重复调用，侧栏重渲染后自动补插）
      const applyBgVideos = function () {
        // 输入框背景视频
        const composerEl = document.querySelector('[data-composer-card]');
        if (composerEl) {
          const old = composerEl.querySelector('.dsss-composer-bg-video');
          if (old) old.remove();
          if (settings.appearance.composerBgType === 'video' && composerBgUrl) {
            const v = document.createElement('video');
            v.className = 'dsss-composer-bg-video';
            v.src = composerBgUrl;
            v.autoplay = true;
            v.loop = true;
            v.muted = true;
            v.playsInline = true;
            composerEl.prepend(v);
            v.play().catch(function(){});
          }
        }
        // 侧边栏背景视频
        const sidebarEl = document.querySelector('[data-slot="sidebar"] > :first-child');
        if (sidebarEl) {
          const old = sidebarEl.querySelector('.dsss-sidebar-bg-video');
          if (old) old.remove();
          if (settings.appearance.sidebarBgType === 'video' && sidebarBgUrl) {
            const v = document.createElement('video');
            v.className = 'dsss-sidebar-bg-video';
            v.src = sidebarBgUrl;
            v.autoplay = true;
            v.loop = true;
            v.muted = true;
            v.playsInline = true;
            sidebarEl.prepend(v);
            v.play().catch(function(){});
          }
        }
        // 新会话按钮背景视频
        if (settings.appearance.newSessionEnabled && settings.appearance.newSessionBgType === 'video' && newSessionBgUrl) {
          const el = document.querySelector("button[class*='newSession']");
          if (el) {
            const old = el.querySelector('.dsss-newsession-video');
            if (old) old.remove();
            const v = document.createElement('video');
            v.className = 'dsss-newsession-video';
            v.src = newSessionBgUrl;
            v.autoplay = true;
            v.loop = true;
            v.muted = true;
            v.playsInline = true;
            v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;z-index:0;';
            el.prepend(v);
            v.play().catch(function(){});
          }
        } else {
          document.querySelectorAll('.dsss-newsession-video').forEach(function (v) { v.remove(); });
        }
        // 工作区文件夹背景视频
        if (settings.appearance.workspaceFolderEnabled && settings.appearance.workspaceFolderBgType === 'video' && workspaceFolderBgUrl) {
          document.querySelectorAll("[data-slot='sidebar'] [class*='projectRow']").forEach(function(el) {
            const old = el.querySelector('.dsss-folder-video');
            if (old) old.remove();
            const v = document.createElement('video');
            v.className = 'dsss-folder-video';
            v.src = workspaceFolderBgUrl;
            v.autoplay = true;
            v.loop = true;
            v.muted = true;
            v.playsInline = true;
            v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;z-index:0;';
            el.prepend(v);
            v.play().catch(function(){});
          });
        } else {
          document.querySelectorAll('.dsss-folder-video').forEach(function (v) { v.remove(); });
        }
        // 会话条目背景视频（工作区行已由上面处理，这里只补会话子条目）
        if (settings.appearance.sessionItemEnabled && settings.appearance.sessionItemBgType === 'video' && sessionItemBgUrl) {
          document.querySelectorAll("[data-slot='sidebar'] [class*='wnFoaW_slot']").forEach(function (el) {
            if (el.querySelector("[class*='projectRow']")) return;
            if (el.querySelector('.dsss-session-video')) return;
            const v = document.createElement('video');
            v.className = 'dsss-session-video';
            v.src = sessionItemBgUrl;
            v.autoplay = true;
            v.loop = true;
            v.muted = true;
            v.playsInline = true;
            v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;z-index:0;';
            el.prepend(v);
            v.play().catch(function(){});
          });
        } else {
          document.querySelectorAll('.dsss-session-video').forEach(function (v) { v.remove(); });
        }
        const chatEl = document.querySelector('[data-conversation-scroll]');
        if (chatEl) {
          const old = chatEl.querySelector('.dsss-chat-bg-video');
          if (old) old.remove();
          if (settings.appearance.chatBgType === 'video' && chatBgUrl) {
            const v = document.createElement('video');
            v.className = 'dsss-chat-bg-video';
            v.src = chatBgUrl;
            v.autoplay = true;
            v.loop = true;
            v.muted = true;
            v.playsInline = true;
            chatEl.prepend(v);
            v.play().catch(function(){});
          }
        }
      };
      useEffect(function () {
        applyBgVideos();
        const sb = document.querySelector('[data-slot="sidebar"]');
        if (!sb) return;
        let timer = 0;
        const mo = new MutationObserver(function () {
          if (timer) return;
          timer = setTimeout(function () { timer = 0; applyBgVideos(); }, 200);
        });
        mo.observe(sb, { childList: true, subtree: true });
        return function () {
          mo.disconnect();
          if (timer) clearTimeout(timer);
        };
      }, [composerBgUrl, sidebarBgUrl, newSessionBgUrl, workspaceFolderBgUrl, sessionItemBgUrl, chatBgUrl, settings.appearance.composerBgType, settings.appearance.sidebarBgType, settings.appearance.newSessionBgType, settings.appearance.workspaceFolderBgType, settings.appearance.sessionItemBgType, settings.appearance.chatBgType, settings.appearance.newSessionEnabled, settings.appearance.workspaceFolderEnabled, settings.appearance.sessionItemEnabled]);

      useEffect(function () {
        const b = document.body;
        const on = !!(settings.wallpaper.enabled && settings.wallpaper.current);
        if (on) b.setAttribute('data-dsss-wp', ''); else b.removeAttribute('data-dsss-wp');
        if (settings.wallpaper.blur > 0) b.setAttribute('data-dsss-blur', ''); else b.removeAttribute('data-dsss-blur');
        if (settings.chat.enabled) b.setAttribute('data-dsss-chat', ''); else b.removeAttribute('data-dsss-chat');
        if (settings.chat.enabled && settings.chat.aiBubble) b.setAttribute('data-dsss-ai-bubble', ''); else b.removeAttribute('data-dsss-ai-bubble');
        if (showIntro) b.setAttribute('data-dsss-intro', ''); else b.removeAttribute('data-dsss-intro');
      }, [settings.wallpaper.enabled, settings.wallpaper.current, settings.wallpaper.blur, settings.chat.enabled, settings.chat.aiBubble, showIntro]);

      useEffect(function () {
        return function () {
          const b = document.body;
          ['data-dsss-wp', 'data-dsss-blur', 'data-dsss-chat', 'data-dsss-ai-bubble', 'data-dsss-intro'].forEach(function (a) { b.removeAttribute(a); });
        };
      }, []);

      useEffect(function () {
        const root = document.createElement('div');
        root.id = 'dsss-stage';
        root.setAttribute('aria-hidden', 'true');
        const media = document.createElement('div');
        media.className = 'dsss-wp-media';
        const mask = document.createElement('div');
        mask.className = 'dsss-wp-mask';
        root.appendChild(media);
        root.appendChild(mask);
        root.style.display = 'none';
        document.body.insertBefore(root, document.body.firstChild);
        stageRef.current = { root: root, media: media, mask: mask, video: null };
        return function () {
          const s = stageRef.current;
          if (s.video) { try { s.video.pause(); } catch (e) { /* ignore */ } }
          if (root.parentNode) root.parentNode.removeChild(root);
          stageRef.current = { root: null, media: null, mask: null, video: null };
        };
      }, []);

      useEffect(function () {
        const s = stageRef.current;
        if (!s.root) return;
        const w = settings.wallpaper;
        const isVideo = !!(wpRec && (wpRec.mime || '').indexOf('video') === 0);
        const on = !!(w.enabled && w.current && wpUrl);
        const size = w.fit === 'fill' ? '100% 100%' : (w.fit === 'contain' ? 'contain' : 'cover');
        s.root.style.display = on ? 'block' : 'none';
        s.media.style.backgroundImage = on && !isVideo && wpUrl ? 'url("' + wpUrl + '")' : 'none';
        s.media.style.backgroundSize = size;
        s.media.style.filter = w.blur ? 'blur(' + w.blur + 'px)' : 'none';
        s.media.style.transform = w.blur ? 'scale(1.04)' : 'none';
        if (on && isVideo) {
          if (!s.video || s.video.getAttribute('src') !== wpUrl) {
            if (s.video && s.video.parentNode) s.video.parentNode.removeChild(s.video);
            const v = document.createElement('video');
            v.setAttribute('src', wpUrl);
            v.autoplay = true;
            v.muted = true;
            v.loop = true;
            v.setAttribute('playsinline', '');
            v.setAttribute('preload', 'auto');
            v.style.objectFit = w.fit === 'fill' ? 'fill' : (w.fit === 'contain' ? 'contain' : 'cover');
            s.media.appendChild(v);
            s.video = v;
          } else {
            s.video.style.objectFit = w.fit === 'fill' ? 'fill' : (w.fit === 'contain' ? 'contain' : 'cover');
          }
        } else if (s.video) {
          try { s.video.pause(); } catch (e) { /* ignore */ }
          if (s.video.parentNode) s.video.parentNode.removeChild(s.video);
          s.video = null;
        }
        s.mask.style.opacity = String(Math.max(0, Math.min(1, (w.overlay || 0) / 100)));
      }, [settings.wallpaper, wpUrl, wpRec]);

      /* ------------------------- 快捷键 ------------------------- */

      useEffect(function () {
        const onKey = function (e) {
          if (e.ctrlKey && e.altKey) {
            const k = (e.key || '').toLowerCase();
            if (k === 'p') {
              e.preventDefault();
              const st = settingsRef.current.pet;
              if (!st.enabled) { setPath('pet.enabled', true); setPath('pet.visible', true); setPath('pet.docked', false); }
              else setPath('pet.visible', !st.visible);
            } else if (k === 's') {
              e.preventDefault();
              setPanelOpen(function (v) { return !v; });
            }
          }
          if (e.key === 'Escape') setPanelOpen(false);
        };
        window.addEventListener('keydown', onKey, true);
        return function () { window.removeEventListener('keydown', onKey, true); };
      }, [setPath]);

      /* ------------------------- 调试通道（可被外部脚本驱动） ------------------------- */

      useEffect(function () {
        window.__skinStudio = {
          get: function () { return settingsRef.current; },
          set: function (path, value) { setPath(path, value); },
          update: function (mutator) { update(mutator); },
          open: function (v) { setPanelOpen(v !== false); },
          tab: function (id) { setPanelOpen(true); if (id) setTab(id); },
          intro: function (v) { setShowIntro(!!v); }
        };
        return function () { delete window.__skinStudio; };
      }, [setPath, update]);

      /* ------------------------- 菜单位置关闭 ------------------------- */

      useEffect(function () {
        if (!menu) return;
        const close = function (e) {
          const t = e && e.target;
          if (!t || !t.closest) return;
          // 右键点在自己宠物/启动球/迷你窗上：不关闭（由 onCtx 重新打开菜单）
          if (e.type === 'contextmenu' && (t.closest('#dsss-pet') || t.closest('#dsss-launcher') || t.closest('#dsss-mini'))) return;
          // 点在菜单内部：不关闭。否则 window 捕获阶段的 pointerdown 会在按钮 onClick 之前
          // 先把菜单 setMenu(null) 卸掉，菜单项永远点不到（表现为菜单一点就消失）
          if (t.closest('#dsss-menu')) return;
          setMenu(null);
        };
        const t = setTimeout(function () {
          window.addEventListener('pointerdown', close, true);
          window.addEventListener('contextmenu', close, true);
        }, 30);
        return function () {
          clearTimeout(t);
          window.removeEventListener('pointerdown', close, true);
          window.removeEventListener('contextmenu', close, true);
        };
      }, [menu]);

      // 宿主和其它插件也会抢 contextmenu：在 window 捕获阶段先接管自己控件上的右键
      useEffect(function () {
        const onCtx = function (e) {
          const t = e.target;
          if (!t || !t.closest) return;
          const petEl = t.closest('#dsss-pet');
          const launcherEl = t.closest('#dsss-launcher');
          const miniEl = t.closest('#dsss-mini');
          if (!petEl && !launcherEl && !miniEl) return;
          e.preventDefault();
          e.stopPropagation();
          setMenu({ x: e.clientX, y: e.clientY, instanceId: petEl ? petEl.getAttribute('data-instance') : null });
        };
        window.addEventListener('contextmenu', onCtx, true);
        return function () { window.removeEventListener('contextmenu', onCtx, true); };
      }, []);

      const openMenu = function (e, instanceId) {
        e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        setMenu({ x: e.clientX, y: e.clientY, instanceId: instanceId || null });
      };

      const onMenuPick = function (id) {
        const targetId = menu && menu.instanceId;
        setMenu(null);
        if (id === 'settings') { setPanelOpen(true); return; }
        if (id === 'music') {
          const next = !settingsRef.current.music.mini;
          setPath('music.mini', next);
          toast(next ? '音乐小窗已显示' : '音乐小窗已隐藏');
          return;
        }
        if (id === 'pet') {
          const st = settingsRef.current.pet;
          if (!st.enabled) { setPath('pet.enabled', true); setPath('pet.visible', true); toast('宠物已显示'); }
          else { setPath('pet.visible', !st.visible); toast(st.visible ? '宠物已隐藏，按 Ctrl+Alt+P 找回' : '宠物已显示'); }
          return;
        }
        if (id === 'collision') {
          const cur = !!settingsRef.current.pet.collision;
          setPath('pet.collision', !cur);
          toast(cur ? '宠物碰撞已关闭' : '宠物碰撞已开启，像台球一样弹开');
          return;
        }
        if (id === 'wander') {
          const cur = !!settingsRef.current.pet.wander;
          setPath('pet.wander', !cur);
          toast(cur ? '随机游走已关闭' : '宠物开始随机走来走去');
          return;
        }
        if (id === 'skin') {
          pickFiles({ accept: 'image/*', multiple: false }).then(function (fs) {
            if (!fs || !fs.length) return;
            importFile(fs[0], 'pet-emoji').then(function (rec) {
              setEmojisState(function (prev) {
                if (prev.indexOf(rec.id) >= 0) return prev;
                return prev.concat([rec.id]);
              });
              if (targetId) {
                update(function (draft) {
                  const it = (draft.pet.instances || []).find(function (x) { return x.id === targetId; });
                  if (it) it.skinId = rec.id;
                });
                toast('已换皮肤');
              }
            });
          });
          return;
        }
        if (id === 'clone') {
          const inst = settingsRef.current.pet.instances || [];
          const src = inst.find(function (x) { return x.id === targetId; }) || inst[0];
          if (!src) return;
          const nid = 'pet-' + Date.now().toString(36);
          setPath('pet.instances', inst.concat([{
            id: nid,
            x: Math.min(window.innerWidth - 140, (src.x || 100) + 80),
            y: (src.y || 100) + 40,
            skinId: src.skinId || null
          }]));
          toast('已复制一个宠物');
          return;
        }
        if (id === 'delete') {
          const inst = settingsRef.current.pet.instances || [];
          if (inst.length <= 1) { toast('至少要保留一个宠物哦！'); return; }
          setPath('pet.instances', inst.filter(function (x) { return x.id !== targetId; }));
          toast('已删除这个宠物');
          return;
        }
        if (id === 'keepone') {
          const inst = settingsRef.current.pet.instances || [];
          if (inst.length <= 1) { toast('已经只有一个宠物了'); return; }
          const first = inst[0];
          setPath('pet.instances', [first]);
          toast('已只留第一个宠物');
          return;
        }
      };

      /* ------------------------- 重置 / 清理 ------------------------- */

      const onReset = function () {
        try {
          localStorage.removeItem(SETTINGS_KEY);
          localStorage.removeItem(QUOTES_KEY);
          localStorage.removeItem(EMOJIS_KEY);
          localStorage.removeItem('skin-studio-ui');
        } catch (e) { /* ignore */ }
        resetUrlCache();
        idbClear().then(function () {
          const fresh = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
          settingsStoreCommit(fresh);
          setQuotesState(DEFAULT_QUOTES.slice());
          setEmojisState([]);
          setFileList([]);
          setUsage(0);
          setShowIntro(false);
          toast('已恢复到初始状态');
        }).catch(function () {
          settingsStoreCommit(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
          toast('设置已重置（文件清理失败）');
        });
      };

      const onClean = function () {
        const keep = {};
        const s = settingsRef.current;
        const add = function (id) { if (id) keep[id] = 1; };
        add(s.wallpaper.current);
        (s.wallpaper.favorites || []).forEach(add);
        add(s.wallpaper.sound.fileId);
        (s.music.tracks || []).forEach(function (t) { add(t.id); });
        add(s.chat.userAvatar); add(s.chat.aiAvatar);
        add(s.intro.logo); add(s.intro.video);
        add(s.pet.emoji);
        emojis.forEach(add);
        (quotes || []).forEach(function (q) { if (q && q.type === 'image') add(q.id); });
        const orphans = fileList.filter(function (f) { return !keep[f.id]; });
        if (!orphans.length) { toast('没有需要清理的文件'); return; }
        let chain = Promise.resolve();
        orphans.forEach(function (f) {
          chain = chain.then(function () { forgetUrl(f.id); return idbDelete(f.id); });
        });
        chain.then(function () {
          refreshFiles();
          toast('已清理 ' + orphans.length + ' 个文件');
        });
      };

      /* ------------------------- 位置 ------------------------- */

      const [launcherPos, setLauncherPos] = useState(function () {
        const saved = settings.layout && settings.layout.launcher;
        if (saved && typeof saved.x === 'number') return saved;
        return { x: Math.max(12, window.innerWidth - 76), y: Math.round(window.innerHeight * 0.36) };
      });
      const [clockPos, setClockPos] = useState(function () {
        const saved = settings.layout && settings.layout.clock;
        if (saved && typeof saved.x === 'number') return saved;
        return { x: Math.round(window.innerWidth / 2 - 62), y: 12 };
      });
      const [miniPos, setMiniPos] = useState(function () {
        const saved = settings.layout && settings.layout.mini;
        if (saved && typeof saved.x === 'number') return saved;
        return { x: Math.max(12, window.innerWidth - 260), y: Math.max(12, window.innerHeight - 300) };
      });

      /* ------------------------- 渲染 ------------------------- */

      const wp = settings.wallpaper;

      const content = (function () {
        switch (tab) {
          case 'wallpaper': return h(WallpaperTab, { settings: settings, setPath: setPath, update: update, files: fileList, refresh: refreshFiles });
          case 'music': return h(MusicTab, { settings: settings, setPath: setPath, update: update, files: fileList, refresh: refreshFiles, music: music });
          case 'appearance': return h(AppearanceTab, { settings: settings, setPath: setPath, update: update, refresh: refreshFiles });
          case 'pet': return h(PetTab, { settings: settings, setPath: setPath, update: update, quotes: quotes, emojis: emojis, setQuotes: setQuotes, setEmojis: setEmojis, refresh: refreshFiles, skinTargetId: skinTargetId.current, onPickSkin: function (id) {
            if (skinTargetId.current) {
              const tid = skinTargetId.current;
              update(function (draft) {
                const it = (draft.pet.instances || []).find(function (x) { return x.id === tid; });
                if (it) it.skinId = id;
              });
              toast('已给这个宠物换皮肤');
              skinTargetId.current = null;
            } else {
              setPath('pet.emoji', id);
            }
          } });
          case 'settings': return h(SettingsTab, { settings: settings, usage: usage, onReset: onReset, onClean: onClean });
          case 'about': return h(AboutTab, null);
          default: return null;
        }
      })();

      const petInstances = settings.pet.instances || [];
      const positionsRef = useRef({});
      const physicsRef = useRef({});

      const onPetPos = function (id, pos) {
        positionsRef.current[id] = pos;
      };
      const onPetCommit = function (id, pos, throwVel) {
        positionsRef.current[id] = pos;
        // 扔出去：把速度交给物理引擎
        if (throwVel && physicsRef.current) {
          physicsRef.current[id] = { x: pos.x, y: pos.y, vx: throwVel.vx || 0, vy: throwVel.vy || 0 };
        }
        update(function (draft) {
          const arr = draft.pet.instances || [];
          const it = arr.find(function (x) { return x.id === id; });
          if (it) { it.x = pos.x; it.y = pos.y; }
        });
      };

      // 碰撞物理：拖一个扔出去，它滑出去撞墙反弹、撞别的宠物把对方弹开，慢慢减速停下
      useEffect(function () {
        if (!settings.pet.collision || !settings.pet.enabled || !settings.pet.visible) return;
        const size = settings.pet.size || 110;
        let raf = 0;
        const step = function () {
          const ids = Object.keys(physicsRef.current);
          if (ids.length) {
            // 1. 更新位置 + 撞墙反弹
            ids.forEach(function (id) {
              const b = physicsRef.current[id];
              b.x += b.vx; b.y += b.vy;
              if (b.x <= 0) { b.x = 0; b.vx = Math.abs(b.vx); }
              if (b.x >= window.innerWidth - size) { b.x = window.innerWidth - size; b.vx = -Math.abs(b.vx); }
              if (b.y <= 0) { b.y = 0; b.vy = Math.abs(b.vy); }
              if (b.y >= window.innerHeight - size) { b.y = window.innerHeight - size; b.vy = -Math.abs(b.vy); }
              const el = document.querySelector('[data-instance="' + id + '"]');
              if (el) { el.style.left = b.x + 'px'; el.style.top = b.y + 'px'; }
              positionsRef.current[id] = { x: b.x, y: b.y };
            });
            // 2. 宠物间弹性碰撞
            for (let i = 0; i < ids.length; i++) {
              for (let j = 0; j < petInstances.length; j++) {
                const otherId = petInstances[j].id;
                if (otherId === ids[i]) continue;
                const a = physicsRef.current[ids[i]];
                const bPos = positionsRef.current[otherId] || petInstances[j];
                if (!a || !bPos) continue;
                const dx = bPos.x - a.x, dy = bPos.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = size * 0.95;
                if (dist > 0 && dist < minDist) {
                  const nx = dx / dist, ny = dy / dist;
                  const overlap = (minDist - dist) / 2;
                  a.x -= nx * overlap; a.y -= ny * overlap;
                  // 被撞的宠物获得速度
                  if (!physicsRef.current[otherId]) physicsRef.current[otherId] = { x: bPos.x, y: bPos.y, vx: 0, vy: 0 };
                  physicsRef.current[otherId].x += nx * overlap;
                  physicsRef.current[otherId].y += ny * overlap;
                  // 撞球：运动中的 a 把全部速度传给 b，a 自己停住（像台球白球打完就停）
                  const speed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
                  if (speed > 0.5) {
                    physicsRef.current[otherId].vx = a.vx;
                    physicsRef.current[otherId].vy = a.vy;
                    a.vx = 0; a.vy = 0;
                  }
                }
              }
            }
            // 3. 速度衰减
            ids.forEach(function (id) {
              physicsRef.current[id].vx *= 0.96;
              physicsRef.current[id].vy *= 0.96;
              if (Math.abs(physicsRef.current[id].vx) < 0.1 && Math.abs(physicsRef.current[id].vy) < 0.1) {
                physicsRef.current[id].vx = 0; physicsRef.current[id].vy = 0;
                // 持久化最终位置
                const finalPos = { x: physicsRef.current[id].x, y: physicsRef.current[id].y };
                const pid = id;
                update(function (draft) {
                  const arr = draft.pet.instances || [];
                  const it = arr.find(function (x) { return x.id === pid; });
                  if (it) { it.x = finalPos.x; it.y = finalPos.y; }
                });
                delete physicsRef.current[id];
              }
            });
          }
          raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return function () { cancelAnimationFrame(raf); };
      }, [settings.pet.collision, settings.pet.enabled, settings.pet.visible, settings.pet.size, petInstances]);

      // 随机游走：宠物自己在屏幕上走来走去，撞墙反弹，偶尔随机变向
      useEffect(function () {
        if (!settings.pet.wander || !settings.pet.enabled || !settings.pet.visible) return;
        const size = settings.pet.size || 110;
        const wanderState = {};
        petInstances.forEach(function (inst) {
          const p = positionsRef.current[inst.id] || { x: 100, y: 100 };
          const ang = Math.random() * Math.PI * 2;
          const spd = 1 + Math.random() * 1.5;
          wanderState[inst.id] = { x: p.x, y: p.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, nextTurn: performance.now() + 2000 + Math.random() * 3000 };
        });
        let raf = 0;
        const step = function () {
          const now = performance.now();
          Object.keys(wanderState).forEach(function (id) {
            const b = wanderState[id];
            // 偶尔随机转向
            if (now > b.nextTurn) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 1 + Math.random() * 1.5;
              b.vx = Math.cos(ang) * spd;
              b.vy = Math.sin(ang) * spd;
              b.nextTurn = now + 2000 + Math.random() * 3000;
            }
            b.x += b.vx; b.y += b.vy;
            if (b.x <= 0) { b.x = 0; b.vx = Math.abs(b.vx); }
            if (b.x >= window.innerWidth - size) { b.x = window.innerWidth - size; b.vx = -Math.abs(b.vx); }
            if (b.y <= 0) { b.y = 0; b.vy = Math.abs(b.vy); }
            if (b.y >= window.innerHeight - size) { b.y = window.innerHeight - size; b.vy = -Math.abs(b.vy); }
            const el = document.querySelector('[data-instance="' + id + '"]');
            if (el) { el.style.left = b.x + 'px'; el.style.top = b.y + 'px'; }
            positionsRef.current[id] = { x: b.x, y: b.y };
          });
          raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return function () { cancelAnimationFrame(raf); };
      }, [settings.pet.wander, settings.pet.enabled, settings.pet.visible, settings.pet.size, petInstances.length]);

      const petEls = settings.pet.enabled && settings.pet.visible && !settings.pet.docked
        ? petInstances.map(function (inst) {
            return h(Pet, {
              key: inst.id,
              settings: settings,
              instance: inst,
              quotes: quotes,
              emojis: emojis,
              openMenu: openMenu,
              onPos: onPetPos,
              onCommitPos: onPetCommit
            });
          })
        : null;

      return h(React.Fragment, null,
        settings.appearance.clock.enabled
          ? h(Clock, {
              settings: settings,
              pos: clockPos,
              onMove: setClockPos,
              onCommit: function (p) { setPath('layout.clock', p); }
            })
          : null,

        // 星星悬浮球（Launcher）按用户要求隐藏：打开设置面板仍可通过 Ctrl+Alt+S，
        // 或在宠物上右键 → 打开设置
        null,

        petEls,
        settings.pet.enabled && settings.pet.docked ? h(PetSlit, { onClick: function () { setPath('pet.docked', false); } }) : null,

        h(MiniPlayer, {
          settings: settings,
          music: music,
          pos: miniPos,
          onMove: setMiniPos,
          onCommit: function (p) { setPath('layout.mini', p); },
          open: !!settings.music.mini,
          onClose: function () { setPath('music.mini', false); },
          onSetPath: setPath
        }),

        h('div', { id: 'dsss-panel', 'data-open': panelOpen ? 'true' : 'false' },
          h('div', { className: 'dsss-head' },
            h('div', { className: 'dsss-logo' }, h(IconSpark, null)),
            h('div', { className: 'dsss-head-copy' },
              h('div', { className: 'dsss-title' }, 'Skin Studio'),
              h('div', { className: 'dsss-subtitle' }, '壁纸 · 音乐 · 宠物 · 外观')
            ),
            h('div', { className: 'dsss-head-spacer' }),
            h('button', { className: 'dsss-close', type: 'button', title: '关闭', onClick: function () { setPanelOpen(false); } }, h(IconClose, null))
          ),
          h('div', { className: 'dsss-body' },
            h('div', { className: 'dsss-rail' },
              TABS.map(function (t) {
                return h('button', {
                  key: t.id,
                  type: 'button',
                  className: 'dsss-tab',
                  'data-active': tab === t.id ? 'true' : 'false',
                  onClick: function () { setTab(t.id); }
                },
                  h('span', { className: 'dsss-tab-emoji' }, t.emoji),
                  h('span', null, t.label)
                );
              })
            ),
            h('div', { className: 'dsss-content' }, content)
          )
        ),

        h(ContextMenu, { menu: menu, onPick: onMenuPick }),
        h(ToastHost, null),
        h(DialogHost, null),

        showIntro
          ? h(Intro, {
              logo: settings.intro.logo,
              video: settings.intro.video,
              logoText: settings.intro.logoText,
              onDone: function () { setShowIntro(false); }
            })
          : null,

        h('style', { ref: varsRef, id: 'dsss-vars' }, varsCss(settings, { user: userAvUrl, ai: aiAvUrl }))
      );
    }

/* ==== 09-tail.js ==== */
    /* ------------------------------------------------------------------ *
     * 09 · 挂载
     * ------------------------------------------------------------------ */

    const STYLE_ID = 'dsss-style';

    function mountStyle() {
      let el = document.getElementById(STYLE_ID);
      if (!el) {
        el = document.createElement('style');
        el.id = STYLE_ID;
        el.setAttribute('data-skin-studio', '');
        document.head.appendChild(el);
      }
      el.textContent = CSS;
      return function () {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      };
    }

    return {
      inject: ['slots'],
      apply: function (ctx) {
        try {
          // 样式：在 effect 中注册，插件卸载时自动移除
          if (typeof ctx.effect === 'function') {
            ctx.effect(mountStyle);
          } else {
            mountStyle();
          }

          // 全屏悬浮层：壁纸、悬浮球、面板、宠物、播放器等
          ctx.slots.inject('shell.overlay', function () {
            return ctx.slots.register(
              { name: 'shell.overlay', id: 'skin-studio', order: 24, label: 'Skin Studio' },
              function SkinStudioMount() {
                return h(SkinStudio, { ctx: ctx });
              }
            );
          });
        } catch (err) {
          window.__dsssBootError = String((err && err.stack) || err);
          throw err;
        }
      }
    };
  }
});
