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

  transformToObjectFormat(value: GeoResult): GeoResult {
    if (typeof value !== "object") {
      // until we have an extended location datatype that includes a custom address addition field, discard invalid values (e.g. in case datatype was changed)
      return undefined;
    }

    return value;
  }

  async importMapFunction(val: any): Promise<GeoResult> {
    if (!val) {
      return undefined;
    }

    const geoResults = await lastValueFrom(this.geoService.lookup(val));
    return geoResults[0];
  }
}
