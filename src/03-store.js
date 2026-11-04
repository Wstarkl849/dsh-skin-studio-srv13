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
