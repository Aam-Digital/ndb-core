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

/**
 * This represents a static class of type <T>.
 * It can be used for passing a class from which new objects should be created.
 * For example usage check the entity mapper service.
 */
import {EntitySchema} from './schema/entity-schema';
import {DatabaseField} from './database-field.decorator';

export type EntityConstructor<T extends Entity> = new(id: string) => T;

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
  static schema: EntitySchema;


  static extractTypeFromId(id: string): string {
    const split = id.indexOf(':');
    return id.substring(0, split);
  }

  static extractEntityIdFromId(id: string): string {
    const split = id.indexOf(':');
    return id.substring(split + 1);
  }

  static createPrefixedId(type: string, id: string): string {
    id = String(id);
    const prefix = type + ':';
    if (!id.startsWith(prefix)) {
      return prefix + id;
    } else {
      return id;
    }
  }


  @DatabaseField()
  _id: string;

  @DatabaseField()
  _rev: string;


  /**
   * An helper property to access the actual id without prefix
   */
  get entityId(): string {
    return Entity.extractEntityIdFromId(this._id);
  }
  set entityId(newEntityId: string) {
    this._id = Entity.createPrefixedId(this.getType(), newEntityId);
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
