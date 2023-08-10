import { Injectable } from "@angular/core";
import { DiscreteDatatype } from "./discrete.datatype";

@Injectable()
export class BooleanDatatype extends DiscreteDatatype {
  static dataType = "boolean";

  editComponent = "EditBoolean";
  viewComponent = "DisplayCheckmark";

  transformToDatabaseFormat(value: boolean) {
    return value;
  }

  transformToObjectFormat(value) {
    return value;
  }
}
