import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditImportColumnMappingComponent } from "./edit-import-column-mapping.component";
import { HelpButtonComponent } from "app/core/common-components/help-button/help-button.component";
import { MatInputModule } from "@angular/material/input";
import { EntityFieldSelectComponent } from "app/core/entity/entity-field-select/entity-field-select.component";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatBadgeModule } from "@angular/material/badge";
import { ColumnMapping } from "../column-mapping";
import { Entity } from "../../entity/model/entity";
import { EntityRegistry } from "app/core/entity/database-entity.decorator";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

describe("EditImportColumnMappingComponent", () => {
  let component: EditImportColumnMappingComponent;
  let fixture: ComponentFixture<EditImportColumnMappingComponent>;
  let mockEntityRegistry: Partial<EntityRegistry>;

  beforeEach(async () => {
    mockEntityRegistry = {
      get: jasmine.createSpy("get").and.returnValue(Entity),
    };

    await TestBed.configureTestingModule({
      declarations: [],
      imports: [
        EditImportColumnMappingComponent,
        HelpButtonComponent,
        MatInputModule,
        EntityFieldSelectComponent,
        FormsModule,
        MatButtonModule,
        MatBadgeModule,
        BrowserAnimationsModule,
      ],
      providers: [{ provide: EntityRegistry, useValue: mockEntityRegistry }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditImportColumnMappingComponent);
    component = fixture.componentInstance;
    component.col = {} as ColumnMapping;
    component.entityCtor = Entity;
    component.mappingAdditionalWarning = "";
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
