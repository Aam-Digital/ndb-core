import { Component, inject, OnInit, signal } from "@angular/core";
import { ViewTitleComponent } from "../core/common-components/view-title/view-title.component";
import { UserAdminService } from "../core/user/user-admin-service/user-admin.service";
import { UserAccount } from "../core/user/user-admin-service/user-account";
import { MatTableModule } from "@angular/material/table";
import { Logging } from "../core/logging/logging.service";
import { MatDialog } from "@angular/material/dialog";
import { UserSecurityComponent } from "../core/user/user-security/user-security.component";
import { Entity } from "../core/entity/model/entity";

@Component({
  selector: "app-admin-user-list",
  imports: [ViewTitleComponent, MatTableModule],
  templateUrl: "./admin-user-list.component.html",
  styleUrl: "./admin-user-list.component.scss",
})
export class AdminUserListComponent implements OnInit {
  private readonly userAdminService = inject(UserAdminService);
  private readonly dialog = inject(MatDialog);

  users = signal<UserAccount[]>([]);
  displayedColumns: string[] = [
    "userEntityId",
    "email",
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
    // Only open dialog if user has a userEntityId
    if (!user.userEntityId) {
      return;
    }

    // Create a minimal entity object with the user's ID
    const entityMock = new Entity(user.userEntityId);

    const dialogRef = this.dialog.open(UserSecurityComponent, {
      data: { entity: entityMock },
    });

    dialogRef.afterClosed().subscribe(() => {
      this.loadUsers();
    });
  }

  isRowClickable(user: UserAccount): boolean {
    return !!user.userEntityId;
  }
}
