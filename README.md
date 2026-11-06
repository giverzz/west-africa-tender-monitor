# 西非工程机会监测

加纳、多哥、尼日利亚及多边机构（世界银行、非洲开发银行、UNGM、DGMarket）的工程与能源招标机会池。

- 网站：https://giverzz.github.io/west-africa-tender-monitor/
- 每日更新：07:30 Africa/Accra（UTC+0），由 GitHub Actions 运行（`.github/workflows/daily.yml`）
- 主存储：`data/master.json`；网站数据：`site/data.json`（由 `tools/build.mjs` 生成，含终态 72 小时清理）

| 脚本 | 作用 |
|---|---|
| `tools/ghaneps-fetch.mjs` | 读取 GHANEPS 当前招标列表 |
| `tools/wb-fetch.mjs` | 读取世界银行采购公告 API（加纳 / 多哥 / 尼日利亚） |
| `tools/auto-ingest.mjs` | 云端自动并入新公告、刷新核验日期、写入来源状态 |
| `tools/build.mjs` | 计算状态、清理终态满 72 小时的记录、生成网站数据 |
| `tools/pages.mjs` | 生成 GitHub Pages 站点 |
| `tools/dgmarket-fetch.mjs` | 本机 ego 浏览器会员会话读取 DGMarket（不在云端运行） |

DGMarket 会员公告、中文标题翻译和其他来源的逐条筛查由本机 Claude 定时任务完成，并推送到本仓库。
