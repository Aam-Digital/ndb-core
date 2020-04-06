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

import { UiComponent } from './ui.component';
import { RouterTestingModule } from '@angular/router/testing';
import { SearchComponent } from '../search/search.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChildrenModule } from '../../../child-dev-project/children/children.module';
import { SchoolsModule } from '../../../child-dev-project/schools/schools.module';
import { SyncStatusModule } from '../../sync-status/sync-status.module';
import { NavigationModule } from '../../navigation/navigation.module';
import { LatestChangesModule } from '../../latest-changes/latest-changes.module';
import { SessionModule } from '../../session/session.module';
import { AppConfigModule } from '../../app-config/app-config.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EntitySubrecordModule } from '../../entity-subrecord/entity-subrecord.module';
import { PrimaryActionComponent } from '../primary-action/primary-action.component';
import { AppConfig } from '../../app-config/app-config';
import { SessionService } from 'app/core/session/session-service/session.service';
import { MockSessionService } from 'app/core/session/session-service/mock-session.service';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CookieService } from 'ngx-cookie-service';
import { SwUpdate } from '@angular/service-worker';
import { of } from 'rxjs';
import { EntitySchemaService } from 'app/core/entity/schema/entity-schema.service';

describe('UiComponent', () => {
  let component: UiComponent;
  let fixture: ComponentFixture<UiComponent>;

  beforeEach(async(() => {
    AppConfig.settings = {
      'site_name': 'Testing',

      'database': {
        'name': 'unit-tests',
        'remote_url': '',
        'timeout': 60000,
        'outdated_threshold_days': 0,
        'useTemporaryDatabase': true,
      },
      webdav: {
        remote_url: '',
      },
    };

    const mockSwUpdate = { available: of(), checkForUpdate: () => {} };
    const mockSession = new MockSessionService(new EntitySchemaService());

    TestBed.configureTestingModule({
      declarations: [SearchComponent, PrimaryActionComponent, UiComponent],
      imports: [RouterTestingModule, CommonModule, FormsModule, MatIconModule, MatToolbarModule, MatSidenavModule,
        MatAutocompleteModule, MatInputModule, MatFormFieldModule, NoopAnimationsModule,
        AppConfigModule,
        EntitySubrecordModule,
        ChildrenModule,
        SchoolsModule,
        SyncStatusModule,
        NavigationModule,
        LatestChangesModule,
        SessionModule,
        FlexLayoutModule,
      ],
      providers: [
        {provide: SessionService, useValue: mockSession},
        CookieService,
        {provide: SwUpdate, useValue: mockSwUpdate},
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


   it('should be created', () => {
     expect(component).toBeTruthy();
   });

});
