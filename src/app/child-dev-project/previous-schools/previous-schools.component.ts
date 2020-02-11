import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ChildSchoolRelation } from '../children/model/childSchoolRelation';
import { ColumnDescription, ColumnDescriptionInputType } from '../../core/ui-helper/entity-subrecord/column-description';
import { ChildrenService } from '../children/children.service';
import { SchoolsService } from '../schools/schools.service';
import { School } from '../schools/model/school';
import * as uniqid from 'uniqid';

@Component({
  selector: 'app-previous-schools',
  template: '<app-entity-subrecord ' +
    '[records]="records" ' +
    '[columns]="columns" ' +
    '[newRecordFactory]="generateNewRecordFactory()" ' +
    '[formValidation]="formValidation">' +
    '</app-entity-subrecord>',
})

export class PreviousSchoolsComponent implements OnInit {

  /**
   * returns a css-compatible color value from green to red using the given
   * input value
   * @param percent The percentage from 0-100 (both inclusive). 0 will be completely red, 100 will be completely green
   * Everything between will have suitable colors (orange, yellow,...)
   * If the color is NaN, the color will be a light grey
   */

  private static fromPercent(percent: number): string {
    if (Number.isNaN(percent)) { return 'rgba(130,130,130,0.4)'; }
    // the hsv color-value is to be between 0 (red) and 120 (green)
    // percent is between 0-100, so we have to normalize it first
    const color = (percent / 100) * 120;
    return 'hsl(' + color + ', 70%, 65%)';
  }

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
          new ColumnDescription('schoolClass', 'Class', ColumnDescriptionInputType.NUMBER),
          new ColumnDescription('start', 'From', ColumnDescriptionInputType.DATE, null,
            // tslint:disable-next-line: max-line-length
            (v: Date) => v && !isNaN(v.getTime()) ? this.datePipe.transform(v, 'yyyy-MM-dd') : ''), // checking if v is a date and otherwise returning undefined prevents a datePipe error
          new ColumnDescription('end', 'To', ColumnDescriptionInputType.DATE, null,
            (v: Date) => v && !isNaN(v.getTime()) ? this.datePipe.transform(v, 'yyyy-MM-dd') : ''),
          new ColumnDescription('result', 'Result', ColumnDescriptionInputType.NUMBER, null,
            (n: number) => n >= 0 && !isNaN(n) ? n + '%' : 'N/A',
            null,
            (value: number) => {
            return {'color': PreviousSchoolsComponent.fromPercent(value)}; }),
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
      newPreviousSchool.result = Number.NaN; // NaN represents no data available
      return newPreviousSchool;
    };
  }

  formValidation = (record) => {
    if (!record.schoolId) {
      return {
        hasPassedValidation: false,
        validationMessage: '"Name" is empty. Please select a school.',
      };
    } else if (record.start && record.end && record.start > record.end) {
      return {
        hasPassedValidation: false,
        validationMessage: '"To"-date lies before "From"-date. Please enter correct dates.',
      };
    } else if (record.result > 100) {
      return {
        hasPassedValidation: false,
        validationMessage: 'Result cannot be greater than 100',
      };
    } else if (record.result < 0) {
      return {
        hasPassedValidation: false,
        validationMessage: 'Result cannot be smaller than 0',
      };
    } else {
      return {
        hasPassedValidation: true,
        validationMessage: '',
      };
    }
  }
}
