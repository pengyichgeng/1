# Express 嵌套路由问题修复说明

## 问题描述

在 Node.js v22+ 环境中，当使用多层嵌套的 Express 路由时，`req.baseUrl` 和 `req.originalUrl` 的处理出现问题。具体表现为：
- 在深层嵌套路由中，`req.originalUrl` 可能无法正确保留原始请求路径
- `req.baseUrl` 可能无法正确累计所有父级路径

## 修复方案

### 修改的文件
- `lib/application.js`

### 修复内容
在 `app.handle` 方法中添加了对 `req.originalUrl` 的初始化代码：

```javascript
// set originalUrl if not already set (important for nested routes)
if (req.originalUrl === undefined) {
  req.originalUrl = req.url;
}
```

### 修复原理
- 当请求首次进入应用时，确保 `req.originalUrl` 被正确设置
- 对于嵌套应用的情况，通过检查 `req.originalUrl` 是否已经存在，避免重复设置
- 这样在整个请求生命周期中，无论经过多少层嵌套路由，`req.originalUrl` 始终保留原始请求路径

## 添加的测试

在 `test/req.baseUrl.js` 中添加了两个新的测试用例：

1. **5 层嵌套路由测试**：验证多层嵌套路由中 `req.baseUrl`、`req.originalUrl` 等属性的正确性
2. **originalUrl 保留测试**：验证在 6 层嵌套路由的每一层中，`req.originalUrl` 都能正确保留原始值

## 验证方法

运行测试套件：

```bash
npm test
```

特别关注 `req.baseUrl` 相关的测试，确保所有测试（包括新添加的嵌套路由测试）都能通过。

## 兼容性说明

此修复：
- 保持了向后兼容性，因为只在 `req.originalUrl` 未定义时才设置它
- 不会影响 `req.route` 的中间件元数据收集功能，因为我们没有修改与路由处理相关的代码
- 适用于 Express 5.x 版本
