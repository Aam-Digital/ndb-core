import { inject, Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { EntityConstructor } from "../entity/model/entity";
import { EntityRegistry } from "../entity/database-entity.decorator";
import { SessionSubject } from "../session/auth/session-info";
import { UserAdminService } from "../user/user-admin-service/user-admin.service";
import { EntityConfigService } from "../entity/entity-config.service";
import { FieldGroup } from "../entity-details/form/field-group";
import { Logging } from "../logging/logging.service";

/**
 * Non-UI logic for the initial-setup step that links the first admin's login account
 * to a "profile" entity they create during setup.
 *
 * @see /src/app/core/setup/README.md
 */
@Injectable({
  providedIn: "root",
})
export class UserEntityLinkService {
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly sessionInfo = inject(SessionSubject);
  private readonly userAdminService = inject(UserAdminService);
  private readonly entityConfigService = inject(EntityConfigService);

  /**
   * Entity types that can be linked to a login account, in entity-registry (import/creation)
   * order. There is no single "correct" default among them, so callers decide how to present
   * none / one / several options to the user.
   *
   * Only call this after {@link EntityConfigReadyService.setupCompleted$} has fired for the
   * newly imported config - `enableUserAccounts` is a config-applied static that is not set
   * until then.
   */
  getUserEntityTypes(): EntityConstructor[] {
    return this.entityRegistry
      .getEntityTypes()
      .filter(({ value }) => value.enableUserAccounts)
      .map(({ value }) => value);
  }

  /**
   * Whether the initial-setup flow should offer to link the current account to a profile:
   * only true for an account that has no linked profile yet and can actually write the link.
   *
   * A missing `entityId` is a valid, silent state outside of initial setup (e.g. this is also
   * how demo mode - which sets a fixed `entityId` - skips this step), so this is not an error
   * check, just a gate for whether to offer the convenience.
   */
  shouldOfferStep(): boolean {
    return (
      !this.sessionInfo.value?.entityId &&
      this.userAdminService.canManageAccounts()
    );
  }

  /**
   * The field groups to render for creating a profile of the given type: the first panel's
   * `Form` component config from the type's details view, or a fallback built from
   * `toStringAttributes` if there is no details view config yet (e.g. a type added later via
   * the admin UI) or its first panel does not configure a `Form`.
   */
  getProfileFieldGroups(type: EntityConstructor): FieldGroup[] {
    const firstPanel =
      this.entityConfigService.getDetailsViewConfig(type)?.config?.panels?.[0];
    const formComponent = firstPanel?.components.find(
      (c) => c.component === "Form",
    );
    const fieldGroups = formComponent?.config?.fieldGroups as FieldGroup[];

    return fieldGroups?.length
      ? fieldGroups
      : [{ fields: type.toStringAttributes }];
  }

  /**
   * Link the current session's account to the given profile entity id.
   *
   * The entity has already been saved before this is called, so a failure here is never rolled
   * back - it is reported to the caller (via the returned `false`) so the user can be told the
   * profile was created but is not yet linked.
   *
   * @returns whether the link was actually written on the server. Only reload the app when this
   *   is `true` - never merely because the step finished.
   */
  async linkAccountToEntity(entityId: string): Promise<boolean> {
    try {
      const { userUpdated } = await firstValueFrom(
        this.userAdminService.updateUser(this.sessionInfo.value.id, {
          userEntityId: entityId,
        }),
      );
      return userUpdated;
    } catch (err) {
      Logging.warn(
        "Failed to link the initial admin account to a profile",
        err,
      );
      return false;
    }
  }
}
