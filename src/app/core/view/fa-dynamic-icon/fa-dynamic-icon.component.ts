import { Component, Input } from "@angular/core";
import { IconDefinition, IconName } from "@fortawesome/fontawesome-svg-core";
import {
  faChartLine,
  faChild,
  faHome,
  faQuestionCircle,
  faTable,
  faUniversity,
  faWrench,
} from "@fortawesome/free-solid-svg-icons";
import {
  faCalendar,
  faCalendarCheck,
  faFileAlt,
  faUser,
} from "@fortawesome/free-regular-svg-icons";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";

/**
 * font-awesome icons decoupled from the config
 */
const faDynamicIcons = new Map<string, IconDefinition>([
  ["home", faHome],
  ["child", faChild],
  ["university", faUniversity],
  ["calendar", faCalendar],
  ["calendar-check", faCalendarCheck],
  ["table", faTable],
  ["notes", faFileAlt],
  ["wrench", faWrench],
  ["user", faUser],
  ["question", faQuestionCircle],
  ["line-chart", faChartLine],
]);

@Component({
  selector: "app-fa-dynamic-icon",
  template: `<fa-icon [icon]="_icon"></fa-icon>`,
})
export class FaDynamicIconComponent {
  /** The fallback icon if the given icon is neither known (inside the internal map)
   * nor registered as a font-awesome icon
   * */
  static fallbackIcon = faQuestionCircle;

  @Input() set icon(icon: string) {
    let definition = faDynamicIcons.get(icon);
    if (!definition) {
      // Fallback if the icon is not available: search through the icon definitions
      definition = this.iconLibrary.getIconDefinition("far", icon as IconName);
    }
    if (!definition) {
      // Fallback if the icon is neither in the map nor a registered icon
      definition = FaDynamicIconComponent.fallbackIcon;
    }
    this._icon = definition;
  }
  _icon: IconDefinition;

  constructor(private iconLibrary: FaIconLibrary) {}
}
