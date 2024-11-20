import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditExternalProfileLinkComponent } from "./edit-external-profile-link.component";

describe("LinkExternalProfileComponent", () => {
  let component: EditExternalProfileLinkComponent;
  let fixture: ComponentFixture<EditExternalProfileLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditExternalProfileLinkComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditExternalProfileLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
