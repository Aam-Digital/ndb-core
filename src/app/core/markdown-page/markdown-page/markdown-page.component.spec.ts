import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { MarkdownPageComponent } from "./markdown-page.component";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { MarkdownPageConfig } from "../MarkdownPageConfig";
import { RouteData } from "../../view/dynamic-routing/view-config.interface";
import { MarkdownModule } from "ngx-markdown";
import { HttpClient, HttpClientModule } from "@angular/common/http";

describe("HowToComponent", () => {
  let component: MarkdownPageComponent;
  let fixture: ComponentFixture<MarkdownPageComponent>;

  let mockRouteData: BehaviorSubject<RouteData<MarkdownPageConfig>>;

  beforeEach(waitForAsync(() => {
    mockRouteData = new BehaviorSubject({
      config: { markdownFile: "test.md" },
    });

    TestBed.configureTestingModule({
      imports: [
        MarkdownPageComponent,
        HttpClientModule,
        MarkdownModule.forRoot({ loader: HttpClient }),
      ],
      providers: [
        { provide: ActivatedRoute, useValue: { data: mockRouteData } },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkdownPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
