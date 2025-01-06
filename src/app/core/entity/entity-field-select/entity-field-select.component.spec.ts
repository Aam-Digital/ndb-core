import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityFieldSelectComponent } from "./entity-field-select.component";
import { EntityRegistry } from "../database-entity.decorator";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ReactiveFormsModule } from "@angular/forms";

describe("EntityFieldSelectComponent", () => {
  let component: EntityFieldSelectComponent;
  let fixture: ComponentFixture<EntityFieldSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        EntityFieldSelectComponent,
        ReactiveFormsModule,
      ],
      providers: [EntityRegistry],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityFieldSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});