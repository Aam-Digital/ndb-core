import { Component,AfterViewInit, } from "@angular/core";
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
export class BirthdayDashboardComponent implements OnInitDynamicComponent,AfterViewInit {

  children: Child[] = [];
  childrendataSource = new  MatTableDataSource<Child>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  isLoading: boolean = false;
    constructor(private entityMapper: EntityMapperService) {}
      ngOnInit(){
      this.entityMapper.loadType(Child).then((res) => {
      this.children = res;
      this.children.sort((a,b) => a.dateOfBirth.getTime()- b.dateOfBirth.getTime());
      this.childrendataSource.data= this.children;
    });
  }
      ngAfterViewInit() {
      this.childrendataSource= new MatTableDataSource(this.children);
      this.childrendataSource.paginator = this.paginator;
    }
 
  onInitFromDynamicConfig(config: any) {
    
  }
 
}

