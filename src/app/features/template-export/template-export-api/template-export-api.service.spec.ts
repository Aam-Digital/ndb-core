import { TestBed } from "@angular/core/testing";

import { TemplateExportApiService } from "./template-export-api.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { SyncStateSubject } from "../../../core/session/session-type";
import { of } from "rxjs";
import { SyncState } from "../../../core/session/session-states/sync-state.enum";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";

describe("TemplateExportApiService", () => {
  let service: TemplateExportApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: null },
        EntityRegistry,
        {
          provide: SyncStateSubject,
          useValue: of(SyncState.COMPLETED),
        },
        { provide: NAVIGATOR_TOKEN, useValue: null },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TemplateExportApiService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
