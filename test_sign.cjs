const crypto = require('crypto');
const https = require('https');

const CA_KEY = '89541443007807288657755311869534';
const CA_SECRET = 'dfkcY1c3sfuw0Cii9DWjOUO3iQy2hqlDxyvDXd1oVMxwYAJSgeB6phO8eW1dfuwX';

function md5Base64(payload) {
  var hash = crypto.createHash('md5').update(payload, 'utf8').digest();
  return Buffer.from(hash).toString('base64');
}

function generateSignature(method, url, timestamp, body) {
  var dataSign = md5Base64(body || '');
  var stringToSign = [method, url, timestamp, dataSign].join('\n');
  return crypto.createHmac('sha256', CA_SECRET).update(stringToSign, 'utf8').digest('base64');
}

// 测试签名生成
var ts = Date.now().toString();
var pk = '4e6e9132b5f04d8f9f7c9e8a5b3d1f2a';
var apiUrl = 'https://gdtv-api.gdtv.cn/api/tv/v2/tvChannel/' + pk;
var sig = generateSignature('GET', apiUrl, ts, '');
console.log('Timestamp:', ts);
console.log('DataSign (empty string md5 base64):', md5Base64(''));
console.log('Signature:', sig);

var url = new URL(apiUrl + '?tvChannelPk=' + pk);
var opts = {
  hostname: url.hostname,
  path: url.pathname + url.search,
  method: 'GET',
  headers: {
    'x-itouchtv-ca-key': CA_KEY,
    'x-itouchtv-ca-signature': sig,
    'x-itouchtv-ca-timestamp': ts,
    'x-itouchtv-client': 'WEB_PC',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://www.gdtv.cn/',
    'Accept': 'application/json',
  }
};

var req = https.get(opts, function(res) {
  var chunks = [];
  res.on('data', function(c) { chunks.push(c); });
  res.on('end', function() {
    var body = Buffer.concat(chunks).toString('utf-8');
    console.log('HTTP Status:', res.statusCode);
    console.log('Response:', body.substring(0, 500));
  });
});
req.on('error', function(e) { console.log('Error:', e.message); });
