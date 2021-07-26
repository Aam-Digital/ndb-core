/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Component, OnInit } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { DemoDataService } from "./demo-data.service";
import { LoggingService } from "../logging/logging.service";
import { SessionService } from "../session/session-service/session.service";
import { DemoUserGeneratorService } from "../user/demo-user-generator.service";

/**
 * Loading box during demo data generation.
 *
 * see {@link DemoDataModule}
 */
@Component({
  template:
    "<p i18n>Generating sample data for this demo ...</p>" +
    '<mat-progress-bar mode="indeterminate"></mat-progress-bar>',
})
export class DemoDataGeneratingProgressDialogComponent implements OnInit {
  /**
   * Display a loading dialog while generating demo data from all register generators.
   * @param dialog
   */
  static loadDemoDataWithLoadingDialog(dialog: MatDialog) {
    dialog.open(DemoDataGeneratingProgressDialogComponent);
  }

  constructor(
    private demoDataService: DemoDataService,
    private dialogRef: MatDialogRef<DemoDataGeneratingProgressDialogComponent>,
    private loggingService: LoggingService,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.dialogRef.disableClose = true;
    this.dialogRef.afterOpened().subscribe(() => {
      this.demoDataService
        .publishDemoData()
        // don't use await this.demoDataService - dialogRef.close doesn't seem to work consistently in that case
        .then(async () => {
          await this.sessionService.login(
            DemoUserGeneratorService.DEFAULT_USERNAME,
            DemoUserGeneratorService.DEFAULT_PASSWORD
          );
          this.dialogRef.close(true);
        })
        .catch((err) =>
          this.loggingService.error({
            title: "error during demo data generation",
            details: err,
          })
        );
    });
  }
}
