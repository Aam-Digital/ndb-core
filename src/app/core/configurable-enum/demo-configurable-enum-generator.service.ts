import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../demo-data/demo-data-generator";
import { ConfigurableEnum } from "./configurable-enum";
import { genders } from "../../child-dev-project/children/model/genders";
import { materials } from "../../child-dev-project/children/educational-material/model/materials";
import {
  mathLevels,
  readingLevels,
} from "../../child-dev-project/children/aser/model/skill-levels";
import { warningLevels } from "../../child-dev-project/warning-levels";
import { ratingAnswers } from "../../features/historical-data/model/rating-answers";
import { centersUnique } from "../../child-dev-project/children/demo-data-generators/fixtures/centers";
import { defaultAttendanceStatusTypes } from "../config/default-config/default-attendance-status-types";
import { defaultInteractionTypes } from "../config/default-config/default-interaction-types";

@Injectable()
export class DemoConfigurableEnumGeneratorService extends DemoDataGenerator<ConfigurableEnum> {
  static provider() {
    return [
      {
        provide: DemoConfigurableEnumGeneratorService,
        useClass: DemoConfigurableEnumGeneratorService,
      },
    ];
  }

  enums = {
    genders: genders,
    materials: materials,
    "math-levels": mathLevels,
    "reading-levels": readingLevels,
    "warning-levels": warningLevels,
    "rating-answer": ratingAnswers,
    center: centersUnique,
    "attendance-status": defaultAttendanceStatusTypes,
    "interaction-type": defaultInteractionTypes,
  };

  protected generateEntities(): ConfigurableEnum[] {
    return Object.entries(this.enums).map(([key, value]) => {
      const e = new ConfigurableEnum(key);
      e.values = value;
      return e;
    });
  }
}
