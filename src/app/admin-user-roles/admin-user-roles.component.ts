import { Component, inject, OnInit, signal } from "@angular/core";
import { ViewTitleComponent } from "../core/common-components/view-title/view-title.component";
import { UserAdminService } from "../core/user/user-admin-service/user-admin.service";
import { UserAccount } from "../core/user/user-admin-service/user-account";
import { MatTableModule } from "@angular/material/table";
import { Logging } from "../core/logging/logging.service";

@Component({
  selector: "app-admin-user-roles",
  imports: [ViewTitleComponent, MatTableModule],
  templateUrl: "./admin-user-roles.component.html",
  styleUrl: "./admin-user-roles.component.scss",
})
export class AdminUserRolesComponent implements OnInit {
  private readonly userAdminService = inject(UserAdminService);

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
}
