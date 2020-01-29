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

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAccountComponent } from './user-account.component';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SessionService } from '../../session/session.service';
import { User } from '../user';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockSessionService } from 'app/core/session/mock-session.service';
import { EntitySchemaService } from 'app/core/entity/schema/entity-schema.service';
import { CloudFileService } from 'app/core/webdav/cloud-file-service.service';
import { MockCloudFileService } from 'app/core/webdav/mock-cloud-file-service';
import { MatTabsModule } from '@angular/material';
import { EntityMapperService } from 'app/core/entity/entity-mapper.service';
import { Database } from 'app/core/database/database';
import { MockDatabase } from 'app/core/database/mock-database';

describe('UserAccountComponent', () => {
  let userAccountComponent: UserAccountComponent;
  let cloudFileService: jasmine.SpyObj<CloudFileService>;
  let sessionService: jasmine.SpyObj<SessionService>;
  let sessionSpy, cloudFileSpy;

  beforeEach(async(() => {
    sessionSpy = jasmine.createSpyObj('SessionService', ['getCurrentUser']);
    cloudFileSpy = jasmine.createSpyObj('SessionService', ['connect', 'checkConnection']);

    TestBed.configureTestingModule({
      imports: [MatFormFieldModule, MatInputModule, MatButtonModule, NoopAnimationsModule, MatTabsModule],
      providers: [
        UserAccountComponent,
        EntityMapperService,
        EntitySchemaService,
        { provide: Database, useClass: MockDatabase },
        {provide: SessionService, useValue: sessionSpy},
        {provide: CloudFileService, useValue: cloudFileSpy},
      ],
    });

    userAccountComponent = TestBed.get(UserAccountComponent);
    cloudFileService = TestBed.get(CloudFileService);
    sessionService = TestBed.get(SessionService);
  }));

  it('should be created', () => {
    expect(userAccountComponent).toBeTruthy();
  });

  it('should update cloud-service credentials annd check the connection', () => {
    const user = new User('user');
    spyOn(user, 'setCloudPassword');
    sessionService.getCurrentUser.and.returnValue(user);
    userAccountComponent.updateCloudService('testUser', 'testPwd', 'loginPwd');
    expect(sessionService.getCurrentUser).toHaveBeenCalled();
    expect(user.cloudUserName).toBe('testUser');
    expect(user.setCloudPassword).toHaveBeenCalledWith('testPwd', 'loginPwd');
    expect(cloudFileService.connect).toHaveBeenCalled();
    expect(cloudFileService.checkConnection).toHaveBeenCalled();
  });
});
