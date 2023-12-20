import { BehaviorSubject } from "rxjs";
import { Entity } from "../entity/model/entity";
import { Injectable } from "@angular/core";

@Injectable()
export class CurrentlyLoggedInSubject extends BehaviorSubject<Entity> {
  constructor() {
    super(undefined);
  }
}
