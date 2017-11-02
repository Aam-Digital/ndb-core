import { Component, OnInit } from '@angular/core';
import { Child } from '../child';
import { EntityMapperService } from '../../entity/entity-mapper.service';

@Component({
  selector: 'app-child-list',
  templateUrl: './child-list.component.html',
  styleUrls: ['./child-list.component.css']
})
export class ChildListComponent implements OnInit {

  ngOnInit(){}

}
