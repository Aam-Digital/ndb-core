import { Directive, Input, TemplateRef, ViewContainerRef, inject } from "@angular/core";
import { ConfigurableEnumService } from "../configurable-enum.service";
import { ConfigurableEnumValue } from "../configurable-enum.types";

/**
 * Enumerate over all {@link ConfigurableEnumConfig} values for the given enum config id.
 *
 * Works similar to `*ngFor`:
 * `<div *appConfigurableEnum="let item of 'interaction-type'"></div>`
 * will create one div for each option defined in the config for "enum:interaction-type".
 */
@Directive({
  selector: "[appConfigurableEnum]",
  standalone: true,
})
export class ConfigurableEnumDirective {
  private templateRef = inject<TemplateRef<any>>(TemplateRef);
  private viewContainerRef = inject(ViewContainerRef);
  private enumService = inject(ConfigurableEnumService);

  /**
   * Sets the string id of the enum config id.
   * @param enumConfigId
   */
  @Input() set appConfigurableEnumOf(enumConfigId: string) {
    const options = this.enumService.getEnumValues(enumConfigId);
    for (const item of options) {
      this.viewContainerRef.createEmbeddedView(this.templateRef, {
        $implicit: item,
      });
    }
  }

  /**
   * Make sure the template checker knows the type of the context with which the
   * template of this directive will be rendered
   * See {@link https://angular.io/guide/structural-directives#typing-the-directives-context}
   * @param directive
   * @param context
   */

  static ngTemplateContextGuard(
    directive: ConfigurableEnumDirective,
    context: unknown,
  ): context is { $implicit: ConfigurableEnumValue } {
    return true;
  }
}
