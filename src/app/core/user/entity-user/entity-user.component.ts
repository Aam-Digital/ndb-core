import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  resource,
} from "@angular/core";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { AlertService } from "../../alerts/alert.service";
import { SessionSubject } from "../../session/auth/session-info";
import { Entity } from "../../entity/model/entity";
import { UserAdminService } from "../user-admin-service/user-admin.service";
import { UserAccount } from "../user-admin-service/user-account";
import { firstValueFrom } from "rxjs";
import { UserDetailsComponent } from "../user-details/user-details.component";

/**
 * Display User Account details and configuration related to a given profile Entity.
 */
@DynamicComponent("EntityUser")
@DynamicComponent("UserSecurity") // for backwards compatibility. Prefer to use "EntityUser"
@Component({
  selector: "app-entity-user",
  templateUrl: "./entity-user.component.html",
  styleUrls: ["./entity-user.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UserDetailsComponent],
})
export class EntityUserComponent {
  private readonly userAdminService = inject(UserAdminService);
  private readonly alertService = inject(AlertService);
  private readonly sessionInfo = inject(SessionSubject);

  entity = input<Entity>();

  userIsPermitted = computed(
    () =>
      this.sessionInfo.value?.roles.includes(
        UserAdminService.ACCOUNT_MANAGER_ROLE,
      ) ?? false,
  );

  user = resource({
    params: () => {
      if (!this.userIsPermitted()) {
        return undefined;
      }

      const entity = this.entity();
      if (!entity) {
        return undefined;
      }

      return { entity };
    },
    loader: async ({ params: { entity } }) => {
      try {
        const primaryUser = await firstValueFrom(
          this.userAdminService.getUser(entity.getId()),
        );

        if (primaryUser !== null) {
          return primaryUser;
        }

        return await firstValueFrom(
          this.userAdminService.getUser(entity.getId(true)),
        );
      } catch (err: unknown) {
        const error = err as { error?: { message?: string }; message?: string };
        this.alertService.addDanger(
          error?.error?.message ||
            error?.message ||
            $localize`Failed to load user account`,
        );
        return null;
      }
    },
  });

  getUserAccountForDetails = computed<UserAccount | null>(() => {
    const loadedUser = this.user.value();
    if (loadedUser) {
      return loadedUser;
    }

    const entity = this.entity();
    if (entity) {
      // stub account object for creating a new account
      return {
        userEntityId: entity.getId(),
        email: "",
        enabled: true,
        roles: [],
      } as UserAccount;
    }

    return null;
  });
}
