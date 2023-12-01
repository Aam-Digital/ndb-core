import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ConfigEntityComponent } from "./config-entity/config-entity.component";
import { RouterModule, Routes } from "@angular/router";
import { MatTabsModule } from "@angular/material/tabs";
import { ViewTitleComponent } from "../common-components/view-title/view-title.component";
import { EntityTypeLabelPipe } from "../common-components/entity-type-label/entity-type-label.pipe";
import { ConfigEntityFormComponent } from "./config-entity-form/config-entity-form.component";
import { HelpButtonComponent } from "../common-components/help-button/help-button.component";
import { DynamicComponentDirective } from "../config/dynamic-components/dynamic-component.directive";
import { RoutedViewComponent } from "../ui/routed-view/routed-view.component";
import { ComponentRegistry } from "../../dynamic-components";
import {
  CdkDrag,
  CdkDragHandle,
  CdkDropList,
  CdkDropListGroup,
} from "@angular/cdk/drag-drop";
import { FormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatCardModule } from "@angular/material/card";
import { ConfigEntityPanelComponentComponent } from "./config-entity-panel-component/config-entity-panel-component.component";
import { Angulartics2OnModule } from "angulartics2";
import { DisableEntityOperationDirective } from "../permissions/permission-directive/disable-entity-operation.directive";
import { ConfigSectionHeaderComponent } from "./config-section-header/config-section-header.component";
import { EntityFieldEditComponent } from "../common-components/entity-field-edit/entity-field-edit.component";
import { EntityFieldLabelComponent } from "../common-components/entity-field-label/entity-field-label.component";

const routes: Routes = [
  {
    path: "entity/:entityType",
    component: RoutedViewComponent,
    data: {
      component: "ConfigEntity",
    },
  },
];

/**
 * An intuitive UI for users to set up and configure the application's data structures and views
 * directly from within the app itself.
 */
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ViewTitleComponent,
    EntityTypeLabelPipe,
    MatTabsModule,
    HelpButtonComponent,
    DynamicComponentDirective,
    CdkDrag,
    CdkDropList,
    CdkDropListGroup,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    FontAwesomeModule,
    MatTooltipModule,
    CdkDragHandle,
    MatCardModule,
    ConfigEntityPanelComponentComponent,
    Angulartics2OnModule,
    DisableEntityOperationDirective,
    ConfigSectionHeaderComponent,
    EntityFieldEditComponent,
    EntityFieldLabelComponent,
  ],
  exports: [RouterModule, ConfigEntityComponent],
  declarations: [ConfigEntityComponent, ConfigEntityFormComponent],
})
export class ConfigUiModule {
  constructor(components: ComponentRegistry) {
    components.addAll([
      [
        "ConfigEntity",
        () =>
          import("./config-entity/config-entity.component").then(
            (c) => c.ConfigEntityComponent,
          ),
      ],
    ]);
  }
}
