import { ChildrenService } from "./children.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { ChildSchoolRelation } from "./model/childSchoolRelation";
import { Child } from "./model/child";
import { School } from "../schools/model/school";
import { TestBed } from "@angular/core/testing";
import moment from "moment";
import { Database } from "../../core/database/database";
import { Note } from "../notes/model/note";
import { genders } from "./model/genders";
import { DatabaseTestingModule } from "../../utils/database-testing.module";
import { sortByAttribute } from "../../utils/utils";
import { expectEntitiesToMatch } from "../../utils/expect-entity-data.spec";

describe("ChildrenService", () => {
  let service: ChildrenService;
  let entityMapper: EntityMapperService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [DatabaseTestingModule],
      providers: [ChildrenService],
    });

    entityMapper = TestBed.inject(EntityMapperService);
    generateChildEntities().forEach((c) => entityMapper.save(c));
    generateSchoolEntities().forEach((s) => entityMapper.save(s));
    generateChildSchoolRelationEntities().forEach((cs) =>
      entityMapper.save(cs)
    );

    service = TestBed.inject<ChildrenService>(ChildrenService);
  });

  afterEach(async () => {
    await TestBed.inject(Database).destroy();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should list newly saved children", async () => {
    const childrenBefore = await service.getChildren().toPromise();
    const child = new Child("10");
    await entityMapper.save<Child>(child);
    const childrenAfter = await service.getChildren().toPromise();

    let find = childrenBefore.find((c) => c.getId() === child.getId());
    expect(find).toBeUndefined();

    find = childrenAfter.find((c) => c.getId() === child.getId());
    expect(find).toBeDefined();
    expect(find).toHaveId(child.getId());
    expect(childrenBefore).toHaveSize(childrenAfter.length - 1);
  });

  it("should find a newly saved child", async () => {
    const child = new Child("10");
    let error;
    try {
      await service.getChild(child.getId()).toPromise();
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();

    await entityMapper.save<Child>(child);
    const childAfter = await service.getChild(child.getId()).toPromise();
    expect(childAfter).toBeDefined();
    expect(childAfter).toHaveId(child.getId());
  });

  // TODO: test getAttendances

  it("calculates days since last note for children", async () => {
    const allChildren = await entityMapper.loadType(Child);

    const c0 = allChildren[0].getId();
    await entityMapper.save(
      Note.create(moment().subtract(5, "days").toDate(), "n0-1", [c0])
    );
    await entityMapper.save(
      Note.create(moment().subtract(8, "days").toDate(), "n0-2", [c0])
    );

    const c1 = allChildren[1].getId();
    // no notes

    const recentNotesMap = await service.getDaysSinceLastNoteOfEachChild();

    expect(recentNotesMap).toHaveSize(allChildren.length);
    expect(recentNotesMap.get(c0)).toBe(5);
    expect(recentNotesMap.get(c1)).toBePositiveInfinity();
  });

  it("calculates days since last note as infinity if above cut-off period for better performance", async () => {
    const allChildren = await entityMapper.loadType(Child);

    const c0 = allChildren[0].getId();
    await entityMapper.save(
      Note.create(moment().subtract(50, "days").toDate(), "n0-1", [c0])
    );

    const recentNotesMap = await service.getDaysSinceLastNoteOfEachChild(49);

    expect(recentNotesMap.get(c0)).toBePositiveInfinity();
  });

  it("should load a single child and add school info", async () => {
    // no active relation
    const child2 = await service.getChild("2").toPromise();
    expect(child2.schoolClass).toBeUndefined();
    expect(child2.schoolId).toBeUndefined();

    // one active relation
    let child1 = await service.getChild("1").toPromise();
    expect(child1.schoolClass).toBe("2");
    expect(child1.schoolId).toBe("1");

    // multiple active relations
    const newRelation = new ChildSchoolRelation();
    newRelation.childId = child1.getId();
    newRelation.start = new Date();
    newRelation.schoolId = "2";
    newRelation.schoolClass = "3";
    await entityMapper.save(newRelation);
    child1 = await service.getChild(child1.getId()).toPromise();
    expect(child1.schoolClass).toBe("3");
    expect(child1.schoolId).toBe("2");

    // multiple active, no start date on one
    const noStartDate = new ChildSchoolRelation();
    noStartDate.childId = child1.getId();
    noStartDate.schoolId = "2";
    noStartDate.schoolClass = "4";
    await entityMapper.save(noStartDate);
    child1 = await service.getChild(child1.getId()).toPromise();
    expect(child1.schoolClass).toBe("4");
    expect(child1.schoolId).toBe("2");
  });

  it("should load all children with school info", async () => {
    const children = await service.getChildren().toPromise();
    const child1 = children.find((child) => child.getId() === "1");
    expect(child1.schoolClass).toBe("2");
    expect(child1.schoolId).toBe("1");
    const child2 = children.find((child) => child.getId() === "2");
    expect(child2.schoolClass).toBeUndefined();
    expect(child2.schoolId).toBeUndefined();
    const child3 = children.find((child) => child.getId() === "3");
    expect(child3.schoolClass).toBe("2");
    expect(child3.schoolId).toBe("1");
  });

  it("should get the relations for a child in sorted order", async () => {
    const relations = await service.queryRelationsOf("child", "3");

    expect(relations).toHaveSize(2);
    expect(relations[0].start.getTime()).toBeGreaterThanOrEqual(
      relations[1].start.getTime()
    );
  });

  it("should get all relations for a school", async () => {
    const relations = await service.queryRelationsOf("school", "1");

    expect(relations).toHaveSize(2);
    const relation1 = relations.find((relation) => relation.getId() === "1");
    expect(relation1.childId).toBe("1");
    const relation2 = relations.find((relation) => relation.getId() === "4");
    expect(relation2.childId).toBe("3");
  });

  it("should get a active relation which starts today", async () => {
    const todayRelation = new ChildSchoolRelation("today");
    todayRelation.schoolId = "3";
    todayRelation.start = new Date();
    await entityMapper.save(todayRelation);
    const relations = await service.queryActiveRelationsOf("school", "3");
    expectEntitiesToMatch(relations, [todayRelation]);
  });

  it("should on default only return active relations", async () => {
    const allRelations = await entityMapper.loadType(ChildSchoolRelation);
    const activeRelations = allRelations
      .filter((rel) => rel.isActive && rel.childId === "3")
      .sort(sortByAttribute("start", "desc"));

    const result = await service.queryActiveRelationsOf("child", "3");
    expect(result).toEqual(activeRelations);
  });
});

function generateChildEntities(): Child[] {
  const data = [];

  const a1 = new Child("1");
  a1.name = "Arjun A.";
  a1.projectNumber = "1";
  a1["religion"] = "Hindu";
  a1.gender = genders[1];
  a1.dateOfBirth = new Date("2000-03-13");
  a1["motherTongue"] = "Hindi";
  a1.center = { id: "delhi", label: "Delhi" };
  data.push(a1);

  const a2 = new Child("2");
  a2.name = "Bandana B.";
  a2.projectNumber = "2";
  a2["religion"] = "Hindu";
  a2.gender = genders[2];
  a2.dateOfBirth = new Date("2001-01-01");
  a2["motherTongue"] = "Bengali";
  a2.center = { id: "kolkata", label: "Kolkata" };
  data.push(a2);

  const a3 = new Child("3");
  a3.name = "Chandan C.";
  a3.projectNumber = "3";
  a3["religion"] = "Hindu";
  a3.gender = genders[1];
  a3.dateOfBirth = new Date("2002-07-29");
  a3["motherTongue"] = "Hindi";
  a3.center = { id: "kolkata", label: "Kolkata" };
  data.push(a3);

  return data;
}

function generateSchoolEntities(): School[] {
  const data = [];

  const s1 = new School("1");
  s1.name = "People's Primary";
  data.push(s1);

  const s2 = new School("2");
  s2.name = "Hope High School";
  data.push(s2);

  return data;
}

function generateChildSchoolRelationEntities(): ChildSchoolRelation[] {
  const data: ChildSchoolRelation[] = [];
  const rel1: ChildSchoolRelation = new ChildSchoolRelation("1");
  rel1.childId = "1";
  rel1.schoolId = "1";
  rel1.start = new Date("2016-10-01");
  rel1.schoolClass = "2";
  data.push(rel1);

  const rel4: ChildSchoolRelation = new ChildSchoolRelation("2");
  rel4.childId = "3";
  rel4.schoolId = "2";
  rel4.start = new Date("2001-01-01");
  rel4.end = new Date("2002-01-01");
  rel4.schoolClass = "1";
  data.push(rel4);

  const rel2: ChildSchoolRelation = new ChildSchoolRelation("3");
  rel2.childId = "2";
  rel2.schoolId = "2";
  rel2.start = new Date("2018-05-07");
  rel2.end = new Date("2018-05-09");
  rel2.schoolClass = "3";
  data.push(rel2);

  const rel3: ChildSchoolRelation = new ChildSchoolRelation("4");
  rel3.childId = "3";
  rel3.schoolId = "1";
  rel3.start = new Date("2010-01-01");
  rel3.schoolClass = "2";
  data.push(rel3);

  return data;
}
