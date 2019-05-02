import {ChildSchoolRelation} from './childSchoolRelation';
import {ChildWithRelation} from './childWithRelation';
import {Child} from './child';

describe('ChildWithRelation', () => {

  it('has schoolClass and schoolId', function () {
    const schoolId = 'school-id';
    const schoolClass = '1';
    const child = new Child('child1');
    const relation = new ChildSchoolRelation('rel1');
    relation.schoolId = schoolId;
    relation.schoolClass = schoolClass;
    const childWithRelation = new ChildWithRelation(child, relation);
    expect(childWithRelation.schoolId).toBe(schoolId);
    expect(childWithRelation.schoolClass).toBe(schoolClass);
  });

  it('has schoolClass and schoolId when setting relation later', function () {
    const schoolId = 'school-id';
    const schoolClass = '1';
    const child = new Child('child1');
    const relation = new ChildSchoolRelation('rel1');
    relation.schoolId = schoolId;
    relation.schoolClass = schoolClass;
    const childWithRelation = new ChildWithRelation(child);
    childWithRelation.setRelation(relation);
    expect(childWithRelation.schoolId).toBe(schoolId);
    expect(childWithRelation.schoolClass).toBe(schoolClass);
    expect(childWithRelation.getRelation()).toBe(relation);
  });
});

