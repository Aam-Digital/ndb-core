import { Component, inject, OnInit, signal } from "@angular/core";
import { UserAdminService } from "../user-admin-service/user-admin.service";
import { MatDialog } from "@angular/material/dialog";
import { SessionSubject } from "../../session/auth/session-info";
import { UserAccount } from "../user-admin-service/user-account";
import { Logging } from "../../logging/logging.service";
import {
  UserDetailsAction,
  UserDetailsComponent,
  UserDetailsDialogData,
} from "../user-details/user-details.component";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { MatTableModule } from "@angular/material/table";
import { EntityBlockComponent } from "../../basic-datatypes/entity/entity-block/entity-block.component";
import { AlertService } from "../../alerts/alert.service";

@Component({
  selector: "app-user-list",
  imports: [ViewTitleComponent, MatTableModule, EntityBlockComponent],

  templateUrl: "./user-list.component.html",
  styleUrl: "./user-list.component.scss",
})
export class UserListComponent implements OnInit {
  private readonly userAdminService = inject(UserAdminService);
  private readonly dialog = inject(MatDialog);
  private readonly sessionInfo = inject(SessionSubject);
  private readonly alertService = inject(AlertService);

  hasUserManagementRole = this.sessionInfo.value?.roles.includes(
    UserAdminService.ACCOUNT_MANAGER_ROLE,
  );

  users = signal<UserAccount[]>([]);
  displayedColumns: string[] = [
    "email",
    "userEntityId",
    "enabled",
    "emailVerified",
    "roles",
  ];

  ngOnInit() {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    if (this.hasUserManagementRole && isOnline) {
      this.loadUsers();
    } else if (!isOnline) {
      this.alertService.addInfo(
        $localize`User accounts cannot be loaded while offline.`,
      );
    }
  }

  loadUsers() {
    this.userAdminService.getAllUsers().subscribe({
      next: (users) => {
        this.users.set(users);
      },
      error: (err) => {
        Logging.error("Failed to load users:", err);
        this.alertService.addWarning(
          $localize`Failed to load users. Please try again later or contact your server administrator.`,
        );
      },
    });
  }

  getRoleNames(userAccount: UserAccount): string {
    return userAccount.roles?.map((r) => r.name).join(", ") || "-";
  }

  openUserDetails(user: UserAccount) {
    const dialogData: UserDetailsDialogData = {
      userAccount: user,
    };

    const dialogRef = this.dialog.open(UserDetailsComponent, {
      data: dialogData,
      width: "99%",
    });

    dialogRef.afterClosed().subscribe((action: UserDetailsAction) => {
      if (!action) {
        // Dialog was closed without an action (e.g., clicked outside or ESC)
        return;
      }

      switch (action.type) {
        case "accountUpdated": {
          const updatedUsers = this.users().map((u) =>
            u.id === action.data.user.id ? action.data.user : u,
          );
          this.users.set(updatedUsers);
          break;
        }
        case "accountCreated":
          this.loadUsers();
          break;
      }
    });
  }
}
