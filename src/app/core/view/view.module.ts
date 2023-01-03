import { NgModule } from "@angular/core";
import {
  viewRegistry,
  ViewRegistry,
} from "./dynamic-components/dynamic-component.decorator";

/**
 * Generic components and services to allow assembling the app dynamically from config objects.
 */
@NgModule({
  providers: [{ provide: ViewRegistry, useValue: viewRegistry }],
})
export class ViewModule {}
