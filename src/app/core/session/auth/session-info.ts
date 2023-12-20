/**
 * The session info which holds information about the currently logged-in user.
 * This is retrieved during the login process and will always be present once state changes to `LOGGED_IN`.
 */
export interface SessionInfo {
  /**
   * ID of an in-app entity.
   * This can be used to retrieve an ID to which the logged-in user is linked.
   *
   * This is either a full ID or (e.g. Child:123) or only the last part.
   * In the later case it refers to the `User` entity.
   */
  entityId?: string;
  /**
   * a list of roles the logged-in user hold.
   */
  roles: string[];
}
