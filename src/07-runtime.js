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
        if (!quotes.length) return;
        const textItems = quotes.filter(function (q) { return q && q.type === 'text'; });
        const imgItems = quotes.filter(function (q) { return q && q.type === 'image'; });
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
        const base = Math.max(1, Number(p.autoMin) || 3) * 60000;
        const schedule = function () {
          const jitter = base * (0.5 + Math.random());
          autoTimer.current = setTimeout(function () {
            if (cancelled) return;
            say();
            schedule();
          }, jitter);
        };
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
