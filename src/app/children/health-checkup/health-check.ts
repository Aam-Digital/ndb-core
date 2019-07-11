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

import { Entity } from '../../entity/entity';

/**
 * Model Class for the Health Checks that are taken for a Child.
 * It stores the Child's ID in a String and both, the height and weight in cm as a number, and the Date
 */
export class HealthCheck extends Entity {
    static ENTITY_TYPE = 'HealthCheck';

    child: string;
    date: Date;

    /** height measurement in cm **/
    height: number;

    /** weight measurement in kg **/
    weight: number;
}
