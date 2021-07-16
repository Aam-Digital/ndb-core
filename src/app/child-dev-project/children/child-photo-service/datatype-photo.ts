/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { EntitySchemaDatatype } from "../../../core/entity/schema/entity-schema-datatype";
import { ChildPhotoService } from "./child-photo.service";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { Entity } from "../../../core/entity/model/entity";
import { Photo } from "./photo";
import { SafeUrl } from "@angular/platform-browser";
import { BehaviorSubject } from "rxjs";

/**
 * Dynamically load the child's photo through the ChildPhotoService during Entity loading process.
 */
export class PhotoDatatype implements EntitySchemaDatatype {
  public readonly name = "photo";
  public readonly editComponent = "EditPhoto";

  public transformToDatabaseFormat(value: Photo, schema: EntitySchemaField) {
    if (value.path === schema.defaultValue) {
      return undefined;
    } else {
      return value.path;
    }
  }

  public transformToObjectFormat(
    value: string,
    schemaField: EntitySchemaField,
    schemaService: EntitySchemaService,
    parent: Entity
  ): Photo {
    // Using of old photoFile values
    if (
      typeof parent["photoFile"] === "string" &&
      parent["photoFile"].trim() !== ""
    ) {
      value = parent["photoFile"];
    }
    return {
      path: value,
      photo: new BehaviorSubject<SafeUrl>(
        // reactivate the integration of cloud file loading here after testing and performance improvements
        ChildPhotoService.getImageFromAssets(value)
      ),
    };
  }
}
