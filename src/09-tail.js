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
