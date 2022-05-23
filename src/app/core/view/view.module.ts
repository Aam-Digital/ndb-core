import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DynamicComponentDirective } from "./dynamic-components/dynamic-component.directive";
import { FaDynamicIconComponent } from "./fa-dynamic-icon/fa-dynamic-icon.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ViewTitleComponent } from "../entity-components/entity-utils/view-title/view-title.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";
import {
  viewRegistry,
  ViewRegistry,
} from "./dynamic-components/dynamic-component.decorator";
import { EmptyComponent } from "./dynamic-routing/empty/empty.component";
import { NotFoundComponent } from "./dynamic-routing/not-found/not-found.component";
import { RouterModule } from "@angular/router";
import { FlexModule } from "@angular/flex-layout";
import { MatProgressBarModule } from "@angular/material/progress-bar";

/**
 * Generic components and services to allow assembling the app dynamically from config objects.
 */
@NgModule({
  declarations: [
    DynamicComponentDirective,
    FaDynamicIconComponent,
    ViewTitleComponent,
    EmptyComponent,
    NotFoundComponent,
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatTooltipModule,
    MatButtonModule,
    RouterModule,
    FlexModule,
    MatProgressBarModule,
  ],
  providers: [{ provide: ViewRegistry, useValue: viewRegistry }],
  exports: [
    DynamicComponentDirective,
    FaDynamicIconComponent,
    ViewTitleComponent,
    EmptyComponent,
  ],
})
export class ViewModule {}
