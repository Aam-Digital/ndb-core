import { ChildrenService } from './children.service';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {ChildSchoolRelation} from './childSchoolRelation';
import {Child} from './child';
import {EntitySchemaService} from '../entity/schema/entity-schema.service';
import {Gender} from './Gender';
import {School} from '../schools/school';
import { TestBed } from '@angular/core/testing';
import { Database } from 'app/database/database';
import { MockDatabase } from 'app/database/mock-database';
import { CloudFileService } from 'app/webdav/cloud-file-service.service';
import { MockCloudFileService } from 'app/webdav/mock-cloud-file-service';

function generateChildEntities(): Child[] {
  const data = [];

  const a1 = new Child('1');
  a1.name = 'Arjun A.';
  a1.projectNumber = '1';
  a1.religion = 'Hindu';
  a1.gender = Gender.MALE;
  a1.dateOfBirth = new Date('2000-03-13');
  a1.motherTongue = 'Hindi';
  a1.center = 'Delhi';
  data.push(a1);

  const a2 = new Child('2');
  a2.name = 'Bandana B.';
  a2.projectNumber = '2';
  a2.religion = 'Hindu';
  a2.gender = Gender.FEMALE;
  a2.dateOfBirth = new Date('2001-01-01');
  a2.motherTongue = 'Bengali';
  a2.center = 'Kolkata';
  data.push(a2);

  const a3 = new Child('3');
  a3.name = 'Chandan C.';
  a3.projectNumber = '3';
  a3.religion = 'Hindu';
  a3.gender = Gender.MALE;
  a3.dateOfBirth = new Date('2002-07-29');
  a3.motherTongue = 'Hindi';
  a3.center = 'Kolkata';
  data.push(a3);

  return data;
}
function generateSchoolEntities(): School[] {
  const data = [];

  const s1 = new School('1');
  s1.name = 'People\'s Primary';
  s1.medium = 'Hindi';
  data.push(s1);

  const s2 = new School('2');
  s2.name = 'Hope High School';
  s2.medium = 'English';
  data.push(s2);

  return data;
}
function generateChildSchoolRelationEntities(): ChildSchoolRelation[] {
  const data: ChildSchoolRelation[] = [];
  const rel1: ChildSchoolRelation = new ChildSchoolRelation('1');
  rel1.childId = '1';
  rel1.schoolId = '1';
  rel1.start = '2016-10-01';
  rel1.schoolClass = '2';
  data.push(rel1);

  const rel4: ChildSchoolRelation = new ChildSchoolRelation('2');
  rel4.childId = '3';
  rel4.schoolId = '2';
  rel4.start = '2001-01-01';
  rel4.end = '2002-01-01';
  rel4.schoolClass = '1';
  data.push(rel4);

  const rel2: ChildSchoolRelation = new ChildSchoolRelation('3');
  rel2.childId = '2';
  rel2.schoolId = '2';
  rel2.start = '2018-05-07';
  rel2.schoolClass = '3';
  data.push(rel2);

  const rel3: ChildSchoolRelation = new ChildSchoolRelation('4');
  rel3.childId = '3';
  rel3.schoolId = '1';
  rel3.start = '2010-01-01';
  rel3.schoolClass = '2';
  data.push(rel3);

  return data;
}


describe('ChildrenService', () => {
  let service: ChildrenService;
  let entityMapper: EntityMapperService;
  let cloudFileService: CloudFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EntityMapperService,
          EntitySchemaService,
          { provide: Database, useClass: MockDatabase },
          { provide: CloudFileService, useClass: MockCloudFileService },
          ChildrenService
        ]
      }
    );

    entityMapper = TestBed.get(EntityMapperService);

    generateChildEntities().forEach(c => entityMapper.save(c));
    generateSchoolEntities().forEach(s => entityMapper.save(s));
    generateChildSchoolRelationEntities().forEach(cs => entityMapper.save(cs));

    service = TestBed.get(ChildrenService);
    cloudFileService = TestBed.get(CloudFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list newly saved children', async () => {
    const childrenBefore = await service.getChildren().toPromise();
    const child = new Child('10');
    await entityMapper.save<Child>(child);
    const childrenAfter = await service.getChildren().toPromise();

    let find = childrenBefore.find(c => c.getId() === child.getId());
    expect(find).toBeUndefined();

    find = childrenAfter.find(c => c.getId() === child.getId());
    expect(find).toBeDefined();
    expect(find.getId()).toBe(child.getId());
    expect(childrenBefore.length).toBe(childrenAfter.length - 1);
  });

  it('should load image for a single child', async() => {
    let child = new Child('10');
    await entityMapper.save<Child>(child);
    expect(child.photo).not.toBeDefined();
    spyOn(cloudFileService, 'getImage').and.callThrough();
    child = await service.getChild('10').toPromise();
    expect(cloudFileService.getImage).toHaveBeenCalledWith('10');
    expect(child.photo).toEqual(await cloudFileService.getImage('10'));

  });

  it('should load images for children', async() => {
    let child = new Child('10');
    await entityMapper.save<Child>(child);
    expect(child.photo).not.toBeDefined();
    spyOn(cloudFileService, 'getImage').and.callThrough();
    const childrenList = await service.getChildren().toPromise();
    child = childrenList[0];
    expect(cloudFileService.getImage).toHaveBeenCalledWith('10');
    expect(child.photo).toEqual(await cloudFileService.getImage('10'));
  });


  it('should find a newly saved child', async () => {
    const child = new Child('10');
    let error;
    try {
      await service.getChild(child.getId()).toPromise();
    } catch (err) {
      error = err;
    }
    expect(error).toEqual({status: 404, message: 'object not found'});

    await entityMapper.save<Child>(child);
    const childAfter = await service.getChild(child.getId()).toPromise();
    expect(childAfter).toBeDefined();
    expect(childAfter.getId()).toBe(child.getId());
  });

  // TODO: test getAttendances

  xit('should find latest ChildSchoolRelation of a child', () => {
    // service.getChildren().subscribe(children => {
    //   const promises: Promise<any>[] = [];
    //   expect(children.length).toBeGreaterThan(0);
    //   children.forEach(child => promises.push(verifyLatestChildRelations(child, service)));
    //   Promise.all(promises).then(() => done());
    // });
  });

  it('should return ChildSchoolRelations of child in correct order', (done: DoneFn) => {
    service.getChildren().subscribe(children => {
      const promises: Promise<any>[] = [];
      expect(children.length).toBeGreaterThan(0);
      children.forEach(child => promises.push(verifyChildRelationsOrder(child, service)));
      Promise.all(promises).then(() => done());
    });
  });
});

function compareRelations(a: ChildSchoolRelation, b: ChildSchoolRelation) {
  expect(a.getId()).toBe(b.getId());
  expect(a.schoolClass).toBe(b.schoolClass);
  expect(a.schoolId).toBe(b.schoolId);
  expect(a.childId).toBe(b.childId);
  expect(a.start).toBe(b.start);
  expect(a.end).toBe(b.end);
}

async function verifyChildRelationsOrder(child: Child, childrenService: ChildrenService) {
  const relations = await childrenService.queryRelationsOfChild(child.getId());
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

// async function verifyLatestChildRelations(child: Child, childrenService: ChildrenService) {
//   const relations = await childrenService.queryRelationsOfChild(child.getId());
//   const latest: ChildSchoolRelation = relations.sort((a, b) => {
//     const aValue = new Date(a.start);
//     const bValue = new Date(b.start);
//     return aValue > bValue ? -1 : aValue === bValue ? 0 : 1;
//   })[0];
//   const childWithRelation = new ChildWithRelation(child, latest);
//   const res = await childrenService.queryLatestRelation(child.getId());
//   compareRelations(res, child.getRelation());
// }
