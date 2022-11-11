import { TestBed } from "@angular/core/testing";

import { MockFileService } from "./mock-file.service";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { Entity } from "../entity/model/entity";
import { firstValueFrom } from "rxjs";
import {
  entityRegistry,
  EntityRegistry,
} from "../entity/database-entity.decorator";

describe("MockFileService", () => {
  let service: MockFileService;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj(["save"]);
    TestBed.configureTestingModule({
      providers: [
        MockFileService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: EntityRegistry, useValue: entityRegistry },
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

    expect(entity[prop]).toBe(file.name);
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(mockEntityMapper.save).toHaveBeenCalledWith(entity);

    service.showFile(entity, prop);

    expect(window.open).toHaveBeenCalledWith("object.url", "_blank");
  });

  it("should remove a file from a entity", async () => {
    const entity = new Entity();
    const prop = "testProp";
    entity[prop] = "test.file";

    await firstValueFrom(service.removeFile(entity, prop));

    expect(entity[prop]).toBe(undefined);
    expect(mockEntityMapper.save).toHaveBeenCalledWith(entity);
  });
});
