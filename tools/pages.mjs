// 生成 GitHub Pages 站点：把 site/index.html（与 claude.ai 版相同的页面片段）包成完整文档，连同 data.json 输出到 public/。
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const body = fs.readFileSync(new URL('site/index.html', root), 'utf8');
const head = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  + '<style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>';
fs.mkdirSync(new URL('public/', root), { recursive: true });
fs.writeFileSync(new URL('public/index.html', root), head + body + '</body></html>');
fs.copyFileSync(new URL('site/data.json', root), new URL('public/data.json', root));
fs.writeFileSync(new URL('public/.nojekyll', root), '');
console.log('public/ ready');
