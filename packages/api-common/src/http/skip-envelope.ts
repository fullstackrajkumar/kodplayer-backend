/**
 * Paths that must return raw bodies (k8s probes, root, Swagger UI / OpenAPI).
 */
export function shouldSkipHttpEnvelope(pathFromUrl: string): boolean {
  const path = pathFromUrl.split("?")[0] || "/";
  if (path === "/" || path === "") {
    return true;
  }
  if (path.includes("/docs")) {
    return true;
  }
  return /^\/(health|startUpProbe|livenessProbe|readinessProbe)\/?$/.test(path);
}
