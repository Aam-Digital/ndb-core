import { genders } from "../../child-dev-project/children/model/genders";
import { materials } from "../../child-dev-project/children/educational-material/model/materials";
import {
  mathLevels,
  readingLevels,
} from "../../child-dev-project/children/aser/model/skill-levels";
import { ConfigurableEnum } from "./configurable-enum";
import { ConfigurableEnumService } from "./configurable-enum.service";
import { NEVER } from "rxjs";
import { defaultInteractionTypes } from "../config/default-config/default-interaction-types";
import { warningLevels } from "../../child-dev-project/warning-levels";
import { ratingAnswers } from "../../features/historical-data/model/rating-answers";
import { centersUnique } from "../../child-dev-project/children/demo-data-generators/fixtures/centers";
import { defaultAttendanceStatusTypes } from "../config/default-config/default-attendance-status-types";

export const demoEnums = Object.entries({
  genders: genders,
  materials: materials,
  "math-levels": mathLevels,
  "reading-levels": readingLevels,
  "warning-levels": warningLevels,
  "rating-answer": ratingAnswers,
  center: centersUnique,
  "attendance-status": defaultAttendanceStatusTypes,
  "interaction-type": defaultInteractionTypes,
}).map(([key, value]) => {
  const e = new ConfigurableEnum(key);
  e.values = value;
  return e;
});

export function createTestingConfigurableEnumService() {
  let service: ConfigurableEnumService;
  service = new ConfigurableEnumService(
    {
      receiveUpdates: () => NEVER,
      loadType: () => Promise.resolve(demoEnums),
      save: () => Promise.resolve(),
    } as any,
    { can: () => true } as any
  );
  service.preLoadEnums();
  return service;
}
