import { Component, AfterViewInit, OnInit } from "@angular/core";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { Child } from "../../model/child";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { ViewChild } from "@angular/core";
import { ConditionalExpr } from "@angular/compiler";
import { Console } from "console";


@DynamicComponent("BirthdayDashboard")
@Component({
  selector: "app-birthday-dashboard",
  templateUrl: "./birthday-dashboard.component.html",
  styleUrls: ["./birthday-dashboard.component.scss"],
})
export class BirthdayDashboardComponent
  implements OnInitDynamicComponent, OnInit, AfterViewInit {
  children: Child[] = [];
  childrendataSource = new MatTableDataSource<{child:Child,birthday:Date}>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  isLoading: boolean = false;

  constructor(private entityMapper: EntityMapperService) {}

  async ngOnInit() {
      this.children = (await this.entityMapper.loadType(Child))
      .filter((child: Child) => child.isActive);
     
     this.childrendataSource.data= this.children.map((child)=>({child:child,birthday:getNextBirthday(child.dateOfBirth)}))
       .sort((a,b) =>daysUntilBirthday(a.birthday) - daysUntilBirthday(b.birthday))
       .filter((a)=>daysUntilBirthday(a.birthday)<32)

     
   
       /** Takes a date as input and returns the number of days till the next birthday (i.e. this or next year).
*/
      function daysUntilBirthday(birthday: Date): number {
         let today = new Date();
         today.setHours(0,0,0,0);
       
         let diff = birthday.getTime() - today.getTime();
         let daysTillNextBirthday = Math.floor(diff / (1000 * 60 * 60 * 24));

         return daysTillNextBirthday;
            }
            function getNextBirthday(dateOfBirth:Date) :Date{
              let today = new Date();
              today.setHours(0,0,0,0);
              let birthday = new Date(today.getFullYear(),dateOfBirth.getMonth(),
                  dateOfBirth.getDate());
                       
     
             // If the birthday has already occured this year. Then their next birthday is next year.
              if (today.getTime() > birthday.getTime()) { 
                 birthday.setFullYear(birthday.getFullYear() + 1);
                    }
                    return birthday;


            }
           
  

    // TASK A: sort this.children so that the child whose birthday comes next is listed first

    // TASK B: filter this.children so that only those children are included whose birthday is less than 30 days from today

  
             }

        ngAfterViewInit() {
        this.childrendataSource.paginator = this.paginator;
          }

        onInitFromDynamicConfig(config: any) {}
      }

/**
* Takes a date as input and returns the number of days till the next birthday (i.e. this or next year).
*/
//function daysUntilBirthday(dateOfBirth: Date) : Number {
  //let today = new Date();
  //let birthday = new Date(today.getFullYear(), dateOfBirth.getMonth() - 1, dateOfBirth.getDate());

  // If the birthday has already occured this year. Then their next birthday is next year.
  //if (today.getTime() > birthday.getTime()) {
    //birthday.setFullYear(birthday.getFullYear() + 1);
 // }

  //let diff = birthday.getTime() - today.getTime();
  //let daysTillNextBirthday = Math.floor(diff/(1000*60*60*24));

  //return daysTillNextBirthday;
//}