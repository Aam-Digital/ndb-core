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

import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { SafeUrl } from "@angular/platform-browser";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { Entity } from "../../../core/entity/entity";
import { ChildPhotoService } from "./child-photo.service";
import { LoadChildPhotoEntitySchemaDatatype } from "./datatype-load-child-photo";
import { BehaviorSubject } from "rxjs";

describe("dataType load-child-photo", () => {
  let entitySchemaService: EntitySchemaService;
  let mockChildPhotoService: jasmine.SpyObj<ChildPhotoService>;

  beforeEach(() => {
    mockChildPhotoService = jasmine.createSpyObj("mockChildPhotoService", [
      "getImageAsyncObservable",
    ]);

    TestBed.configureTestingModule({
      providers: [
        EntitySchemaService,
        { provide: ChildPhotoService, useValue: mockChildPhotoService },
      ],
    });

    entitySchemaService = TestBed.get(EntitySchemaService);
    entitySchemaService.registerSchemaDatatype(
      new LoadChildPhotoEntitySchemaDatatype(mockChildPhotoService)
    );
  });

  it("schema:load-child-photo is removed from rawData to be saved", function () {
    class TestEntity extends Entity {
      @DatabaseField({ dataType: "load-child-photo" }) photo: SafeUrl;
    }
    const id = "test1";
    const entity = new TestEntity(id);
    entity.photo = "12345";

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);
    expect(rawData.photo).toBeUndefined();
  });

  it("schema:load-child-photo is provided through ChildPhotoService on load", fakeAsync(() => {
    class TestEntity extends Entity {
      @DatabaseField({ dataType: "load-child-photo" }) photo: BehaviorSubject<
        SafeUrl
      >;
    }
    const id = "test1";
    const entity = new TestEntity(id);

    const defaultImg = "default-img";
    const mockCloudImg = "test-img-data";

    const mockImgObs = new BehaviorSubject(defaultImg);
    mockChildPhotoService.getImageAsyncObservable.and.returnValue(mockImgObs);

    const data = {
      _id: id,
    };
    entitySchemaService.loadDataIntoEntity(entity, data);

    expect(entity.photo.value).toEqual(defaultImg);

    mockImgObs.next(mockCloudImg);
    mockImgObs.complete();
    tick();
    expect(entity.photo.value).toEqual(mockCloudImg);
  }));
});
