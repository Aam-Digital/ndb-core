import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import {
  IconDefinition,
  IconName,
  IconPrefix,
} from "@fortawesome/fontawesome-svg-core";
import {
  faCalendarAlt,
  faCalendarCheck,
  faChartLine,
  faFileAlt,
  faQuestionCircle,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import {
  FaIconLibrary,
  FontAwesomeModule,
} from "@fortawesome/angular-fontawesome";
import { Logging } from "../../logging/logging.service";
import { NgIf } from "@angular/common";

/**
 * A map to prevent old configs to be broken
 */
const iconAliases = new Map<string, IconDefinition>([
  ["calendar-check-o", faCalendarCheck],
  ["file-text", faFileAlt],
  ["question", faQuestionCircle],
  ["line-chart", faChartLine],
  ["calendar", faCalendarAlt],
  ["users", faUsers],
]);

/**
 * This component can be used to display dynamic Font-Awesome icons.
 * The term 'dynamic icons' refers to icons that are injected at runtime,
 * for example through the config.
 */
@Component({
  selector: "app-fa-dynamic-icon",
  template: ` <fa-icon *ngIf="_icon" [icon]="_icon"></fa-icon>`,
  imports: [FontAwesomeModule, NgIf],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaDynamicIconComponent {
  /** The fallback icon if the given icon is neither known (inside the internal map)
   * nor registered as a font-awesome icon
   */
  static fallbackIcon = faQuestionCircle;

  /**
   * Sets the dynamic icon by name.
   * You should make sure that the icon is registered inside the {@link iconAliases}-map,
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
    if (!icon) {
      this._icon = undefined;
      return;
    }
    let definition = iconAliases.get(icon);
    if (!definition && icon) {
      const iconAndDef = icon.split(" ");
      if (iconAndDef.length === 1) {
        definition = this.iconLibrary.getIconDefinition(
          "fas",
          icon as IconName,
        );
      } else {
        definition = this.iconLibrary.getIconDefinition(
          iconAndDef[0] as IconPrefix,
          iconAndDef[1] as IconName,
        );
      }
      // Fallback if the icon is not available: search through the icon definitions
    }
    if (!definition) {
      // Fallback if the icon is neither in the map nor a registered icon
      definition = FaDynamicIconComponent.fallbackIcon;
      Logging.warn(
        `Tried to set icon "${icon}" but it does not exist as a font awesome regular item nor is it registered as an alias.`,
      );
    }
    this._icon = definition;
  }

  /**
   * The font-awesome internal icon definition
   */
  _icon: IconDefinition;

  constructor(private iconLibrary: FaIconLibrary) {}
}
