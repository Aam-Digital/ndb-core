import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LanguageSelectComponent } from "./language-select.component";
import { TranslationModule } from "../translation.module";

describe("LanguageSelectComponent", () => {
  let component: LanguageSelectComponent;
  let fixture: ComponentFixture<LanguageSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LanguageSelectComponent],
      imports: [TranslationModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LanguageSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
