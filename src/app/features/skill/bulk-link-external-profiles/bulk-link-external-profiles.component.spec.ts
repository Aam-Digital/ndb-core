import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkLinkExternalProfilesComponent } from './bulk-link-external-profiles.component';

describe('BulkLinkExternalProfilesComponent', () => {
  let component: BulkLinkExternalProfilesComponent;
  let fixture: ComponentFixture<BulkLinkExternalProfilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkLinkExternalProfilesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BulkLinkExternalProfilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
