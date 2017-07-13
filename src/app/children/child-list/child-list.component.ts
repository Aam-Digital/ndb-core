import { Component, OnInit } from '@angular/core';
import { Child } from '../child';
import { EntityMapperService } from '../../entity/entity-mapper.service';
import { Ng2TableModule } from 'ng2-table/ng2-table'; //Import Module for Child-List-Table


@Component({
  selector: 'app-child-list',
  templateUrl: './child-list.component.html',
  styleUrls: ['./child-list.component.css']
})
export class ChildListComponent implements OnInit {

}