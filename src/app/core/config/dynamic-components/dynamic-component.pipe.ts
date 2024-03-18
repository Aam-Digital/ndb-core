import { Pipe, PipeTransform, Type } from "@angular/core";
import { ComponentRegistry } from "../../../dynamic-components";

@Pipe({
  name: "dynamicComponent",
  standalone: true,
})
export class DynamicComponentPipe implements PipeTransform {
  constructor(private componentRegistry: ComponentRegistry) {}

  async transform(value: string): Promise<Type<any>> {
    return await this.componentRegistry.get(value)();
  }
}
