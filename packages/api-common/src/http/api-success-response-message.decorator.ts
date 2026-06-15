import { SetMetadata } from "@nestjs/common";

export const API_SUCCESS_RESPONSE_MESSAGE_KEY = "mbt:apiSuccessResponseMessage";

/** Human-readable `message` on the JSON success envelope `{ success, statusCode, message, data, meta }`. */
export const ApiSuccessResponseMessage = (message: string) =>
  SetMetadata(API_SUCCESS_RESPONSE_MESSAGE_KEY, message);
