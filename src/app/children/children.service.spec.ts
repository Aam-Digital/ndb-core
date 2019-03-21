import { ChildrenService } from './children.service';
import {EntityMapperService} from '../entity/entity-mapper.service';
import {ChildSchoolRelation} from './childSchoolRelation';
import {Child} from './child';
import {ChildWithRelation} from './childWithRelation';
import {MockDatabaseManagerService} from '../database/mock-database-manager.service';

describe('ChildrenService', () => {
  let service: ChildrenService;
  beforeEach(() => {
    const database = new MockDatabaseManagerService().getDatabase();
    service = new ChildrenService(new EntityMapperService(database), database)
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // TODO: test getChildren

  // TODO: test getChild

  // TODO: test getAttendances

  it('should find latest ChildSchoolRelation of a child', (done: DoneFn) => {
    service.getChildren().subscribe(children => {
      const promises: Promise<any>[] = [];
      expect(children.length).toBeGreaterThan(0);
      children.forEach(child => promises.push(verifyChildRelations(child, service)));
      Promise.all(promises).then(() => done())
    })
  });
});

async function verifyChildRelations(child: Child, childrenService: ChildrenService) {
  const relations = await childrenService.queryRelationsOfChild(child.getId());
  const latest: ChildSchoolRelation = relations.sort((a, b) => {
    const aValue = new Date(a.start);
    const bValue = new Date(b.start);
    return aValue > bValue ? -1 : aValue === bValue ? 0 : 1;
  })[0];
  const childWithRelation = new ChildWithRelation(child, latest);
  const res = await childrenService.queryLatestRelation(child.getId());
  expect(res.class).toBe(childWithRelation.getRelation().class);
  expect(res.schoolId).toBe(childWithRelation.getRelation().schoolId);
  expect(res.childId).toBe(childWithRelation.getId());
  expect(res.start).toBe(childWithRelation.getRelation().start);
  expect(res.end).toBe(childWithRelation.getRelation().end);
}
