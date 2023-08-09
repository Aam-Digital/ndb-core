import { DefaultDatatype } from "../../core/entity/schema/datatype-default";

export class LocationDatatype extends DefaultDatatype {
  static dataType = "location";

  editComponent = "EditLocation";
  viewComponent = "ViewLocation";
}
