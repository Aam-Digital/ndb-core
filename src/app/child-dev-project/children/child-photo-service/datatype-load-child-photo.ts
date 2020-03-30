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


import { EntitySchemaDatatype } from '../../../core/entity/schema/entity-schema-datatype';
import { ChildPhotoService } from './child-photo.service';
import { EntitySchemaField } from '../../../core/entity/schema/entity-schema-field';
import { EntitySchemaService } from '../../../core/entity/schema/entity-schema.service';
import { Entity } from '../../../core/entity/entity';

/**
 * Dynamically load the child's photo through the ChildPhotoService during Entity loading process.
 */
export class LoadChildPhotoEntitySchemaDatatype implements EntitySchemaDatatype {
  public readonly name = 'load-child-photo';

  constructor(
    private childPhotoService: ChildPhotoService,
  ) { }


  public transformToDatabaseFormat(value) {
    return undefined;
  }

  public transformToObjectFormat(value, schemaField: EntitySchemaField, schemaService: EntitySchemaService, parent: Entity) {
    const childDummy: any = Object.assign({}, parent);
    if (!childDummy.entityId) {
      childDummy.entityId = Entity.extractEntityIdFromId(childDummy._id);
    }

    return this.childPhotoService.getImageAsyncObservable(childDummy);
  }
}
