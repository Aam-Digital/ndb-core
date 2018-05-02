import { Student } from "./students";
import { Medium } from "./Medium";
import {Entity} from '../../entity/entity';

export class School extends Entity {
  public id: string;
  public name: string;
  public address: string;
  public students: Student[];
  public medium: Medium;
  public max_class?: number;
  public remarks?: string;
  public board?: string;
}
