import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

/**
 * The session info which holds information about the currently logged-in user.
 * This is retrieved during the login process and will always be present once state changes to `LOGGED_IN`.
 */
export interface SessionInfo {
  /*
   * The user account id from the auth server (e.g. User ID in Keycloak)
   */
  id: string;

  /**
   * Name of user account.
   * @deprecated Use id or entityId instead as this is an unpredictable mix from different sources
   */
  name: string;

  /**
   * List of roles the logged-in user hold.
   */
  roles: string[];

  /**
   * List of linked projects
   */
  projects?: string[];

  /**
   * ID of the entity which is connected with the user account.
   *
   * This is either a full ID or (e.g. Child:123) or only the last part.
   * In the later case it refers to the `User` entity.
   */
  entityId?: string;

  /**
   * Email address of a user
   */
  email?: string;
}

/**
 * Use this provider to get information about the currently active session.
 * E.g. for checking required roles or accessing the unique user identifier.
 */
@Injectable()
export class SessionSubject extends BehaviorSubject<SessionInfo> {
  constructor() {
    super(undefined);
  }
}
