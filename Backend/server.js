const https = require('https');
const http = require('http');
const fs = require('fs');

const app = require('./index');

const opciones = {
  key: fs.readFileSync('./certs/localhost.key'),
  cert: fs.readFileSync('./certs/localhost.crt'),
};

https.createServer(opciones, app).listen(3000, () => {
  console.log('✅ HTTPS Server running on port 3000');
});

http.createServer((req, res) => {
  res.writeHead(301, {
    Location: 'https://localhost:3000' + req.url
  });
  res.end();
}).listen(3001);