/** Errors use the shared envelope: `{ success: false, statusCode, error: { code, message, fieldErrors? }, meta }`. */
export const API_RESPONSE_400 = {
  status: 400,
  description:
    "Bad request (envelope: success=false, error.code typically BAD_REQUEST; validation messages in error.fieldErrors when present)",
} as const;

export const API_RESPONSE_401 = {
  status: 401,
  description: "Unauthorized (envelope: error.code UNAUTHORIZED)",
} as const;

export const API_RESPONSE_500 = {
  status: 500,
  description: "Internal server error (envelope: error.code INTERNAL_SERVER_ERROR)",
} as const;
