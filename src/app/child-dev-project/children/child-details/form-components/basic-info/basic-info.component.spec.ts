import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BasicInfoComponent } from "./basic-info.component";

describe("BasicInfoComponent", () => {
  let component: BasicInfoComponent;
  let fixture: ComponentFixture<BasicInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BasicInfoComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BasicInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  // it("should create with edit mode", () => {
  //   mockChildPhotoService.canSetImage.and.returnValue(true);
  //   component.switchEdit();
  //
  //   fixture.detectChanges();
  //
  //   expect(component).toBeTruthy();
  // });
});
