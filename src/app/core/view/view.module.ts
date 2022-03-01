import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DynamicComponentDirective } from "./dynamic-components/dynamic-component.directive";
import { FaDynamicIconComponent } from "./fa-dynamic-icon/fa-dynamic-icon.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ViewTitleComponent } from "../entity-components/entity-utils/view-title/view-title.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";

/**
 * Generic components and services to allow assembling the app dynamically from config objects.
 */
@NgModule({
  declarations: [
    DynamicComponentDirective,
    FaDynamicIconComponent,
    ViewTitleComponent,
  ],
  imports: [CommonModule, FontAwesomeModule, MatTooltipModule, MatButtonModule],
  exports: [
    DynamicComponentDirective,
    FaDynamicIconComponent,
    ViewTitleComponent,
  ],
})
export class ViewModule {}
