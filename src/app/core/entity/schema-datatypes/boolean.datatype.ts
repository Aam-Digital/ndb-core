import { Injectable } from "@angular/core";
import { DiscreteDatatype } from "./discrete.datatype";

@Injectable()
export class BooleanDatatype extends DiscreteDatatype<boolean, boolean> {
  static dataType = "boolean";

  editComponent = "EditBoolean";
  viewComponent = "DisplayCheckmark";

  transformToDatabaseFormat(value: boolean) {
    return value;
  }

  transformToObjectFormat(value: boolean) {
    return value;
  }
}
