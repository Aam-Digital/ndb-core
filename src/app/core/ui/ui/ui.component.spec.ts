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

import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { UiComponent } from "./ui.component";
import { RouterTestingModule } from "@angular/router/testing";
import { SearchComponent } from "../search/search.component";
import { CommonModule } from "@angular/common";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { PrimaryActionComponent } from "../primary-action/primary-action.component";
import { SwUpdate } from "@angular/service-worker";
import { of, Subject } from "rxjs";
import { ApplicationInitStatus } from "@angular/core";
import { UiModule } from "../ui.module";
import { Angulartics2Module } from "angulartics2";
import { ConfigService } from "../../config/config.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { PermissionsModule } from "../../permissions/permissions.module";
import { MockSessionModule } from "../../session/mock-session.module";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { DatabaseIndexingService } from "../../entity/database-indexing/database-indexing.service";

describe("UiComponent", () => {
  let component: UiComponent;
  let fixture: ComponentFixture<UiComponent>;

  beforeEach(
    waitForAsync(() => {
      const mockSwUpdate = { available: of(), checkForUpdate: () => {} };
      const mockIndexingService = jasmine.createSpyObj<DatabaseIndexingService>(
        ["createIndex"],
        {
          indicesRegistered: new Subject(),
        }
      );
      mockIndexingService.createIndex.and.resolveTo();

      TestBed.configureTestingModule({
        declarations: [SearchComponent, PrimaryActionComponent, UiComponent],
        imports: [
          RouterTestingModule,
          CommonModule,
          UiModule,
          NoopAnimationsModule,
          Angulartics2Module.forRoot(),
          FontAwesomeTestingModule,
          MockSessionModule.withState(),
          PermissionsModule.withAbility(),
        ],
        providers: [
          { provide: SwUpdate, useValue: mockSwUpdate },
          {
            provide: DatabaseIndexingService,
            useValue: mockIndexingService,
          },
          ConfigService,
        ],
      }).compileComponents();
      TestBed.inject(ApplicationInitStatus); // This ensures that the AppConfig is loaded before test execution

      const entityMapper = TestBed.inject(EntityMapperService);
      const configService = TestBed.inject(ConfigService);
      configService.saveConfig(entityMapper, { navigationMenu: { items: [] } });
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(UiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });
});
