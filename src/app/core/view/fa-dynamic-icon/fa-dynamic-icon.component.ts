import { Component, Input } from "@angular/core";
import {
  IconDefinition,
  IconName,
  IconPrefix,
} from "@fortawesome/fontawesome-svg-core";
import {
  faChartLine,
  faChild,
  faHome,
  faQuestionCircle,
  faTable,
  faUniversity,
  faWrench,
  faCalendarCheck,
  faCalendar,
  faFileAlt,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
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
   * A prefix can be specified using the syntax "<prefix> <icon-name>", for example
   * "far address-book". The default prefix, if not specified, is "fas"
   * (font-awesome solid icons)
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
      const iconAndDef = icon.split(" ");
      if (iconAndDef.length === 1) {
        definition = this.iconLibrary.getIconDefinition(
          "fas",
          icon as IconName
        );
      } else {
        definition = this.iconLibrary.getIconDefinition(
          iconAndDef[0] as IconPrefix,
          iconAndDef[1] as IconName
        );
      }
      // Fallback if the icon is not available: search through the icon definitions
    }
    if (!definition) {
      // Fallback if the icon is neither in the map nor a registered icon
      definition = FaDynamicIconComponent.fallbackIcon;
      this.loggingService.warn(
        `Tried to set icon ${icon} but it is neither registered as dynamic icon ` +
          `nor does it exist as font-awesome regular item`
      );
    }
    this._icon = definition;
  }

  /**
   * The font-awesome internal icon definition
   */
  _icon: IconDefinition;

  constructor(
    private iconLibrary: FaIconLibrary,
    private loggingService: LoggingService
  ) {}
}
