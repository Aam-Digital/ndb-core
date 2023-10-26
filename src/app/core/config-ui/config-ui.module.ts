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

const routes: Routes = [
  {
    path: "entity/:entityType",
    component: ConfigEntityComponent,
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
  ],
  exports: [RouterModule],
  declarations: [ConfigEntityComponent, ConfigEntityFormComponent],
})
export class ConfigUiModule {}
