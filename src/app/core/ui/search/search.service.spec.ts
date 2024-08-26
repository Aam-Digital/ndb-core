import { TestBed } from "@angular/core/testing";

import { SearchService } from "./search.service";
import { DatabaseTestingModule } from "../../../utils/database-testing.module";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Database } from "../../database/database";
import { expectEntitiesToMatch } from "../../../utils/expect-entity-data.spec";
import { Entity } from "../../entity/model/entity";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("SearchService", () => {
  let service: SearchService;
  const childToStringBefore = TestEntity.toStringAttributes;
  const csrToStringBefore = ChildSchoolRelation.toStringAttributes;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DatabaseTestingModule] });
  });

  afterEach(() => {
    TestEntity.toStringAttributes = childToStringBefore;
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
    TestEntity.toStringAttributes = ["name"];
    const c1 = TestEntity.create("first");
    const c2 = TestEntity.create("second");
    const r = new ChildSchoolRelation("relation");

    await runSearchTest("firs", [c1], [c1, c2, r]);
    await runSearchTest("relation", []);
  });

  it("should only index on database properties", async () => {
    TestEntity.toStringAttributes = ["schoolId", "name"];
    const child = TestEntity.create("test");
    child["schoolId"] = ["someSchool"];

    await runSearchTest("someSchool", [], [child]);
    await runSearchTest("test", [child]);
  });

  it("should not fail if toStringAttribute is not set", async () => {
    TestEntity.toStringAttributes = ["other", "name"];
    const child = TestEntity.create("test");

    await runSearchTest("test", [child], [child]);
  });

  it("should include properties that are marked searchable", async () => {
    TestEntity.toStringAttributes = ["name"];
    TestEntity.schema.get("other").searchable = true;
    const child = TestEntity.create("test");
    child.other = "number";

    await runSearchTest("tes", [child], [child]);
    await runSearchTest("numb", [child]);

    delete TestEntity.schema.get("other").searchable;
  });

  it("should support search terms with multiple words", async () => {
    TestEntity.toStringAttributes = ["name", "other"];
    const child = TestEntity.create("test");
    child.other = "number";

    await runSearchTest("tes num", [child], [child]);
  });

  it("should allows searches for properties with multiple words", async () => {
    TestEntity.toStringAttributes = ["name"];
    const child = TestEntity.create("test name");

    await runSearchTest("nam", [child], [child]);
  });

  it("should not return the same entity multiple times", async () => {
    TestEntity.toStringAttributes = ["name"];
    const child = TestEntity.create("Peter Petersilie");

    await runSearchTest("peter", [child], [child]);
  });
});
