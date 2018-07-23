import { Component, OnInit } from '@angular/core';
import {ChildrenService} from '../children.service';
import {Aser} from '../aser/aser';
import {EntityMapperService} from '../../entity/entity-mapper.service';

@Component({
  selector: 'app-coaching-planner',
  templateUrl: './coaching-planner.component.html',
  styleUrls: ['./coaching-planner.component.scss']
})
export class CoachingPlannerComponent implements OnInit {

  children: any[];
  containers = ['A', 'B', 'C'];

  constructor(private childrenService: ChildrenService) { }

  ngOnInit() {
    this.childrenService.getChildren()
      .subscribe(results => {
        this.children = this.initChildren(results);
      });
  }

  private initChildren(results) {
    results = results.filter(c => c.isActive());

    // TODO: proper filtering with UI
    results = results.filter(c => c.center === 'Liluah');
    results = results.filter(c => c.getClassAsNumber() < 9);

    results.forEach(r => {
      r.container = 'A';
      this.childrenService.getAserResultsOfChild(r.getId())
        .subscribe(asers => this.initLatestASER(r, asers));
    });

    return results;
  }

  private initLatestASER(child, asers: Aser[]) {
    asers = asers.sort((a, b) => b.date.getTime() - a.date.getTime());

    if (asers.length === 0) {
      child.lastAser = new Aser('');
    } else {
      child.lastAser = asers[0];
    }
  }


  doDrop(event, container) {
    console.log(event);
    event.dragData.container = container;
  }

}
