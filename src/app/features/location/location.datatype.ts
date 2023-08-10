import { DefaultDatatype } from "../../core/entity/schema/default.datatype";

export class LocationDatatype extends DefaultDatatype {
  static dataType = "location";

  editComponent = "EditLocation";
  viewComponent = "ViewLocation";
}
