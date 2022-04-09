import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BirthdayDashboardComponent } from "./birthday-dashboard.component";
import { ChildrenModule } from "../../children.module";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import { mockEntityMapper } from "../../../../core/entity/mock-entity-mapper-service";
import { Child } from "../../model/child";

describe("BirthdayDashboardComponent", () => {
  let component: BirthdayDashboardComponent;
  let fixture: ComponentFixture<BirthdayDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChildrenModule],
      providers: [
        {
          provide: EntityMapperService,
          useValue: mockEntityMapper([new Child(), new Child()]),
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BirthdayDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
