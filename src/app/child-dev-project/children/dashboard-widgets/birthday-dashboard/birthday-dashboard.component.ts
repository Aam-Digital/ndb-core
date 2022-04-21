import { Component } from "@angular/core";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { Child } from "../../model/child";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { ViewChild } from "@angular/core";
@DynamicComponent("BirthdayDashboard")
@Component({
  selector: "app-birthday-dashboard",
  templateUrl: "./birthday-dashboard.component.html",
  styleUrls: ["./birthday-dashboard.component.scss"],
})
export class BirthdayDashboardComponent implements OnInitDynamicComponent {
  children: Child[] = [];
  dataSource: MatTableDataSource<Child>;
  displayedColumns: string[] = ['entityid', 'Birthday', 'age'];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  currentUser: Child[];
  constructor(private entityMapper: EntityMapperService) {
    // TODO sort the children based on the date of birth
    this.currentUser = this.children;
    this.dataSource = new MatTableDataSource(this.children);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    


    this.entityMapper.loadType(Child).then((res) => (this.children = res));
  
  }

  onInitFromDynamicConfig(config: any) {
   
  }
 
}
