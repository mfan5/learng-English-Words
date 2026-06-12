# 开口说物

一个面向英语口语学习者的生活物品词汇网站。

用户可以按厨房、客厅、卧室、浴室、办公室和街区六个生活场景学习常见物品。每张词卡包含真实图片、中英对照、音标、发音、常见搭配和生活口语例句，并可记录当天已经学会的卡片。

图片将以压缩后的常规网页尺寸保存在项目本地，避免依赖外部图片服务。

## 当前进度

- 6 个生活场景、120 张词卡
- 真实图片均下载到项目本地并压缩为 WebP
- 支持单词和例句发音
- 支持按日期记录“今日学过”

详细设计见 [产品设计文档](docs/superpowers/specs/2026-06-12-everyday-english-objects-design.md)。

## 本地使用

```bash
npm install
npm test
python -m http.server 4173
```

然后访问 `http://localhost:4173`。

图片来源与许可证记录在 `assets/images/ATTRIBUTION.json`。运行 `npm run images` 可从开放图片源补齐缺失资源，运行 `npm run verify:assets` 可检查图片完整性。
