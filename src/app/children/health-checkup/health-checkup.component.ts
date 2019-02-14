import { Component, OnInit } from '@angular/core';
import { HealthCheck } from './HealthCheck';
import { ColumnDescription } from '../../ui-helper/entity-subrecord/column-description';
import { ActivatedRoute } from '@angular/router';
import { EntityMapperService } from 'app/entity/entity-mapper.service';


@Component({
  selector: 'app-health-checkup',
  templateUrl: './health-checkup.component.html',
  styleUrls: ['./health-checkup.component.scss']
})

export class HealthCheckupComponent implements OnInit {
  records = new Array<HealthCheck>();
  columns : Array<ColumnDescription> = [
    new ColumnDescription('date','Date','Date', null),
    new ColumnDescription('height','Height','number', null),
    new ColumnDescription('weight','Weight','number', null),
  ];
  childId : string;
  constructor(private route: ActivatedRoute, private entityMapperService: EntityMapperService) { }

  ngOnInit() {
    this.route.paramMap.subscribe (params => {
      this.childId = params.get("id").toString();
      this.loadHealthChecks();

    } )
  }

  loadHealthChecks(){

    let tempArray = []; //we need this because somehow you cant push directly into the HealthCheckRecords Array
    //this is a workaround until indizes in our database are centrelized 
    this.entityMapperService.loadType<HealthCheck>(HealthCheck).then(
       result => result.forEach(doc => {
           if(doc.child===this.childId) {
                tempArray.push(doc);
            }
            else{
              console.log(doc);
            }
       })
       );
       console.log(tempArray);
       this.records=tempArray;
      }
    }