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

import { LoginComponent } from "./login.component";
import { LoginState } from "../session-states/login-state.enum";
import { BehaviorSubject } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { LoginStateSubject } from "../session-type";

describe("LoginComponent", () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let loginState: LoginStateSubject;

  beforeEach(waitForAsync(() => {
    loginState = new BehaviorSubject(LoginState.LOGGED_IN);
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [{ provide: LoginStateSubject, useValue: loginState }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });

  it("should route to redirect uri once state changes to 'logged-in'", () => {
    const navigateSpy = spyOn(TestBed.inject(Router), "navigateByUrl");
    TestBed.inject(ActivatedRoute).snapshot.queryParams = {
      redirect_uri: "someUrl",
    };

    loginState.next(LoginState.LOGGED_IN);

    expect(navigateSpy).toHaveBeenCalledWith("someUrl");
  });
});
