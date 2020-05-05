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
import { SessionService } from '../../session/session-service/session.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatTabsModule } from '@angular/material';
import { EntityMapperService } from 'app/core/entity/entity-mapper.service';
import { Database } from 'app/core/database/database';
import { MockDatabase } from 'app/core/database/mock-database';
import { WebdavModule } from '../../webdav/webdav.module';
import { User } from '../user';
import { AppConfig } from '../../app-config/app-config';

describe('UserAccountComponent', () => {
  let component: UserAccountComponent;
  let fixture: ComponentFixture<UserAccountComponent>;

  let mockSessionService;
  let mockEntityMapper;
  const testUser = new User('');

  beforeEach(async(() => {
    // @ts-ignore
    AppConfig.settings = {};
    mockSessionService = jasmine.createSpyObj('sessionService', ['getCurrentUser']);
    mockSessionService.getCurrentUser.and.returnValue(testUser);
    mockEntityMapper = jasmine.createSpyObj(['save']);

    TestBed.configureTestingModule({
      declarations: [
        UserAccountComponent,
      ],
      imports: [
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        NoopAnimationsModule,
        MatTabsModule,
        WebdavModule,
      ],
      providers: [
        { provide: Database, useClass: MockDatabase },
        { provide: SessionService, useValue: mockSessionService },
        { provide: EntityMapperService, useValue: mockEntityMapper },
      ],
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
