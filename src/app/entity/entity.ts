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

import {EntitySchema} from './entity-schema';

/**
 * Entity is a base class for all domain model classes.
 *
 * Entity does not deal with database actions. Inject `EntityMapperService`
 * and use its find/save/delete functions.
 */
export class Entity {
  /**
   * The entity's type.
   */
  static ENTITY_TYPE = 'Entity';

  static schema: EntitySchema<Entity> = new EntitySchema<Entity>({
    _id: 'string',
    _rev: 'string?',
    // searchIndices: 'string[]' // generated through this.generateSearchIndices() and assigned in rawData() directly
  });


  _id: string;
  _rev: string;


  /**
   * An helper property to access the actual id without prefix
   */
  get entityId(): string {
    const split = this._id.indexOf(':');
    return this._id.substring(split + 1);
  }
  set entityId(newEntityId: string) {
    // TODO: this duplicates the EntityMapper.createDatabaseId function, (re)move it there?
    this._id = this.getType() + ':' + newEntityId;
  }

  /**
   * Creates an entity object with the given id. This id is final and won't be changeable after this object has been
   * created.
   *
   * @param id a unique id for this entity
   */
  constructor(id: string) {
    this.entityId = id;
  }

  /**
   * Get the class (Entity or the actual subclass of the instance) to call static methods on the correct class considering inheritance
   */
  getConstructor(): typeof Entity {
    return <typeof Entity>this.constructor;
  }

  /**
   * Returns the id of this entity.
   *
   * Note that an id is final and can't be changed after the object has been instantiated, hence there is no
   * <code>setId()</code> method.
   *
   * @returns {string} the unique id of this entity
   */
  public getId(): string {
    return this.entityId;
  }

  /**
   * Returns the type which is used to categorize this entity in the database.
   *
   * <b>Important: Do not overwrite this method! Types are handled internally.</b>
   *
   * @returns {string} the entity's type (which is the class name).
   */
  public getType(): string {
    return this.getConstructor().ENTITY_TYPE;
  }


  public load(data: any) {
    data = this.getConstructor().schema.transformDatabaseToEntityFormat(data);

    return Object.assign(this, data);
  }

  /**
   * Returns an object cleaned for export or writing to the database.
   *
   * Generates the current search indices for the returned object.
   *
   * <b>Overwrite this method in subtypes if you need to convert some special property before saving.</b>
   *
   * @returns {object} the instance's cleaned object.
   */
  public rawData(): any {
    const data = this.getConstructor().schema.transformEntityToDatabaseFormat(this);

    data['searchIndices'] = this.generateSearchIndices();

    return data;
  }

  /**
   * Returns a string representation or summary of the instance.
   *
   * <b>Important: Overwrite this method in subtypes!</b>
   *
   * @returns {string} the instance's string representation.
   */
  public toString(): string {
    return this.getId();
  }

  /**
   * Returns an array of strings by which the entity can be searched.
   *
   * By default the parts of the "name" property (split at spaces) is used if it is present.
   *
   * <b>Overwrite this method in subtypes if you want an entity type to be searchable by other properties.</b>
   *
   * @returns {string[]} an array of strings through which the entity can be searched.
   */
  public generateSearchIndices(): string[] {
    let indices = [];

    // default indices generated from "name" property
    if (this.hasOwnProperty('name')) {
      indices = this['name'].split(' ');
    }

    return indices;
  }

  public getColor() {
    return '';
  }
}
