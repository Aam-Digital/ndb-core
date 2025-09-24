import { Component, Input, inject, signal } from "@angular/core";
import {
  EntityDetailsConfig,
  Panel,
  PanelComponent,
} from "../../../entity-details/EntityDetailsConfig";
import { EntityConstructor } from "../../../entity/model/entity";
import { DynamicComponent } from "../../../config/dynamic-components/dynamic-component.decorator";
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
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { WidgetComponentSelectComponent } from "#src/app/core/admin/admin-entity-details/widget-component-select/widget-component-select.component";

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
    AdminTabsComponent,
    AdminTabTemplateDirective,
    MatExpansionModule,
    MatIconModule,
    DragDropModule,
  ],
})
export class AdminEntityDetailsComponent {
  private dialog = inject(MatDialog);
  /** Track expanded sections */
  private expandedSections = signal<Set<string>>(new Set());

  @Input() entityConstructor: EntityConstructor;
  @Input() config: EntityDetailsConfig;

  newPanelFactory(): Panel {
    return { title: "New Tab", components: [] };
  }

  addComponent(panel: Panel) {
    this.dialog
      .open(WidgetComponentSelectComponent, {
        data: { entityType: this.entityConstructor.ENTITY_TYPE },
      })
      .afterClosed()
      .subscribe((sectionConfig: PanelComponent) => {
        if (sectionConfig) {
          panel.components.push(sectionConfig);
        }
      });
  }

  onSectionDrop(panel: Panel, event: CdkDragDrop<PanelComponent[]>) {
    if (
      event.previousIndex === event.currentIndex ||
      event.currentIndex < 0 ||
      event.currentIndex >= panel.components.length
    ) {
      return;
    }

    moveItemInArray(panel.components, event.previousIndex, event.currentIndex);
  }

  /**
   * Generate a unique identifier for a panel component/sections
   */
  private getSectionId(panel: Panel, component: PanelComponent): string {
    const panelIndex = this.config.panels.indexOf(panel);
    const componentIndex = panel.components.indexOf(component);
    return `${panelIndex}-${componentIndex}-${component.component || "unknown"}`;
  }

  isSectionExpanded(panel: Panel, component: PanelComponent): boolean {
    const componentId = this.getSectionId(panel, component);

    // Auto-expand if it's the only component/sections in the panel
    if (
      panel.components.length <= 1 &&
      !this.expandedSections().has(componentId)
    ) {
      return true;
    }

    return this.expandedSections().has(componentId);
  }

  onSectionOpened(panel: Panel, component: PanelComponent) {
    const componentId = this.getSectionId(panel, component);
    this.expandedSections.update((sections) => {
      const newSections = new Set(sections);
      newSections.add(componentId);
      return newSections;
    });
  }

  onSectionClosed(panel: Panel, component: PanelComponent) {
    const componentId = this.getSectionId(panel, component);
    this.expandedSections.update((sections) => {
      const newSections = new Set(sections);
      newSections.delete(componentId);
      return newSections;
    });
  }
}
