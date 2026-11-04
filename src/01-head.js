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
