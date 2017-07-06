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
   * The database entityId in the form <code><prefix>:<entityId></code>
   */
  private readonly _id: string;

  /**
   * The unique entityId of this entity.
   */
  private readonly entityId: string;

  /**
   * The prefix for this entity type.
   */
  private readonly prefix: string;

  /**
   * Creates an entity object with the given entityId. This entityId is fixed and won't be changeable after this object has been
   * created.
   *
   * @param id a unique entityId
   */
  constructor(id: string) {
    this.entityId = id;
    this.prefix = this.constructor.name;
    this._id = this.prefix + ':' + this.entityId;
  }

  /**
   * Returns the ID of this given entity.
   *
   * Note that an ID is final and can't be changed after the object has been instantiated, hence there is no
   * <code>setId()</code> method.
   *
   * @returns {string} the unique entityId of this entity
   */
  public getEntityId(): string {
    return this.entityId;
  }

  /**
   * Returns the prefix which is used to categorize this entity in the database.
   *
   * @returns {string} the prefix of this entity.
   */
  public getPrefix(): string {
    return this.prefix;
  }

  /**
   * Returns the entityId including a prefix to store this entity in the database.
   *
   * @returns {string} the entity's entityId including a prefix in the form <code><prefix>:<entityId></code>.
   */
  public getIdWithPrefix(): string {
    return this._id;
  }
}
