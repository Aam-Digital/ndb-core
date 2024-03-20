import {
  Component,
  ContentChild,
  Input,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { AdminEntityFormComponent } from "../../admin-entity-details/admin-entity-form/admin-entity-form.component";
import { AdminEntityPanelComponentComponent } from "../../admin-entity-details/admin-entity-panel-component/admin-entity-panel-component.component";
import { AdminSectionHeaderComponent } from "../admin-section-header/admin-section-header.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButton } from "@angular/material/button";
import {
  MatTab,
  MatTabContent,
  MatTabGroup,
  MatTabLabel,
} from "@angular/material/tabs";
import { MatTooltip } from "@angular/material/tooltip";
import { AdminTabTemplateDirective } from "./admin-tab-template.directive";
import {
  CdkDragDrop,
  moveItemInArray,
  DragDropModule,
} from "@angular/cdk/drag-drop";

/**
 * Building block for drag&drop form builder to let an admin user manage multiple tabs.
 *
 * Provide a template for the tab content when using this component:
   <app-admin-tabs
     [tabs]="myTabsArray"
     [newTabFactory]="newTabFactory"
   >
     <!-- provide the array of tabs to the `appAdminTabTemplate` to infer typing -->
     <ng-template [appAdminTabTemplate]="myTabsArray" let-item>
       {{ item.title }} <!-- use the tab entry in your template -->
     </ng-template>
   </app-admin-tabs>
 */
@Component({
  selector: "app-admin-tabs",
  standalone: true,
  imports: [
    CommonModule,
    AdminEntityFormComponent,
    AdminEntityPanelComponentComponent,
    AdminSectionHeaderComponent,
    FaIconComponent,
    MatButton,
    MatTab,
    MatTabContent,
    MatTabGroup,
    MatTabLabel,
    MatTooltip,
    AdminTabTemplateDirective,
    DragDropModule,
  ],
  templateUrl: "./admin-tabs.component.html",
  styleUrl: "./admin-tabs.component.scss",
})
export class AdminTabsComponent<
  E extends { title: string } | { name: string },
> {
  @Input() tabs: E[];
  @Input() newTabFactory: () => E = () => ({ title: "" }) as E;

  @ContentChild(AdminTabTemplateDirective<E>, { read: TemplateRef })
  tabTemplate: TemplateRef<any>;

  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;

  createTab() {
    const newTab = this.newTabFactory();
    this.tabs.push(newTab);

    // wait until view has actually added the new tab before we can auto-select it
    setTimeout(() => {
      const newTabIndex = this.tabs.length - 1;
      this.tabGroup.selectedIndex = newTabIndex;
      this.tabGroup.focusTab(newTabIndex);
    });
  }
  getAllTabs(index) {
    var allTabs = [];
    for (var i = 0; i < this.tabs?.length; i++) {
      if (i != index) {
        allTabs.push("tabs-" + i);
      }
    }

    return allTabs;
  }

  drop(event: CdkDragDrop<string[]>) {
    const previousIndex = parseInt(
      event.previousContainer.id.replace("tabs-", ""),
    );
    const currentIndex = parseInt(event.container.id.replace("tabs-", ""));
    moveItemInArray(this.tabs, previousIndex, currentIndex);
    if (this.tabGroup.selectedIndex !== currentIndex) {
      this.tabGroup.selectedIndex = currentIndex;
      this.tabGroup.focusTab(currentIndex);
    }
    let tab = JSON.stringify(this.tabs);
    this.tabs = JSON.parse(tab); // Needed to avoid Angular Ivy render bug
  }
}
