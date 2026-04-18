/**
 * 本地测试服务器 - 用于测试云函数逻辑
 * 仅在开发环境使用
 */

const express = require('express');
const cors = require('cors');
const cloudFunction = require('./index.js');

const app = express();
const PORT = 3001;

// 启用CORS
app.use(cors());
app.use(express.json());

// 模拟云函数调用
app.post('/sendmail', async (req, res) => {
  // 构造模拟的请求对象
  const mockRequest = {
    method: 'POST',
    body: Buffer.from(JSON.stringify(req.body))
  };

  // 构造响应对象
  const mockResponse = {
    statusCode: 200,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    setStatusCode(code) {
      this.statusCode = code;
    },
    send(data) {
      res.status(this.statusCode)
        .set(this.headers)
        .send(data);
    }
  };

  // 调用云函数
  await cloudFunction.handler(mockRequest, mockResponse, {});
});

app.listen(PORT, () => {
  console.log(`本地测试服务器运行在 http://localhost:${PORT}`);
  console.log('测试端点: POST http://localhost:3001/sendmail');
});
