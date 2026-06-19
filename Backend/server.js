const https = require('https');
const http = require('http');
const fs = require('fs');
const app = require('./app');

const opciones = {
    key: fs.readFileSync('certs/localhost.key'),
    cert: fs.readFileSync('certs/localhost.crt'),
};

https.createServer(opciones, app).listen(443, () => {
    console.log('✅HTTPS Server running on port 443');
});


http.createServer((req, res) => {
    res.writeHead(301, 
        { Location: 'https://' + req.headers.host + req.url });
    res.end();
}).listen(80, () => {
    console.log('🔄HTTP Server running on port 80');
} );