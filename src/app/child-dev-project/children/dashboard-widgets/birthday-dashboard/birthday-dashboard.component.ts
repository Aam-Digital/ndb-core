import { Component,Input,OnInit,AfterViewInit } from "@angular/core";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { Child } from "../../model/child";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { ViewChild } from "@angular/core";
import { calculateAge } from "app/utils/utils";
@DynamicComponent("BirthdayDashboard")
@Component({
  selector: "app-birthday-dashboard",
  templateUrl: "./birthday-dashboard.component.html",
  styleUrls: ["./birthday-dashboard.component.scss"],
})
export class BirthdayDashboardComponent implements OnInitDynamicComponent,AfterViewInit {
  @Input() dateOfBirth: Date;
  @Input() age:number;


  children: Child[] = [];
  Child: any ;
  /**  displayedColumns: string[] = ['entityid', 'dateOfBirth', 'age'];*/
  childrenDataSource = new  MatTableDataSource<Child>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  isLoading: boolean = true;
  dataSource: MatTableDataSource<Child>;
  


  constructor(private entityMapper: EntityMapperService) {}
  ngOnInit(){
   // TODO sort the children based on the date of birth
    this.entityMapper.loadType(Child).then((res) => {
      this.children = res;
      console.log(res);
      
      //  Now the children are set
    });
  
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  onInitFromDynamicConfig(config: any) {
    if (config?.dateOfBirth) {
      this.dateOfBirth = config.dateOfBirth;
    }
    if (config?.age) {
      this.age = config.age;
    }
  }
 
}
