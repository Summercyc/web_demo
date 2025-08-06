const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const auth = require('./auth');
const authRoutes = require('./auth_routes');

const app = express();

// 初始化数据库
console.log('正在初始化数据库...');
auth.initDatabase().then(() => {
  console.log('数据库初始化完成');
}).catch((err) => {
  console.error('数据库初始化失败:', err);
});

// 启用CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// 解析JSON请求体
app.use(express.json());

// 解析URL编码的请求体
app.use(express.urlencoded({ extended: true }));

// 解析Cookie
app.use(cookieParser());

// 配置会话
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));

// 静态文件服务
app.use(express.static(path.join(__dirname)));

// 使用鉴权路由
app.use('/api/auth', authRoutes);

// 代理到阿里云API
app.use('/api/dashscope', createProxyMiddleware({
  target: 'https://dashscope.aliyuncs.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/dashscope': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    // 将Authorization头部从请求中传递到代理请求
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
  }
}));

// 启动服务器
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`- 静态文件服务: http://localhost:${PORT}`);
  console.log(`- 鉴权API: http://localhost:${PORT}/api/auth`);
  console.log(`- 阿里云API代理: http://localhost:${PORT}/api/dashscope`);
});
