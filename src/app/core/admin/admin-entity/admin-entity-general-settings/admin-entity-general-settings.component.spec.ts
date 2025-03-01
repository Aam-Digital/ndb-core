import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatTabsModule } from "@angular/material/tabs";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AdminEntityGeneralSettingsComponent } from "./admin-entity-general-settings.component";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import { FaDynamicIconComponent } from "../../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "app/core/entity/entity-mapper/mock-entity-mapper-service";

describe("AdminEntityGeneralSettingsComponent", () => {
  let component: AdminEntityGeneralSettingsComponent;
  let fixture: ComponentFixture<AdminEntityGeneralSettingsComponent>;

  // Mock EntityConstructor
  const mockEntityConstructor: EntityConstructor = class MockEntity extends Entity {
    constructor(public id?: string) {
      super(id);
    }
  };

  mockEntityConstructor.label = "Child";
  mockEntityConstructor.labelPlural = "Childrens";
  mockEntityConstructor.icon = "child";
  mockEntityConstructor.toStringAttributes = ["firstname", "lastname"];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MatButtonModule,
        MatInputModule,
        MatTabsModule,
        MatSlideToggleModule,
        MatTooltipModule,
        FaDynamicIconComponent,
        FontAwesomeTestingModule,
        ReactiveFormsModule,
        FormsModule,
      ],
      providers: [
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper(),
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminEntityGeneralSettingsComponent);
    component = fixture.componentInstance;
    component.entityConstructor = mockEntityConstructor;
    component.generalSettings = { label: "Test Label" };
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
