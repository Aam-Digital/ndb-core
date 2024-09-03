import { fakeAsync, TestBed, tick } from "@angular/core/testing";

import { InheritedValueService } from "./inherited-value.service";
import { Entity } from "../entity/model/entity";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import {
  cleanUpTemporarySchemaFields,
  getDefaultInheritedForm,
} from "./default-value.service.spec";
import { DynamicPlaceholderValueService } from "./dynamic-placeholder-value.service";
import { FormControl, FormGroup } from "@angular/forms";
import { EntityForm } from "../common-components/entity-form/entity-form.service";
import { DefaultValueService } from "./default-value.service";

describe("InheritedValueService", () => {
  let service: InheritedValueService;
  let defaultValueService: DefaultValueService;
  let mockEntityMapperService: jasmine.SpyObj<EntityMapperService>;

  beforeEach(() => {
    mockEntityMapperService = jasmine.createSpyObj(["load"]);

    TestBed.configureTestingModule({
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapperService },
        { provide: DynamicPlaceholderValueService, useValue: null },
      ],
    });
    service = TestBed.inject(InheritedValueService);
    defaultValueService = TestBed.inject(DefaultValueService);
  });

  afterEach(() => {
    cleanUpTemporarySchemaFields();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should do nothing, if field in parent entity is missing", () => {
    // given
    let entity = new Entity();

    let form: EntityForm<any> = {
      formGroup: new FormGroup<any>({
        field1: new FormControl(),
      }),
      entity: entity,
      defaultValueConfigs: new Map(),
      watcher: new Map(),
      inheritedParentValues: new Map(),
    };

    let targetFormControl = form.formGroup.get("field1");

    // when
    service.setDefaultValue(
      targetFormControl,
      {
        defaultValue: {
          mode: "inherited",
          field: "invalid-field",
          localAttribute: "reference-1",
        },
      },
      form,
    );

    // then
    expect(targetFormControl.value).toBe(undefined);
    expect(
      form.watcher.has("sourceFormControlValueChanges_field1"),
    ).toBeFalse();
  });

  it("should set default value on FormControl, if target field empty", fakeAsync(() => {
    // given
    let entity = new Entity();
    entity["foo"] = "bar";
    mockEntityMapperService.load.and.returnValue(Promise.resolve(entity));

    let form: EntityForm<any> = {
      formGroup: new FormGroup<any>({
        field1: new FormControl(),
        field2: new FormControl(),
      }),
      entity: entity,
      defaultValueConfigs: new Map(),
      watcher: new Map(),
      inheritedParentValues: new Map(),
    };

    let targetFormControl = form.formGroup.get("field1");

    // when
    service.setDefaultValue(
      targetFormControl,
      {
        isArray: false,
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "field2",
        },
      },
      form,
    );

    // when
    tick();
    form.formGroup.get("field2").setValue("Entity:0");
    tick(10); // fetching reference is always async

    // then
    expect(form.watcher.has("sourceFormControlValueChanges_field2")).toBeTrue();
    expect(targetFormControl.value).toBe("bar");
  }));

  it("should set default array value on FormControl, if target field empty", fakeAsync(() => {
    // given
    let entity = new Entity();
    entity["foo"] = ["bar", "doo"];
    mockEntityMapperService.load.and.returnValue(Promise.resolve(entity));

    let form: EntityForm<any> = {
      formGroup: new FormGroup<any>({
        field1: new FormControl(),
        field2: new FormControl(),
      }),
      entity: entity,
      defaultValueConfigs: new Map(),
      watcher: new Map(),
      inheritedParentValues: new Map(),
    };

    let targetFormControl = form.formGroup.get("field1");

    // when
    service.setDefaultValue(
      targetFormControl,
      {
        isArray: true,
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "field2",
        },
      },
      form,
    );

    // when
    tick();
    form.formGroup.get("field2").setValue("Entity:0");
    tick(10); // fetching reference is always async

    // then
    expect(form.watcher.has("sourceFormControlValueChanges_field2")).toBeTrue();
    expect(targetFormControl.value).toEqual(["bar", "doo"]);
  }));

  it("should set value on FormControl, if source is single value array", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      field: {
        isArray: true,
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "reference-1",
        },
      },
    });

    let entity0 = new Entity();
    entity0["foo"] = ["bar"];
    mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));

    // when
    defaultValueService.handleEntityForm(form, form.entity);
    tick();
    form.formGroup.get("reference-1").setValue(["Entity:0"]);
    tick(10); // fetching reference is always async

    // then
    expect(form.formGroup.get("field").value).toEqual(["bar"]);
  }));

  it("should not set value on FormControl, if source is multi value array", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      field: {
        isArray: true,
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "reference-1",
        },
      },
    });

    let entity0 = new Entity();
    entity0["foo"] = ["bar", "doo"];
    mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));

    // when
    defaultValueService.handleEntityForm(form, form.entity);
    tick();
    form.formGroup.get("reference-1").setValue(["Entity:0", "Entity:1"]);
    tick(10); // fetching reference is always async

    // then
    expect(form.formGroup.get("field").value).toEqual(undefined);
  }));

  it("should reset FormControl, if parent (array) field got cleared", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      field: {
        isArray: true,
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "reference-1",
        },
      },
    });

    let entity0 = new Entity();
    entity0["foo"] = ["bar", "doo"];
    mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));

    // when
    defaultValueService.handleEntityForm(form, form.entity);
    tick();
    form.formGroup.get("reference-1").setValue("foo");
    tick();

    expect(form.formGroup.get("field").value).toEqual(["bar", "doo"]);

    // when/then
    form.formGroup.get("reference-1").setValue(null);
    tick(); // fetching reference is always async
    expect(form.formGroup.get("field").value).toBe(undefined);

    form.formGroup.get("reference-1").setValue(undefined);
    tick(); // fetching reference is always async
    expect(form.formGroup.get("field").value).toBe(undefined);

    form.formGroup.get("reference-1").setValue("");
    tick(); // fetching reference is always async
    expect(form.formGroup.get("field").value).toBe(undefined);
  }));

  it("should reset FormControl, if parent (single value) field got cleared", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      field: {
        isArray: false,
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "reference-1",
        },
      },
    });

    let entity0 = new Entity();
    entity0["foo"] = "bar";
    mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));

    // when
    defaultValueService.handleEntityForm(form, form.entity);
    tick();
    form.formGroup.get("reference-1").setValue("foo");
    tick();

    expect(form.formGroup.get("field").value).toBe("bar");

    // when/then
    form.formGroup.get("reference-1").setValue(null);
    tick(); // fetching reference is always async
    expect(form.formGroup.get("field").value).toBe(undefined);

    form.formGroup.get("reference-1").setValue(undefined);
    tick(); // fetching reference is always async
    expect(form.formGroup.get("field").value).toBe(undefined);

    form.formGroup.get("reference-1").setValue("");
    tick(); // fetching reference is always async
    expect(form.formGroup.get("field").value).toBe(undefined);
  }));

  it("should do nothing, if parent entity does not exist", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      field: {
        isArray: true,
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "reference-1",
        },
      },
    });

    mockEntityMapperService.load.and.returnValue(Promise.resolve(undefined));

    // when
    defaultValueService.handleEntityForm(form, form.entity);
    tick();

    // when/then
    form.formGroup.get("reference-1").setValue("non-existing-entity-id");
    tick(); // fetching reference is always async
    expect(form.formGroup.get("field").value).toBe(undefined);
  }));

  it("should do nothing, if formGroup is disabled", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      field: {
        isArray: true,
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "reference-1",
        },
      },
    });

    form.formGroup.disable();

    mockEntityMapperService.load.and.returnValue(Promise.resolve(undefined));

    // when
    defaultValueService.handleEntityForm(form, form.entity);
    tick();

    // when/then
    form.formGroup.get("reference-1").setValue("non-existing-entity-id");
    tick(); // fetching reference is always async
    expect(form.formGroup.get("field").value).toBe(null);
  }));

  it("should set value on FormControl, if source is not in formGroup but set on entity", fakeAsync(() => {
    // given
    let form = getDefaultInheritedForm({
      field: {
        isArray: true,
        defaultValue: {
          mode: "inherited",
          field: "foo",
          localAttribute: "reference-1",
        },
      },
    });
    form.formGroup.removeControl("reference-1");

    let entity0 = new Entity();
    entity0["foo"] = ["bar"];
    mockEntityMapperService.load.and.returnValue(Promise.resolve(entity0));
    form.entity["reference-1"] = entity0.getId();

    // when
    defaultValueService.handleEntityForm(form, form.entity);
    tick();

    // then
    expect(form.formGroup.get("field").value).toEqual(["bar"]);
  }));
});
