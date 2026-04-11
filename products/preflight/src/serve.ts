/**
 * Node.js HTTP server that wraps the Worker fetch handler.
 * Used for local deployment behind nginx + Cloudflare Tunnel.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

// Import the Worker default export
import worker from "./index.js";

const PORT = parseInt(process.env.PORT ?? "8030", 10);

async function nodeToFetchRequest(req: IncomingMessage): Promise<Request> {
  const protocol = req.headers["x-forwarded-proto"] ?? "http";
  const host = req.headers.host ?? `localhost:${PORT}`;
  const url = `${protocol}://${host}${req.url ?? "/"}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let body: string | undefined;
  if (hasBody) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    body = Buffer.concat(chunks).toString("utf-8");
  }

  return new Request(url, {
    method: req.method ?? "GET",
    headers,
    body,
  });
}

async function fetchResponseToNode(
  fetchRes: Response,
  res: ServerResponse,
): Promise<void> {
  res.writeHead(fetchRes.status, Object.fromEntries(fetchRes.headers.entries()));
  if (fetchRes.body) {
    const reader = fetchRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}

const server = createServer(async (req, res) => {
  try {
    const fetchReq = await nodeToFetchRequest(req);
    const fetchRes = await worker.fetch(fetchReq, {
      ENVIRONMENT: process.env.ENVIRONMENT ?? "production",
    });
    await fetchResponseToNode(fetchRes, res);
  } catch (err) {
    console.error("Request error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Preflight listening on 127.0.0.1:${PORT}`);
});
