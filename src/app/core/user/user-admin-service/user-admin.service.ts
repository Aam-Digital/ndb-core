import { Observable } from "rxjs";
import { Role, UserAccount } from "./user-account";

/**
 * Admin functionalities to manage users in an authentication server like Keycloak.
 */
export abstract class UserAdminService {
  /**
   * Users with this role can create and update other accounts.
   */
  static readonly ACCOUNT_MANAGER_ROLE = "account_manager";

  /**
   * Get the user account details of the user linked to the given entity.
   * @param userEntityId The entity id of the "profile" linked with the account
   * @returns The user account details or `null` of no user is found
   * @throws {@link UserAdminApiError} if an error occurs (but not if no user is found)
   */
  abstract getUser(userEntityId: string): Observable<UserAccount>;

  /**
   * Create a user account with the given name and email
   * @param userEntityId The entity id of the "profile" linked with the account
   * @param email
   * @param roles
   * @returns The user account created
   * @throws {@link UserAdminApiError} status=409 if email already exists
   */
  abstract createUser(
    userEntityId: string,
    email: string,
    roles: Role[],
  ): Observable<UserAccount>;

  /**
   * Update the user with the given id
   * @param userAccountId The user account id of the authentication server (not the profile entity id)
   * @param updatedUser see {@link https://www.keycloak.org/docs-api/19.0.2/rest-api/index.html#_userrepresentation}
   */
  abstract updateUser(
    userAccountId: string,
    updatedUser: Partial<UserAccount>,
  ): Observable<{ userUpdated: boolean }>;

  /**
   * Delete a user with the given id
   * @param userEntityId The entity id of the "profile" linked with the account
   */
  abstract deleteUser(
    userEntityId: string,
  ): Observable<{ userDeleted: boolean }>;

  /**
   * Get all available roles of the server
   */
  abstract getAllRoles(): Observable<Role[]>;

  /**
   * Get all users registered in the authentication server (Keycloak) for this realm
   * @returns An array of all user accounts with their details, including only non-technical roles
   */
  abstract getAllUsers(): Observable<UserAccount[]>;
}

export class UserAdminApiError extends Error {
  /**
   * The HTTP status code of the error.
   * - 404: Not Found (e.g. user not found)
   * - 409: Conflict (e.g. email already exists)
   * - 500: Internal Server Error
   */
  status: number;

  constructor(status: number, message?: string) {
    super(message);
    this.name = "UserAdminApiError";
    // Set the prototype explicitly to maintain the correct prototype chain (see https://medium.com/@Nelsonalfonso/understanding-custom-errors-in-typescript-a-complete-guide-f47a1df9354c)
    Object.setPrototypeOf(this, UserAdminApiError.prototype);

    this.status = status;
    if (!message) {
      this.message = this.generateDefaultMessage(status);
    }
  }

  private generateDefaultMessage(status: number) {
    switch (status) {
      case 404:
        return $localize`:User API error:The entry does not exist.`;
      case 409:
        return $localize`:User API error:The email address is already in use. Only one account is allowed per email address.`;
      case 500:
        return $localize`:User API error:There was an internal error at the user management server. Please try again later or reach out to your technical support team.`;
      default:
        return `Unexpected error with status code ${status}`;
    }
  }
}
