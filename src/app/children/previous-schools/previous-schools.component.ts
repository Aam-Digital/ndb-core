import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DatePipe} from '@angular/common';
import {PreviousSchools} from './previous-schools';
import {ColumnDescription} from '../../ui-helper/entity-subrecord/column-description';
import {ChildrenService} from '../children.service';
import {SchoolsService} from '../../schools/schools.service';
import { removeSummaryDuplicates } from '@angular/compiler';
import { School } from 'app/schools/school';


@Component({
  selector: 'app-previous-schools',
  template: '<app-entity-subrecord [records]="records" [columns]="columns" [newRecordFactory]="generateNewRecordFactory()">' +
  '</app-entity-subrecord>',
})

export class PreviousSchoolsComponent implements OnInit {

  childId: string;
  records = new Array<PreviousSchools>();
  schoolList = new Array<School>();
  columns = new Array<ColumnDescription>();

  constructor(private route: ActivatedRoute,
              private childrenService: ChildrenService,
              private schoolsService: SchoolsService,
              private datePipe: DatePipe) {
  }


  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.childId = params.get('id').toString();
      this.loadData(this.childId); 
    });
  }


  loadData(id: string) {
    let tempRecords = new Array<PreviousSchools>();
    this.childrenService.getSchoolsWithRelations(id)
      .then(results => {
        results.forEach(element => {
          let previousSchool = new PreviousSchools('');
          previousSchool.name=element.getSchoolName();
          previousSchool.from=new Date(element.getStartTime());
          previousSchool.to=new Date(element.getEndTime());
          tempRecords.push(previousSchool);
        });
        this.records = tempRecords
          .sort((a, b) => (
            (b.from ? b.from.valueOf() : 0) - (a.from ? a.from.valueOf() : 0)
          ));
      });
    this.schoolsService.getSchools().subscribe(data => {
        this.columns = [
          new ColumnDescription('name', 'Name', 'select',
            data.map(t => { return { value: t.name, label: t.name} })),
          new ColumnDescription('from', 'From', 'date', null,
            (v: Date) => this.datePipe.transform(v, 'yyyy-MM-dd')),
          new ColumnDescription('to', 'To', 'date', null,
            (v: Date) => this.datePipe.transform(v, 'yyyy-MM-dd')),
        ];
    });
  }

  
  generateNewRecordFactory() {
    return () => {
      const newPreviousSchool = new PreviousSchools(Date.now().toString());
      newPreviousSchool.child = this.childId;
      newPreviousSchool.from = new Date();
      newPreviousSchool.to = new Date();
      return newPreviousSchool;
    }
  }
}
