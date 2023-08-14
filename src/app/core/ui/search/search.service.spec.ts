import { TestBed } from "@angular/core/testing";

import { SearchService } from "./search.service";
import { DatabaseTestingModule } from "../../../utils/database-testing.module";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { Child } from "../../../child-dev-project/children/model/child";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { Database } from "../../database/database";
import { expectEntitiesToMatch } from "../../../utils/expect-entity-data.spec";
import { Entity } from "../../entity/model/entity";

describe("SearchService", () => {
  let service: SearchService;
  const childToStringBefore = Child.toStringAttributes;
  const csrToStringBefore = ChildSchoolRelation.toStringAttributes;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DatabaseTestingModule] });
  });

  afterEach(() => {
    Child.toStringAttributes = childToStringBefore;
    ChildSchoolRelation.toStringAttributes = csrToStringBefore;
    return TestBed.inject(Database).destroy();
  });

  /**
   * Do a unit test run with the given input parameters.
   * @param searchTerm
   * @param expectedResults
   * @param entitiesInDb (Optional) entities to be saved into database before running the search
   */
  async function runSearchTest(
    searchTerm: string,
    expectedResults: Entity[],
    entitiesInDb?: Entity[],
  ) {
    if (entitiesInDb) {
      await TestBed.inject(EntityMapperService).saveAll(entitiesInDb);
    }

    service = TestBed.inject(SearchService);
    let res = await service.getSearchResults(searchTerm);

    expectEntitiesToMatch(res, expectedResults);
  }

  it("should allow to search for toStringAttributes that are not the entityId", async () => {
    ChildSchoolRelation.toStringAttributes = ["entityId"];
    Child.toStringAttributes = ["name"];
    const c1 = Child.create("first");
    const c2 = Child.create("second");
    const r = new ChildSchoolRelation("relation");

    await runSearchTest("firs", [c1], [c1, c2, r]);
    await runSearchTest("relation", []);
  });

  it("should only index on database properties", async () => {
    Child.toStringAttributes = ["schoolId", "name"];
    const child = Child.create("test");
    child.schoolId = ["someSchool"];

    await runSearchTest("someSchool", [], [child]);
    await runSearchTest("test", [child]);
  });

  it("should not fail if toStringAttribute is not set", async () => {
    Child.toStringAttributes = ["projectNumber", "name"];
    const child = Child.create("test");

    await runSearchTest("test", [child], [child]);
  });

  it("should include properties that are marked searchable", async () => {
    Child.toStringAttributes = ["name"];
    Child.schema.get("projectNumber").searchable = true;
    const child = Child.create("test");
    child.projectNumber = "number";

    await runSearchTest("tes", [child], [child]);
    await runSearchTest("numb", [child]);

    delete Child.schema.get("projectNumber").searchable;
  });

  it("should support search terms with multiple words", async () => {
    Child.toStringAttributes = ["name", "projectNumber"];
    const child = Child.create("test");
    child.projectNumber = "number";

    await runSearchTest("tes num", [child], [child]);
  });

  it("should allows searches for properties with multiple words", async () => {
    Child.toStringAttributes = ["name"];
    const child = Child.create("test name");

    await runSearchTest("nam", [child], [child]);
  });

  it("should not return the same entity multiple times", async () => {
    Child.toStringAttributes = ["name"];
    const child = Child.create("Peter Petersilie");

    await runSearchTest("peter", [child], [child]);
  });
});
