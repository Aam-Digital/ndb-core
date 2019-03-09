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


export class Note extends Entity {
  static ENTITY_TYPE = 'Note';
  static schema = Entity.schema.extend({
    'children': 'any', // TODO: change schema type to string[] (or Child[]) once lists are implemented in EntitySchema
    'date': 'date=',
    'subject': 'string=',
    'text': 'string=',
    'author': 'string=',
    'category': 'string=',
    'warningLevel': 'string?',
  });


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
    'Guardians\' Meeting',
    'Children\'s Meeting',
    'Daily Routine',
    'Annual Survey',
  ];

  children: string[] = []; // id of Child entity
  date: Date;
  subject = '';
  text = '';
  author = '';
  category = '';
  warningLevel: WarningLevel = WarningLevel.OK;

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
