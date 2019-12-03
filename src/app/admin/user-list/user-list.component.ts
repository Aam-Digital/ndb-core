import {User} from '../../user/user';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {MatTableDataSource} from '@angular/material/table';
import {Component, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {UserDetailsComponent} from '../user-details/user-details.component';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  public displayedColumns = ['id', 'name', 'admin'];
  public dataSource = new MatTableDataSource<User>();
  public users: User[] = [];
  public editing: Boolean = false;

  constructor(private entityMapperService: EntityMapperService, private dialog: MatDialog) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.entityMapperService.loadType<User>(User)
      .then(users => {
        this.users = users;
        this.dataSource.data = users;
        console.log(users);
      });
  }

  editUser(user) {
    const dialogRef = this.dialog.open(UserDetailsComponent, {data: user});
    dialogRef.afterClosed().subscribe(res => res ? this.loadData() : null);
  }

  createUser() {
    this.editUser(null);
  }
}
