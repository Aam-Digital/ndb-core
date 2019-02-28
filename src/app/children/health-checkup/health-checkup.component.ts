import { Component, OnInit } from '@angular/core';
import { HealthCheck } from './HealthCheck';
import { ColumnDescription } from '../../ui-helper/entity-subrecord/column-description';
import { ActivatedRoute } from '@angular/router';
import { EntityMapperService } from 'app/entity/entity-mapper.service';
import {uniqid} from 'uniqid';


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

  generateNewRecordFactory() {
    // define values locally because "this" is a different scope after passing a function as input to another component
    const childId = this.childId;

    return () => {
      var newHC = new HealthCheck(Date.now().toString());

      // use last entered date as default, otherwise today's date
      newHC.date = this.records.length > 0 ? this.records[0].date : new Date();
      newHC.child = childId;

      return newHC;
    };
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
    
      // addHealthCheck(date: Date, height: number, weight: number){
  //   var newHealthCheck = new HealthCheck(uniqid());
  //   newHealthCheck.date=date;
  //   newHealthCheck.height=height;
  //   newHealthCheck.weight=weight;
  //   newHealthCheck.child=this.child.getId();
  //   console.log(newHealthCheck);
  //   this.entityMapperService.save<HealthCheck>(newHealthCheck);
  //   this.loadHealthChecks();
  // }

    }