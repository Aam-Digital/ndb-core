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


  constructor(private entityMapperService: EntityMapperService) { }

  ngOnInit() {
    
  }


  //Load all users from DataBase using basic EntityMapperService Functions
  loadData(){
    this.entityMapperService.loadType<User>(User).then(
      users => this.users=users)
    }
  

}
