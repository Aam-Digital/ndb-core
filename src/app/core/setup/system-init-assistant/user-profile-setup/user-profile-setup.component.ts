import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { firstValueFrom } from "rxjs";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { EntityConfigService } from "../../../entity/entity-config.service";
import { SessionSubject } from "../../../session/auth/session-info";
import { UserAdminService } from "../../../user/user-admin-service/user-admin.service";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { EntityFormService } from "../../../common-components/entity-form/entity-form.service";
import { EntityFormComponent } from "../../../common-components/entity-form/entity-form/entity-form.component";
import { InvalidFormFieldError } from "../../../common-components/entity-form/invalid-form-field.error";
import { FieldGroup } from "../../../entity-details/form/field-group";
import { AlertService } from "../../../alerts/alert.service";
import { Logging } from "../../../logging/logging.service";
import { SetupService } from "../../setup.service";
import { DatabaseResolverService } from "../../../database/database-resolver.service";
import { SyncedPouchDatabase } from "../../../database/pouchdb/synced-pouch-database";
import { LOCATION_TOKEN } from "../../../../utils/di-tokens";

/**
 * Step of the initial system setup that lets the first user create their own "profile" entity
 * and links their login account to it.
 *
 * Renders nothing and completes immediately if that does not apply (e.g. an account that is
 * already linked), so the assistant can move on to its final screen.
 *
 * @see /src/app/core/setup/README.md
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-user-profile-setup",
  imports: [MatButtonModule, MatSelectModule, EntityFormComponent],
  templateUrl: "./user-profile-setup.component.html",
})
export class UserProfileSetupComponent implements OnInit {
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly sessionInfo = inject(SessionSubject);
  private readonly userAdminService = inject(UserAdminService);
  private readonly entityConfigService = inject(EntityConfigService);
  private readonly entityFormService = inject(EntityFormService);
  private readonly setupService = inject(SetupService);
  private readonly databaseResolver = inject(DatabaseResolverService);
  private readonly alertService = inject(AlertService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly location = inject(LOCATION_TOKEN);

  /**
   * Emitted when this step is done - profile created, skipped or not applicable at all - with
   * a message to be displayed on the final setup screen, if there is anything to report.
   */
  readonly completed = output<string | null>();

  /** Whether this step applies to the current account at all. */
  applies = signal<boolean>(false);
  /** Whether the type picker / form can be shown (i.e. the new config has been applied). */
  ready = signal<boolean>(false);

  entityTypes = signal<EntityConstructor[]>([]);
  selectedType = signal<EntityConstructor | null>(null);
  entity = signal<Entity | null>(null);
  fieldGroups = signal<FieldGroup[]>([]);
  form = signal<EntityForm<Entity> | null>(null);
  saving = signal<boolean>(false);

  async ngOnInit(): Promise<void> {
    // `applies` is set synchronously, before the first await, so that a step that does not
    // apply renders nothing at all rather than flashing the "preparing" placeholder.
    this.applies.set(this.shouldOfferStep());

    const notice = await this.prepareStep();
    // always emitted from a later microtask, so completing cannot invalidate the parent
    // template branch that has just created this component
    if (notice !== undefined) {
      this.completed.emit(notice);
    }
  }

  /**
   * Whether to offer linking the current account to a profile: only for an account that has no
   * linked profile yet and can actually write the link.
   *
   * A missing `entityId` is a valid, silent state outside of initial setup (e.g. this is also
   * how demo mode - which sets a fixed `entityId` - skips this step), so this is not an error
   * check, just a gate for whether to offer the convenience.
   */
  private shouldOfferStep(): boolean {
    return (
      !this.sessionInfo.value?.entityId &&
      this.userAdminService.canManageAccounts()
    );
  }

  /**
   * Prepare the type picker and form for the profile to be created.
   *
   * @returns the notice to complete this step with (`null` for nothing to report), or
   *   `undefined` if the step is to be shown to the user.
   */
  private async prepareStep(): Promise<string | null | undefined> {
    if (!this.applies()) {
      return null;
    }

    // only awaited on a system that has just imported a base config successfully - otherwise
    // there is no new config to read entity types from and this could never resolve.
    await this.setupService.waitForConfigReady();

    const types = this.getUserEntityTypes();
    if (types.length === 0) {
      return $localize`:no user-linkable type notice:No record type in this configuration supports login accounts, so no profile was created for your account.`;
    }

    this.entityTypes.set(types);
    this.ready.set(true);

    if (types.length === 1) {
      await this.selectType(types[0]);
    }
    return undefined;
  }

  /**
   * Entity types that can be linked to a login account, in entity-registry (import/creation)
   * order. There is no single "correct" default among them, so the user picks if there are
   * several.
   *
   * Only valid once the newly imported config has been applied - `enableUserAccounts` is a
   * config-applied static that is not set before that.
   */
  private getUserEntityTypes(): EntityConstructor[] {
    return this.entityRegistry
      .getEntityTypes()
      .filter(({ value }) => value.enableUserAccounts)
      .map(({ value }) => value);
  }

  async selectType(type: EntityConstructor) {
    this.selectedType.set(type);

    const entity = new type();
    const fieldGroups = this.getProfileFieldGroups(type);
    const fields = fieldGroups.flatMap((group) => group.fields);

    this.entity.set(entity);
    this.fieldGroups.set(fieldGroups);
    this.form.set(
      // field-level permission checks are skipped: this runs right after importing the config
      // whose permission rules govern this type, and AbilityService may not have re-applied
      // them yet (no signal exists to await that) - without this, fields could silently render
      // as blank/disabled. The save-time ability check in saveChanges() is separate and not
      // skipped; it fails loudly (a caught error) rather than silently, which is acceptable here.
      await this.entityFormService.createEntityForm(
        fields,
        entity,
        this.destroyRef,
        false,
        false,
      ),
    );
  }

  /**
   * The field groups to render for creating a profile of the given type: the first panel's
   * `Form` component config from the type's details view, or a fallback built from
   * `toStringAttributes` if there is no details view config yet (e.g. a type added later via
   * the admin UI) or its first panel does not configure a `Form`.
   */
  private getProfileFieldGroups(type: EntityConstructor): FieldGroup[] {
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

  async save() {
    const form = this.form();
    const entity = this.entity();
    if (!form || !entity) {
      return;
    }

    this.saving.set(true);
    try {
      const saved = await this.entityFormService.saveChanges(form, entity);

      // the entity is already saved at this point: a failure below must never roll it back,
      // only report that it is not yet linked.
      const linked =
        (await this.pushProfileToServer()) &&
        (await this.linkAccountToEntity(saved.getId()));

      if (linked) {
        // reload so Keycloak's next init() issues a token carrying the new `username` claim -
        // writing the attribute server-side does not change the already-issued token.
        this.location.pathname = "";
        return;
      }

      const notLinkedMessage = $localize`:profile created but not linked warning:Your profile "${saved.toString()}:profileName:" was created, but could not be linked to your account automatically. An administrator can link it to your account later from user administration.`;
      // shown twice: as a toast now, and handed on to the final screen so the entity id/name is
      // still visible even if the toast is missed - it's the only place an admin would
      // otherwise learn there is an orphaned profile to link.
      this.alertService.addWarning(notLinkedMessage);
      this.completed.emit(notLinkedMessage);
    } catch (err) {
      // InvalidFormFieldError is already surfaced as inline field highlighting - an alert on
      // top would be redundant (same convention as FormComponent.saveClicked).
      if (!(err instanceof InvalidFormFieldError)) {
        this.alertService.addDanger(err.message);
      }
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Send the newly created profile to the server before the account is linked to it.
   *
   * A save only writes to the local database, and the reload after linking does not come back
   * to that same one: the local database name is built from `SessionInfo.name`, which is the
   * token's `username` claim - exactly what linking sets. The app therefore reopens under a
   * different local database, orphaning whatever was left unsynced in the previous one. The
   * changed `${user.entityId}` additionally makes the next login enforce different permission
   * rules, so {@link PermissionEnforcerService} discards local data they no longer cover (on
   * the legacy `idb` adapter by destroying the local database outright). Either way, a profile
   * that has not reached the server yet is lost while its account link survives.
   *
   * @returns whether the profile is on the server (always true where the save already went
   *   there directly, i.e. without a local database to sync from).
   */
  private async pushProfileToServer(): Promise<boolean> {
    const database = this.databaseResolver.getDatabase();
    try {
      await (database as SyncedPouchDatabase)?.ensureSynced?.();
      return true;
    } catch (err) {
      Logging.warn("Failed to sync a new profile before linking it", err);
      return false;
    }
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
  private async linkAccountToEntity(entityId: string): Promise<boolean> {
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

  skip() {
    this.completed.emit(null);
  }
}
