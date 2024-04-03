import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatTabsModule } from "@angular/material/tabs";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AdminEntityEditComponent } from "./admin-entity-edit.component";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import { FaDynamicIconComponent } from "../../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

describe("AdminEntityEditComponent", () => {
  let component: AdminEntityEditComponent;
  let fixture: ComponentFixture<AdminEntityEditComponent>;

  // Mock EntityConstructor
  const mockEntityConstructor: EntityConstructor = class MockEntity extends Entity {
    constructor(public id?: string) {
      super(id);
    }
  };

  mockEntityConstructor.prototype.label = "Child";
  mockEntityConstructor.prototype.labelPlural = "Childrens";
  mockEntityConstructor.prototype.icon = "child";
  mockEntityConstructor.prototype.toStringAttributes = [
    "firstname",
    "lastname",
  ];

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
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminEntityEditComponent);
    component = fixture.componentInstance;
    component.entityConstructor = mockEntityConstructor;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
