import { TestBed } from "@angular/core/testing";

import { AnalyticsService } from "./analytics.service";
import { Angulartics2Module } from "angulartics2";
import { RouterTestingModule } from "@angular/router/testing";
import { SessionService } from "../session/session-service/session.service";
import { LoginState } from "../session/session-states/login-state.enum";
import { BehaviorSubject } from "rxjs";

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  beforeEach(() => {
    const mockSessionService = jasmine.createSpyObj<SessionService>([], {
      loginStateStream: new BehaviorSubject(LoginState.LOGGED_OUT),
    });

    TestBed.configureTestingModule({
      imports: [Angulartics2Module.forRoot(), RouterTestingModule],
      providers: [{ provide: SessionService, useValue: mockSessionService }],
    });
    service = TestBed.inject(AnalyticsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
