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
import { LoggingService } from "../../logging/logging.service";

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

/**
 * This component can be used to display dynamic Font-Awesome icons.
 * The term 'dynamic icons' refers to icons that are injected at runtime,
 * for example through the config.
 */
@Component({
  selector: "app-fa-dynamic-icon",
  template: `<fa-icon [icon]="_icon"></fa-icon>`,
})
export class FaDynamicIconComponent {
  /** The fallback icon if the given icon is neither known (inside the internal map)
   * nor registered as a font-awesome icon
   */
  static fallbackIcon = faQuestionCircle;

  /**
   * Sets the dynamic icon by name.
   * You should make sure that the icon is registered inside the {@link faDynamicIcons}-map,
   * or put it into this map if it isn't there.
   * <br>
   * If for some reason the icon is not inside the map or cannot be inserted into the map,
   * the icon name has to match the <em>exact</em> icon name as provided by font-awesome.
   * Prefixed icon names are not supported and the prefix is always assumed to be `far`
   * (font awesome regular items).
   * <br>
   * In case the provided icon still doesn't exist, a question-mark-icon with circle
   * (see {@link fallbackIcon}) will be shown.
   * <br>
   * Note that there is no getter and you should not attempt to get the icon name, for example via
   * {@link _icon#iconName} since it is not guaranteed to be the same as the provided name
   * @param icon the icon name
   */
  @Input() set icon(icon: string) {
    let definition = faDynamicIcons.get(icon);
    if (!definition) {
      // Fallback if the icon is not available: search through the icon definitions
      definition = this.iconLibrary.getIconDefinition("far", icon as IconName);
    }
    if (!definition) {
      // Fallback if the icon is neither in the map nor a registered icon
      this.loggingService.debug('Icon not found: ' + icon);
      definition = FaDynamicIconComponent.fallbackIcon;
    }
    this._icon = definition;
  }

  /**
   * The font-awesome internal icon definition
   */
  _icon: IconDefinition;

  constructor(private iconLibrary: FaIconLibrary, private loggingService: LoggingService) {}
}
