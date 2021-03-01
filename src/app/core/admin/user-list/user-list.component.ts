import { User } from "../../user/user";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { MatTableDataSource } from "@angular/material/table";
import { Component, OnInit } from "@angular/core";
import { SessionService } from "../../session/session-service/session.service";

/**
 * Display all available users.
 */
@Component({
  selector: "app-user-list",
  templateUrl: "./user-list.component.html",
  styleUrls: ["./user-list.component.scss"],
})
export class UserListComponent implements OnInit {
  /** displayed columns for the list table in the template */
  displayedColumns = ["id", "name", "admin", "details"];
  /** datasource for the list table in the template */
  dataSource = new MatTableDataSource<User>();

  /** additional technical details of a user mapped to the user id as key */
  debugDetails = new Map<string, string>();

  constructor(
    private entityMapperService: EntityMapperService,
    private sessionService: SessionService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.entityMapperService.loadType<User>(User)
      .then(users => this.dataSource.data = users)
      .then(() =>
        this.dataSource.data.forEach((user) =>
          this.debugDetails.set(user.getId(), JSON.stringify(user))
        )
      )
  }

  /**
   * Change the admin role of the given user and save the entity.
   *
   * This requires the currently logged in user to be admin.
   *
   * @param user The user to be updated
   * @param admin Whether to assign or remove admin role to the given user
   */
  async makeAdmin(user: User, admin: boolean) {
    if (!this.sessionService.getCurrentUser().isAdmin()) {
      this.loadData();
      return;
    }
    if (this.sessionService.getCurrentUser().getId() === user.getId()) {
      // do not change own user to avoid removing your own admin rights by accident
      this.loadData();
      return;
    }

    user.setAdmin(admin);
    await this.entityMapperService.save<User>(user);
  }
}
