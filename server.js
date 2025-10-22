const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = 8080;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm'
};

http.createServer((req, res) => {
  let pathname = url.parse(req.url).pathname;
  
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  const ext = path.extname(pathname);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(path.join(__dirname, 'dist', pathname), (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Si fichier non trouvé, servir index.html (pour le routing SPA)
        fs.readFile(path.join(__dirname, 'dist', 'index.html'), (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end('File not found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}).listen(port);

console.log(`Server running at http://localhost:${port}/`);
console.log('Ouvrez cette URL dans votre navigateur');