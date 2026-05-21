import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  inject,
} from "@angular/core";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import {
  FaIconLibrary,
  FontAwesomeModule,
  IconDefinition,
} from "@fortawesome/angular-fontawesome";
import { Logging } from "../../logging/logging.service";
import { resolveIconDefinition } from "./fa-icon-utils";

/**
 * This component can be used to display dynamic Font-Awesome icons.
 * The term 'dynamic icons' refers to icons that are injected at runtime,
 * for example through the config.
 */
@Component({
  selector: "app-fa-dynamic-icon",
  template: ` @if (_icon()) {
    <fa-icon [icon]="_icon()"></fa-icon>
  }`,
  imports: [FontAwesomeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaDynamicIconComponent {
  private iconLibrary = inject(FaIconLibrary);

  /** The fallback icon if the given icon is neither known nor registered as a font-awesome icon */
  static fallbackIcon = faQuestionCircle;

  icon = input<string>();

  readonly _icon = computed<IconDefinition | undefined>(() => {
    const icon = this.icon();
    if (!icon) return undefined;
    let definition = resolveIconDefinition(icon, this.iconLibrary);
    if (!definition) {
      definition = FaDynamicIconComponent.fallbackIcon;
      Logging.warn(
        "Tried to set icon but it does not exist as a font awesome regular item nor is it registered as an alias.",
        icon,
      );
    }
    return definition;
  });
}
