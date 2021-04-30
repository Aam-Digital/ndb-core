import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { SchoolBlockWrapperComponent } from "./school-block-wrapper.component";
import { ChildrenModule } from "../../children.module";
import { RouterTestingModule } from "@angular/router/testing";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { mockEntityMapper } from "app/core/entity/mock-entity-mapper-service";

describe("SchoolBlockWrapperComponent", () => {
  let component: SchoolBlockWrapperComponent;
  let fixture: ComponentFixture<SchoolBlockWrapperComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [ChildrenModule, RouterTestingModule],
        providers: [
          { provide: EntityMapperService, useValue: mockEntityMapper([]) },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(SchoolBlockWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
