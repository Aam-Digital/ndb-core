import { Component, OnInit } from '@angular/core';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {AlertService} from '../../alerts/alert.service';
import {Child} from '../child';

@Component({
  selector: 'app-children-list',
  templateUrl: './children-list.component.html',
  styleUrls: ['./children-list.component.scss']
})
export class ChildrenListComponent implements OnInit {

  children: Child[];

  constructor(private entityMapper: EntityMapperService, private alertService: AlertService) { }

  ngOnInit() {
    this.entityMapper.loadType<Child>(Child).then(
      loadedEntities => this.children = loadedEntities,
      reason => this.alertService.addWarning(reason)
    );
  }

}
