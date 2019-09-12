import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DatePipe} from '@angular/common';
import {ChildSchoolRelation} from '../childSchoolRelation';
import {ColumnDescription} from '../../ui-helper/entity-subrecord/column-description';
import {ChildrenService} from '../children.service';
import {SchoolsService} from '../../schools/schools.service';
import { School } from 'app/schools/school';

@Component({
  selector: 'app-previous-schools',
  template: '<app-entity-subrecord [records]="records" [columns]="columns" [newRecordFactory]="newRecordFactory" [optionalFormValidation]="optionalFormValidation">' + '</app-entity-subrecord>',
})


export class PreviousSchoolsComponent implements OnInit {

  childId: string;
  records = new Array<ChildSchoolRelation>();
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
    const tempRecords = new Array<ChildSchoolRelation>();
    this.childrenService.getSchoolsWithRelations(id)
      .then(results => {
        results.forEach(element => {
          const previousSchool = new ChildSchoolRelation('');
          previousSchool.schoolId = element.getSchoolName();
          previousSchool.start = new Date(element.getStartTime());
          previousSchool.end = new Date(element.getEndTime());
          tempRecords.push(previousSchool);
        });
        this.records = tempRecords
          .sort((a, b) => (
            (b.start ? b.start.valueOf() : 0) - (a.start ? a.start.valueOf() : 0)
          ));
      });
    this.schoolsService.getSchools().subscribe(data => {
        this.columns = [
          new ColumnDescription('schoolId', 'Name', 'select',
            data.map(t => { return { value: t.name, label: t.name} })),
          new ColumnDescription('start', 'From', 'date', null,
            (v: Date) => !isNaN(v.getTime()) ? this.datePipe.transform(v, 'yyyy-MM-dd') : undefined), // checking if v is a date and otherweise returning undefined prevents a datePipe error
          new ColumnDescription('end', 'To', 'date', null,
            (v: Date) => !isNaN(v.getTime()) ? this.datePipe.transform(v, 'yyyy-MM-dd') : undefined),
        ];
    });
  }


  newRecordFactory = () => {
    const newPreviousSchool = new ChildSchoolRelation(Date.now().toString());
    newPreviousSchool.childId = this.childId;
    const lastToDate =  (this.records.length && this.records[0].end) ? new Date(this.records[0].end) : new Date(new Date().setDate(new Date().getDate() + -1));  // last to-date (of first entry in records); if the first entry doesn't have any to-date, lastToDate is set to yesterday
    newPreviousSchool.start = new Date(lastToDate.setDate(lastToDate.getDate() + 1));  // one day after last to-date
    newPreviousSchool.end = new Date('');  // void date
    return newPreviousSchool;
  }

  optionalFormValidation = (record) => {
    if (!record.schoolId) {
      return {
        hasPassedValidation: false,
        validationMessage: '"Name" is empy. Please select a school.',
      };
    } else if (record.start > record.end) {
      return {
        hasPassedValidation: false,
        validationMessage: '"To"-date lies before "From"-date. Please enter correct dates.',
      };
    } else {
      return {
        hasPassedValidation: true,
        validationMessage: '',
      };
    }
  }
}
