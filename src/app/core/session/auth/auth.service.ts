import { AuthUser } from "../session-service/auth-user";

/**
 * Abstract class that handles user authentication and password change.
 * Implement this for different authentication providers.
 * See {@link AuthProvider} for available options.
 */
export abstract class AuthService {
  /**
   * Authenticate a user with credentials.
   * @param username The username of the user
   * @param password The password of the user
   * @returns Promise that resolves with the user if the login was successful, rejects otherwise.
   */
  abstract authenticate(username: string, password: string): Promise<AuthUser>;

  /**
   * Authenticate a user without credentials based on a still valid session.
   * @returns Promise that resolves with the user if the session is still valid, rejects otherwise.
   */
  abstract autoLogin(): Promise<AuthUser>;

  /**
   * Add headers to requests send by PouchDB if required for authentication.
   * @param headers the object where further headers can be added
   */
  abstract addAuthHeader(headers: any);

  /**
   * Clear the local session of the currently logged-in user.
   */
  abstract logout(): Promise<void>;
}
