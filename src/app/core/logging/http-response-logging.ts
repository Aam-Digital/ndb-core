import { HttpStatusCode } from "@angular/common/http";

/**
 * Names for the unexpected response statuses of a database request: the message
 * text is grouped with numbers masked (see `fingerprintKey`), so a status
 * interpolated as a number would put every unexpected response into one issue.
 */
const UNEXPECTED_STATUS_NAMES: Record<number, string> = {
  [HttpStatusCode.BadRequest]: "bad request",
  [HttpStatusCode.PayloadTooLarge]: "payload too large",
  [HttpStatusCode.TooManyRequests]: "too many requests",
};

/**
 * The static message to report for an unexpected response from a database request
 * ("response", not "fetch": the same code path carries reads and writes).
 */
export function unexpectedResponseMessage(status: number): string {
  return `Unexpected DB response: ${UNEXPECTED_STATUS_NAMES[status] ?? "unnamed client error"}`;
}

/**
 * The diagnostic fields of a fetch `Response` as a plain object: a `Response`
 * itself is logged as `{}`. The request `method` tells a rejected write from a read.
 */
export function describeResponse(
  response: Response | undefined,
  method?: string,
): {
  method?: string;
  status?: number;
  statusText?: string;
  responseUrl?: string;
} {
  if (!response) {
    return { method };
  }
  return {
    method,
    status: response.status,
    statusText: response.statusText,
    responseUrl: response.url,
  };
}
