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

import { v4 as uuid } from "uuid";
import { EntitySchema } from "../schema/entity-schema";
import { DatabaseField } from "../database-field.decorator";
import { getWarningLevelColor, WarningLevel } from "./warning-level";

/**
 * This represents a static class of type <T>.
 * It can be used for passing a class from which new objects should be created.
 * It can also be used to check the ENTITY_TYPE of a class
 * For example usage check the {@link EntityMapperService}.
 */
export type EntityConstructor<T extends Entity = Entity> = (new (
  id?: string
) => T) &
  typeof Entity;

export const ENTITY_CONFIG_PREFIX = "entity:";

/**
 * "Entity" is a base class for all domain model classes.
 * It implements the basic general properties and methods that are required for all Entity types
 * e.g. supporting the Entity Schema system or basic database logic.
 *
 * Entity classes do not deal with database actions, use {@link EntityMapperService} with its find/save/delete functions.
 *
 * Do not use the Entity class directly. Instead implement your own Entity types, writing classes that extend "Entity".
 * A How-To Guide on how to implement your own types is available:
 * - [How to Create a new Entity Type]{@link /additional-documentation/how-to-guides/create-a-new-entity-type.html}
 */
export class Entity {
  /**
   * The entity's type.
   * In classes extending Entity this is usually overridden by the class annotation `@DatabaseEntity('NewEntity')`.
   * The type needs to be used as routing path in lower case. The routing path can be defined in the configuration file.
   */
  static ENTITY_TYPE = "Entity";

  /**
   * EntitySchema defining property transformations from/to the database.
   * This is auto-generated from the property annotations `@DatabaseField()`.
   *
   * see {@link /additional-documentation/how-to-guides/create-a-new-entity-type.html}
   */
  static schema: EntitySchema;

  /**
   * Defining which attribute values of an entity should be shown in the `.toString()` method.
   *
   * The default is the ID of the entity (`entityId`).
   * This can be overwritten in subclasses or through the config.
   */
  static toStringAttributes = ["entityId"];

  /**
   * human-readable name/label of the entity in the UI
   */
  static get label(): string {
    return this._label ?? this.ENTITY_TYPE;
  }
  static set label(value: string) {
    this._label = value;
  }
  private static _label: string;

  /**
   * human-readable label for uses of plural of the entity in the UI
   */
  static get labelPlural(): string {
    return this._labelPlural ?? this.label;
  }
  static set labelPlural(value: string) {
    this._labelPlural = value;
  }
  private static _labelPlural: string;

  /**
   * icon id used for this entity
   */
  static icon: string;

  /**
   * Extract the ENTITY_TYPE from an id.
   * @param id An entity's id including prefix.
   */
  static extractTypeFromId(id: string): string {
    const split = id.indexOf(":");
    return id.substring(0, split);
  }

  /**
   * Extract entityId without prefix.
   * @param id An entity's id including prefix.
   */
  static extractEntityIdFromId(id: string): string {
    const split = id.indexOf(":");
    return id.substring(split + 1);
  }

  /**
   * Create a prefixed id by adding the type prefix if it isn't already part of the given id.
   * @param type The type prefix to be added.
   * @param id The id to be extended with a prefix.
   */
  static createPrefixedId(type: string, id: string): string {
    id = String(id);
    const prefix = type + ":";
    if (!id.startsWith(prefix)) {
      return prefix + id;
    } else {
      return id;
    }
  }

  static getBlockComponent(): string {
    return;
  }

  /**
   * Internal database id.
   * This is usually combined from the ENTITY_TYPE as a prefix with the entityId field `EntityType:entityId`
   * @example "Entity:123"
   */
  @DatabaseField() _id: string;

  /** internal database doc revision, used to detect conflicts by PouchDB/CouchDB */
  @DatabaseField() _rev: string;

  /** actual id without prefix */
  get entityId(): string {
    return Entity.extractEntityIdFromId(this._id);
  }

  /**
   * Set id without prefix.
   * @param newEntityId The new id without prefix.
   */
  set entityId(newEntityId: string) {
    this._id = Entity.createPrefixedId(this.getType(), newEntityId);
  }

  /**
   * Returns an array of strings by which the entity can be searched.
   *
   * By default the parts of the "name" property (split at spaces) is used if it is present.
   *
   * <b>Overwrite this method in subtypes if you want an entity type to be searchable by other properties.</b>
   */
  @DatabaseField() get searchIndices(): string[] {
    let indices = [];

    // default indices generated from "name" property
    if (typeof this["name"] === "string") {
      indices = this["name"].split(" ");
    }

    return indices;
  }

  set searchIndices(value) {
    // do nothing, always generated on the fly
    // searchIndices is only saved to database so it can be used internally for database indexing
  }

  /**
   * Creates an entity object with the given id. This id is final and won't be changeable after this object has been
   * created.
   *
   * @param id a unique id for this entity; if no id is passed a uuid is generated automatically
   */
  constructor(id: string = uuid()) {
    this.entityId = id;
  }

  /**
   * Get the class (Entity or the actual subclass of the instance) to call static methods on the correct class considering inheritance
   */
  getConstructor(): EntityConstructor {
    return <typeof Entity>this.constructor;
  }

  /**
   * Get the entity schema of this class
   */
  getSchema(): EntitySchema {
    return this.getConstructor().schema;
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
   * This can be configured with the static `toStringAttributes` for each subclass.
   *
   * @returns {string} the instance's string representation.
   */
  public toString(): string {
    return this.getConstructor()
      .toStringAttributes.map((attr) => this[attr])
      .join(" ");
  }

  /**
   * Used by some generic UI components to set the color for the entity instance.
   * Override this method as needed.
   */
  public getColor(): string {
    return getWarningLevelColor(this.getWarningLevel());
  }

  /**
   * Override getWarningLevel() to define when the entity is in a critical condition and should be color-coded
   * and highlighted in generic components of the UI.
   */
  public getWarningLevel(): WarningLevel {
    return WarningLevel.NONE;
  }

  /**
   * Shallow copy of the entity.
   * The resulting entity will be of the same type as this
   * (taking into account subclassing)
   */
  public copy(): Entity {
    const other = new (this.getConstructor())(this._id);
    Object.assign(other, this);
    return other;
  }

  /**
   * Checks if the entity is valid and if the check fails, throws an error explaining the failed check.
   */
  assertValid(): void {
    return;
  }
}
