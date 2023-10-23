/**
 * The user object which holds the name and roles of a user.
 * This is retrieved during the login process.
 */
export interface AuthUser {
  name: string;
  roles: string[];

  /**
   * if the user is marked as "incognity" it will not be tracked in usage analytics
   * and not expect to have a "User" entity.
   */
  incognito?: boolean;
}
