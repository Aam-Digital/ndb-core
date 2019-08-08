import { ChildrenService } from './children.service';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {ChildSchoolRelation} from './childSchoolRelation';
import {Child} from './child';
import {MockDatabaseManagerService} from '../database/mock-database-manager.service';
import {EntitySchemaService} from '../entity/schema/entity-schema.service';

describe('ChildrenService', () => {
  let service: ChildrenService;
  let entityMapper: EntityMapperService;
  let entitySchemaService: EntitySchemaService;

  beforeEach(() => {
    entitySchemaService = new EntitySchemaService();
    const database = new MockDatabaseManagerService().getDatabase();
    entityMapper = new EntityMapperService(database, entitySchemaService);
    service = new ChildrenService(entityMapper, entitySchemaService, database);
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
