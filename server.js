const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "0.0.0.0";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const rel = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  const file = path.resolve(root, rel);

  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    res.end(data);
  });
});

server.listen(port, host, () => {
  const urls = [`http://127.0.0.1:${port}`];
  for (const net of Object.values(os.networkInterfaces())) {
    for (const item of net || []) {
      if (item.family === "IPv4" && !item.internal) urls.push(`http://${item.address}:${port}`);
    }
  }
  console.log("재난안전 커뮤니케이션 전략 가이드");
  console.log(urls.join("\n"));
});
