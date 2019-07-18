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

import { Child } from './child';
import {async} from '@angular/core/testing';
import {Entity} from '../entity/entity';
import {Gender} from './Gender';
import {EntitySchemaService} from '../entity/schema/entity-schema.service';

describe('Child', () => {
  const ENTITY_TYPE = 'Child';
  let entitySchemaService: EntitySchemaService;

  beforeEach(async(() => {
    entitySchemaService = new EntitySchemaService();
  }));


  it('has correct _id and entityId and type', function () {
    const id = 'test1';
    const entity = new Child(id);

    expect(entity.getId()).toBe(id);
    expect(Entity.extractEntityIdFromId(entity._id)).toBe(id);
  });

  it('has correct type/prefix', function () {
    const id = 'test1';
    const entity = new Child(id);

    expect(entity.getType()).toBe(ENTITY_TYPE);
    expect(Entity.extractTypeFromId(entity._id)).toBe(ENTITY_TYPE);
  });

  it('has all and only defined schema fields in rawData', function () {
    const id = 'test1';
    const expectedData = {
      _id: ENTITY_TYPE + ':' + id,

      name: 'Max',
      projectNumber: '1',
      gender: 'M',
      dateOfBirth: new Date(2010, 1, 1),
      motherTongue: 'Hindi',
      religion: 'Hindu',
      schoolId: '2',
      schoolClass: '2',

      photoFile: '..',
      center: 'Alpha',
      admissionDate: new Date(),
      status: 'Active',
      address: 'Main Street',
      phone: '0112',
      guardianName: 'Mom',
      preferredTimeForGuardianMeeting: '5 a.m.',

      has_aadhar: 'applied',
      has_bankAccount: 'applied',
      has_kanyashree: 'applied',
      has_rationCard: 'applied',
      has_BplCard: 'applied',

      dropoutDate: new Date(),
      dropoutType: 'unknown',
      dropoutRemarks: 'no idea what happened',

      health_vaccinationStatus: 'none',
      health_bloodGroup: 'AB+',
      health_eyeHealthStatus: 'Ok',
      health_lastDentalCheckup: new Date(),
      health_lastEyeCheckup: new Date(),
      health_lastENTCheckup: new Date(),
      health_lastVitaminD: new Date(),
      health_lastDeworming: new Date(),

      searchIndices: [],
    };
    expectedData.searchIndices.push(expectedData.name);
    expectedData.searchIndices.push(expectedData.projectNumber);

    const entity = new Child(id);
    entity.name = expectedData.name;
    entity.projectNumber = expectedData.projectNumber;
    entity.gender = Gender.MALE;
    entity.dateOfBirth = expectedData.dateOfBirth;
    entity.motherTongue = expectedData.motherTongue;
    entity.religion = expectedData.religion;
    entity.schoolId = expectedData.schoolId;
    entity.schoolClass = expectedData.schoolClass;

    entity.photoFile = expectedData.photoFile;
    entity.center = expectedData.center;
    entity.admissionDate = expectedData.admissionDate;
    entity.status = expectedData.status;
    entity.address = expectedData.address;
    entity.phone = expectedData.phone;
    entity.guardianName = expectedData.guardianName;
    entity.preferredTimeForGuardianMeeting = expectedData.preferredTimeForGuardianMeeting;

    entity.has_aadhar = expectedData.has_aadhar;
    entity.has_bankAccount = expectedData.has_bankAccount;
    entity.has_kanyashree = expectedData.has_kanyashree;
    entity.has_rationCard = expectedData.has_rationCard;
    entity.has_BplCard = expectedData.has_BplCard;

    entity.dropoutDate = expectedData.dropoutDate;
    entity.dropoutType = expectedData.dropoutType;
    entity.dropoutRemarks = expectedData.dropoutRemarks;

    entity.health_vaccinationStatus = expectedData.health_vaccinationStatus;
    entity.health_bloodGroup = expectedData.health_bloodGroup;
    entity.health_eyeHealthStatus = expectedData.health_eyeHealthStatus;
    entity.health_lastDentalCheckup = expectedData.health_lastDentalCheckup;
    entity.health_lastEyeCheckup = expectedData.health_lastEyeCheckup;
    entity.health_lastENTCheckup = expectedData.health_lastENTCheckup;
    entity.health_lastVitaminD = expectedData.health_lastVitaminD;
    entity.health_lastDeworming = expectedData.health_lastDeworming;

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData).toEqual(expectedData);
  });
});
