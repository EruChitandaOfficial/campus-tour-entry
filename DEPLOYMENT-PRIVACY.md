# 部署到香港奶蛙大学-广州.com，并减少公开身份信息

本教程使用最新域名 **香港奶蛙大学-广州.com**。网页已去掉作者署名和个人联系方式；公开部署包不包含 Git、账户配置或本机路径。静态页面不收集资料、不使用第三方统计，也不需要部署在你的个人电脑上。

公开隐私保护的目标是让普通访客无法从网页、托管名称和公开注册信息直接看到你的个人信息。注册商、Cloudflare、付款机构可能仍需真实账户资料或验证，隐私服务也有披露规则，不能承诺绝对匿名。按平台要求提供准确信息，不要填写虚假注册资料。

## 1. 核验并注册中文域名

找支持 **中文 .com 国际化域名（IDN）** 的注册商，搜索：

Cloudflare 的域名注册服务目前不支持 IDN（包括其 Punycode 形式），所以这里在支持 IDN 的其他注册商购买，再接入 Cloudflare DNS 和 Pages。[Cloudflare Registrar 官方限制](https://developers.cloudflare.com/registrar/get-started/register-domain/)

```text
香港奶蛙大学-广州.com
```

如果注册商只接受 ASCII，搜索同一个域名的 Punycode：

```text
xn----4b1bljz4elweu1ac71fii5bhj9a.com
```

购买前核对首年/续费价格、是否支持该 IDN、是否提供适用的 WHOIS/RDAP 信息遮蔽或隐私/代理服务。**确认姓名也被隐藏**，不要仅凭“隐私保护”四个字推定所有字段都遮蔽。不同服务可能只替换地址/邮箱，或者由代理服务显示其注册信息，具体以服务条款为准。

不要勾选公开个人姓名、组织、邮箱等可选同意项；使用自己能长期接收验证和续费提醒的联系邮箱。保留账户验证和二次验证。

域名格式已检查，但可注册性和实际隐私服务需要在购买时确认。域名本身要付费，Pages 托管可使用 Free。

参考：[ICANN 隐私与代理服务](https://www.icann.org/en/contracted-parties/accredited-registrars/privacy-and-proxy-service-providers) · [注册数据政策](https://www.icann.org/en/contracted-parties/consensus-policies/registration-data-policy/)

## 2. 用中性项目名上传 Pages

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)，进入 **Workers & Pages**。
2. 创建应用，选择 **Pages / Direct Upload / Drag and drop**（界面名称可能随语言和版本变化）。
3. 项目名用中性名称，例如 `campus-tour-entry`，不要填真实姓名、学号、邮箱前缀或常用个人网名。若名称已占用，用中性数字后缀。
4. 上传随附 **milk-frog-pages.zip**，或者拖入 `dist` 文件夹。ZIP 根目录直接包含 `index.html`。
5. 点击 **Deploy site**，记录控制台返回的实际地址，例如 `你的项目.pages.dev`。
6. 先访问 `https://你的实际项目.pages.dev/?preview=1` 检查图和文字。去掉 `?preview=1` 检查 100% 后自动前往学校官网。

此路径无需公开 GitHub/GitLab 仓库，避免公开提交作者、邮箱和个人账号。**不要上传完整源码 ZIP、.git、测试截图、账户配置、证件或付款截图。** Pages ZIP 已经只包含公开页面需要的文件。

参考：[Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)。

## 3. 把中文域名接入 Cloudflare DNS

1. 在部署 Pages 的**同一个 Cloudflare 账户**中添加域名站点，输入：

   `xn----4b1bljz4elweu1ac71fii5bhj9a.com`

2. 选择 Free。若域名已有邮件、TXT 验证等业务，先核对并保留相关 DNS 记录。
3. Cloudflare 会显示该域名专属的 Nameservers，通常是两条。
4. 到域名注册商的 Nameservers / DNS 服务器设置，填写 Cloudflare 返回的**实际 NS**。不要使用学校官网的 NS，也不要填写示例值。
5. 若原来开启了 DNSSEC，按平台指引处理旧 DS 记录，避免更换 NS 后验证失败；接入后再设置新的 DNSSEC。
6. 等待 Cloudflare 域名状态变成 Active。

如果域名格式输入框不接受中文，统一使用上面的 Punycode。两种写法是同一域名。

## 4. 在 Pages 绑定根域名

1. 打开 **Workers & Pages → 你的 Pages 项目 → Custom domains → Set up a domain**。
2. 输入 `xn----4b1bljz4elweu1ac71fii5bhj9a.com`，完成向导。
3. Cloudflare 通常自动添加对应 DNS 记录。检查记录与项目实际地址一致：

| 类型 | 名称 | 目标 |
| --- | --- | --- |
| CNAME | @ | 你的实际项目.pages.dev |

根域名由 Cloudflare 的 CNAME flattening 处理。**目标是你自己的 Pages 地址，不是 hkust-gz.edu.cn**；学校官网跳转由页面的图片播放进度控制。

4. 若同名旧 A/AAAA/CNAME 冲突，移除或按向导调整这些冲突记录，保留无关记录。
5. 等待 Custom domain 与 HTTPS 证书为 Active，再打开：

   `https://香港奶蛙大学-广州.com/`

6. 可选 `www`：另在 Pages 中绑定 `www.xn----4b1bljz4elweu1ac71fii5bhj9a.com`，并检查 `www` CNAME 指向你的实际 Pages 地址。

**不要只添加 DNS CNAME 而跳过 Pages 的 Custom domains 绑定。** 否则可能遇到 522。根域名需要作为同账户 Cloudflare zone 接入并使用其 NS。DNS 和证书生效时间不固定。

参考：[Cloudflare Pages 自定义域名](https://developers.cloudflare.com/pages/configuration/custom-domains/)。

## 5. 上线后核对公开信息

- 打开 [ICANN Lookup](https://lookup.icann.org/)，查询 Punycode 域名，确认公开 RDAP 数据没有自己的姓名、地址、电话或私人邮箱；若有，先找注册商确认适用的遮蔽或代理服务，再分享链接。组织名等可选字段也要核对。
- 最终只分享你的中文域名。Pages 项目名保持中性；不要分享包含个人账户名的其他预览平台地址。
- 使用浏览器查看网页源代码和 Network，确认只加载同站资源，页面没有个人署名、邮箱、社交账号或开发路径。
- 不添加指向个人网站/IP、个人 GitHub 或社交账号的 DNS/网页链接。只保留真正需要的 DNS 记录。
- 以后换素材时检查 EXIF、PNG 文本等元数据。当前五张图检查到 PNG 信息字段和 EXIF 均为空。
- 教师批准信息、注册订单、账单和控制台截图留作私下存档，不上传到公开站点。

普通访客不会因为访问 Cloudflare Pages 而看到控制台登录邮箱；但这不意味着服务商不知道账户是谁。WHOIS/RDAP 遮蔽也不删除已被外部收集的历史公开数据。[ICANN Lookup 与 RDAP 说明](https://lookup.icann.org/)

## 可选：Git 自动部署

本项目可以通过私有仓库部署。若采用 Git，仍应使用不暴露身份的项目名，不将仓库或个人作者信息链接到网页。Pages 配置：Framework `None`、Build command `exit 0`、Build output directory `dist`，Root directory 设为项目在仓库中的实际相对路径。优先使用上面的直接上传方式即可，无需创建仓库。

## 常见问题

- **百分比走完前就跳转**：关闭注册商 URL 转发、Cloudflare Redirect Rules/Bulk Redirects 中额外配置的首页转发。项目没有 301/302、meta refresh 或 _redirects 跳转。
- **图片未全部加载**：进度保持 0% 是保护行为；等加载完成或刷新。图片解码失败会显示提示，不会自动离开。
- **522**：核对 Pages 中已绑定完整域名、CNAME 指向正确项目、zone 已 Active。
- **证书长时间 Pending**：核对 DNS；若有 CAA 限制，按 Cloudflare 自定义域名文档核验允许签发的 CA。
- **想更新网站**：在同一 Pages 项目创建新部署，重新上传更新后的 Pages ZIP，中文域名无需重新购买或绑定。
