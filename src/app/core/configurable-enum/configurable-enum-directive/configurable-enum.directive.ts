import { Directive, Input, TemplateRef, ViewContainerRef } from "@angular/core";
import {
  CONFIGURABLE_ENUM_CONFIG_PREFIX,
  ConfigurableEnumConfig,
} from "../configurable-enum.interface";
import { ConfigService } from "../../config/config.service";

/**
 * Enumerate over all {@link ConfigurableEnumConfig} values for the given enum config id.
 *
 * Works similar to `*ngFor`:
 * `<div *appConfigurableEnum="let item of 'interaction-type'"></div>`
 * will create one div for each option defined in the config for "enum:interaction-type".
 */
@Directive({
  selector: "[appConfigurableEnum]",
})
export class ConfigurableEnumDirective {
  /**
   * Sets the string id of the enum config id.
   * @param enumConfigId
   */
  @Input() set appConfigurableEnumOf(enumConfigId: string) {
    if (!enumConfigId.startsWith(CONFIGURABLE_ENUM_CONFIG_PREFIX)) {
      enumConfigId = CONFIGURABLE_ENUM_CONFIG_PREFIX + enumConfigId;
    }

    const options =
      this.configService.getConfig<ConfigurableEnumConfig>(enumConfigId);
    for (const item of options) {
      this.viewContainerRef.createEmbeddedView(this.templateRef, {
        $implicit: item,
      });
    }
  }

  /**
   * For implementation details see
   * https://www.talkinghightech.com/en/create-ngfor-directive/ and
   * https://angular.io/guide/structural-directives#write-a-structural-directive
   *
   * @param templateRef
   * @param viewContainerRef
   * @param configService
   */
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainerRef: ViewContainerRef,
    private configService: ConfigService
  ) {}
}
