import { genders } from "app/child-dev-project/children/model/genders";
import { materials } from "app/child-dev-project/children/demo-data-generators/educational-material/materials";
import {
  mathLevels,
  readingLevels,
} from "app/child-dev-project/children/demo-data-generators/aser/skill-levels";
import { warningLevels } from "app/child-dev-project/warning-level";
import { ratingAnswers } from "app/child-dev-project/children/demo-data-generators/observations/rating-answers";
import { centersUnique } from "app/child-dev-project/children/demo-data-generators/fixtures/centers";
import { defaultAttendanceStatusTypes } from "app/core/config/default-config/default-attendance-status-types";
import { INTERACTION_TYPE_CONFIG_ID } from "app/child-dev-project/notes/model/interaction-type.interface";
import { defaultInteractionTypes } from "app/core/config/default-config/default-interaction-types";
import { ConfigurableEnum } from "./configurable-enum";

export function getDefaultEnumEntities(): ConfigurableEnum[] {
  return Object.entries({
    genders: genders,
    materials: materials,
    "math-levels": mathLevels,
    "reading-levels": readingLevels,
    "warning-levels": warningLevels,
    "rating-answer": ratingAnswers,
    center: centersUnique,
    "attendance-status": defaultAttendanceStatusTypes,
    [INTERACTION_TYPE_CONFIG_ID]: defaultInteractionTypes,
  }).map(([key, value]) => {
    const e = new ConfigurableEnum(key);
    e.values = value;
    return e;
  });
}
