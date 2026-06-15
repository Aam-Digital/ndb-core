import { Injectable, inject } from "@angular/core";
import { lastValueFrom } from "rxjs";
import {
  DefaultDatatype,
  ExportColumnMapping,
} from "../../core/entity/default-datatype/default.datatype";
import { GeoLocation } from "./geo-location";
import { OpenStreetMapsSearchResult, GeoService } from "./geo.service";
import { LocationImportConfig } from "./location-import-config/location-import-config.component";
import { EntitySchemaField } from "../../core/entity/schema/entity-schema-field";

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

  /**
   * Export the human-readable location string (default column) plus separate
   * columns for the individual address parts (street, house number, postcode, city)
   * so they can be used flexibly for mail merge and similar processes (see #3715).
   */
  override getExportColumns(
    schemaField: EntitySchemaField,
  ): ExportColumnMapping<GeoLocation>[] {
    if (!schemaField.label) {
      return [];
    }

    const label = schemaField.label;
    const part = (
      keySuffix: string,
      partLabel: string,
      pick: (value: GeoLocation) => string | undefined,
    ): ExportColumnMapping<GeoLocation> => ({
      keySuffix,
      label: `${label} (${partLabel})`,
      resolveValue: (value) => (value ? pick(value) : undefined),
    });

    return [
      {
        keySuffix: "",
        label,
        // return the whole object so the CSV/XLSX transformation extracts the locationString
        resolveValue: (value) => value,
      },
      part(
        "_street",
        $localize`:Location export column:street`,
        (value) => value.road ?? value.geoLookup?.address?.road,
      ),
      part(
        "_house_number",
        $localize`:Location export column:house number`,
        (value) => value.house_number ?? value.geoLookup?.address?.house_number,
      ),
      part(
        "_postcode",
        $localize`:Location export column:postcode`,
        (value) =>
          value.postcode ??
          (value.geoLookup?.address?.postcode != null
            ? String(value.geoLookup.address.postcode)
            : undefined),
      ),
      part(
        "_city",
        $localize`:Location export column:city`,
        (value) =>
          value.city ??
          value.geoLookup?.address?.city ??
          value.geoLookup?.address?.village ??
          value.geoLookup?.address?.town,
      ),
    ];
  }

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
        geoLookup: value as unknown as OpenStreetMapsSearchResult,
      };
    }

    // fix errors from broken migrations
    while (value?.geoLookup && "geoLookup" in value.geoLookup) {
      value.geoLookup = (
        value.geoLookup as { geoLookup: OpenStreetMapsSearchResult }
      ).geoLookup;
    }

    if (!value.locationString) {
      value.locationString = value.geoLookup?.display_name ?? "";
    }

    return this.geoService.enrichGeoLocation(value);
  }

  override async importMapFunction(
    val: any,
    schemaField?: any,
    additional?: LocationImportConfig,
  ): Promise<GeoLocation> {
    if (!val) {
      return undefined;
    }

    let geoResults: OpenStreetMapsSearchResult[] | undefined;
    if (!additional?.skipAddressLookup) {
      try {
        geoResults = await lastValueFrom(this.geoService.lookup(val));
      } catch {
        geoResults = undefined;
      }
    }

    return this.geoService.enrichGeoLocation({
      locationString: val,
      geoLookup: geoResults ? geoResults[0] : undefined,
    });
  }
}
