import { UserAccount } from "./user-account";
import { v4 as uuid } from "uuid";

/**
 * Extract of Keycloak user object as provided by the external Keycloak Service.
 * See {@link https://www.keycloak.org/docs-api/19.0.3/rest-api/index.html#_userrepresentation}
 *
 * These fields overlap with our internal `SessionInfo` interface that is seen as abstracted from Keycloak.
 */
export class KeycloakUserDto {
  id?: string;

  username?: string;

  email?: string;

  attributes?: { [key in string]: string[] };

  requiredActions?: string[];

  enabled? = true;

  emailVerified?: boolean;

  constructor(email?: string, userEntityId?: string) {
    if (email) {
      this.username = uuid(); // we have set the userEntityId here but this doesn't really make sense and newer Keycloak version don't allow some of the characters
      this.email = email;
      this.emailVerified = false;
      this.requiredActions = ["VERIFY_EMAIL", "UPDATE_PASSWORD"];
    }
    if (userEntityId) {
      this.attributes = { exact_username: [userEntityId] };
    }
  }

  /**
   * Builds a partial update from a partial {@link UserAccount}, assigning only the keys the
   * partial actually defines. This is required for {@link KeycloakAdminService.updateKeycloakUser},
   * which merges the result onto the current user - an explicit `undefined` here would overwrite
   * (and effectively clear) that field on the server.
   */
  static fromUserAccount(
    userAccount: Partial<UserAccount>,
  ): Partial<KeycloakUserDto> {
    const kcUser: Partial<KeycloakUserDto> = {};
    if (userAccount.id !== undefined) {
      kcUser.id = userAccount.id;
    }
    if (userAccount.email !== undefined) {
      kcUser.email = userAccount.email;
    }
    if (userAccount.enabled !== undefined) {
      kcUser.enabled = userAccount.enabled;
    }
    if (userAccount.emailVerified !== undefined) {
      kcUser.emailVerified = userAccount.emailVerified;
    }
    if (userAccount.userEntityId) {
      kcUser.attributes = { exact_username: [userAccount.userEntityId] };
    }
    return kcUser;
  }
}
