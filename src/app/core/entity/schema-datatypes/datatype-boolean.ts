import { DefaultDatatype } from "../schema/datatype-default";
import { Injectable } from "@angular/core";

@Injectable()
export class BooleanDatatype extends DefaultDatatype {
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
