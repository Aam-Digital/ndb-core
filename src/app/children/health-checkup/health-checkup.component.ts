import { Component, OnInit } from '@angular/core';
import { HealthCheck } from './health-check';
import { ColumnDescription } from '../../ui-helper/entity-subrecord/column-description';
import { ActivatedRoute } from '@angular/router';
import { ChildrenService } from '../children.service';
import {DatePipe} from '@angular/common';


@Component({
  selector: 'app-health-checkup',
  templateUrl: './health-checkup.component.html',
  styleUrls: ['./health-checkup.component.scss']
})

export class HealthCheckupComponent implements OnInit {
  records = new Array<HealthCheck>();
  /**
   * Column Description for the SubentityRecordComponent
   * The Date-Column needs to be transformed to apply the MathFormCheck in the SubentityRecordComponent
   */
  columns: Array<ColumnDescription> = [
    new ColumnDescription('date', 'Date', 'date', null,
    (v: Date) => this.datePipe.transform(v, 'yyyy-MM-dd')),
    new ColumnDescription('height', 'Height [cm]', 'number', null,
    (height: Number) => height + ' cm' ),
    new ColumnDescription('weight', 'Weight [kg]', 'number', null,
    (weight: Number) => weight + ' kg'),
  ];
  childId: string;
  constructor(private route: ActivatedRoute, private childrenService: ChildrenService, private datePipe: DatePipe ) { }

  ngOnInit() {
    this.route.paramMap.subscribe (params => {
      this.childId = params.get('id').toString();
      this.loadHealthChecks();

    } );
  }

  /**
   *
   */
  generateNewRecordFactory() {
    // define values locally because "this" is a different scope after passing a function as input to another component
    const childId = this.childId;

    return () => {
      const newHC = new HealthCheck(Date.now().toString());

      // use last entered date as default, otherwise today's date
      newHC.date = this.records.length > 0 ? this.records[0].date : new Date();
      newHC.child = childId;

      return newHC;
    };
  }


  /**
   * implements the health check loading from the children service and is called in the onInit()
   */
  loadHealthChecks() {
    this.childrenService.getHealthChecksOfChild(this.childId)
      .subscribe(results => {
        this.records = results
          .sort((a, b ) => (b.date ? b.date.valueOf() : 0) - (a.date ? a.date.valueOf() : 0) );
      });
  }
}
