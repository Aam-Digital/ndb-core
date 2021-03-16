import { TestBed } from "@angular/core/testing";

import { AggregationService } from "./aggregation.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { Child } from "../children/model/child";
import { Gender } from "../children/model/Gender";

describe("AggregationService", () => {
  let service: AggregationService;
  const mockEntityMapper: jasmine.SpyObj<EntityMapperService> = jasmine.createSpyObj(
    ["loadType"]
  );

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: EntityMapperService, useValue: mockEntityMapper }],
    });
    service = TestBed.inject(AggregationService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should count all children with specified attributes", async () => {
    const child1 = new Child();
    child1.gender = Gender.MALE;
    child1.religion = "christian";
    const child2 = new Child();
    child2.gender = Gender.FEMALE;
    child2.religion = "christian";
    const child3 = new Child();
    child3.gender = Gender.FEMALE;
    child3.religion = "muslim";
    const child4 = new Child();
    child4.gender = Gender.MALE;
    mockEntityMapper.loadType.and.resolveTo([child1, child2, child3, child4]);
    service.loadData();
    const maleChristianQuery = {
      gender: "M",
      religion: "christian",
    };
    const femaleQuery = {
      gender: "F",
    };
    const allQuery = {};
    const queryResults = await service.countEntitiesByProperties(Child, [
      maleChristianQuery,
      femaleQuery,
      allQuery,
    ]);

    expect(queryResults).toHaveSize(3);
    expect(queryResults[0]).toEqual(1);
    expect(queryResults[1]).toEqual(2);
    expect(queryResults[2]).toEqual(4);
  });
});
