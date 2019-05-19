import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DatePipe} from '@angular/common';
import {Aser} from './aser';
import {ColumnDescription} from '../../ui-helper/entity-subrecord/column-description';
import {ChildrenService} from '../children.service';


@Component({
  selector: 'app-aser',
  template: '<app-entity-subrecord [records]="records" [columns]="columns" [newRecordFactory]="generateNewRecordFactory()">' +
  '</app-entity-subrecord>',
})
export class AserComponent implements OnInit {

  childId: string;
  records: Array<Aser>;

  columns: Array<ColumnDescription> = [
    new ColumnDescription('date', 'Date', 'date', null,
      (v: Date) => this.datePipe.transform(v, 'yyyy-MM-dd')),
    new ColumnDescription('math', 'Math', 'select',
      Aser.MathLevels.map(s => { return { value: s, label: s } })),
    new ColumnDescription('english', 'English', 'select',
      Aser.ReadingLevels.map(s => { return { value: s, label: s } })),
    new ColumnDescription('hindi', 'Hindi', 'select',
      Aser.ReadingLevels.map(s => { return { value: s, label: s } })),
    new ColumnDescription('bengali', 'Bengali', 'select',
      Aser.ReadingLevels.map(s => { return { value: s, label: s } })),
    new ColumnDescription('remarks', 'Remarks', 'text'),
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
    this.childrenService.getAserResultsOfChild(id)
      .subscribe(results => {
        this.records = results
          //.sort((a, b) => b.date.valueOf() - a.date.valueOf());
      });
  }


  generateNewRecordFactory() {
    // define values locally because "this" is a different scope after passing a function as input to another component
    const child = this.childId;

    return () => {
      const newAtt = new Aser(Date.now().toString());
      newAtt.date = new Date();
      newAtt.child = child;

      return newAtt;
    };
  }
}
