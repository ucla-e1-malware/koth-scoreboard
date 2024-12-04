const http = require('http');
const fs = require('fs');
const path = '/king.txt';

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('File not found');
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Internal server error');
                }
            } else {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(data);
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
});

const PORT = 9999;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
