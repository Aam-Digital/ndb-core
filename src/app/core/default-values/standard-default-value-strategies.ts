import { DefaultValueStrategy } from "./default-value-strategy.interface";
import { StaticDefaultValueService } from "./x-static/static-default-value.service";
import { DynamicPlaceholderValueService } from "./x-dynamic-placeholder/dynamic-placeholder-value.service";
import { InheritedValueService } from "../../features/inherited-field/inherited-value.service";

/**
 * Standard default-value strategies that are used in the application.
 * Add further providers to your modules or the AppModule to extend.
 */
export const defaultValueStrategyProviders = [
  {
    provide: DefaultValueStrategy,
    useClass: StaticDefaultValueService,
    multi: true,
  },
  {
    provide: DefaultValueStrategy,
    useClass: DynamicPlaceholderValueService,
    multi: true,
  },
  {
    provide: DefaultValueStrategy,
    useClass: InheritedValueService,
    multi: true,
  },
];
