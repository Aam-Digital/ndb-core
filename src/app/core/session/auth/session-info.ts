/**
 * The session info which holds the name and roles of a user.
 * This is retrieved during the login process.
 */
export interface SessionInfo {
  name: string;
  roles: string[];
}
