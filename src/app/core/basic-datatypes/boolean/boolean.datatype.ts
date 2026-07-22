import { Injectable } from "@angular/core";
import { DiscreteDatatype } from "../discrete/discrete.datatype";

@Injectable()
export class BooleanDatatype extends DiscreteDatatype<boolean, boolean> {
  static override dataType = "boolean";
  static override label: string = $localize`:datatype-label:checkbox`;

  override editComponent = "EditBoolean";
  override viewComponent = "DisplayCheckmark";

  override transformToDatabaseFormat(value) {
    return this.parseBoolean(value);
  }

  override transformToObjectFormat(value) {
    return this.parseBoolean(value);
  }

  /**
   * Coerce values into a real boolean.
   * Values from import or external sources may arrive as strings ("true"/"false")
   * or numbers (1/0) and need to be normalized so storage and display stay consistent.
   */
  private parseBoolean(value) {
    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      return (
        normalized === "true" || normalized === "1" || normalized === "yes"
      );
    }
    return !!value;
  }
}
