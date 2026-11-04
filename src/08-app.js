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
      const textColorRule = a.textColor ? '--dsw-alias-label-primary:' + a.textColor + ' !important;--dsw-alias-label-secondary:' + hexToRgba(a.textColor, 0.65) + ' !important;' : '';
      const aiBubbleRule = (c.aiBubble && !c.aiBubbleNoFill) ? '--dsss-ai-bubble:' + hexToRgba(c.aiBubbleColor || '#7c8cff', aiAlpha) + ' !important;' : '--dsss-ai-bubble:rgba(255,255,255,0);';
      return [
        ':root,html,body{',
        '--dsss-accent:' + a.accent + ';',
        '--dsss-accent-soft:' + hexToRgba(a.accent, 0.16) + ';',
        '--dsw-alias-brand-primary:' + a.accent + ' !important;',
        textColorRule,
        '--dsss-ui-opacity:' + (a.uiOpacity / 100).toFixed(3) + ';',
        '--dsh-content-font-size:' + fontPx.toFixed(2) + 'px;',
        '--dsh-content-font-delta:' + delta.toFixed(2) + 'px;',
        '--dsss-composer-bg:' + hexToRgba(a.composerBg || '#1e1e1e', 0.85) + ';',
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

    function SkinStudio(props) {
      const [settings, setSettings] = useState(function () { return loadSettings(); });
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
        setSettings(function (prev) {
          const next = JSON.parse(JSON.stringify(prev));
          const parts = String(path).split('.');
          let o = next;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!isObj(o[parts[i]])) o[parts[i]] = {};
            o = o[parts[i]];
          }
          o[parts[parts.length - 1]] = value;
          saveSettingsSoon(next);
          return next;
        });
      }, []);

      const update = useCallback(function (mutator) {
        setSettings(function (prev) {
          const next = JSON.parse(JSON.stringify(prev));
          mutator(next);
          saveSettingsSoon(next);
          return next;
        });
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
          if (!s.wallpaper.current || !ids.has(s.wallpaper.current)) {
            const pick = latest('wallpaper');
            if (pick) { s.wallpaper.current = pick; s.wallpaper.enabled = true; }
            else { s.wallpaper.current = null; s.wallpaper.enabled = false; }
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
      const userAvUrl = useBlobUrl(settings.chat.userAvatar);
      const aiAvUrl = useBlobUrl(settings.chat.aiAvatar);
      const introLogoUrl = useBlobUrl(settings.intro.logo);

      const music = useMusic(settings, setPath);
      useAmbience(settings, music.playing);
      const skinTargetId = useRef(null);

      /* ------------------------- 写入动态变量 ------------------------- */

      useEffect(function () {
        if (!varsRef.current) return;
        varsRef.current.textContent = varsCss(settings, { user: userAvUrl, ai: aiAvUrl });
      }, [settings, userAvUrl, aiAvUrl]);

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

      /* ------------------------- 壁纸层（body 直属，置于 UI 之下） ------------------------- */

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
          setSettings(fresh);
          setQuotesState(DEFAULT_QUOTES.slice());
          setEmojisState([]);
          setFileList([]);
          setUsage(0);
          setShowIntro(false);
          toast('已恢复到初始状态');
        }).catch(function () {
          setSettings(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
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
