import { Injectable } from "@angular/core";
import { NumberDatatype } from "../number.datatype";

/** Datatype for percentage values */
@Injectable()
export class PercentageDatatype extends NumberDatatype {
  static override dataType = "percentage";
  static override label: string = $localize`:datatype-label:Percentage`;

  override viewComponent = "DisplayPercentage";
  override editComponent = "EditNumber";
}
