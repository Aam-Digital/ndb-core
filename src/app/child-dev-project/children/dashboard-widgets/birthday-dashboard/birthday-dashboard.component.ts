import { Component,OnInit,AfterViewInit, } from "@angular/core";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { Child } from "../../model/child";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { ViewChild } from "@angular/core";
import _ from "lodash";
import { date } from "faker";


@DynamicComponent("BirthdayDashboard")
@Component({
  selector: "app-birthday-dashboard",
  templateUrl: "./birthday-dashboard.component.html",
  styleUrls: ["./birthday-dashboard.component.scss"],
})
export class BirthdayDashboardComponent implements OnInitDynamicComponent,AfterViewInit {

  children: Child[] = [];
  displayedColumns: string[]= ['name', 'dateOfBirth', 'age'];
  childrendataSource = new  MatTableDataSource<Child>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  isLoading: boolean = false;
  dateOfBirth: string | number | Date;
  age: number;


  constructor(private entityMapper: EntityMapperService) {}
  
  ngOnInit(){
   // TODO sort the children based on the date of birth
    this.entityMapper.loadType(Child).then((res) => {
      this.children = res;
      this.children.sort((a,b) => a.dateOfBirth.getTime()- b.dateOfBirth.getTime());
      this.childrendataSource.data= this.children;
    
      //  Now the children are set
    });
  }
 
  
  ngAfterViewInit() {
    this.childrendataSource= new MatTableDataSource(this.children);
    this.childrendataSource.paginator = this.paginator;
   
  }
 
  onInitFromDynamicConfig(config: any) {
    
  }
 
}

