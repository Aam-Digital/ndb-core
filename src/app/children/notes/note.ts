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

import {Entity} from '../../entity/entity';
import {WarningLevel} from '../attendance/warning-level';
import {DatabaseEntity} from '../../entity/database-entity.decorator';
import {DatabaseField} from '../../entity/database-field.decorator';

@DatabaseEntity('Note')
export class Note extends Entity {

  static INTERACTION_TYPES = [
    'Home Visit',
    'Talk with Guardians',
    'Talk with Child',
    'Incident',
    'Discussion/Decision',
    'School/Hostel Visit',
    'Phone Call',
    'Talk with Coaching Teacher',
    'Talk with Peer',
    'Talk with Neighbours',
    'Guardians\' Meeting',
    'Children\'s Meeting',
    'Daily Routine',
    'Annual Survey',
    'Contact with other partners (club/NGO/...)',
  ];

  @DatabaseField() children: string[] = []; // id of Child entity
  @DatabaseField() date: Date;
  @DatabaseField() subject: string = '';
  @DatabaseField() text: string = '';
  @DatabaseField() author: string = '';
  @DatabaseField() category: string = '';
  @DatabaseField({dataType: 'string'}) warningLevel: WarningLevel = WarningLevel.OK;

  getWarningLevel (): WarningLevel {
    return this.warningLevel;
  }

  isLinkedWithChild(childId: string) {
    return (this.children.findIndex(e => e === childId) > -1);
  }


  public getColor() {
    if (this.warningLevel === WarningLevel.URGENT) {
      return '#fd727280';
    }
    if (this.warningLevel === WarningLevel.WARNING) {
      return '#ffa50080';
    }

    if (this.category === 'Guardians\' Meeting' || this.category === 'Children\'s Meeting') {
      return '#E1F5FE';
    }
    if (this.category === 'Discussion/Decision') {
      return '#E1BEE7';
    }
    if (this.category === 'Annual Survey') {
      return '#FFFDE7';
    }
    if (this.category === 'Daily Routine') {
      return '#F1F8E9';
    }

    return '';
  }
}
