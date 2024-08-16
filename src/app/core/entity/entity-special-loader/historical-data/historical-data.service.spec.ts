import { TestBed, waitForAsync } from "@angular/core/testing";

import { HistoricalDataService } from "./historical-data.service";
import { EntityMapperService } from "../../entity-mapper/entity-mapper.service";
import { Entity } from "../../model/entity";
import { Database } from "../../../database/database";
import moment from "moment";
import { DatabaseTestingModule } from "../../../../utils/database-testing.module";
import { createEntityOfType } from "../../../demo-data/create-entity-of-type";

describe("HistoricalDataService", () => {
  let service: HistoricalDataService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DatabaseTestingModule],
    });
    service = TestBed.inject(HistoricalDataService);
  }));

  afterEach(() => TestBed.inject(Database).destroy());

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should load data related to a entity", async () => {
    const entityMapper = TestBed.inject(EntityMapperService);
    const entity = new Entity();
    const relatedData = createEntityOfType("HistoricalEntityData");
    relatedData.relatedEntity = entity.getId();
    const unrelatedData = createEntityOfType("HistoricalEntityData");
    unrelatedData.relatedEntity = "anotherEntity";
    await entityMapper.save(relatedData);
    await entityMapper.save(unrelatedData);

    const results = await service.getHistoricalDataFor(entity.getId());

    expect(results.map((x) => x.getId())).toEqual([relatedData.getId()]);
  });

  it("should return the historical data sorted by date", async () => {
    const entityMapper = TestBed.inject(EntityMapperService);
    const entity = new Entity();
    const firstData = createEntityOfType("HistoricalEntityData");
    firstData.relatedEntity = entity.getId();
    firstData.date = new Date();
    const secondData = createEntityOfType("HistoricalEntityData");
    secondData.relatedEntity = entity.getId();
    secondData.date = moment().subtract(1, "day").toDate();
    const thirdData = createEntityOfType("HistoricalEntityData");
    thirdData.relatedEntity = entity.getId();
    thirdData.date = moment().subtract(10, "days").toDate();
    const unrelatedData = createEntityOfType("HistoricalEntityData");
    unrelatedData.relatedEntity = "anotherEntity";
    unrelatedData.date = moment().subtract(2, "days").toDate();
    await entityMapper.save(firstData);
    await entityMapper.save(unrelatedData);
    await entityMapper.save(thirdData);
    await entityMapper.save(secondData);

    const result = await service.getHistoricalDataFor(entity.getId());

    expect(result).toHaveSize(3);
    expect(result.map((res) => res.getId())).toEqual([
      firstData.getId(),
      secondData.getId(),
      thirdData.getId(),
    ]);
  });
});
