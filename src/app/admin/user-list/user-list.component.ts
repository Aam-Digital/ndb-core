import { Component, OnInit } from '@angular/core';
import { EntityMapperService } from 'app/entity/entity-mapper.service';
import { User } from 'app/user/user';
import { ColumnDescription } from '../../ui-helper/entity-subrecord/column-description';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  users = new Array<User>();

  columns: Array<ColumnDescription> = [
  new ColumnDescription('name', 'Username', 'string'),
  new ColumnDescription('password', 'Password', 'string'),
  new ColumnDescription('admin', 'Role', 'boolean'), 
  ]

  constructor(private entityMapperService: EntityMapperService) { }

  ngOnInit() {
    this.loadData();
    console.log(this.users);
  }


  //Load all users from DataBase using basic EntityMapperService Functions
  loadData(){
    this.entityMapperService.loadType<User>(User).then(
      users => this.users=users)
    }

  generateNewRecordFactory(){
    
  }
  

}
