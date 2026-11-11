// 读取指定 DGMarket 公告页摘要（沿用 ego 浏览器已登录会话，不处理验证码）。
// 运行：ego-browser nodejs -e "globalThis.DG_IDS='id1,id2'; await import('file:///.../tools/dgmarket-detail.mjs')"
const OUT = 'C:/Users/31033/.claude/scheduled-tasks/west-africa-tender-daily/data/dgmarket-details-' + new Date().toISOString().slice(0, 10) + '.json';
const ids = String(globalThis.DG_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
const fs = await import('node:fs/promises');
const task = await taskSpace('dgmarket-detail');
const page = task.page('p1');
const out = {};
for (const id of ids) {
  await page.goto(`https://www.dgmarket.com/tenders/np-notice.do?keywords=&noticeId=${id}`, { timeout: 60000 });
  const r = await page.evaluate(() => ({
    blocked: /security verification|Just a moment/i.test(document.title),
    text: document.body.innerText.replace(/\n{2,}/g, '\n').slice(0, 6000),
    links: [...document.querySelectorAll('a[href^="http"]')].map((a) => a.href).filter((h) => !/dgmarket\.com|facebook|twitter|linkedin/i.test(h)).slice(0, 25),
  }));
  out[id] = r;
}
await fs.writeFile(OUT, JSON.stringify(out, null, 1), 'utf8');
console.log('详情读取完成 ' + ids.length + ' 条 -> ' + OUT);
