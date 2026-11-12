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
