    const CSS = String.raw`
/* ============================ Skin Studio base ============================ */
:root{--dsss-accent:#3ddc97;--dsss-accent-soft:rgba(61,220,151,.16);}
html:has(body[data-dsss-wp]){background:transparent !important;}
body[data-dsss-wp]{--dsw-alias-bg-base:transparent !important;--dsw-specific-sidebar-fill:transparent !important;background:transparent !important;}
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
/* 新会话和导航按钮背景色 */
button[class*='newSession'],
[data-slot="sidebar"] nav button,
[data-slot="sidebar"] [class*='navItem'],
[data-slot="sidebar"] [class*='menuItem']{
  background: var(--dsss-sidebar-bg) !important;
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
