import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { EntityFormComponent } from "./entity-form.component";
import { ChildPhotoService } from "../../../../child-dev-project/children/child-photo-service/child-photo.service";
import { Entity } from "../../../entity/model/entity";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { User } from "../../../user/user";
import { RouterTestingModule } from "@angular/router/testing";
import { SessionService } from "../../../session/session-service/session.service";
import { ConfigService } from "../../../config/config.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { AlertService } from "../../../alerts/alert.service";
import { DatabaseField } from "../../../entity/database-field.decorator";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import { Child } from "../../../../child-dev-project/children/model/child";
import { EntityFormModule } from "../entity-form.module";
import { FormBuilder } from "@angular/forms";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { EntityFormService } from "../entity-form.service";

describe("EntityFormComponent", () => {
  let component: EntityFormComponent;
  let fixture: ComponentFixture<EntityFormComponent>;

  let mockChildPhotoService: jasmine.SpyObj<ChildPhotoService>;
  let mockSessionService: jasmine.SpyObj<SessionService>;
  let mockConfigService: jasmine.SpyObj<ConfigService>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockEntitySchemaService: jasmine.SpyObj<EntitySchemaService>;

  const testChild = new Child("Test Name");

  beforeEach(
    waitForAsync(() => {
      mockChildPhotoService = jasmine.createSpyObj([
        "canSetImage",
        "setImage",
        "getImage",
      ]);
      mockSessionService = jasmine.createSpyObj({
        getCurrentUser: new User("test-user"),
      });
      mockConfigService = jasmine.createSpyObj(["getConfig"]);
      mockEntityMapper = jasmine.createSpyObj(["save"]);
      mockEntityMapper.save.and.resolveTo();
      mockEntitySchemaService = jasmine.createSpyObj([
        "getComponent",
        "registerSchemaDatatype",
      ]);

      TestBed.configureTestingModule({
        declarations: [EntityFormComponent],
        imports: [
          EntityFormModule,
          NoopAnimationsModule,
          RouterTestingModule,
          MatSnackBarModule,
        ],
        providers: [
          FormBuilder,
          AlertService,
          { provide: EntityMapperService, useValue: mockEntityMapper },
          { provide: ChildPhotoService, useValue: mockChildPhotoService },
          { provide: SessionService, useValue: mockSessionService },
          { provide: ConfigService, useValue: mockConfigService },
          { provide: EntitySchemaService, useValue: mockEntitySchemaService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    testChild.name = "Test Name";
    mockChildPhotoService.canSetImage.and.returnValue(false);
    fixture = TestBed.createComponent(EntityFormComponent);
    component = fixture.componentInstance;
    component.entity = testChild;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit notification when a child is saved", (done) => {
    spyOnProperty(component.form, "valid").and.returnValue(true);
    const subscription = component.save.subscribe((child) => {
      expect(child).toEqual(testChild);
      subscription.unsubscribe();
      done();
    });

    component.saveClicked();
  });

  it("should show an warning alert when form service rejects saving", async () => {
    const alertService = TestBed.inject(AlertService);
    spyOn(alertService, "addWarning");
    const entityFormService = TestBed.inject(EntityFormService);
    spyOn(entityFormService, "saveChanges").and.rejectWith(
      new Error("error message")
    );

    await component.saveClicked();

    expect(alertService.addWarning).toHaveBeenCalledWith("error message");
  });

  it("should add column definitions from property schema", () => {
    class Test extends Entity {
      @DatabaseField({ description: "Property description" })
      propertyField: string;
    }
    mockEntitySchemaService.getComponent.and.returnValue("PredefinedComponent");
    component.entity = new Test();
    component.columns = [
      [
        {
          id: "fieldWithDefinition",
          edit: "EditComponent",
          view: "DisplayComponent",
          label: "Field with definition",
          tooltip: "Custom tooltip",
        },
        { id: "propertyField", label: "Property" },
      ],
    ];

    component.ngOnInit();

    expect(component._columns).toEqual([
      [
        {
          id: "fieldWithDefinition",
          edit: "EditComponent",
          view: "DisplayComponent",
          label: "Field with definition",
          forTable: false,
          tooltip: "Custom tooltip",
        },
        {
          id: "propertyField",
          edit: "PredefinedComponent",
          view: "PredefinedComponent",
          label: "Property",
          forTable: false,
          tooltip: "Property description",
        },
      ],
    ]);
  });
});
