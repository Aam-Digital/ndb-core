import { Component, AfterViewInit, OnInit } from "@angular/core";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { Child } from "../../model/child";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { ViewChild } from "@angular/core";
import { months } from "moment";
import { C } from "@angular/cdk/keycodes";
import { date } from "faker";

@DynamicComponent("BirthdayDashboard")
@Component({
  selector: "app-birthday-dashboard",
  templateUrl: "./birthday-dashboard.component.html",
  styleUrls: ["./birthday-dashboard.component.scss"],
})
export class BirthdayDashboardComponent
  implements OnInitDynamicComponent, OnInit, AfterViewInit {
  children: Child[] = [];
  childrendataSource = new MatTableDataSource<Child>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  isLoading: boolean = false;

  constructor(private entityMapper: EntityMapperService) {}

  async ngOnInit() {
    this.children = (await this.entityMapper.loadType(Child))
      .filter((child: Child) => child.isActive)
      //*.sort((a, b) => a.dateOfBirth.getTime() - b.dateOfBirth.getTime());
    this.childrendataSource.data = this.children;
    var dateOfBirth: any[], today: Date, bday: Date, diff: number, days: number;
  dateOfBirth = [months,days]; // 6th of February
        today = new Date();
        bday = new Date(today.getFullYear(),dateOfBirth[1]-1,dateOfBirth[0]);
    if( today.getTime() > bday.getTime()) {
        bday.setFullYear(bday.getFullYear()+1);
          }
       diff = bday.getTime()-today.getTime();// calculating difference between days
        days = Math.floor(diff/(1000*60*60*24));
   // const children=[]  ;
     
//function distanceToBirthday(dateOfBirth)
//{
   // let currDate = new Date();
   // currDate.setHours(0, 0, 0, 0);
    //let currYear = currDate.getFullYear();

   // let offset = new Date();
   // offset.setHours(0, 0, 0, 0);
   // offset.setFullYear(currYear + 1);

    //dateOfBirth = new Date(dateOfBirth + " 00:00");
    //dateOfBirth.setFullYear(currYear);

    //let diff = dateOfBirth - currDate;
   // return (diff < 0) ? diff + offset.getTime() : diff;
//}

//function getUpcomingBirthdays(bdays)
//{
   // return bdays.slice(0).sort(
       // (a: any[], b: any[]) => distanceToBirthday(a[1]) - distanceToBirthday(b[1])
   // );
//}

//console.log(getUpcomingBirthdays(children));
  }
  

  ngAfterViewInit() {
    this.childrendataSource.paginator = this.paginator;
  }

  onInitFromDynamicConfig(config: any) {}
}
