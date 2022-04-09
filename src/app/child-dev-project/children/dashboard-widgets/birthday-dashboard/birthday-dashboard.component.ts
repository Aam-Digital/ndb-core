import { Component } from "@angular/core";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { Child } from "../../model/child";
import { DynamicComponent } from "../../../../core/view/dynamic-components/dynamic-component.decorator";
import { OnInitDynamicComponent } from "../../../../core/view/dynamic-components/on-init-dynamic-component.interface";

@DynamicComponent("BirthdayDashboard")
@Component({
  selector: "app-birthday-dashboard",
  templateUrl: "./birthday-dashboard.component.html",
  styleUrls: ["./birthday-dashboard.component.scss"],
})
export class BirthdayDashboardComponent implements OnInitDynamicComponent {
  children: Child[] = [];

  constructor(private entityMapper: EntityMapperService) {
    // TODO sort the children based on the birthday
    this.entityMapper.loadType(Child).then((res) => (this.children = res));
  }

  onInitFromDynamicConfig(config: any) {}
}
