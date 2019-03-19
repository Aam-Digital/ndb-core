import { Child } from './child';
import {describe} from 'selenium-webdriver/testing';
import {ChildSchoolRelation} from './childSchoolRelation';
import {ChildWithRelation} from './childWithRelation';

describe('ChildWithRelation', () => {

  it('has class and schoolId', () => {
    const schoolId = 'school-id';
    const schoolClass = '1';
    const child = new Child('child1');
    const relation = new ChildSchoolRelation('rel1');
    relation.schoolId = schoolId;
    relation.class = schoolClass;
    const childWithRelation = new ChildWithRelation(child, relation);
    expect(childWithRelation.schoolId).toBe(schoolId);
    expect(childWithRelation.schoolClass).toBe(schoolClass);
    expect(childWithRelation.getChild).toBe(child);
    expect(childWithRelation.getRelation).toBe(relation);
  });

  it('has class and schoolId when setting relation later', () => {
    const schoolId = 'school-id';
    const schoolClass = '1';
    const child = new Child('child1');
    const relation = new ChildSchoolRelation('rel1');
    relation.schoolId = schoolId;
    relation.class = schoolClass;
    const childWithRelation = new ChildWithRelation(child);
    childWithRelation.setRelation(relation);
    expect(childWithRelation.schoolId).toBe(schoolId);
    expect(childWithRelation.schoolClass).toBe(schoolClass);
  });
});
