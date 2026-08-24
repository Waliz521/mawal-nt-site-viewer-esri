/** Shared NTG WMS proxy — used by Vercel (`api/wms-proxy.js`) and Vite dev middleware. */

export const NTG_WMS_ORIGIN = 'https://land.visualiser.nt.gov.au/wms/wms';

const UPSTREAM_URL_PATTERN = /https?:\/\/land\.visualiser\.nt\.gov\.au\/wms\/wms/gi;

function proxyBaseFromRequest(req) {
  const headers = req.headers ?? {};
  const host = headers['x-forwarded-host'] ?? headers.host ?? 'localhost';
  const proto = headers['x-forwarded-proto'] ?? 'http';
  return `${proto}://${host}/api/wms-proxy`;
}

function rewriteCapabilitiesXml(xml, proxyBase) {
  return xml
    .replace(UPSTREAM_URL_PATTERN, proxyBase)
    .replace(/https?:\/\/land\.visualiser\.nt\.gov\.au\/wms\/wms\?&amp;/gi, `${proxyBase}?`);
}

function queryParam(query, key) {
  const value = query?.[key] ?? query?.[key.toLowerCase()] ?? query?.[key.toUpperCase()];
  return Array.isArray(value) ? value[0] : value;
}

export async function fetchNtgWms(query, method = 'GET') {
  const url = new URL(NTG_WMS_ORIGIN);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (Array.isArray(value)) {
      for (const entry of value) url.searchParams.append(key, entry);
    } else if (value != null) {
      url.searchParams.set(key, value);
    }
  }

  return fetch(url.toString(), {
    method,
    headers: { 'User-Agent': 'MawalNTSiteViewer/1.0' },
  });
}

/** @param {import('http').IncomingMessage} req */
/** @param {import('http').ServerResponse} res */
export async function handleWmsProxy(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const requestType = queryParam(req.query, 'REQUEST');
  const proxyBase = proxyBaseFromRequest(req);

  try {
    const upstream = await fetchNtgWms(req.query, req.method);
    res.statusCode = upstream.status;
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const contentType = upstream.headers.get('content-type') ?? '';
    const isCapabilities =
      requestType === 'GetCapabilities' ||
      contentType.includes('wms_xml') ||
      contentType.includes('text/xml');

    if (isCapabilities) {
      const xml = rewriteCapabilitiesXml(await upstream.text(), proxyBase);
      res.setHeader('Content-Type', 'application/vnd.ogc.wms_xml');
      res.end(xml);
      return;
    }

    if (contentType) res.setHeader('Content-Type', contentType);

    const body = Buffer.from(await upstream.arrayBuffer());
    res.end(body);
  } catch (error) {
    console.error('WMS proxy error', error);
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'WMS upstream unavailable' }));
  }
}

/** Connect-style middleware for Vite dev server. */
export function createWmsProxyMiddleware() {
  return async (req, res, next) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      req.query = Object.fromEntries(url.searchParams.entries());
      await handleWmsProxy(req, res);
    } catch (error) {
      next(error);
    }
  };
}
