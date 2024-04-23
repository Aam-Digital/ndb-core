import {
  Component,
  ContentChild,
  Input,
  OnChanges,
  SimpleChanges,
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
  DragDropModule,
  moveItemInArray,
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
export class AdminTabsComponent<E extends { title: string } | { name: string }>
  implements OnChanges
{
  @Input() tabs: E[];
  @Input() newTabFactory: () => E = () =>
    ({ [this.tabTitleProperty]: "" }) as E;

  tabTitleProperty: "title" | "name" = "title";

  @ContentChild(AdminTabTemplateDirective<E>, { read: TemplateRef })
  tabTemplate: TemplateRef<any>;

  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.tabs) {
      this.detectTabTitleProperty();
    }
  }

  private detectTabTitleProperty() {
    if (!this.tabs || this.tabs.length < 1) {
      return;
    }

    this.tabTitleProperty = this.tabs[0].hasOwnProperty("name")
      ? "name"
      : "title";
  }

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

  /**
   * A list of tab element ids required for linking drag&drop targets
   * due to the complex template of tab headers.
   * @param index
   */
  getAllTabs(index: number) {
    const allTabs = [];
    for (let i = 0; i < this.tabs?.length; i++) {
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

    const previouslySelectedTab = this.tabs[this.tabGroup.selectedIndex];

    moveItemInArray(this.tabs, previousIndex, currentIndex);

    // re-select the previously selected tab, even after its index shifted
    let shiftedSelectedIndex = this.tabs.indexOf(previouslySelectedTab);
    if (shiftedSelectedIndex !== this.tabGroup.selectedIndex) {
      this.tabGroup.selectedIndex = shiftedSelectedIndex;
      this.tabGroup.focusTab(shiftedSelectedIndex);
    }

    this.tabs = JSON.parse(JSON.stringify(this.tabs)); // Needed to avoid Angular Ivy render bug
  }
}
