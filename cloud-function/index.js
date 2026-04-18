/**
 * 阿里云函数计算 - DirectMail API代理
 * 用于解决浏览器CORS限制和安全问题
 * 
 * 部署步骤：
 * 1. 在阿里云控制台创建函数计算服务
 * 2. 创建HTTP触发器
 * 3. 配置环境变量：ACCESS_KEY_ID, ACCESS_KEY_SECRET
 * 4. 部署此函数
 * 5. 在前端配置函数URL
 */

const crypto = require('crypto');

// ============================================
// 生成阿里云API签名
// ============================================
function generateSignature(params, accessKeySecret, method = 'GET') {
  const sortedKeys = Object.keys(params).sort();
  const canonicalizedQueryString = sortedKeys
    .map(key => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join('&');

  const stringToSign = `${method}&${percentEncode('/')}&${percentEncode(canonicalizedQueryString)}`;
  const hmac = crypto.createHmac('sha1', accessKeySecret + '&');
  hmac.update(stringToSign);
  return hmac.digest('base64');
}

function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/\+/g, '%20')
    .replace(/\*/g, '%2A')
    .replace(/%7E/g, '~');
}

// ============================================
// 主处理函数
// ============================================
exports.handler = async function (request, response, context) {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json; charset=utf-8'
  };

  // 处理OPTIONS预检请求
  if (request.method === 'OPTIONS') {
    response.setStatusCode(200);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.send('');
    return;
  }

  try {
    // 解析请求体
    const body = JSON.parse(request.body.toString());
    
    const {
      toAddress,
      subject,
      htmlBody,
      fromAddress,
      fromAlias,
      region = 'cn-hangzhou',
      accessKeyId,
      accessKeySecret
    } = body;

    // 验证必填参数
    if (!toAddress || !subject || !htmlBody || !fromAddress || !accessKeyId || !accessKeySecret) {
      response.setStatusCode(400);
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.send(JSON.stringify({
        success: false,
        error: '缺少必填参数'
      }));
      return;
    }

    // 构建DirectMail API请求参数
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const requestId = crypto.randomUUID();

    const params = {
      AccessKeyId: accessKeyId,
      Action: 'SingleSendMail',
      AccountName: fromAddress,
      AddressType: 1,
      ReplyToAddress: false,
      ToAddress: toAddress,
      Subject: subject,
      HtmlBody: htmlBody,
      Format: 'JSON',
      Version: '2015-11-23',
      SignatureMethod: 'HMAC-SHA1',
      SignatureVersion: '1.0',
      SignatureNonce: requestId,
      Timestamp: timestamp
    };

    if (fromAlias) {
      params.FromAlias = fromAlias;
    }

    // 生成签名
    const signature = generateSignature(params, accessKeySecret);
    params.Signature = signature;

    // 构建请求URL
    const baseUrl = `https://dm.${region}.aliyuncs.com/`;
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    const url = baseUrl + '?' + queryString;

    // 调用阿里云DirectMail API
    const https = require('https');
    
    const result = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('解析响应失败'));
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    });

    // 返回结果
    if (result.Code && result.Code !== 'OK') {
      response.setStatusCode(200);
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.send(JSON.stringify({
        success: false,
        error: result.Message || '发送失败',
        code: result.Code
      }));
    } else {
      response.setStatusCode(200);
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.send(JSON.stringify({
        success: true,
        requestId: result.RequestId,
        message: '发送成功'
      }));
    }

  } catch (error) {
    console.error('Error:', error);
    response.setStatusCode(500);
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.send(JSON.stringify({
      success: false,
      error: error.message || '服务器内部错误'
    }));
  }
};
