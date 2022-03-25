import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditEntityArrayComponent } from "./edit-entity-array.component";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { Child } from "../../../../../child-dev-project/children/model/child";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EntityUtilsModule } from "../../entity-utils.module";
import { EntitySchemaService } from "../../../../entity/schema/entity-schema.service";
import { setupEditComponent } from "../edit-component.spec";
import {
  EntityRegistry,
  entityRegistry,
} from "../../../../entity/database-entity.decorator";

describe("EditEntityArrayComponent", () => {
  let component: EditEntityArrayComponent;
  let fixture: ComponentFixture<EditEntityArrayComponent>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(async () => {
    mockEntityMapper = jasmine.createSpyObj(["loadType"]);
    mockEntityMapper.loadType.and.resolveTo([]);
    await TestBed.configureTestingModule({
      imports: [EntityUtilsModule, NoopAnimationsModule],
      declarations: [EditEntityArrayComponent],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: EntityRegistry, useValue: entityRegistry },
        EntitySchemaService,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditEntityArrayComponent);
    component = fixture.componentInstance;
    setupEditComponent(component);
    component.entityName = Child.ENTITY_TYPE;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
