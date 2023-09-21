import { TestBed } from "@angular/core/testing";

import { MockFileService } from "./mock-file.service";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "../../core/entity/model/entity";
import { firstValueFrom, NEVER, of } from "rxjs";
import {
  entityRegistry,
  EntityRegistry,
} from "../../core/entity/database-entity.decorator";
import { SessionService } from "../../core/session/session-service/session.service";
import { SyncState } from "../../core/session/session-states/sync-state.enum";

describe("MockFileService", () => {
  let service: MockFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockFileService,
        {
          provide: EntityMapperService,
          useValue: { receiveUpdates: () => NEVER },
        },
        { provide: EntityRegistry, useValue: entityRegistry },
        {
          provide: SessionService,
          useValue: { syncState: of(SyncState.COMPLETED) },
        },
      ],
    });
    service = TestBed.inject(MockFileService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should allow to open a file that has been uploaded before", async () => {
    spyOn(URL, "createObjectURL").and.returnValue("object.url");
    spyOn(window, "open");
    const entity = new Entity();
    const prop = "fileProp";
    const file = { name: "test.file " } as File;

    await firstValueFrom(service.uploadFile(file, entity, prop));

    expect(URL.createObjectURL).toHaveBeenCalledWith(file);

    service.showFile(entity, prop);

    expect(window.open).toHaveBeenCalledWith("object.url", "_blank");
  });

  it("should remove a file from a entity", async () => {
    const entity = new Entity();
    const prop = "testProp";

    const res = await firstValueFrom(service.removeFile(entity, prop));

    expect(res).toEqual({ ok: true });
  });
});
