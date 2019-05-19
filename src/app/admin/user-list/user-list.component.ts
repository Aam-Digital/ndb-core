import { Component, OnInit } from '@angular/core';
import { EntityMapperService } from 'app/entity/entity-mapper.service';
import { User } from 'app/user/user';
import { ColumnDescription } from '../../ui-helper/entity-subrecord/column-description';
import { PouchDatabaseManagerService } from 'app/database/pouch-database-manager.service';
import { DatabaseManagerService } from 'app/database/database-manager.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  users = new Array<User>();

  columns: Array<ColumnDescription> = [
  new ColumnDescription('name', 'Username', 'string'),
  new ColumnDescription('password', 'Password', 'string', null, (password: String) => password='***'),
  new ColumnDescription('admin', 'Role', 'boolean', null, (role: Boolean) => role ? 'admin' : 'user')
  ]

  constructor(private entityMapperService: EntityMapperService,
              private databaseService: DatabaseManagerService) { }

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

  signupUser(){
      this.databaseService.signupUser(); 
  }
  

}
