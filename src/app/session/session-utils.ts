/**
 * JSON interface as returned by Keycloak in the access_token.
 */
export interface ParsedJWT {
  // keycloak user ID
  sub: string;
  // keycloak `exact_username` attribute
  username: string;
  // email of keycloak user
  email: string;
  // roles according to couchdb format
  "_couchdb.roles": string[];
}

/**
 * Parses and returns the payload of a JWT into a JSON object.
 * For me info see {@link https://jwt.io}.
 * @param token a valid JWT
 */
export function parseJwt(token): ParsedJWT {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );
  return JSON.parse(jsonPayload);
}
