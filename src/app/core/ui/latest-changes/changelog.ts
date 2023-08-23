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
 * Format of a changelog entry in the changelog.json describing one app version.
 */
export class Changelog {
  /** short title of the version */
  name: string;

  /** version tag, e.g. "2.1.7" */
  tag_name: string;

  /** description of changes included in this version */
  body: string;

  /** release date */
  published_at: string;

  /** whether it is a pre-release */
  prerelease?: boolean;

  /** whether it is a draft */
  draft?: boolean;
}
