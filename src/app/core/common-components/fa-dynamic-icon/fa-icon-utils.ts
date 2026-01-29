import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";
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
  IconDefinition,
} from "@fortawesome/angular-fontawesome";

/**
 * A map to prevent old configs from breaking.
 */
const iconAliases = new Map<string, IconDefinition>([
  ["calendar-check-o", faCalendarCheck],
  ["file-text", faFileAlt],
  ["question", faQuestionCircle],
  ["line-chart", faChartLine],
  ["calendar", faCalendarAlt],
  ["users", faUsers],
]);

export const resolveIconDefinition = (
  icon: string | null | undefined,
  iconLibrary: FaIconLibrary,
): IconDefinition | undefined => {
  if (!icon) {
    return undefined;
  }

  const trimmedIcon = icon.trim();
  if (!trimmedIcon) {
    return undefined;
  }

  const aliasDefinition = iconAliases.get(trimmedIcon);
  if (aliasDefinition) {
    return aliasDefinition;
  }

  const iconAndDef = trimmedIcon.split(" ");
  if (iconAndDef.length === 1) {
    return iconLibrary.getIconDefinition("fas", trimmedIcon as IconName);
  }

  return iconLibrary.getIconDefinition(
    iconAndDef[0] as IconPrefix,
    iconAndDef[1] as IconName,
  );
};
