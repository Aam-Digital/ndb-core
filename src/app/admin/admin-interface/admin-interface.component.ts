import { Component, OnInit } from '@angular/core';
import {EntityMapperService} from '../../entity/entity-mapper.service';

@Component({
  selector: 'app-admin-interface',
  templateUrl: './admin-interface.component.html',
  styleUrls: ['./admin-interface.component.scss']
})
export class AdminInterfaceComponent implements OnInit {

  constructor(entityMapperService: EntityMapperService) { }

  ngOnInit() {
    
  }

}
