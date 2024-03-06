import { Component, Input, ViewChild } from "@angular/core";
import {
  EntityDetailsConfig,
  Panel,
} from "../../../entity-details/EntityDetailsConfig";
import { EntityConstructor } from "../../../entity/model/entity";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
import { NgForOf, NgIf } from "@angular/common";
import { MatTabGroup, MatTabsModule } from "@angular/material/tabs";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { EntityTypeLabelPipe } from "../../../common-components/entity-type-label/entity-type-label.pipe";
import { ViewTitleComponent } from "../../../common-components/view-title/view-title.component";
import { AdminSectionHeaderComponent } from "../admin-section-header/admin-section-header.component";
import { AdminEntityFormComponent } from "../admin-entity-form/admin-entity-form.component";
import { AdminEntityPanelComponentComponent } from "../admin-entity-panel-component/admin-entity-panel-component.component";
import { MatTooltipModule } from "@angular/material/tooltip";

@DynamicComponent("AdminEntityDetails")
@Component({
  selector: "app-admin-entity-details",
  templateUrl: "./admin-entity-details.component.html",
  styleUrls: ["./admin-entity-details.component.scss"],
  standalone: true,
  imports: [
    MatTabsModule,
    FaIconComponent,
    MatButtonModule,
    EntityTypeLabelPipe,
    ViewTitleComponent,
    AdminSectionHeaderComponent,
    AdminEntityFormComponent,
    AdminEntityPanelComponentComponent,
    MatTooltipModule,
    NgForOf,
    NgIf,
  ],
})
export class AdminEntityDetailsComponent {
  @Input() entityConstructor: EntityConstructor;
  @Input() config: EntityDetailsConfig;

  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;

  createPanel() {
    const newPanel: Panel = { title: "New Tab", components: [] };
    this.config.panels.push(newPanel);

    // wait until view has actually added the new tab before we can auto-select it
    setTimeout(() => {
      const newTabIndex = this.config.panels.length - 1;
      this.tabGroup.selectedIndex = newTabIndex;
      this.tabGroup.focusTab(newTabIndex);
    });
  }

  addComponent(panel: Panel) {
    panel.components.push({
      title: $localize`:Default title:New Section`,
      component: "Form", // TODO: make this configurable
      config: { fieldGroups: [] },
    });
  }
}
