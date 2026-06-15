/** Swagger UI is off in production unless explicitly enabled. */
export function isSwaggerEnabled(): boolean {
  if (process.env.SWAGGER_ENABLED === "true") return true;
  if (process.env.SWAGGER_ENABLED === "false") return false;
  return process.env.NODE_ENV !== "production";
}
