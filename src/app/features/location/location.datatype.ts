import { DefaultDatatype } from "../../core/entity/schema/default.datatype";
import { Injectable } from "@angular/core";

@Injectable()
export class LocationDatatype extends DefaultDatatype {
  static dataType = "location";
  editComponent = "EditLocation";
  viewComponent = "ViewLocation";
}
