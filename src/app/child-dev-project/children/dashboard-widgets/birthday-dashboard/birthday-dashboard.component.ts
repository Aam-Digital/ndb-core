import { Component, AfterViewInit, OnInit } from "@angular/core";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { Child } from "../../model/child";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { ViewChild } from "@angular/core";

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
     
  this.childrendataSource.data= this.children.map((child)=>( {child:child,birthday:getNextBirthday(child.dateOfBirth)} ))
      .sort((a,b) =>daysUntilBirthday(a.birthday) - daysUntilBirthday(b.birthday))
      .filter((a)=>daysUntilBirthday(a.birthday)<32);

 function daysUntilBirthday(birthday: Date): number {
  let today = new Date();
      today.setHours(0,0,0,0);
  let diff = birthday.getTime() - today.getTime();
  let daysTillNextBirthday = Math.floor(diff / (1000 * 60 * 60 * 24));
      return daysTillNextBirthday;
}
 function getNextBirthday(dateOfBirth:Date) :Date {
  let today = new Date();
      today.setHours(0,0,0,0);
  let birthday = new Date(today.getFullYear(),dateOfBirth.getMonth(), dateOfBirth.getDate());

  if (today.getTime() > birthday.getTime()) { 
      birthday.setFullYear(birthday.getFullYear() + 1);
}
    return birthday;
}
}
 ngAfterViewInit() {
 this.childrendataSource.paginator = this.paginator;
}
 onInitFromDynamicConfig(config: any) {}
}