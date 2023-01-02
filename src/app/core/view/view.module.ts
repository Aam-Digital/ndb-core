import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DynamicComponentDirective } from "./dynamic-components/dynamic-component.directive";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ViewTitleComponent } from "../entity-components/entity-utils/view-title/view-title.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";
import {
  viewRegistry,
  ViewRegistry,
} from "./dynamic-components/dynamic-component.decorator";
import { ApplicationLoadingComponent } from "./dynamic-routing/empty/application-loading.component";
import { NotFoundComponent } from "./dynamic-routing/not-found/not-found.component";
import { RouterModule } from "@angular/router";
import { MatProgressBarModule } from "@angular/material/progress-bar";

/**
 * Generic components and services to allow assembling the app dynamically from config objects.
 */
@NgModule({
  declarations: [
    DynamicComponentDirective,
    ViewTitleComponent,
    ApplicationLoadingComponent,
    NotFoundComponent,
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatTooltipModule,
    MatButtonModule,
    RouterModule,
    MatProgressBarModule,
  ],
  providers: [{ provide: ViewRegistry, useValue: viewRegistry }],
  exports: [
    DynamicComponentDirective,
    ViewTitleComponent,
    ApplicationLoadingComponent,
  ],
})
export class ViewModule {}
