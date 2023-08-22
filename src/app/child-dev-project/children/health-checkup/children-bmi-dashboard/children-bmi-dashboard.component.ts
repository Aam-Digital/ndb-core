import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { WarningLevel } from "../../../warning-level";
import { HealthCheck } from "../model/health-check";
import { groupBy } from "../../../../utils/utils";
import { Child } from "../../model/child";
import { DecimalPipe, NgIf } from "@angular/common";
import { DisplayEntityComponent } from "../../../../core/basic-datatypes/entity/display-entity/display-entity.component";
import { DashboardWidgetComponent } from "../../../../core/dashboard/dashboard-widget/dashboard-widget.component";
import { WidgetContentComponent } from "../../../../core/dashboard/dashboard-widget/widget-content/widget-content.component";

interface BmiRow {
  childId: string;
  bmi: number;
}

@DynamicComponent("ChildrenBmiDashboard")
@Component({
  selector: "app-children-bmi-dashboard",
  templateUrl: "./children-bmi-dashboard.component.html",
  styleUrls: ["./children-bmi-dashboard.component.scss"],
  imports: [
    NgIf,
    MatTableModule,
    DecimalPipe,
    MatPaginatorModule,
    DisplayEntityComponent,
    DashboardWidgetComponent,
    WidgetContentComponent,
  ],
  standalone: true,
})
export class ChildrenBmiDashboardComponent implements OnInit, AfterViewInit {
  bmiDataSource = new MatTableDataSource<BmiRow>();
  isLoading = true;
  entityLabelPlural: string = Child.labelPlural;
  @ViewChild("paginator") paginator: MatPaginator;

  constructor(private entityMapper: EntityMapperService) {}

  ngOnInit() {
    return this.loadBMIData();
  }

  ngAfterViewInit() {
    this.bmiDataSource.paginator = this.paginator;
  }

  async loadBMIData() {
    // Maybe replace this by a smart index function
    const healthChecks = await this.entityMapper.loadType(HealthCheck);
    const BMIs: BmiRow[] = [];
    groupBy(healthChecks, "child").forEach(([childId, checks]) => {
      const latest = checks.reduce((prev, cur) =>
        cur.date > prev.date ? cur : prev,
      );
      if (latest && latest.getWarningLevel() === WarningLevel.URGENT) {
        BMIs.push({ childId: childId, bmi: latest?.bmi });
      }
    });
    this.bmiDataSource.data = BMIs;
    this.isLoading = false;
  }
}
