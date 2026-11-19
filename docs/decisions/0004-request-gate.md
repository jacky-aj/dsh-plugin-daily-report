# 0004 路由走 DSH 的请求校验

## 状态

已采用

## 背景

插件的 17 个 HTTP 路由都用 `ctx.webServer.register({ kind: "exact" })` 挂载。`exact` 注册**优先于** DSH 的 `/api` 前缀校验，所以这些路由从来没有经过宿主的访问检查。

原来的唯一检查是：

```js
if (!isLoopback(req)) return sendError(res, 403, ...);
```

`isLoopback` 判断的是 TCP 对端地址。用户在浏览器里打开的任意网页，请求这些路由时对端地址**就是** `127.0.0.1`，所以这个检查拦不住：

- 恶意页面可以读取设置、导出日报、触发扫描和生成、删除缓存、还原配置
- 部署在反向代理或隧道后面时，反过来又会误伤正常访问

## 决策

改为询问宿主自己的校验：

```js
const refused = ctx.connection.requestRejection(req); // 401 | 403 | undefined
if (refused !== undefined) return sendRefusal(res, refused);
```

- `inject` 增加 `connection`
- 校验放在 `registerRoute` 的包装层里，**不是**逐个 handler 复制
- 校验通过的语义由宿主决定：Host/Origin 围栏 + 浏览器登录
- 宿主没有该服务时（更老的 DSH），退回原来的 `isLoopback` 规则，行为不变
- 宿主校验抛异常时按 403 处理（失败关闭），不放开

## 为什么放在包装层

逐个 handler 加，等于 17 份重复的准入规则，新增路由很容易漏。包装层只有一处，且 `registerRoute` 是唯一注册入口。

与此同时删掉了 17 份重复的 `isLoopback` 判断：准入规则只有一条，不会再出现「两套规则各自演化」。

## 取舍

- 非 loopback 部署（反向代理 / LAN 主机名）不再被硬拦，改为由宿主的 `trustedHosts` 决定 —— 与 DSH 自己的 `/api` 一致。这是行为变化，但方向正确：访问策略属于部署配置，不属于插件。
- 401 表示需要登录，403 表示来源不被信任；两者都返回结构化 JSON 错误。

## 影响

- `index.js`：`inject`、`requestGate`、`refusedStatus`、`sendRefusal`、`registerRoute`
- 测试：`test/integration/host.spec.mjs` 增加 403 / 401 / 抛异常 / 放行远端 / 无服务回退五种情况

## 背景来源

GitHub 插件市场 `awesome-dsh-plugin` 的收录评审意见：条目描述因此补了一句说明，修掉后可以删掉那句并重新提 PR。
