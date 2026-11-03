import { NotPermittedError } from "#src/app/core/permissions/not-permitted.error";
import { inject } from "@angular/core";
import { Observable } from "rxjs";
import { Role, UserAccount } from "./user-account";
import { SessionSubject } from "../../session/auth/session-info";

/**
 * Admin functionalities to manage users in an authentication server like Keycloak.
 */
export abstract class UserAdminService {
  /**
   * Users with this role can create and update other accounts.
   */
  static readonly ACCOUNT_MANAGER_ROLE = "account_manager";

  private readonly sessionInfo = inject(SessionSubject, { optional: true });

  /**
   * Whether the current user has the role required to manage accounts
   * (e.g. list, create, update or delete accounts) on the authentication server.
   */
  canManageAccounts(): boolean {
    return (
      this.sessionInfo?.value?.roles?.includes(
        UserAdminService.ACCOUNT_MANAGER_ROLE,
      ) ?? false
    );
  }

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
  ): Observable<{ userUpdated: boolean; error?: UserAdminApiError }>;

  /**
   * Delete a user with the given id
   * @param userEntityId The entity id of the "profile" linked with the account
   */
  abstract deleteUser(
    userEntityId: string,
  ): Observable<{ userDeleted: boolean }>;

  /**
   * Re-send the account invitation email (e.g. if the original link expired)
   * @param userAccountId The user account id of the authentication server (not the profile entity id)
   */
  abstract resendInvitation(userAccountId: string): Observable<void>;

  /**
   * Get all available roles of the server
   */
  abstract getAllRoles(): Observable<Role[]>;

  /**
   * Create a new realm role in the authentication server
   * @throws {@link UserAdminApiError} status=409 if the role already exists
   */
  abstract createRole(
    role: Pick<Role, "name" | "description">,
  ): Observable<void>;

  /**
   * Update the description of an existing realm role
   */
  abstract updateRole(
    roleName: string,
    update: Pick<Role, "description">,
  ): Observable<void>;

  /**
   * Delete a realm role from the authentication server.
   * Users currently having the role lose it.
   */
  abstract deleteRole(roleName: string): Observable<void>;

  /**
   * Get all users registered in the authentication server (Keycloak) for this realm
   * @returns An array of all user accounts with their details, including only non-technical roles
   */
  abstract getAllUsers(): Observable<UserAccount[]>;
}

/**
 * A failure of the user account server, with a message for the user.
 * A 403 has a `NotPermittedError` as its `cause`, so that it is recognized as one
 * (see `isNotPermittedError`) and only logged for debugging.
 */
export class UserAdminApiError extends Error {
  /**
   * The HTTP status code of the error.
   * - 403: Forbidden (the account may not manage user accounts)
   * - 404: Not Found (e.g. user not found)
   * - 409: Conflict (e.g. email already exists)
   * - 500: Internal Server Error
   */
  status: number;

  /**
   * @param status
   * @param message for the user; a default one by the status if not given
   * @param cause the failed request
   */
  constructor(status: number, message?: string, cause?: unknown) {
    super(message, {
      cause:
        status === 403
          ? new NotPermittedError("Not permitted to manage user accounts", {
              status,
              cause,
            })
          : cause,
    });
    this.name = "UserAdminApiError";
    this.status = status;
    if (!message) {
      this.message = this.generateDefaultMessage(status);
    }
  }

  private generateDefaultMessage(status: number) {
    switch (status) {
      case 403:
        return $localize`:User API error:You do not have permission to manage user accounts.`;
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
