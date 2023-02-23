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
    spyOn(TestBed.inject(EntityRegistry), "entries").and.returnValue([
      [ChildSchoolRelation.ENTITY_TYPE, ChildSchoolRelation],
      [Child.ENTITY_TYPE, Child],
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

  it("should only index on database properties", async () => {
    Child.toStringAttributes = ["schoolId", "name"];
    const child = new Child();
    child.name = "test";
    child.schoolId = "someSchool";
    spyOn(TestBed.inject(EntityRegistry), "entries").and.returnValue([
      [Child.ENTITY_TYPE, Child],
    ] as any);
    await TestBed.inject(EntityMapperService).save(child);

    service = TestBed.inject(SearchService);

    let res = await service.getSearchResults("someSchool");
    expect(res).toEqual([]);
    res = await service.getSearchResults("test");
    // reset default value
    child.schoolId = "";
    expect(res).toEqual([child]);
  });
});
