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

import { TestBed } from "@angular/core/testing";
import { SafeUrl } from "@angular/platform-browser";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { Entity } from "../../../core/entity/model/entity";
import { ChildPhotoService } from "./child-photo.service";
import { BehaviorSubject } from "rxjs";
import { PhotoDatatype } from "./datatype-photo";
import { Photo } from "./photo";
import { Child } from "../model/child";

describe("dataType photo", () => {
  let entitySchemaService: EntitySchemaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EntitySchemaService],
    });

    entitySchemaService =
      TestBed.inject<EntitySchemaService>(EntitySchemaService);
    entitySchemaService.registerSchemaDatatype(new PhotoDatatype());
  });

  it("should only save the path of an image", () => {
    class TestEntity extends Entity {
      @DatabaseField({ dataType: "photo" }) photo: Photo;
    }
    const id = "test1";
    const entity = new TestEntity(id);
    entity.photo = { path: "12345", photo: new BehaviorSubject<SafeUrl>(null) };

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);
    expect(rawData.photo).toEqual(entity.photo.path);
  });

  it("should set the default photo when loading", () => {
    class TestEntity extends Entity {
      @DatabaseField({ dataType: "photo", defaultValue: "" })
      photo: Photo;
    }
    const defaultImg = "default-img";
    spyOn(ChildPhotoService, "getImageFromAssets").and.returnValue(defaultImg);

    const data = { _id: "someId" };
    const entity = new TestEntity();
    entitySchemaService.loadDataIntoEntity(entity, data);

    expect(entity.photo.photo.value).toEqual(defaultImg);
  });

  it("should migrate a child with the old photo format", () => {
    const oldFormatInDb = entitySchemaService.transformEntityToDatabaseFormat(
      new Child()
    );
    oldFormatInDb["photoFile"] = "oldPhotoFile.jpg";

    const newFormatChild = new Child();
    entitySchemaService.loadDataIntoEntity(newFormatChild, oldFormatInDb);

    expect(newFormatChild.photo.path).toEqual(oldFormatInDb.photoFile);
  });

  it("should not safe the default value", () => {
    class TestEntity extends Entity {
      @DatabaseField({ dataType: "photo", defaultValue: "someFile.jpg" })
      photo: Photo;
    }

    const entity = new TestEntity();
    entitySchemaService.loadDataIntoEntity(entity, {});
    const result = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(result.photo).toBeUndefined();
  });

  it("should not throw an error if deprecated value is null", () => {
    const oldChild = {
      _id: "oldChild",
      photoFile: null,
    };

    expect(() =>
      entitySchemaService.loadDataIntoEntity(new Child(), oldChild)
    ).not.toThrowError();
  });
});
