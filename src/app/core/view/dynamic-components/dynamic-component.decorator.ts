import { OnInitDynamicComponent } from "./on-init-dynamic-component.interface";
import { viewRegistry } from "../../registry/dynamic-registry";

export function DynamicComponent<
  Constructor extends new (...args: any[]) => OnInitDynamicComponent
>(...aliases: string[]) {
  return (ctor: Constructor) => {
    viewRegistry.add(ctor.name.replace("Component", ""), ctor);
    viewRegistry.addAliases(aliases, ctor);
  };
}
