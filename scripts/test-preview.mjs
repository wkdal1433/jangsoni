import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

export async function serveTestPreview(extraPages = {}) {
  const html = await readFile(new URL('../index.html', import.meta.url));
  const pages = new Map([['/', html], ['/index.html', html], ...Object.entries(extraPages)]);
  const server = createServer((request, response) => {
    const content = pages.get(request.url);
    if (content === undefined) { response.writeHead(404); response.end(); return; }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(content);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  server.unref();
  const origin = 'http://127.0.0.1:' + server.address().port;
  return {
    url: origin + '/index.html', origin,
    matches: url => new URL(url).origin === origin,
    close: () => new Promise(resolve => server.close(resolve)),
  };
}
