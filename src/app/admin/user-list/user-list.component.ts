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
  roles = [true, false];

  /**
   * This defines the columns that are shown in the use table.
   * the password column gets anonymized by replacing every singe password with *** for now
   * the role column needs to be transformed twice, once when getting input it transfors admin|user to true|false and once when desplaying the value it it should transform the other way around.
   */
  columns: Array<ColumnDescription> = [
  new ColumnDescription('name', 'Username', 'text'),
  new ColumnDescription('password', 'Password', 'text', null, (password: String) => password='***'),
  new ColumnDescription('admin', 'Role', 'select', this.roles.map(role => { 
            return { value: role, label: role ? 'admin' : 'user'};}, (role: Boolean) => role ? 'admin' : 'user'))
  /* new ColumnDescription('admin', 'Role', 'text', null, (role: Boolean) => role ? 'admin' : 'user') */
  ]

  constructor(private entityMapperService: EntityMapperService,
              private databaseService: DatabaseManagerService) { }

  ngOnInit() {
    this.loadData();
  }


  //Load all users from DataBase using basic EntityMapperService Functions
  loadData(){
    this.entityMapperService.loadType<User>(User).then(
      users => this.users=users)
    }

  generateNewRecordFactory(){

    return () => {
      const newUser= new User('');
      return newUser;
    };

  }

}
