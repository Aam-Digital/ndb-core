import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DynamicComponentDirective } from "./dynamic-components/dynamic-component.directive";
import { FaDynamicIconComponent } from "./fa-dynamic-icon/fa-dynamic-icon.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

/**
 * Generic components and services to allow assembling the app dynamically from config objects.
 */
@NgModule({
  declarations: [DynamicComponentDirective, FaDynamicIconComponent],
  imports: [CommonModule, FontAwesomeModule],
  exports: [DynamicComponentDirective, FaDynamicIconComponent],
})
export class ViewModule {}
