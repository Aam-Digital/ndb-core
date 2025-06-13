import { ConfigurableEnumService } from "./configurable-enum.service";
import { NEVER } from "rxjs";
import { genders } from "../../../child-dev-project/children/model/genders";
import { materials } from "../../../child-dev-project/children/demo-data-generators/educational-material/materials";
import {
  mathLevels,
  readingLevels,
} from "../../../child-dev-project/children/demo-data-generators/aser/skill-levels";
import { warningLevels } from "../../../child-dev-project/warning-level";
import { ratingAnswers } from "../../../child-dev-project/children/demo-data-generators/observations/rating-answers";
import { centersUnique } from "../../../child-dev-project/children/demo-data-generators/fixtures/centers";
import { defaultAttendanceStatusTypes } from "../../config/default-config/default-attendance-status-types";
import { INTERACTION_TYPE_CONFIG_ID } from "../../../child-dev-project/notes/model/interaction-type.interface";
import { defaultInteractionTypes } from "../../config/default-config/default-interaction-types";
import {
  ACTIVITY_STATUS_ENUM,
  defaultActivityStatus,
} from "../../config/default-config/default-activity-status";
import { ConfigurableEnum } from "./configurable-enum";

export function createTestingConfigurableEnumService() {
  let service: ConfigurableEnumService;
  service = new ConfigurableEnumService(
    {
      receiveUpdates: () => NEVER,
      loadType: () =>
        Promise.resolve(
          Object.entries({
            genders: genders,
            materials: materials,
            "math-levels": mathLevels,
            "reading-levels": readingLevels,
            "warning-levels": warningLevels,
            "rating-answer": ratingAnswers,
            center: centersUnique,
            "attendance-status": defaultAttendanceStatusTypes,
            [INTERACTION_TYPE_CONFIG_ID]: defaultInteractionTypes,
            [ACTIVITY_STATUS_ENUM]: defaultActivityStatus,
          }).map(([key, value]) => {
            const e = new ConfigurableEnum(key);
            e.values = value;
            return e;
          }),
        ),
      save: () => Promise.resolve(),
    } as any,
    { can: () => true } as any,
  );
  service.preLoadEnums();
  return service;
}
