import { Directive, HostListener, Input } from "@angular/core";
import { DuplicateRecordService } from '../duplicate-records.service';

@Directive({
  selector: '[appDuplicateRecords]',
  standalone: true,
})

export class DuplicateRecordsDirective {
  @Input("appDuplicateRecords") data: any = [];
  @Input() entityType: string = ''; 

  constructor( private duplicateRecordService: DuplicateRecordService) {}
  
  @HostListener("click")
  click(){
    return this.duplicateRecordService.duplicateRecord(this.data, this.entityType);
  }
}
