import {
  Component,
  ContentChild,
  TemplateRef,
  ViewChild,
  computed,
  ChangeDetectionStrategy,
  input,
  model,
} from "@angular/core";
import { CommonModule } from "@angular/common";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-admin-tabs",
  imports: [
    CommonModule,
    AdminSectionHeaderComponent,
    FaIconComponent,
    MatButton,
    MatTab,
    MatTabContent,
    MatTabGroup,
    MatTabLabel,
    MatTooltip,
    DragDropModule,
  ],
  templateUrl: "./admin-tabs.component.html",
  styleUrl: "./admin-tabs.component.scss",
})
export class AdminTabsComponent<
  E extends { title: string } | { name: string },
> {
  tabs = model<E[]>([]);
  newTabFactory = input<() => E>(
    () => ({ [this.tabTitleProperty()]: "" }) as E,
  );

  tabTitleProperty = computed<"title" | "name">(() => {
    const tabs = this.tabs();
    if (!tabs || tabs.length < 1) {
      return "title";
    }
    return tabs[0].hasOwnProperty("name") ? "name" : "title";
  });

  @ContentChild(AdminTabTemplateDirective<E>, { read: TemplateRef })
  tabTemplate: TemplateRef<any>;

  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;

  createTab() {
    const newTab = this.newTabFactory()();
    this.tabs.update((tabs) => [...tabs, newTab]);

    // wait until view has actually added the new tab before we can auto-select it
    setTimeout(() => {
      const newTabIndex = this.tabs().length - 1;
      this.tabGroup.selectedIndex = newTabIndex;
      this.tabGroup.focusTab(newTabIndex);
    });
  }

  removeTab(index: number) {
    this.tabs.update((tabs) =>
      tabs.filter((_, tabIndex) => tabIndex !== index),
    );
    this.tabGroup.selectedIndex = index - 1;
  }

  /**
   * For each tab, the list of other tab element ids required for linking drag&drop targets
   * due to the complex template of tab headers.
   */
  allTabIds = computed<string[][]>(() =>
    this.tabs().map((_, index, tabs) =>
      tabs.map((__, i) => "tabs-" + i).filter((_, i) => i !== index),
    ),
  );

  drop(event: CdkDragDrop<string[]>) {
    const previousIndex = parseInt(
      event.previousContainer.id.replace("tabs-", ""),
    );
    const currentIndex = parseInt(event.container.id.replace("tabs-", ""));

    const previouslySelectedTab = this.tabs()[this.tabGroup.selectedIndex];

    this.tabs.update((tabs) => {
      const nextTabs = [...tabs];
      moveItemInArray(nextTabs, previousIndex, currentIndex);
      return nextTabs;
    });

    // re-select the previously selected tab, even after its index shifted
    let shiftedSelectedIndex = this.tabs().indexOf(previouslySelectedTab);
    if (shiftedSelectedIndex !== this.tabGroup.selectedIndex) {
      this.tabGroup.selectedIndex = shiftedSelectedIndex;
      this.tabGroup.focusTab(shiftedSelectedIndex);
    }

    this.tabs.update((tabs) => JSON.parse(JSON.stringify(tabs))); // Needed to avoid Angular Ivy render bug
  }
}
