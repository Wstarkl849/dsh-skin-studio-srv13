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
