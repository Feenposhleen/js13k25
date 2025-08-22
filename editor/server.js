const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 7362;
const HOST = 'localhost';
// Serve files from the `public` subfolder instead of the script's directory
const ROOT_DIR = path.join(__dirname, 'public');
const DRAWABLES_PATH = path.join(__dirname, '..', 'src', 'core', 'assets', 'drawables.gen.ts');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function safeJoin(base, target) {
  const resolved = path.resolve(base, '.' + path.sep + target);
  if (!resolved.startsWith(path.resolve(base))) {
    return null;
  }
  return resolved;
}

function send404(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Not found');
}

function send500(res, err) {
  res.statusCode = 500;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Server error: ' + (err && err.message ? err.message : String(err)));
}

const OPEN_MARKER = '/*GEN*/';
const CLOSE_MARKER = '/*/GEN*/';

function findGenRegion(content) {
  const i = content.indexOf(OPEN_MARKER);
  if (i === -1) return null;
  const j = content.indexOf(CLOSE_MARKER, i + OPEN_MARKER.length);
  if (j === -1) return null;
  return {
    before: content.slice(0, i),
    inner: content.slice(i + OPEN_MARKER.length, j),
    after: content.slice(j + CLOSE_MARKER.length),
    startIdx: i,
    endIdx: j + CLOSE_MARKER.length
  };
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url || '', true);
  const pathname = parsed.pathname || '/';

  // GET /drawables -> return JSON parsed from the section between the markers
  if (req.method === 'GET' && (pathname === '/drawables' || pathname === '/drawables/')) {
    fs.readFile(DRAWABLES_PATH, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          send404(res);
        } else {
          send500(res, err);
        }
        return;
      }
      const region = findGenRegion(data);
      if (!region) {
        send404(res);
        return;
      }
      let parsedJson;
      try {
        const trimmed = region.inner.trim();
        parsedJson = trimmed === '' ? {} : JSON.parse(trimmed);
      } catch (e) {
        send500(res, new Error('Invalid JSON inside GEN region: ' + e.message));
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      // return pretty-printed JSON
      res.end(JSON.stringify(parsedJson, null, 2));
    });
    return;
  }

  // POST /drawables -> replace the JSON inside the GEN markers with pretty-printed JSON (no extra leading/trailing newlines inside the markers)
  if (req.method === 'POST' && (pathname === '/drawables' || pathname === '/drawables/')) {
    let size = 0;
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB limit
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_SIZE) {
        res.statusCode = 413;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Payload too large');
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8').trim();
      let obj;
      try {
        obj = body === '' ? {} : JSON.parse(body);
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Invalid JSON: ' + e.message);
        return;
      }

      const innerPretty = JSON.stringify(obj, null, 2); // pretty-printed with 2-space indent, no extra leading/trailing newlines

      // ensure destination directory exists
      fs.mkdir(path.dirname(DRAWABLES_PATH), { recursive: true }, (mkErr) => {
        if (mkErr) {
          send500(res, mkErr);
          return;
        }

        fs.readFile(DRAWABLES_PATH, 'utf8', (rErr, data) => {
          let newContent;
          if (rErr) {
            if (rErr.code === 'ENOENT') {
              // file doesn't exist -> create it with the GEN region
              newContent = OPEN_MARKER + '\n' + innerPretty + '\n' + CLOSE_MARKER + '\n';
            } else {
              send500(res, rErr);
              return;
            }
          } else {
            const region = findGenRegion(data);
            if (region) {
              // replace inner region; keep a newline between marker and content for readability,
              // but the innerPretty itself has no leading/trailing blank lines
              newContent = region.before + OPEN_MARKER + innerPretty + CLOSE_MARKER + region.after;
            } else {
              // markers not found -> append them at the end with a separating newline
              const sep = data.endsWith('\n') ? '' : '\n';
              newContent = data + sep + OPEN_MARKER + '\n' + innerPretty + '\n' + CLOSE_MARKER + '\n';
            }
          }

          fs.writeFile(DRAWABLES_PATH, newContent, 'utf8', (wErr) => {
            if (wErr) {
              send500(res, wErr);
              return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: true, path: path.relative(process.cwd(), DRAWABLES_PATH) }));
          });
        });
      });
    });
    req.on('error', (err) => {
      send500(res, err);
    });
    return;
  }

  // Serve files and directory listing from the public subfolder
  const fsPath = safeJoin(ROOT_DIR, pathname);
  if (!fsPath) {
    send404(res);
    return;
  }

  fs.stat(fsPath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        send404(res);
      } else {
        send500(res, err);
      }
      return;
    }

    if (stats.isDirectory()) {
      // try to serve index.html if present
      const indexPath = path.join(fsPath, 'index.html');
      fs.stat(indexPath, (iErr, iStats) => {
        if (!iErr && iStats.isFile()) {
          // serve index.html
          res.statusCode = 200;
          res.setHeader('Content-Type', MIME['.html'] || 'text/html; charset=utf-8');
          fs.createReadStream(indexPath).pipe(res);
          return;
        }

        // directory listing
        fs.readdir(fsPath, { withFileTypes: true }, (rErr, entries) => {
          if (rErr) {
            send500(res, rErr);
            return;
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          const list = entries.map(e => {
            const name = e.name + (e.isDirectory() ? '/' : '');
            return name;
          }).join('\n');
          res.end(list);
        });
      });
      return;
    }

    if (stats.isFile()) {
      const ext = path.extname(fsPath).toLowerCase();
      const contentType = MIME[ext] || 'application/octet-stream';
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      const stream = fs.createReadStream(fsPath);
      stream.on('error', (sErr) => send500(res, sErr));
      stream.pipe(res);
      return;
    }

    // not a file or directory
    send404(res);
  });
});

server.on('error', (err) => {
  // log listen errors (EADDRINUSE, EACCES, etc.)
  console.error('Server error:', err && err.message ? err.message : String(err));
  process.exitCode = 1;
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err && err.stack ? err.stack : String(err));
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason && reason.stack ? reason.stack : String(reason));
});

server.listen(PORT, HOST, () => {
  console.log(`Editor hosted at http://${HOST}:${PORT}/`);
  console.log(`GET  /drawables -> reads ${DRAWABLES_PATH}`);
  console.log(`POST /drawables -> writes ${DRAWABLES_PATH}`);
  console.log(`Serving files from ${ROOT_DIR}`);
});