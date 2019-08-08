import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DatePipe} from '@angular/common';
import {EducationalMaterial} from './educational-material';
import {ColumnDescription} from '../../ui-helper/entity-subrecord/column-description';
import {ChildrenService} from '../children.service';


@Component({
  selector: 'app-educational-material',
  templateUrl: './educational-material.component.html',
})
export class EducationalMaterialComponent implements OnInit {

  childId: string;
  records = new Array<EducationalMaterial>();

  materialTypes = EducationalMaterial.MATERIAL_ALL;

  columns: Array<ColumnDescription> = [
    new ColumnDescription('date', 'Date', 'date', null,
      (v: Date) => this.datePipe.transform(v, 'yyyy-MM-dd'), 'xs'),
    new ColumnDescription('materialType', 'Material', 'autocomplete',
      this.materialTypes.map(t => { return { value: t, label: t }; }), undefined, 'xs'),
    new ColumnDescription('materialAmount', 'Amount', 'number', null, undefined, 'md'),
    new ColumnDescription('description', 'Description/Remarks', 'text', null, undefined, 'md'),
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
    this.childrenService.getEducationalMaterialsOfChild(id)
      .subscribe(results => {
        this.records = results
          .sort((a, b) => (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0) );
      });
  }


  generateNewRecordFactory() {
    // define values locally because "this" is a different scope after passing a function as input to another component
    const child = this.childId;

    return () => {
      const newAtt = new EducationalMaterial(Date.now().toString());

      // use last entered date as default, otherwise today's date
      newAtt.date = this.records.length > 0 ? this.records[0].date : new Date();

      newAtt.child = child;

      return newAtt;
    };
  }

  getSummary() {
    if (this.records.length === 0) {
      return '';
    }

    const summary = new Map<string, number>();
    this.records.forEach(m => {
      const previousValue = summary.has(m.materialType) ? summary.get(m.materialType) : 0;
      summary.set(m.materialType, previousValue + m.materialAmount);
    });

    let summaryText = '';
    summary.forEach((v, k) => summaryText = summaryText + k + ': ' + v + ', ');
    return summaryText;
  }
}
