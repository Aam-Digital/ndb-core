import {User} from '../../user/user';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {MatTableDataSource} from '@angular/material/table';
import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  public displayedColumns = ['name', 'admin'];
  public dataSource = new MatTableDataSource<User>();
  public users: User[] = [];
  public editing: Boolean = false;

  constructor(private entityMapperService: EntityMapperService) { }

  ngOnInit() {
    this.entityMapperService.loadType<User>(User)
      .then(users => {
        this.users = users;
        this.dataSource.data = users;
      });
  }

}
