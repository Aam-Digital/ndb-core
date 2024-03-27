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
import { IconName } from "@fortawesome/fontawesome-svg-core";

/**
 * Entity representing a User object including password.
 *
 * Note that in addition to the User Entity there also is a "regular" CouchDB user with the same name and password
 * in the CouchDB _users database which is used for remote database authentication.
 *
 * @Deprecated: This entity type does not provide special functionality anymore and will be replaced by a config-only type in the future
 */
@DatabaseEntity("User")
export class User extends Entity {
  static toStringAttributes = ["name"];
  static icon: IconName = "user";
  static label = $localize`:label for entity:User`;
  static labelPlural = $localize`:label (plural) for entity:Users`;
  static override hasPII = true;

  /** username used for login and identification */
  @DatabaseField({
    label: $localize`:Label of username:Username`,
    validators: { required: true, uniqueId: "User" },
  })
  name: string;
}
