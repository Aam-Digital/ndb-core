import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DynamicComponentDirective } from "./dynamic-components/dynamic-component.directive";

/**
 * Generic components and services to allow assembling the app dynamically from config objects.
 */
@NgModule({
  declarations: [DynamicComponentDirective],
  imports: [CommonModule],
  exports: [DynamicComponentDirective],
})
export class ViewModule {}
