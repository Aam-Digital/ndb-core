import {Component, OnInit} from '@angular/core';
import {AppConfig} from '../../app-config/app-config';
import {AlertService} from '../../alerts/alert.service';
import {Alert} from '../../alerts/alert';
import FileSaver from 'file-saver';
import {BackupService} from '../services/backup.service';
import {ConfirmationDialogService} from '../../ui-helper/confirmation-dialog/confirmation-dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import PouchDB from 'pouchdb-browser';
import {ChildPhotoUpdateService} from '../services/child-photo-update.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  appConfig = AppConfig.settings;
  db;
  alerts: Alert[];

  constructor(private alertService: AlertService,
              private backupService: BackupService,
              private confirmationDialog: ConfirmationDialogService,
              private snackBar: MatSnackBar,
              private childPhotoUpdateService: ChildPhotoUpdateService,
              ) { }

  ngOnInit() {
    this.alerts = this.alertService.alerts;
    this.db = new PouchDB(AppConfig.settings.database.name);
  }

  updatePhotoFilenames() {
    this.childPhotoUpdateService.updateChildrenPhotoFilenames();
  }

  debugDatabase() {
    console.log(this.db);
  }


  saveBackup() {
    this.backupService.getJsonExport()
      .then(bac => this.startDownload(bac, 'text/json', 'backup.json'));
  }

  saveCsvExport() {
    this.backupService.getCsvExport()
      .then(csv => this.startDownload(csv, 'text/csv', 'export.csv'));
  }


  private startDownload(data: string, type: string, name: string) {
    const blob = new Blob([data], { type: type });
    FileSaver.saveAs(blob, name);
  }

  private readFile(file): Promise<string> {
    return new Promise(resolve => {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          resolve(fileReader.result as string);
        };
        fileReader.readAsText(file);
      }
    );
  }


  loadBackup(file) {
    const pRestorePoint = this.backupService.getJsonExport();
    const pLoadedData = this.readFile(file);
    Promise.all([pLoadedData, pRestorePoint]).then(r => {
      const newData = r[0];
      const restorePoint = r[1];

      const dialogRef = this.confirmationDialog
        .openDialog('Overwrite complete database?', 'Are you sure you want to restore this backup? ' +
          'This will delete all ' + restorePoint.split('\n').length + ' existing records in the database, ' +
          'restoring ' + newData.split('\n').length + ' records from the loaded file.');

      dialogRef.afterClosed()
        .subscribe(confirmed => {
          if (confirmed) {
            this.backupService.clearDatabase();
            this.backupService.importJson(newData, true);

            const snackBarRef = this.snackBar.open('Backup restored', 'Undo', { duration: 8000 });
            snackBarRef.onAction().subscribe(() => {
              this.backupService.clearDatabase();
              this.backupService.importJson(restorePoint, true);
            });
          }
        });
    });
  }


  loadCsv(file) {
    const pRestorePoint = this.backupService.getJsonExport();
    const pLoadedData = this.readFile(file);
    Promise.all([pLoadedData, pRestorePoint]).then(r => {
      const newData = r[0];
      const restorePoint = r[1];

      const dialogRef = this.confirmationDialog
        .openDialog('Import new data?', 'Are you sure you want to import this file? ' +
          'This will add or update ' + (newData.trim().split('\n').length - 1) + ' records from the loaded file. ' +
          'Existing records with same "_id" in the database will be overwritten!');

      dialogRef.afterClosed()
        .subscribe(confirmed => {
          if (confirmed) {
            this.backupService.importCsv(newData, true);

            const snackBarRef = this.snackBar.open('Import completed', 'Undo', {duration: 8000});
            snackBarRef.onAction().subscribe(() => {
              this.backupService.clearDatabase();
              this.backupService.importJson(restorePoint, true);
            });
          }
        });
    });
  }


  clearDatabase() {
    this.backupService.getJsonExport().then(restorePoint => {
      const dialogRef = this.confirmationDialog
        .openDialog('Empty complete database?', 'Are you sure you want to clear the database? ' +
          'This will delete all ' + restorePoint.split('\n').length + ' existing records in the database!');

      dialogRef.afterClosed()
        .subscribe(confirmed => {
          if (confirmed) {
            this.backupService.clearDatabase();

            const snackBarRef = this.snackBar.open('Import completed', 'Undo', {duration: 8000});
            snackBarRef.onAction().subscribe(() => {
              this.backupService.importJson(restorePoint, true);
            });
          }
        });
    });
  }
}
