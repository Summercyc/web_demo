const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// 启用CORS
app.use(cors());

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
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`代理服务器运行在 http://localhost:${PORT}`);
});