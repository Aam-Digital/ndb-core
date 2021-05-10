import { ChildrenService } from "./children.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { ChildSchoolRelation } from "./model/childSchoolRelation";
import { Child } from "./model/child";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { Gender } from "./model/Gender";
import { School } from "../schools/model/school";
import { TestBed } from "@angular/core/testing";
import moment from "moment";
import { Database } from "../../core/database/database";
import { Note } from "../notes/model/note";
import { PouchDatabase } from "../../core/database/pouch-database";

describe("ChildrenService", () => {
  let service: ChildrenService;
  let entityMapper: EntityMapperService;
  let database: PouchDatabase;

  beforeEach(async () => {
    database = PouchDatabase.createWithInMemoryDB();
    TestBed.configureTestingModule({
      providers: [
        ChildrenService,
        EntityMapperService,
        EntitySchemaService,
        { provide: Database, useValue: database },
      ],
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
    await database.destroy();
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
    expect(find.getId()).toBe(child.getId());
    expect(childrenBefore.length).toBe(childrenAfter.length - 1);
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
    expect(childAfter.getId()).toBe(child.getId());
  });

  // TODO: test getAttendances

  it("should find latest ChildSchoolRelation of a child", async () => {
    const children = await service.getChildren().toPromise();
    const promises: Promise<any>[] = [];
    expect(children.length).toBeGreaterThan(0);
    children.forEach((child) =>
      promises.push(verifyLatestChildRelations(child, service))
    );
    await Promise.all(promises);
  });

  it("should return ChildSchoolRelations of child in correct order", (done: DoneFn) => {
    service
      .getChildren()
      .toPromise()
      .then((children) => {
        const promises: Promise<any>[] = [];
        expect(children.length).toBeGreaterThan(0);
        children.forEach((child) =>
          promises.push(verifyChildRelationsOrder(child, service))
        );
        Promise.all(promises).then(() => done());
      });
  });

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
    expect(recentNotesMap.get(c1)).toBe(Number.POSITIVE_INFINITY);
  });

  it("calculates days since last note as infinity if above cut-off period for better performance", async () => {
    const allChildren = await entityMapper.loadType(Child);

    const c0 = allChildren[0].getId();
    await entityMapper.save(
      Note.create(moment().subtract(50, "days").toDate(), "n0-1", [c0])
    );

    const recentNotesMap = await service.getDaysSinceLastNoteOfEachChild(49);

    expect(recentNotesMap.get(c0)).toBe(Number.POSITIVE_INFINITY);
  });

  it("should set school class and id", async () => {
    const child1 = await service.getChild("1").toPromise();
    expect(child1.schoolClass).toBe("2");
    expect(child1.schoolId).toBe("1");

    const child2 = await service.getChild("2").toPromise();
    expect(child2.schoolClass).toBeNull();
    expect(child2.schoolId).toBeNull();
  });

  it("should load all children with school info", async () => {
    const children = await service.getChildren().toPromise();
    const child1 = children.find((child) => child.getId() === "1");
    expect(child1.schoolClass).toBe("2");
    expect(child1.schoolId).toBe("1");
    const child2 = children.find((child) => child.getId() === "2");
    expect(child2.schoolClass).toBe("");
    expect(child2.schoolId).toBe("");
    const child3 = children.find((child) => child.getId() === "3");
    expect(child3.schoolClass).toBe("2");
    expect(child3.schoolId).toBe("1");
  });

  it("should get the relations for a child in sorted order", async () => {
    const relations = await service.querySortedRelations("3");

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

  it("should get a relation which starts today", async () => {
    const todayRelation = new ChildSchoolRelation("today");
    todayRelation.schoolId = "3";
    todayRelation.start = new Date();
    await entityMapper.save(todayRelation);
    const relations = await service.queryRelationsOf("school", "3");
    expect(relations).toHaveSize(1);
    expect(relations[0].getId()).toEqual(todayRelation.getId());
  });
});

function generateChildEntities(): Child[] {
  const data = [];

  const a1 = new Child("1");
  a1.name = "Arjun A.";
  a1.projectNumber = "1";
  a1.religion = "Hindu";
  a1.gender = Gender.MALE;
  a1.dateOfBirth = new Date("2000-03-13");
  a1.motherTongue = "Hindi";
  a1.center = { id: "delhi", label: "Delhi" };
  data.push(a1);

  const a2 = new Child("2");
  a2.name = "Bandana B.";
  a2.projectNumber = "2";
  a2.religion = "Hindu";
  a2.gender = Gender.FEMALE;
  a2.dateOfBirth = new Date("2001-01-01");
  a2.motherTongue = "Bengali";
  a2.center = { id: "kolkata", label: "Kolkata" };
  data.push(a2);

  const a3 = new Child("3");
  a3.name = "Chandan C.";
  a3.projectNumber = "3";
  a3.religion = "Hindu";
  a3.gender = Gender.MALE;
  a3.dateOfBirth = new Date("2002-07-29");
  a3.motherTongue = "Hindi";
  a3.center = { id: "kolkata", label: "Kolkata" };
  data.push(a3);

  return data;
}

function generateSchoolEntities(): School[] {
  const data = [];

  const s1 = new School("1");
  s1.name = "People's Primary";
  s1.medium = "Hindi";
  data.push(s1);

  const s2 = new School("2");
  s2.name = "Hope High School";
  s2.medium = "English";
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

function compareRelations(a: ChildSchoolRelation, b: ChildSchoolRelation) {
  expect(a.getId()).toEqual(b.getId());
  expect(a.schoolClass).toEqual(b.schoolClass);
  expect(a.schoolId).toEqual(b.schoolId);
  expect(a.childId).toEqual(b.childId);
  expect(moment(a.start).isSame(b.start, "day")).toBeTrue();
  expect(moment(a.end).isSame(b.end, "day")).toBeTrue();
}

async function verifyChildRelationsOrder(
  child: Child,
  childrenService: ChildrenService
) {
  const relations = await childrenService.queryRelationsOf(
    "child",
    child.getId()
  );
  const sorted = relations.sort((a, b) => {
    const aValue = new Date(a.start);
    const bValue = new Date(b.start);
    return aValue > bValue ? -1 : aValue === bValue ? 0 : 1;
  });
  const res = await childrenService.querySortedRelations(child.getId());
  expect(res.length).toBe(sorted.length);
  for (let i = 0; i < res.length; i++) {
    compareRelations(res[i], sorted[i]);
  }
}

async function verifyLatestChildRelations(
  child: Child,
  childrenService: ChildrenService
) {
  const relations = await childrenService.queryRelationsOf(
    "child",
    child.getId()
  );
  const latest: ChildSchoolRelation = relations.sort((a, b) => {
    const aValue = new Date(a.start);
    const bValue = new Date(b.start);
    return aValue > bValue ? -1 : aValue === bValue ? 0 : 1;
  })[0];
  const res = await childrenService.queryLatestRelation(child.getId());
  compareRelations(res, latest);
}
