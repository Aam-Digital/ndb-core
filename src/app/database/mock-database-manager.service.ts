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

import { Injectable } from '@angular/core';
import { DatabaseManagerService } from './database-manager.service';
import { User } from '../user/user';
import { Database } from './database';
import { isNullOrUndefined } from 'util';
import {MockDatabase} from './mock-database';
import {Gender} from '../children/Gender';
import {AttendanceMonth} from '../children/attendance/attendance-month';
import {EntityMapperService} from '../entity/entity-mapper.service';

@Injectable()
export class MockDatabaseManagerService extends DatabaseManagerService {

  private database: MockDatabase;


  static getDummyDataAttendance(): AttendanceMonth[] {
    const data =  new Array<AttendanceMonth>();
    const a1 = new AttendanceMonth('1');
    a1.student = '22';
    a1.month = new Date('2018-01-01');
    a1.daysWorking = 20;
    a1.daysAttended = 18;
    data.push(a1);

    const a2 = new AttendanceMonth('2');
    a2.student = '22';
    a2.month = new Date('2018-02-01');
    a2.daysWorking = 22;
    a2.daysAttended = 5;
    data.push(a2);

    const a3 = new AttendanceMonth('3');
    a3.student = '22';
    a3.month = new Date('2018-03-01');
    a3.daysWorking = 19;
    a3.daysAttended = 11;
    a3.daysExcused = 3;
    data.push(a3);

    return data;
  }


  constructor() {
    super();

    this.database = new MockDatabase();
    this.initDemoData();
  }

  private initDemoData() {
    const entityMapper = new EntityMapperService(this.database);

    // add demo user
    const demoUser = new User('demo');
    demoUser.name = 'demo';
    demoUser.setNewPassword('pass');
    const demoUserData = JSON.parse(JSON.stringify(demoUser));
    demoUserData._id = demoUser.getType() + ':' + demoUser.name;
    this.database.put(demoUserData);

    this.database.put({
      '_id': 'Child:22',
      'name': 'Max Meyer',
      'pn': '22',
      'religion': 'Hindu',
      'gender': Gender.MALE,
      'dateOfBirth': '2000-03-01',
      'motherTongue': 'Hindi',
      'admission': '2013-10-04',
      'center': 'Tikiapara',
    });
    this.database.put({
      '_id': 'Child:25',
      'name': 'Sonia Sagufta',
      'pn': '25',
      'religion': 'Muslim',
      'gender': Gender.FEMALE,
      'dateOfBirth': '2001-01-01',
      'motherTongue': 'Hindi',
      'admission': '2013-10-04',
      'center': 'Tikiapara',
    });

    this.database.put({
      '_id': 'School:1',
      'name': 'St. Mary Day School',
      'medium': 'English',
    });
    this.database.put({
      '_id': 'School:2',
      'name': 'Public High',
      'medium': 'Hindi',
    });

    MockDatabaseManagerService.getDummyDataAttendance()
      .forEach(d => entityMapper.save(d));
  }


  login(username: string, password: string): Promise<boolean> {
    return Promise.resolve(true);
  }

  logout(): void {
  }

  getDatabase(): Database {
    return this.database;
  }
}
