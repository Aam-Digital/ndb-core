import { Injectable, inject } from "@angular/core";
import { lastValueFrom } from "rxjs";
import { DefaultDatatype } from "../../core/entity/default-datatype/default.datatype";
import { GeoLocation } from "./geo-location";
import { GeoResult, GeoService } from "./geo.service";
import { LocationImportConfig } from "./location-import-config/location-import-config.component";

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
  override importConfigComponent = "LocationImportConfig";

  override transformToObjectFormat(value: GeoLocation): GeoLocation {
    if (typeof value !== "object") {
      // until we have an extended location datatype that includes a custom address addition field, discard invalid values (e.g. in case datatype was changed)
      return undefined;
    }

    // migrate from legacy format
    if (
      !value.hasOwnProperty("locationString") &&
      !value.hasOwnProperty("geoLookup")
    ) {
      value = {
        geoLookup: value as unknown as GeoResult,
      };
    }

    // fix errors from broken migrations
    while (value?.geoLookup && "geoLookup" in value.geoLookup) {
      value.geoLookup = (value.geoLookup as { geoLookup: GeoResult }).geoLookup;
    }

    if (!value.locationString) {
      value.locationString = value.geoLookup?.display_name ?? "";
    }

    return value;
  }

  override async importMapFunction(
    val: any,
    schemaField?: any,
    additional?: LocationImportConfig,
  ): Promise<GeoLocation> {
    if (!val) {
      return undefined;
    }

    let geoResults: GeoResult[];
    if (!additional?.skipAddressLookup) {
      geoResults = await lastValueFrom(this.geoService.lookup(val));
    }

    return {
      locationString: val,
      geoLookup: geoResults ? geoResults[0] : undefined,
    };
  }
}
