import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DatePipe} from '@angular/common';
import {PreviousSchools} from './previous-schools';
import {ColumnDescription} from '../../ui-helper/entity-subrecord/column-description';
import {ChildrenService} from '../children.service';
import {ChildSchoolRelation} from '../childSchoolRelation';


@Component({
  selector: 'app-previous-schools',
  template: '<app-entity-subrecord [records]="records" [columns]="columns" [newRecordFactory]="generateNewRecordFactory()">' +
  '</app-entity-subrecord>',
})
export class PreviousSchoolsComponent implements OnInit {

  childId: string;
  records: Array<ChildSchoolRelation>;

  columns: Array<ColumnDescription> = [
    new ColumnDescription('schoolId', 'Name', 'text'),
    new ColumnDescription('start', 'From', 'date', null,
      (v: Date) => this.datePipe.transform(v, 'yyyy-MM-dd')),
    new ColumnDescription('end', 'To', 'date', null,
      (v: Date) => this.datePipe.transform(v, 'yyyy-MM-dd')),
  ];

  constructor(private route: ActivatedRoute,
              private childrenService: ChildrenService,
              private datePipe: DatePipe) {
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.childId = params.get('id').toString();
      this.loadData(this.childId);
    });
  }

  loadData(id: string) {
    this.childrenService.getPreviousSchoolsOfChild(id)
      .subscribe(results => {
        this.records = results
          .sort((a, b) => b.start.valueOf() - a.start.valueOf());
          console.log(this.records);
      });
  }


  generateNewRecordFactory() {
    // define values locally because "this" is a different scope after passing a function as input to another component
    const child = this.childId;

    return () => {
      const newAtt = new PreviousSchools(Date.now().toString());
      newAtt.date = new Date();
      newAtt.child = child;

      return newAtt;
    };
  }
}
