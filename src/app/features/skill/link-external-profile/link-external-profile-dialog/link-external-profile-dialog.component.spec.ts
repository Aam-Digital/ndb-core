import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkExternalProfileDialogComponent } from './link-external-profile-dialog.component';

describe('LinkExternalProfileDialogComponent', () => {
  let component: LinkExternalProfileDialogComponent;
  let fixture: ComponentFixture<LinkExternalProfileDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkExternalProfileDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LinkExternalProfileDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
