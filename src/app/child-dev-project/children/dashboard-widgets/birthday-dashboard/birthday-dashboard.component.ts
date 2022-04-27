import { Component,OnInit,AfterViewInit, } from "@angular/core";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { Child } from "../../model/child";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { ViewChild } from "@angular/core";
import { ChildrenBmiDashboardComponent } from "../children-bmi-dashboard/children-bmi-dashboard.component";
import childBlockStories from "../../child-block/child-block.stories";

@DynamicComponent("BirthdayDashboard")
@Component({
  selector: "app-birthday-dashboard",
  templateUrl: "./birthday-dashboard.component.html",
  styleUrls: ["./birthday-dashboard.component.scss"],
})
export class BirthdayDashboardComponent implements OnInitDynamicComponent,AfterViewInit {

  children: Child[] = [];
  displayedColumns: string[] = ['entityid', 'dateOfBirth', 'age'];
  childrendataSource = new  MatTableDataSource<Child>();
  @ViewChild("Paginator",{static:true}) paginator: MatPaginator;
  @ViewChild("Sort",{static:true}) sort: MatSort;
  isLoading: boolean = false;

  constructor(private entityMapper: EntityMapperService) {}
  ngOnInit(){
   // TODO sort the children based on the date of birth
    this.entityMapper.loadType(Child).then((res) => {
      this.children = res;
      console.log(this.children);
      this.displayedColumns = ['entityid', 'dateOfBirth', 'age'];
      this.childrendataSource = new MatTableDataSource(this.children);
      
      this.childrendataSource.paginator=this.paginator;
      
      //  Now the children are set
    });
    
    

  
  }
  ngAfterViewInit() {
    this.childrendataSource= new MatTableDataSource(this.children);
    this.childrendataSource.paginator = this.paginator;
    this.childrendataSource.sort = this.sort;
  }
  onInitFromDynamicConfig(config: any) {
    
  }
 
}
