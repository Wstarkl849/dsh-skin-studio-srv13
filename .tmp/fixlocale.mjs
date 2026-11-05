import fs from 'node:fs';
const zh = {
  meta: {
    title: 'Skin Studio 皮肤工作台',
    description: '壁纸、主题、音乐、宠物与聊天气泡的一站式美化工作台。'
  }
};
const en = {
  meta: {
    title: 'Skin Studio',
    description: 'Wallpaper, theme, music, desktop pet and chat decoration in one place.'
  }
};
fs.writeFileSync('plugin/locale/zh.json', JSON.stringify(zh, null, 2) + '\n', 'utf8');
fs.writeFileSync('plugin/locale/en.json', JSON.stringify(en, null, 2) + '\n', 'utf8');
const a = JSON.parse(fs.readFileSync('plugin/locale/zh.json', 'utf8'));
const b = JSON.parse(fs.readFileSync('plugin/locale/en.json', 'utf8'));
console.log(JSON.stringify({ zh: a.meta.title, en: b.meta.title }));