import { User } from "../../user/user";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { MatTableDataSource } from "@angular/material/table";
import { Component, OnInit } from "@angular/core";

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
  displayedColumns = ["id", "name", "details"];
  /** datasource for the list table in the template */
  dataSource = new MatTableDataSource<User>();

  /** additional technical details of a user mapped to the user id as key */
  debugDetails = new Map<string, string>();

  constructor(private entityMapperService: EntityMapperService) {}

  async ngOnInit() {
    await this.loadData();
  }

  private async loadData() {
    this.dataSource.data = await this.entityMapperService.loadType<User>(User);
    this.dataSource.data.forEach((user) =>
      this.debugDetails.set(user.getId(), JSON.stringify(user))
    );
  }
}
