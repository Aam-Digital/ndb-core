import { TestBed } from "@angular/core/testing";

import { EntityFormService } from "../entity-form/entity-form.service";
import { FormBuilder } from "@angular/forms";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { AlertService } from "../../alerts/alert.service";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";

describe("EntityFormService", () => {
  let service: EntityFormService;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj(["save"]);
    mockEntityMapper.save.and.resolveTo();
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule],
      providers: [
        FormBuilder,
        AlertService,
        EntitySchemaService,
        { provide: EntityMapperService, useValue: mockEntityMapper },
      ],
    });
    service = TestBed.inject(EntityFormService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
