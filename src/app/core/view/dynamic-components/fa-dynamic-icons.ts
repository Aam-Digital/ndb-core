import {
  faChartLine,
  faChild,
  faHome,
  faTable,
  faUniversity,
  faQuestionCircle,
  faWrench,
  faFileImport,
} from "@fortawesome/free-solid-svg-icons";
import {
  faCalendar,
  faCalendarCheck,
  faFileAlt,
  faUser,
} from "@fortawesome/free-regular-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

/**
 * font-awesome icons decoupled from the config
 */
export const faDynamicIcons = new Map<string, IconDefinition>([
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
  ["file-import", faFileImport]
]);
