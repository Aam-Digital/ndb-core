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
