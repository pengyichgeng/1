'use strict';

var express = require('./');

// 创建一个嵌套多层路由的应用
var app = express();

var level1 = express.Router();
var level2 = express.Router();
var level3 = express.Router();
var level4 = express.Router();
var level5 = express.Router();

// 一个记录请求信息的中间件
function logRequest(name) {
  return function(req, res, next) {
    console.log(`[${name}]`);
    console.log(`  req.originalUrl: ${req.originalUrl}`);
    console.log(`  req.baseUrl: ${req.baseUrl}`);
    console.log(`  req.url: ${req.url}`);
    console.log(`  req.path: ${req.path}`);
    next();
  };
}

// 嵌套路由配置
level5.get('/test', logRequest('Level 5'), function(req, res) {
  res.json({
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    url: req.url,
    path: req.path,
    params: req.params
  });
});

level4.use('/level5', logRequest('Level 4'), level5);
level3.use('/level4', logRequest('Level 3'), level4);
level2.use('/level3', logRequest('Level 2'), level3);
level1.use('/level2', logRequest('Level 1'), level2);
app.use('/level1', logRequest('App'), level1);

// 简单的测试路由
app.get('/simple', function(req, res) {
  res.json({
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    url: req.url,
    path: req.path
  });
});

console.log('Express app created with 5 levels of nested routes');
console.log('Test endpoints:');
console.log('  GET /simple - Simple test');
console.log('  GET /level1/level2/level3/level4/level5/test - Nested test');

module.exports = app;
