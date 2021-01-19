import { ChildrenService } from "./children.service";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import { ChildSchoolRelation } from "./model/childSchoolRelation";
import { Child } from "./model/child";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { Gender } from "./model/Gender";
import { School } from "../schools/model/school";
import { MockDatabase } from "../../core/database/mock-database";
import { TestBed } from "@angular/core/testing";
import { ChildPhotoService } from "./child-photo-service/child-photo.service";
import { CloudFileService } from "../../core/webdav/cloud-file-service.service";
import moment from "moment";
import { LoggingService } from "../../core/logging/logging.service";
import { take } from "rxjs/operators";
import { Database } from "../../core/database/database";

function generateChildEntities(): Child[] {
  const data = [];

  const a1 = new Child("1");
  a1.name = "Arjun A.";
  a1.projectNumber = "1";
  a1.religion = "Hindu";
  a1.gender = Gender.MALE;
  a1.dateOfBirth = new Date("2000-03-13");
  a1.motherTongue = "Hindi";
  a1.center = "Delhi";
  data.push(a1);

  const a2 = new Child("2");
  a2.name = "Bandana B.";
  a2.projectNumber = "2";
  a2.religion = "Hindu";
  a2.gender = Gender.FEMALE;
  a2.dateOfBirth = new Date("2001-01-01");
  a2.motherTongue = "Bengali";
  a2.center = "Kolkata";
  data.push(a2);

  const a3 = new Child("3");
  a3.name = "Chandan C.";
  a3.projectNumber = "3";
  a3.religion = "Hindu";
  a3.gender = Gender.MALE;
  a3.dateOfBirth = new Date("2002-07-29");
  a3.motherTongue = "Hindi";
  a3.center = "Kolkata";
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

describe("ChildrenService", () => {
  let service: ChildrenService;
  let entityMapper: EntityMapperService;
  let mockChildPhotoService: jasmine.SpyObj<ChildPhotoService>;

  beforeEach(() => {
    mockChildPhotoService = jasmine.createSpyObj("mockChildPhotoService", [
      "getImage",
    ]);
    TestBed.configureTestingModule({
      providers: [
        EntityMapperService,
        EntitySchemaService,
        { provide: Database, useClass: MockDatabase },
        { provide: CloudFileService, useValue: { isConnected: () => false } },
        ChildPhotoService,
        ChildrenService,
        LoggingService,
      ],
    });

    entityMapper = TestBed.inject<EntityMapperService>(EntityMapperService);

    generateChildEntities().forEach((c) => entityMapper.save(c));
    generateSchoolEntities().forEach((s) => entityMapper.save(s));
    generateChildSchoolRelationEntities().forEach((cs) =>
      entityMapper.save(cs)
    );

    service = TestBed.inject<ChildrenService>(ChildrenService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should list newly saved children", async () => {
    const childrenBefore = await service
      .getChildren()
      .pipe(take(1))
      .toPromise();
    const child = new Child("10");
    await entityMapper.save<Child>(child);
    const childrenAfter = await service.getChildren().pipe(take(1)).toPromise();

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
    expect(error).toEqual({ status: 404, message: "object not found" });

    await entityMapper.save<Child>(child);
    const childAfter = await service.getChild(child.getId()).toPromise();
    expect(childAfter).toBeDefined();
    expect(childAfter.getId()).toBe(child.getId());
  });

  // TODO: test getAttendances

  it("should find latest ChildSchoolRelation of a child", (done: DoneFn) => {
    service.getChildren().subscribe((children) => {
      const promises: Promise<any>[] = [];
      expect(children.length).toBeGreaterThan(0);
      children.forEach((child) =>
        promises.push(verifyLatestChildRelations(child, service))
      );
      Promise.all(promises).then(() => done());
    });
  });

  it("should return ChildSchoolRelations of child in correct order", (done: DoneFn) => {
    service.getChildren().subscribe((children) => {
      const promises: Promise<any>[] = [];
      expect(children.length).toBeGreaterThan(0);
      children.forEach((child) =>
        promises.push(verifyChildRelationsOrder(child, service))
      );
      Promise.all(promises).then(() => done());
    });
  });
});

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
