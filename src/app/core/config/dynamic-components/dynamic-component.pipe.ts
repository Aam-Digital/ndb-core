import { Pipe, PipeTransform, Type, inject } from "@angular/core";
import { ComponentRegistry } from "../../../dynamic-components";

/**
 * Transform a string "component name" and load the referenced component.
 *
 * This is async and needs an additional async pipe. Use with *ngComponentOutlet
```
<ng-container
  *ngComponentOutlet="
    'EntityDetails' | dynamicComponent | async;
    inputs: config
  "
></ng-container>
```
 */
@Pipe({
  name: "dynamicComponent",
  standalone: true,
})
export class DynamicComponentPipe implements PipeTransform {
  private componentRegistry = inject(ComponentRegistry);

  async transform(value: string): Promise<Type<any>> {
    return await this.componentRegistry.get(value)();
  }
}
