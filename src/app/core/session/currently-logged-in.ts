import { BehaviorSubject } from "rxjs";
import { Entity } from "../entity/model/entity";

export class CurrentlyLoggedInSubject extends BehaviorSubject<Entity> {
  constructor(_value?: Entity) {
    super(_value);
  }
}
