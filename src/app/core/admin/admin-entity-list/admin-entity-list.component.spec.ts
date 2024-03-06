import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminEntityListComponent } from "./admin-entity-list.component";
import { FilterGeneratorService } from "../../filter/filter-generator/filter-generator.service";
import { FilterService } from "../../filter/filter.service";
import { ActivatedRoute } from "@angular/router";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("AdminEntityListComponent", () => {
  let component: AdminEntityListComponent;
  let fixture: ComponentFixture<AdminEntityListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEntityListComponent, FontAwesomeTestingModule],
      providers: [
        { provide: FilterGeneratorService, useValue: {} },
        { provide: FilterService, useValue: {} },
        { provide: ActivatedRoute, useValue: {} },
        { provide: EntityFormService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEntityListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
