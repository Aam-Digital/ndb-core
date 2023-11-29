/**
 * The user object which holds the name and roles of a user.
 * This is retrieved during the login process.
 */
export interface AuthUser {
  name: string;
  roles: string[];
}
