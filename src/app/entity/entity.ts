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

  private readonly _id: string;

  /**
   * Creates an entity object with the given ID. If the prefix is not included it will be added so the ID will match
   * the format <code><prefix>:<id></code>.
   *
   * <b>Important: </b>Make sure to always call <code>super(id)</code> whenever you overwrite the constructor.
   *
   * @param id
   */
  constructor(id: string) {
    if (!id.startsWith(this.getPrefix())) {
      id = this.getPrefix() + id;
    }
    this._id = id;
  }

  /**
   *
   */
  public getPrefix(): string {
    return this.constructor.name;
  }

  /**
   * Returns the ID of this given entity. An ID exists in the form of <code><prefix>:<id></code>. Note that an ID is
   * final and can't be changed after the object has been instantiated, hence there is no <code>setId()</code> method.
   *
   * @returns {string}
   */
  public getId(): string {
    return this._id;
  }
}
