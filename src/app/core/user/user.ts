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

import { Entity } from "../entity/model/entity";
import { DatabaseEntity } from "../entity/database-entity.decorator";
import { DatabaseField } from "../entity/database-field.decorator";

/**
 * Entity representing a User object including password.
 *
 * Note that in addition to the User Entity there also is a "regular" CouchDB user with the same name and password
 * in the CouchDB _users database which is used for remote database authentication.
 */
@DatabaseEntity("User")
export class User extends Entity {
  static toStringAttributes = ["name"];

  /** username used for login and identification */
  @DatabaseField({
    label: $localize`:Label of username:Username`,
    validators: { required: true },
  })
  set name(value: string) {
    if (this._name && value !== this._name) {
      // Throwing error if trying to change existing username
      const label = User.schema.get("name").label;
      throw new Error(
        $localize`:Error message when trying to change the username|e.g. username cannot be changed after initialization:${label} cannot be changed after initialization`
      );
    }
    this.entityId = value;
    this._name = value;
  }

  get name(): string {
    return this._name;
  }

  private _name: string;

  /**
   * settings for the mat-paginator for tables.
   * map of ids (uniquely identifying a table) to pageSize or pageIndex.
   *
   * pageSizeOptions is set in the corresponding html of the component,
   * pageSize is stored persistently in the database and
   * pageIndex is saved only temporarily for the session
   */
  @DatabaseField() paginatorSettingsPageSize: { [id: string]: number } = {};
  public paginatorSettingsPageIndex: { [id: string]: number } = {};
}
