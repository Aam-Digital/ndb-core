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
  editing = computed(
    () => this.formMode() === "edit" || this.formMode() === "create",
  );
  userIsPermitted = signal<boolean>(false);
  formMode = signal<"create" | "edit" | "view">("create");

  onUserDetailsAction(action: UserDetailsAction) {
    switch (action.type) {
      case "formCancel":
        this.onFormCancel();
        break;
      case "editRequested":
        this.editForm();
        break;
      case "accountCreated":
        this.user.set(action.data);
        this.disableForm();
        break;
      case "accountUpdated":
        this.user.set(action.data.user);
        this.disableForm();
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
          if (res) {
            this.formMode.set("view");
          } else {
            this.formMode.set("create");
          }
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

  editForm() {
    this.formMode.set("edit");
  }

  disableForm() {
    this.formMode.set("view");
  }

  onFormCancel() {
    this.disableForm();
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
