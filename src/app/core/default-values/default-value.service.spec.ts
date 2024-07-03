import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { DefaultValueService } from "./default-value.service";
import { HandleDefaultValuesUseCase } from "./default-field-value/handle-default-values.usecase";
import { FormBuilder, FormGroup } from "@angular/forms";
import { Entity } from "../entity/model/entity";
import { EntityForm } from "../common-components/entity-form/entity-form.service";

describe("DefaultValueService", () => {
  let service: DefaultValueService;
  let mockHandleDefaultValuesUseCase: jasmine.SpyObj<HandleDefaultValuesUseCase>;

  function getEntityForm(formGroup: FormGroup): EntityForm<any> {
    return {
      formGroup: formGroup,
      entity: new Entity(),
      defaultValueConfigs: new Map(),
      inheritedParentValues: new Map(),
      inheritedSyncStatus: new Map(),
      watcher: new Map(),
    };
  }

  beforeEach(() => {
    mockHandleDefaultValuesUseCase = jasmine.createSpyObj({
      handleEntityForm: jasmine.createSpy(),
    });
    mockHandleDefaultValuesUseCase.handleEntityForm.calls.saveArgumentsByValue();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: HandleDefaultValuesUseCase,
          useValue: mockHandleDefaultValuesUseCase,
        },
      ],
    });
    service = TestBed.inject(DefaultValueService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should call HandleDefaultValuesUseCase if defaultValue is set", fakeAsync(() => {
    // given
    let form: EntityForm<any> = getEntityForm(
      new FormBuilder().group<any>({ test: {} }),
    );

    form.defaultValueConfigs.set("test", {
      mode: "static",
      value: "bar",
    });

    // when
    service.handleEntityForm(form, new Entity());
    tick();

    // then
    expect(mockHandleDefaultValuesUseCase.handleEntityForm).toHaveBeenCalled();

    Entity.schema.delete("test");
  }));
});
