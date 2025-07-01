import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ReorderableListComponent } from "./reorderable-list.component";

describe("ReorderableListComponent", () => {
  let component: ReorderableListComponent<any>;
  let fixture: ComponentFixture<ReorderableListComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReorderableListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReorderableListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
