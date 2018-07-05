import {Child} from "./child";
import {School} from "../schools/schoolsShared/school";
import {Entity} from "../entity/entity";

export class ChildSchoolRelation extends Entity {
  protected static ENTITY_TYPE = 'ChildSchoolRelation';


  public child: Child;
  public school: School;
  public class: string;
  public start: Date;
  public end: Date;
}
