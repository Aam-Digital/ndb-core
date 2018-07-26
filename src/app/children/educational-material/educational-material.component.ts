import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DatePipe} from '@angular/common';
import {EducationalMaterial} from './educational-material';
import {ColumnDescription} from '../../ui-helper/entity-subrecord/column-description';
import {ChildrenService} from '../children.service';


@Component({
  selector: 'app-educational-material',
  template: '<app-entity-subrecord [records]="records" [columns]="columns" [newRecordFactory]="generateNewRecordFactory()">' +
  '</app-entity-subrecord>',
})
export class EducationalMaterialComponent implements OnInit {

  childId: string;
  records: Array<EducationalMaterial>;

  materialTypes = EducationalMaterial.MATERIAL_ALL;

  columns: Array<ColumnDescription> = [
    new ColumnDescription('date', 'Date', 'date', null,
      (v: Date) => this.datePipe.transform(v, 'yyyy-MM-dd')),
    new ColumnDescription('materialType', 'Material', 'autocomplete',
      this.materialTypes.map(t => { return { value: t, label: t }; })),
    new ColumnDescription('materialAmount', 'Amount', 'number'),
    new ColumnDescription('description', 'Description/Remarks', 'text'),
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
          .sort((a, b) => b.date.valueOf() - a.date.valueOf())
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
}
