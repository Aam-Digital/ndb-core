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
import { HttpClient } from "@angular/common/http";
import { UntilDestroy } from "@ngneat/until-destroy";
import { SessionSubject } from "../../session/auth/session-info";
import { Entity } from "../../entity/model/entity";
import { switchMap } from "rxjs/operators";
import { environment } from "../../../../environments/environment";
import { UserAdminService } from "../user-admin-service/user-admin.service";
import { UserAccount } from "../user-admin-service/user-account";
import { of } from "rxjs";
import {
  UserDetailsComponent,
  UserDetailsAction,
} from "../user-details/user-details.component";

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
  private readonly http = inject(HttpClient);
  private readonly sessionInfo = inject(SessionSubject);

  @Input() entity?: Entity;
  user = signal<UserAccount | null>(null);
  userIsPermitted = signal<boolean>(false);
  editing = signal<boolean>(false);

  onUserDetailsAction(action: UserDetailsAction) {
    switch (action.type) {
      case "formCancel":
        this.editing.set(false);
        break;
      case "editRequested":
        this.editing.set(true);
        break;
      case "accountCreated":
        this.user.set(action.data);
        this.editing.set(false);
        break;
      case "accountUpdated":
        this.user.set(action.data.user);
        this.editing.set(false);
        if (action.data.triggerSyncReset) {
          this.triggerSyncReset();
        }
        break;
    }
  }

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
          this.editing.set(!res);
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


  /**
   * Reset server DB sync state to ensure previously hidden docs are re-synced
   * after an account has gained more access permissions.
   *
   * see https://github.com/Aam-Digital/replication-backend/blob/master/src/admin/admin.controller.ts
   * @private
   */
  private triggerSyncReset() {
    this.http
      .post(
        `${environment.DB_PROXY_PREFIX}/admin/clear_local/${Entity.DATABASE}`,
        undefined,
      )
      .subscribe({
        next: () => undefined,
        // request fails if no permission backend is used - this is fine
        error: () => undefined,
      });
  }
}
