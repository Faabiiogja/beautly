/**
 * Defesa em profundidade contra CSRF em route handlers POST/PATCH/DELETE.
 * Complementa (não substitui) o cookie SameSite=Lax: valida que a requisição
 * veio da mesma origem via header Origin e, na falta deste, Sec-Fetch-Site.
 */
export function isSameOriginRequest(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin === new URL(req.url).origin;
    } catch {
      return false;
    }
  }
  // Origin pode faltar em algumas navegações same-origin; aceita apenas se
  // Sec-Fetch-Site confirmar mesma origem (ou "none" para entry manual).
  const site = req.headers.get("sec-fetch-site");
  return site === "same-origin" || site === "none";
}
