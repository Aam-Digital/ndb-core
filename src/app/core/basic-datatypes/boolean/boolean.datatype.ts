import { Injectable } from "@angular/core";
import { DiscreteDatatype } from "../discrete/discrete.datatype";

@Injectable()
export class BooleanDatatype extends DiscreteDatatype<boolean, boolean> {
  static override dataType = "boolean";
  static override label: string = $localize`:datatype-label:checkbox`;

  override editComponent = "EditBoolean";
  override viewComponent = "DisplayCheckmark";

  override transformToDatabaseFormat(value: boolean) {
    return value;
  }

  override transformToObjectFormat(value: boolean) {
    return value;
  }
}
