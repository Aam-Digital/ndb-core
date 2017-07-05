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

  private _id: string;

  constructor(id: string) {
    this.setId(id);
  }


  public getPrefix(): string {
    return '';
  }

  public getId(): string {
    return this._id;
  }

  private setId(id: string) {
    if (!id.startsWith(this.getPrefix())) {
      id = this.getPrefix() + id;
    }
    this._id = id;
  }
}
