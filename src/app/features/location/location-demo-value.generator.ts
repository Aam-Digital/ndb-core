import { Injectable } from "@angular/core";
import {
  DemoValueContext,
  DemoValueGenerator,
} from "../../core/demo-data/generic/demo-value-generator";
import { EntitySchemaField } from "../../core/entity/schema/entity-schema-field";
import { enrichGeoLocation, GeoLocation } from "./geo-location";
import { LocationDatatype } from "./location.datatype";

/**
 * Demo addresses for `location` fields, so that address columns and the map
 * have something to show.
 *
 * The parts are generated first and the displayed address composed from them,
 * so what a list shows matches what an export writes.
 */
@Injectable()
export class LocationDemoValueGenerator implements DemoValueGenerator {
  readonly dataType: string = LocationDatatype.dataType;

  generate(
    _field: EntitySchemaField,
    { faker }: DemoValueContext,
  ): GeoLocation {
    const houseNumber = faker.location.buildingNumber();
    const road = faker.location.street();
    const postcode = faker.location.zipCode();
    const city = faker.location.city();
    const displayName = `${houseNumber} ${road}, ${postcode} ${city}`;

    return enrichGeoLocation({
      locationString: displayName,
      geoLookup: {
        ...faker.geoAddress(),
        display_name: displayName,
        address: {
          house_number: houseNumber,
          road,
          postcode,
          city,
          country: faker.location.country(),
        },
      },
    });
  }
}
