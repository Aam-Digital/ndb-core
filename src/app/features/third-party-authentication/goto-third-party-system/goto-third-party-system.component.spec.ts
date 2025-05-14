import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GotoThirdPartySystemComponent } from './goto-third-party-system.component';

describe('GotoThirdPartySystemComponent', () => {
  let component: GotoThirdPartySystemComponent;
  let fixture: ComponentFixture<GotoThirdPartySystemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GotoThirdPartySystemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GotoThirdPartySystemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
