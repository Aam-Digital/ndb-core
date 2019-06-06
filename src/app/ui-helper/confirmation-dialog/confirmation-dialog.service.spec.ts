import { TestBed, inject } from '@angular/core/testing';

import { ConfirmationDialogService } from './confirmation-dialog.service';
import { MatDialogModule } from '@angular/material/dialog';

describe('ConfirmationDialogService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConfirmationDialogService],
      imports: [MatDialogModule],
    });
  });

  it('should be created', inject([ConfirmationDialogService], (service: ConfirmationDialogService) => {
    expect(service).toBeTruthy();
  }));
});
