import { TestBed } from "@angular/core/testing";

import { SearchService } from "./search.service";
import { DatabaseTestingModule } from "../../../utils/database-testing.module";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { Child } from "../../../child-dev-project/children/model/child";
import { EntityRegistry } from "../../entity/database-entity.decorator";
import { EntityMapperService } from "../../entity/entity-mapper.service";

describe("SearchService", () => {
  let service: SearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DatabaseTestingModule] });
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should allow to search for toStringAttributes that are not the entityId", async () => {
    ChildSchoolRelation.toStringAttributes = ["entityId"];
    Child.toStringAttributes = ["name"];
    spyOn(TestBed.inject(EntityRegistry), "values").and.returnValue([
      ChildSchoolRelation,
      Child,
    ] as any);
    const c1 = new Child();
    c1.name = "first";
    const c2 = new Child();
    c2.name = "second";
    const r = new ChildSchoolRelation("relation");
    await TestBed.inject(EntityMapperService).saveAll([c1, c2, r]);

    service = TestBed.inject(SearchService);

    let res = await service.getSearchResults("firs");
    expect(res).toEqual([c1]);
    res = await service.getSearchResults("relation");
    expect(res).toEqual([]);
  });
});
