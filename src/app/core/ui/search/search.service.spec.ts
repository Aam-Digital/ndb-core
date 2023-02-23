import { TestBed } from "@angular/core/testing";

import { SearchService } from "./search.service";
import { DatabaseTestingModule } from "../../../utils/database-testing.module";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { Child } from "../../../child-dev-project/children/model/child";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { Database } from "../../database/database";

describe("SearchService", () => {
  let service: SearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DatabaseTestingModule] });
  });

  afterEach(() => TestBed.inject(Database).destroy());

  it("should allow to search for toStringAttributes that are not the entityId", async () => {
    ChildSchoolRelation.toStringAttributes = ["entityId"];
    Child.toStringAttributes = ["name"];
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
    await TestBed.inject(EntityMapperService).save(child);

    service = TestBed.inject(SearchService);

    let res = await service.getSearchResults("someSchool");
    expect(res).toEqual([]);
    res = await service.getSearchResults("test");
    // reset default value
    child.schoolId = "";
    expect(res).toEqual([child]);
  });

  it("should not fail if toStringAttribute is not set", async () => {
    Child.toStringAttributes = ["projectNumber", "name"];
    const child = new Child();
    child.name = "test";
    await TestBed.inject(EntityMapperService).save(child);

    service = TestBed.inject(SearchService);

    const res = await service.getSearchResults("test");
    expect(res).toEqual([child]);
  });

  it("should include properties that are marked searchable", async () => {
    Child.toStringAttributes = ["name"];
    Child.schema.get("projectNumber").searchable = true;
    const child = new Child();
    child.name = "test";
    child.projectNumber = "number";
    await TestBed.inject(EntityMapperService).save(child);

    service = TestBed.inject(SearchService);

    let res = await service.getSearchResults("tes");
    expect(res).toEqual([child]);
    res = await service.getSearchResults("numb");
    expect(res).toEqual([child]);

    delete Child.schema.get("projectNumber").searchable;
  });

  it("should support search terms with multiple words", async () => {
    Child.toStringAttributes = ["name", "projectNumber"];
    const child = new Child();
    child.name = "test";
    child.projectNumber = "number";
    await TestBed.inject(EntityMapperService).save(child);

    service = TestBed.inject(SearchService);

    let res = await service.getSearchResults("tes num");
    expect(res).toEqual([child]);
  });

  it("should allows searches for properties with multiple words", async () => {
    Child.toStringAttributes = ["name"];
    const child = new Child();
    child.name = "test name";
    await TestBed.inject(EntityMapperService).save(child);

    service = TestBed.inject(SearchService);

    let res = await service.getSearchResults("nam");
    expect(res).toEqual([child]);
  });

  it("should not return the same entity multiple times", async () => {
    Child.toStringAttributes = ["name"];
    const child = new Child();
    child.name = "Peter Petersilie";
    await TestBed.inject(EntityMapperService).save(child);

    service = TestBed.inject(SearchService);

    let res = await service.getSearchResults("peter");
    expect(res).toEqual([child]);
  });
});
