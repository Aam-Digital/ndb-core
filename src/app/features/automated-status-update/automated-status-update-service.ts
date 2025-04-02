import { Injectable } from "@angular/core";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";
import { MatDialog } from "@angular/material/dialog";

@Injectable({ providedIn: "root" })
export class AutomatedStatusUpdateService {
  constructor(
    private entityMapperService: EntityMapperService,
    private dialog: MatDialog,
  ) {}
}
