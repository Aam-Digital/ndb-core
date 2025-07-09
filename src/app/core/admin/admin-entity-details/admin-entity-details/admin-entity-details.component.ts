import { Component, Input } from "@angular/core";
import {
  EntityDetailsConfig,
  Panel,
  PanelComponent,
} from "../../../entity-details/EntityDetailsConfig";
import { EntityConstructor } from "../../../entity/model/entity";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { NgForOf, NgIf } from "@angular/common";
import { MatTabsModule } from "@angular/material/tabs";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { ViewTitleComponent } from "../../../common-components/view-title/view-title.component";
import { AdminSectionHeaderComponent } from "../../building-blocks/admin-section-header/admin-section-header.component";
import { AdminEntityFormComponent } from "../admin-entity-form/admin-entity-form.component";
import { AdminEntityPanelComponentComponent } from "../admin-entity-panel-component/admin-entity-panel-component.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AdminTabsComponent } from "../../building-blocks/admin-tabs/admin-tabs.component";
import { AdminTabTemplateDirective } from "../../building-blocks/admin-tabs/admin-tab-template.directive";
import { MatDialog } from "@angular/material/dialog";
import { EntityComponentSelectComponent } from "../entity-component-select-component/entity-component-select-component";

@DynamicComponent("AdminEntityDetails")
@Component({
  selector: "app-admin-entity-details",
  templateUrl: "./admin-entity-details.component.html",
  styleUrls: [
    "./admin-entity-details.component.scss",
    "../../admin-entity/admin-entity-styles.scss",
  ],
  imports: [
    MatTabsModule,
    FaIconComponent,
    MatButtonModule,
    ViewTitleComponent,
    AdminSectionHeaderComponent,
    AdminEntityFormComponent,
    AdminEntityPanelComponentComponent,
    MatTooltipModule,
    NgForOf,
    NgIf,
    AdminTabsComponent,
    AdminTabTemplateDirective,
  ],
})
export class AdminEntityDetailsComponent {
  @Input() entityConstructor: EntityConstructor;
  @Input() config: EntityDetailsConfig;

  constructor(private dialog: MatDialog) {}

  newPanelFactory(): Panel {
    return { title: "New Tab", components: [] };
  }

  addComponent(panel: Panel) {
    this.dialog
      .open(EntityComponentSelectComponent, {
        data: { entityType: this.entityConstructor.ENTITY_TYPE },
      })
      .afterClosed()
      .subscribe((sectionConfig: PanelComponent) => {
        if (sectionConfig) {
          panel.components.push(sectionConfig);
        }
      });
  }
}
