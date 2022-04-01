import { TestBed } from "@angular/core/testing";

import { EntityFormService } from "./entity-form.service";
import { FormBuilder } from "@angular/forms";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { EntityFormModule } from "./entity-form.module";
import { Entity } from "../../entity/model/entity";

describe("EntityFormService", () => {
  let service: EntityFormService;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj(["save"]);
    mockEntityMapper.save.and.resolveTo();
    TestBed.configureTestingModule({
      imports: [EntityFormModule],
      providers: [
        FormBuilder,
        EntitySchemaService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
      ],
    });
    service = TestBed.inject(EntityFormService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should not save invalid entities", () => {
    const entity = new Entity("initialId");
    spyOn(entity, "copy").and.returnValue(entity);
    spyOn(entity, "assertValid").and.throwError(new Error());
    const formGroup = TestBed.inject(FormBuilder).group({ _id: "newId" });

    expect(() => service.saveChanges(formGroup, entity)).toThrowError();
    // expect(entity.getId()).not.toBe("newId");
  });

  it("should update entity if saving is successful", async () => {
    const entity = new Entity("initialId");
    const formGroup = TestBed.inject(FormBuilder).group({ _id: "newId" });

    await service.saveChanges(formGroup, entity);

    expect(entity.getId()).toBe("newId");
  });
});
