import { DynamicRegistry } from "../../registry/DynamicRegistry";
import { OnInitDynamicComponent } from "./on-init-dynamic-component.interface";

export function DynamicComponent<
  Constructor extends new (...args: any[]) => OnInitDynamicComponent
>(...aliases: string[]) {
  return (ctor: Constructor) => {
    DynamicRegistry.VIEW.add(ctor.name.replace("Component", ""), ctor);
    DynamicRegistry.VIEW.addAliases(aliases, ctor);
  };
}
