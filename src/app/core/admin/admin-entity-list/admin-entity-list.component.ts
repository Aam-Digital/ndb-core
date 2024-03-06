import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FilterComponent } from "../../filter/filter/filter.component";
import { MatTab, MatTabGroup } from "@angular/material/tabs";
import { EntitiesTableComponent } from "../../common-components/entities-table/entities-table.component";
import { EntityConstructor } from "../../entity/model/entity";
import { EntityListConfig } from "../../entity-list/EntityListConfig";

@Component({
  selector: "app-admin-entity-list",
  standalone: true,
  imports: [
    CommonModule,
    FilterComponent,
    MatTabGroup,
    EntitiesTableComponent,
    MatTab,
  ],
  templateUrl: "./admin-entity-list.component.html",
  styleUrl: "./admin-entity-list.component.scss",
})
export class AdminEntityListComponent {
  @Input() entityConstructor: EntityConstructor;
  @Input() config: EntityListConfig;
}
