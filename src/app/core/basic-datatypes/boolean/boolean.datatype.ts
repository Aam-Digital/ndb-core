import { Injectable } from "@angular/core";
import { DiscreteDatatype } from "../discrete/discrete.datatype";

@Injectable()
export class BooleanDatatype extends DiscreteDatatype<boolean, boolean> {
  static override dataType = "boolean";
  static override label: string = $localize`:datatype-label:checkbox`;

  editComponent = "EditBoolean";
  viewComponent = "DisplayCheckmark";

  transformToDatabaseFormat(value: boolean) {
    return value;
  }

  transformToObjectFormat(value: boolean) {
    return value;
  }
}
