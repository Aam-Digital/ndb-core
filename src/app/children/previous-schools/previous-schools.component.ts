import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DatePipe} from '@angular/common';
import {ChildSchoolRelation} from '../childSchoolRelation';
import {ColumnDescription, ColumnDescriptionInputType} from '../../ui-helper/entity-subrecord/column-description';
import {ChildrenService} from '../children.service';
import {SchoolsService} from '../../schools/schools.service';
import {School} from 'app/schools/school';
import * as uniqid from 'uniqid';


@Component({
  selector: 'app-previous-schools',
  // tslint:disable-next-line: max-line-length
  template: '<app-entity-subrecord [records]="records" [columns]="columns" [newRecordFactory]="generateNewRecordFactory()" [optionalFormValidation]="optionalFormValidation">' + '</app-entity-subrecord>',
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
      console.log('called init');
      this.loadData(this.childId);
    });
  }


  loadData(id: string) {
    this.childrenService.getSchoolsWithRelations(id)
      .then(results => {
        this.records = results;
      });
    this.schoolsService.getSchools().subscribe(data => {
        const schoolMap = {};
        data.forEach(s => schoolMap[s.getId()] = s.name);
        this.columns = [
          new ColumnDescription('schoolId', 'Name', ColumnDescriptionInputType.SELECT,
            data.map(t => { return { value: t.getId(), label: t.name}; }),
            (schoolId) => schoolMap[schoolId]),
            // (schoolId) => data.find(schoolElement => schoolElement._id === ('School:' + schoolId)).name),
          new ColumnDescription('start', 'From', ColumnDescriptionInputType.DATE, null,
            // tslint:disable-next-line: max-line-length
            (v: Date) => v && !isNaN(v.getTime()) ? this.datePipe.transform(v, 'yyyy-MM-dd') : ''), // checking if v is a date and otherweise returning undefined prevents a datePipe error
          new ColumnDescription('end', 'To', ColumnDescriptionInputType.DATE, null,
            (v: Date) => v && !isNaN(v.getTime()) ? this.datePipe.transform(v, 'yyyy-MM-dd') : ''),
        ];
    });
  }

  generateNewRecordFactory() {
    const childId = this.childId;
    return () => {
      const newPreviousSchool = new ChildSchoolRelation(uniqid());
      newPreviousSchool.childId = childId;
      // last to-date (of first entry in records); if the first entry doesn't have any to-date, lastToDate is set to yesterday
      const lastToDate = (this.records.length && this.records[0].end)
        ? new Date(this.records[0].end)
        : new Date(new Date().setDate(new Date().getDate() + -1));
      newPreviousSchool.start = new Date(lastToDate.setDate(lastToDate.getDate() + 1));  // one day after last to-date
      newPreviousSchool.end = null; // void date
      return newPreviousSchool;
    };
  }

  optionalFormValidation = (record) => {
    if (!record.schoolId) {
      return {
        hasPassedValidation: false,
        validationMessage: '"Name" is empy. Please select a school.',
      };
    } else if (record.start && record.end && record.start > record.end) {
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
