import { Directive, HostListener, Input } from "@angular/core";
import { DuplicateRecordsService } from '../duplicate-records.service';

@Directive({
  selector: '[appDuplicateRecords]',
  standalone: true,
})

export class DuplicateRecordsDirective {
  @Input("appDuplicateRecords") data: any = [];
  @Input("angularticsCategory") entityType: string = ''; // Input for entityType

  constructor( private duplicaterecords: DuplicateRecordsService) {}
 
  @HostListener("click")
  click(){
    return this.duplicaterecords.getDataforDuplicate(this.data, this.entityType);
  }
}
