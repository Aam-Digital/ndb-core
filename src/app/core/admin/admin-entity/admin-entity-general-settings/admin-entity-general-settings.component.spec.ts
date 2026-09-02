/*
 * Kept for its setup, not its assertion.
 *
 * This component needs real providers or inputs to be constructed at all, so it cannot join
 * the sweep in `src/app/component-smoke.spec.ts`, and working out what it depends on is the
 * expensive part of writing a test for it. The construction check below is a placeholder:
 * the component has enough logic to deserve real assertions, so add them here rather than
 * starting a new file.
 */
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
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";

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
          useValue: {
            load: vi.fn(),
          },
        },
        EntityRegistry,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminEntityGeneralSettingsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("entityConstructor", mockEntityConstructor);
    fixture.componentRef.setInput("generalSettings", { label: "Test Label" });

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
