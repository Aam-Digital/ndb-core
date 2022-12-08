import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EntityPropertyViewComponent } from "./entity-property-view.component";
import { EntityUtilsModule } from "../entity-utils.module";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
import {
  ConfigService,
  createTestingConfigService,
} from "../../../config/config.service";
import { Child } from "../../../../child-dev-project/children/model/child";

describe("EntityPropertyViewComponent", () => {
  let component: EntityPropertyViewComponent;
  let fixture: ComponentFixture<EntityPropertyViewComponent>;

  let testEntity: Child;
  const testProperty: string = "dateOfBirth";

  beforeEach(async () => {
    testEntity = Child.create("tester");

    await TestBed.configureTestingModule({
      imports: [EntityUtilsModule],
      providers: [
        EntitySchemaService,
        { provide: ConfigService, useValue: createTestingConfigService() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityPropertyViewComponent);
    component = fixture.componentInstance;

    component.entity = testEntity;
    component.property = testProperty;

    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });

  it("should get component from schema if not given", () => {
    component.ngOnInit();

    expect(component.component).toBe("DisplayDate");
  });

  it("should use component from input if given", () => {
    component.component = "DisplayText";
    component.ngOnInit();

    expect(component.component).toBe("DisplayText");
  });

  it("should get label from schema", () => {
    component.ngOnInit();

    expect(component.label).toBe(Child.schema.get(testProperty).label);
  });
});
