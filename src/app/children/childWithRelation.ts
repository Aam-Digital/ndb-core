import {Child} from './child';
import {ChildSchoolRelation} from './childSchoolRelation';

export class ChildWithRelation extends Child {
  public schoolId = '';
  public schoolClass = '';

  constructor(private _child: Child = new Child(''), private _childSchoolRelation: ChildSchoolRelation = new ChildSchoolRelation('')) {
    super(_child.getId());
    this.load(_child);
    this.schoolId = this._childSchoolRelation.schoolId;
    this.schoolClass = this._childSchoolRelation.class;
  }

  getChild(): Child {
    return this._child;
  }

  setChild(child: Child) {
    this._child = child;
    this.load(child);
  }

  setRelation(childSchoolRelation: ChildSchoolRelation) {
    this._childSchoolRelation = childSchoolRelation;
    this.schoolId = childSchoolRelation.schoolId;
    this.schoolClass = childSchoolRelation.class;
  }

  getRelation(): ChildSchoolRelation {
    return this._childSchoolRelation;
  }
}
