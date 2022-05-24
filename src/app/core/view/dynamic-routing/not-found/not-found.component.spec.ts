import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NotFoundComponent } from "./not-found.component";
import { RouterTestingModule } from "@angular/router/testing";
import { ViewModule } from "../../view.module";

describe("NotFoundComponent", () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewModule, RouterTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
