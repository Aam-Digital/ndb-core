import { Component, inject, OnInit, signal } from "@angular/core";
import { ViewTitleComponent } from "../core/common-components/view-title/view-title.component";
import { UserAdminService } from "../core/user/user-admin-service/user-admin.service";
import { UserAccount } from "../core/user/user-admin-service/user-account";
import { MatTableModule } from "@angular/material/table";
import { Logging } from "../core/logging/logging.service";
import { MatDialog } from "@angular/material/dialog";
import {
  UserDetailsComponent,
  UserDetailsAction,
  UserDetailsDialogData,
} from "../core/user/user-details/user-details.component";
import { EntityBlockComponent } from "../core/basic-datatypes/entity/entity-block/entity-block.component";
import { SessionSubject } from "../core/session/auth/session-info";

@Component({
  selector: "app-admin-user-list",
  imports: [ViewTitleComponent, MatTableModule, EntityBlockComponent],
  templateUrl: "./admin-user-list.component.html",
  styleUrl: "./admin-user-list.component.scss",
})
export class AdminUserListComponent implements OnInit {
  private readonly userAdminService = inject(UserAdminService);
  private readonly dialog = inject(MatDialog);
  private readonly sessionInfo = inject(SessionSubject);

  users = signal<UserAccount[]>([]);
  displayedColumns: string[] = [
    "email",
    "userEntityId",
    "enabled",
    "emailVerified",
    "roles",
  ];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userAdminService.getAllUsers().subscribe({
      next: (users) => {
        this.users.set(users);
      },
      error: (err) => {
        Logging.error("Failed to load users:", err);
      },
    });
  }

  getRoleNames(userAccount: UserAccount): string {
    return userAccount.roles?.map((r) => r.name).join(", ") || "-";
  }

  openUserSecurity(user: UserAccount) {
    const userIsPermitted =
      this.sessionInfo.value?.roles.includes(
        UserAdminService.ACCOUNT_MANAGER_ROLE,
      ) ?? false;

    const dialogData: UserDetailsDialogData = {
      userAccount: user,
      mode: "dialog",
      editing: true,
      userIsPermitted,
    };

    const dialogRef = this.dialog.open(UserDetailsComponent, {
      data: dialogData,
      width: "99%",
    });

    dialogRef.componentInstance.action.subscribe(
      (action: UserDetailsAction) => {
        switch (action.type) {
          case "accountUpdated": {
            const updatedUsers = this.users().map((u) =>
              u.id === action.data.user.id ? action.data.user : u,
            );
            this.users.set(updatedUsers);
            dialogRef.close();
            break;
          }
          case "editRequested":
            break;
          case "closeDialog":
          case "formCancel":
            dialogRef.close();
            break;
        }
      },
    );

    dialogRef.afterClosed().subscribe(() => {
      this.loadUsers();
    });
  }
}
