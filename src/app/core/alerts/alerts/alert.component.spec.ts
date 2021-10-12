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

import { AlertComponent } from "./alert.component";
import { AlertService } from "../alert.service";
import { MatButtonModule } from "@angular/material/button";
import { MAT_SNACK_BAR_DATA } from "@angular/material/snack-bar";
import { Alert } from "../alert";
import { AlertDisplay } from "../alert-display";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("AlertComponent", () => {
  let component: AlertComponent;
  let fixture: ComponentFixture<AlertComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [AlertComponent],
        imports: [FontAwesomeTestingModule, MatButtonModule],
        providers: [
          AlertService,
          {
            provide: MAT_SNACK_BAR_DATA,
            useValue: new Alert("test", Alert.WARNING, AlertDisplay.PERSISTENT),
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });
});
