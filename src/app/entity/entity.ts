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

  /**
   * The unique id of this entity.
   */
  private readonly entityId: string;

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
    const c = <typeof Entity>this.constructor;
    return c.ENTITY_TYPE;
  }
}
