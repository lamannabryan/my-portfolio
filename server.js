const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const rootDir = __dirname;
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const send = (response, statusCode, body, headers = {}) => {
  response.writeHead(statusCode, headers);
  response.end(body);
};

const resolveInsideRoot = (requestPath) => {
  const resolvedPath = path.resolve(rootDir, `.${requestPath}`);
  const rootWithSeparator = rootDir.endsWith(path.sep) ? rootDir : `${rootDir}${path.sep}`;

  if (resolvedPath !== rootDir && !resolvedPath.startsWith(rootWithSeparator)) {
    return null;
  }

  return resolvedPath;
};

const getFilePath = (pathname) => {
  if (pathname === "/" || pathname === "/index.html") {
    return path.join(rootDir, "index.html");
  }

  if (pathname.startsWith("/src/")) {
    return resolveInsideRoot(pathname);
  }

  return null;
};

const server = http.createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return send(response, 405, "Metodo nao permitido", {
      Allow: "GET, HEAD",
      "Content-Type": "text/plain; charset=utf-8",
    });
  }

  let pathname;

  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  } catch {
    return send(response, 400, "Requisicao invalida", {
      "Content-Type": "text/plain; charset=utf-8",
    });
  }

  const filePath = getFilePath(pathname);

  if (!filePath) {
    return send(response, 404, "Arquivo nao encontrado", {
      "Content-Type": "text/plain; charset=utf-8",
    });
  }

  try {
    const file = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();

    response.writeHead(200, {
      "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=86400",
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
    });

    return request.method === "HEAD" ? response.end() : response.end(file);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      return send(response, 404, "Arquivo nao encontrado", {
        "Content-Type": "text/plain; charset=utf-8",
      });
    }

    console.error(error);
    return send(response, 500, "Erro interno do servidor", {
      "Content-Type": "text/plain; charset=utf-8",
    });
  }
});

server.listen(port, host, () => {
  console.log(`Aplicacao Node.js rodando em http://localhost:${port}`);
});
