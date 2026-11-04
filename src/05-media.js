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
