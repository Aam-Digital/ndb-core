import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportMatchExistingComponent } from "./import-match-existing.component";
import { EntityRegistry } from "../../../entity/database-entity.decorator";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ImportMatchExistingComponent", () => {
  let component: ImportMatchExistingComponent;
  let fixture: ComponentFixture<ImportMatchExistingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ImportMatchExistingComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [EntityRegistry],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportMatchExistingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
