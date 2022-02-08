import { DynamicRegistry } from "../../registry/DynamicRegistry";
import { OnInitDynamicComponent } from "./on-init-dynamic-component.interface";

export function DynamicComponent<
  Constructor extends new (...args: any[]) => OnInitDynamicComponent
>(name?: string, ...aliases: string[]) {
  return (ctor: Constructor) => {
    if (name === undefined) {
      DynamicRegistry.VIEW.add(ctor.name.replace("Component", ""), ctor);
    } else {
      DynamicRegistry.VIEW.add(name, ctor);
    }
    DynamicRegistry.VIEW.addAliases(aliases, ctor);
  };
}
