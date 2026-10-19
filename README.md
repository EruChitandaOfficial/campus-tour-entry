# 香港奶蛙大学（广州）

学生趣味创作 · 非官方网站。

按最新要求实现：**纯色空白背景 → 五张提供的 PNG 原图移动并依次切换 → 简体/繁体文字 → 百分比进度条 → 达到 100% 后自动前往学校官网**。没有校徽页头、装饰卡片或额外插画。

- 简体：奶蛙带你参观港科广
- 繁体：奶蛙帶你參觀港科廣
- 目标：https://www.hkust-gz.edu.cn/
- 自定义域名：香港奶蛙大学-广州.com
- DNS / Punycode：`xn----4b1bljz4elweu1ac71fii5bhj9a.com`

## 本地运行

安装 Node.js 20 或更新版本，在项目目录运行：

```sh
npm start
```

正常模式：http://127.0.0.1:4173/

预览模式：http://127.0.0.1:4173/?preview=1 （播放动画但暂停自动跳转）。

运行不需要安装依赖、不需要构建。请使用 HTTP 静态服务器，不能双击 HTML 以 file:// 方式运行 ES Modules。

## 动画与跳转

五张 PNG 文件原样复制，按顺序播放，每张约 0.8 秒；切换前进行短暂淡入淡出，配合小幅左右移动、上下浮动与旋转。所有图片 decode 成功后才开始四秒可见时间轴。图片与进度共用时间轴，最后一张播放完整后达到 100%，再保留最终画面至少 150ms 后自动跳转。

后台停留不计时；长帧最多计入 100ms，因此网络慢、切换标签、设备卡顿时，总等待时间可能超过四秒。图片加载失败时停止自动跳转，提示刷新并提供手动官网链接。

保留暂停自动跳转和手动按钮；手动按钮在播放完整后才可用。无 JavaScript 时提供官网链接。遵循系统深色模式，背景仍是纯色；减弱动态模式关闭位移、旋转和淡化，保留五张图切换和完整四秒时长。返回缓存恢复时暂停自动跳转，避免循环离开。

## 素材顺序

| 发布文件 | 原素材名称 |
| --- | --- |
| assets/frame-01.png | 香港科大广州欢乐吉祥物.png |
| assets/frame-02.png | 开心红鸟抱肚大笑.png |
| assets/frame-03.png | 红色胖鸟欢笑抱肚贴纸.png |
| assets/frame-04.png | 红色圆滚滚鸟形吉祥物贴纸-2.png |
| assets/frame-05.png | 欢笑红鸟吉祥物 PNG-1.png |

五张图均为提供的 1024×1536 PNG 原图，未重绘、裁剪或改变图片内容；发布文件使用中性英文名，原桌面路径不写入网页。已检查 PNG 信息字段和 EXIF，没有作者或定位信息。

## 部署与公开身份保护

请按 [DEPLOYMENT-PRIVACY.md](DEPLOYMENT-PRIVACY.md) 操作，文档包含中文域名注册、Cloudflare Pages 拖拽上传、DNS、HTTPS，以及公开身份检查。

**只上传 dist/ 或 milk-frog-pages.zip。** 不需要公开 Git 仓库，也不需要公开本地源码包。部署目录仅有网页、样式、脚本、原素材和 Cloudflare 响应头，不包含本机路径、账户名称、邮箱、Git 元数据或作者署名。

域名格式详见 [DOMAIN.md](DOMAIN.md)。免费 Pages 托管不包含域名注册、续费。尚未执行你的 Cloudflare 账户登录、域名购买或 DNS 变更。

## 文件

```text
dist/                     # 公开部署目录
  index.html              # 简繁文案、五张图与百分比进度条
  styles.css              # 纯色背景、响应式、深色模式
  app.js                  # 图片解码、移动切换、导航与暂停
  timeline.js             # 4000ms 可见时间轴与切换状态
  _headers                # CSP 等安全响应头
  assets/frame-01.png ... frame-05.png
scripts/serve.mjs         # 仅绑定本机的开发服务器
tests/                   # 时间轴与浏览器测试
DEPLOYMENT-PRIVACY.md     # 部署和公开身份保护教程
```

## 测试

无需额外依赖：`npm test`。

浏览器验收：先 `npm start`，在另一终端 `npm install`，再 `npm run test:browser`；默认使用已安装的独立无头 Chrome，也可通过 `BROWSER_CHANNEL=msedge` 使用 Edge。

测试涵盖图片按顺序播放及位移、慢图加载门槛、坏图保护、100% 后的自动和手动跳转、后台事件仿真、响应式、深色模式、减弱动态、键盘与无 JavaScript。目标官网请求由测试拦截，不测试对方官网内部功能。

## 自定义

- 文案：dist/index.html。
- 颜色与尺寸：dist/styles.css。
- 时长和目标：dist/timeline.js 的 DURATION_MS、DESTINATION。
- 素材：替换 dist/assets/frame-01.png 至 frame-05.png；如改变数量，同步 index.html 的图片元素。
- 动画幅度与切换：timeline.js 的 slideAt()。

不要配置服务器端 301/302、注册商 URL 转发或 meta refresh，否则可能在图片播放完成前离开。

## GitHub 提交隐私

这份副本从干净目录创建，不继承旧 Git 历史。提交作者使用 Campus Project 和保留的 example.invalid 邮箱，不关联个人姓名或真实邮箱。未带入托管账户元数据、系统隐藏文件、测试环境报告或截图。

本项目按发布者要求公开源码。中性提交信息避免直接写入个人姓名、真实邮箱和本机信息，但公开仓库仍关联所属 GitHub 账户，不提供账户匿名。公开网站只发布 dist/。
