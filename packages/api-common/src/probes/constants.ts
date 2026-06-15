import { RequestMethod } from "@nestjs/common";

export const PROBES_ROUTE_PATHS = [
  "",
  "health",
  "startUpProbe",
  "livenessProbe",
  "readinessProbe",
] as const;

export const PROBES_GLOBAL_PREFIX_EXCLUDE = PROBES_ROUTE_PATHS.map((path) => ({
  path,
  method: RequestMethod.GET,
}));
