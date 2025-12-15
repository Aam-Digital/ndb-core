import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Input,
  OnInit,
  signal,
} from "@angular/core";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { AlertService } from "../../alerts/alert.service";
import { UntilDestroy } from "@ngneat/until-destroy";
import { SessionSubject } from "../../session/auth/session-info";
import { Entity } from "../../entity/model/entity";
import { switchMap } from "rxjs/operators";
import { UserAdminService } from "../user-admin-service/user-admin.service";
import { UserAccount } from "../user-admin-service/user-account";
import { of } from "rxjs";
import { UserDetailsComponent } from "../user-details/user-details.component";

/**
 * Display User Account details and configuration related to a given profile Entity.
 */
@UntilDestroy()
@DynamicComponent("EntityUser")
@DynamicComponent("UserSecurity") // for backwards compatibility. Prefer to use "EntityUser"
@Component({
  selector: "app-entity-user",
  templateUrl: "./entity-user.component.html",
  styleUrls: ["./entity-user.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UserDetailsComponent],
})
export class EntityUserComponent implements OnInit {
  private readonly userAdminService = inject(UserAdminService);
  private readonly alertService = inject(AlertService);
  private readonly sessionInfo = inject(SessionSubject);

  @Input() entity?: Entity;
  user = signal<UserAccount | null>(null);
  userIsPermitted = signal<boolean>(false);

  constructor() {
    if (
      this.sessionInfo.value?.roles.includes(
        UserAdminService.ACCOUNT_MANAGER_ROLE,
      )
    ) {
      this.userIsPermitted.set(true);
    }
  }

  getEntity(): Entity | undefined {
    return this.entity;
  }

  getUserAccountForDetails = computed<UserAccount | null>(() => {
    if (this.user()) {
      return this.user();
    }
    const entity = this.getEntity();
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

  ngOnInit() {
    if (!this.userIsPermitted()) {
      return;
    }

    const entityToUse = this.getEntity();

    if (!entityToUse) {
      return;
    }

    this.userAdminService
      .getUser(entityToUse.getId())
      .pipe(
        switchMap((user) =>
          user === null
            ? this.userAdminService.getUser(entityToUse.getId(true))
            : of(user),
        ),
      )
      .subscribe({
        next: (res) => {
          this.user.set(res);
        },
        error: (err) => {
          this.alertService.addDanger(
            err?.error?.message ||
              err?.message ||
              "Failed to load user account",
          );
        },
      });
  }
}
