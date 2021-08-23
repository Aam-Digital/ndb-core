import { TestBed } from "@angular/core/testing";

import { AnalyticsService } from "./analytics.service";
import { Angulartics2Module } from "angulartics2";
import { RouterTestingModule } from "@angular/router/testing";
import { MockSessionModule } from "../session/mock-session.module";

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        Angulartics2Module.forRoot(),
        RouterTestingModule,
        MockSessionModule.withState(),
      ],
    });
    service = TestBed.inject(AnalyticsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
