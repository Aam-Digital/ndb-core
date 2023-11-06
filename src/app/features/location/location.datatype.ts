import { DefaultDatatype } from "../../core/entity/default-datatype/default.datatype";
import { Injectable } from "@angular/core";
import { GeoResult, GeoService } from "./geo.service";
import { lastValueFrom } from "rxjs";

@Injectable()
export class LocationDatatype extends DefaultDatatype<GeoResult, GeoResult> {
  static override dataType = "location";
  static override label: string = $localize`:datatype-label:location (address + map)`;

  editComponent = "EditLocation";
  viewComponent = "ViewLocation";

  constructor(private geoService: GeoService) {
    super();
  }

  async importMapFunction(val: any): Promise<GeoResult> {
    if (!val) {
      return undefined;
    }

    const geoResults = await lastValueFrom(this.geoService.lookup(val));
    return geoResults[0];
  }
}
