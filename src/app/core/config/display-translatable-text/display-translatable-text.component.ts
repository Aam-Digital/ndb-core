import { ChangeDetectionStrategy, Component, computed } from "@angular/core";
import { ViewDirective } from "#src/app/core/entity/default-datatype/view.directive";
import { DynamicComponent } from "../dynamic-components/dynamic-component.decorator";
import { TranslatableText } from "../multi-lingual-config";
import { resolveLocaleText } from "../../language/active-locale";

/** Display a configurable text in the user's active language. */
@DynamicComponent("DisplayTranslatableText")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-display-translatable-text",
  template: `{{ displayText() }}`,
  standalone: true,
})
export class DisplayTranslatableTextComponent extends ViewDirective<TranslatableText> {
  readonly displayText = computed(() => resolveLocaleText(this.value()));
}
