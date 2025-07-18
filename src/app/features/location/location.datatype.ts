import { DefaultDatatype } from "../../core/entity/default-datatype/default.datatype";
import { Injectable, inject } from "@angular/core";
import { GeoResult, GeoService } from "./geo.service";
import { lastValueFrom } from "rxjs";
import { GeoLocation } from "./geo-location";

@Injectable()
export class LocationDatatype extends DefaultDatatype<
  GeoLocation,
  GeoLocation
> {
  private geoService = inject(GeoService);

  static override dataType = "location";
  static override label: string = $localize`:datatype-label:location (address + map)`;

  override editComponent = "EditLocation";
  override viewComponent = "ViewLocation";

  override transformToObjectFormat(value: GeoLocation): GeoLocation {
    if (typeof value !== "object") {
      // until we have an extended location datatype that includes a custom address addition field, discard invalid values (e.g. in case datatype was changed)
      return undefined;
    }

    if (!value.hasOwnProperty("locationString")) {
      // migrate from legacy format
      return {
        locationString: value["display_name"],
        geoLookup: value as unknown as GeoResult,
      };
    }

    return value;
  }

  override async importMapFunction(val: any): Promise<GeoLocation> {
    if (!val) {
      return undefined;
    }

    const geoResults = await lastValueFrom(this.geoService.lookup(val));
    return { locationString: val, geoLookup: geoResults[0] };
  }
}
