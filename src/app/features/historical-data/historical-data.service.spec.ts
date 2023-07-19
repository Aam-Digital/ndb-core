import { TestBed, waitForAsync } from "@angular/core/testing";

import { HistoricalDataService } from "./historical-data.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { Entity } from "../../core/entity/model/entity";
import { HistoricalEntityData } from "./model/historical-entity-data";
import { expectEntitiesToMatch } from "../../utils/expect-entity-data.spec";
import { Database } from "../../core/database/database";
import moment from "moment";
import { DatabaseTestingModule } from "../../utils/database-testing.module";

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
    const relatedData = new HistoricalEntityData();
    relatedData.relatedEntity = entity.getId();
    const unrelatedData = new HistoricalEntityData();
    unrelatedData.relatedEntity = "anotherEntity";
    await entityMapper.save(relatedData);
    await entityMapper.save(unrelatedData);

    const results = await service.getHistoricalDataFor(entity.getId());

    expectEntitiesToMatch(results, [relatedData]);
  });

  it("should return the historical data sorted by date", async () => {
    const entityMapper = TestBed.inject(EntityMapperService);
    const entity = new Entity();
    const firstData = new HistoricalEntityData();
    firstData.relatedEntity = entity.getId();
    firstData.date = new Date();
    const secondData = new HistoricalEntityData();
    secondData.relatedEntity = entity.getId();
    secondData.date = moment().subtract(1, "day").toDate();
    const thirdData = new HistoricalEntityData();
    thirdData.relatedEntity = entity.getId();
    thirdData.date = moment().subtract(10, "days").toDate();
    const unrelatedData = new HistoricalEntityData();
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
