import { User } from '../../user/user';
import { EntityMapperService } from '../../entity/entity-mapper.service';
import { MatTableDataSource } from '@angular/material/table';
import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../session/session.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnInit {
  public displayedColumns = ['id', 'name', 'admin', 'details'];
  public dataSource = new MatTableDataSource<User>();

  debugDetails = new Map<string, string>();

  constructor(
    private entityMapperService: EntityMapperService,
    private sessionService: SessionService,
  ) { }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.dataSource.data = await this.entityMapperService.loadType<User>(User);
    this.dataSource.data.forEach(user => this.debugDetails.set(user.getId(), JSON.stringify(user)));
  }

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
