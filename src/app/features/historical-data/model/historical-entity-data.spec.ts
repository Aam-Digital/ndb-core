import { testEntitySubclass } from "../../../core/entity/model/entity.spec";
import { HistoricalEntityData } from "./historical-entity-data";

describe("HistoricalEntityData", () => {
  testEntitySubclass("HistoricalEntityData", HistoricalEntityData, {
    _id: "HistoricalEntityData:some-id",
    date: new Date(),
    relatedEntity: "Child:some-other-id",
  });
});
