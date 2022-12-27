import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DynamicComponentDirective } from "./dynamic-components/dynamic-component.directive";
import { FaDynamicIconComponent } from "./fa-dynamic-icon/fa-dynamic-icon.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ViewTitleComponent } from "../entity-components/entity-utils/view-title/view-title.component";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import {
  viewRegistry,
  ViewRegistry,
} from "./dynamic-components/dynamic-component.decorator";
import { ApplicationLoadingComponent } from "./dynamic-routing/empty/application-loading.component";
import { NotFoundComponent } from "./dynamic-routing/not-found/not-found.component";
import { RouterModule } from "@angular/router";
import { MatLegacyProgressBarModule as MatProgressBarModule } from "@angular/material/legacy-progress-bar";

/**
 * Generic components and services to allow assembling the app dynamically from config objects.
 */
@NgModule({
  declarations: [
    DynamicComponentDirective,
    FaDynamicIconComponent,
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
    FaDynamicIconComponent,
    ViewTitleComponent,
    ApplicationLoadingComponent,
  ],
})
export class ViewModule {}
