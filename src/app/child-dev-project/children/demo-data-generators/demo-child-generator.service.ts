import { Child } from "../model/child";
import { religions } from "./fixtures/religions";
import { languages } from "./fixtures/languages";
import { dropoutTypes } from "./fixtures/dropout-types";
import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../../../core/demo-data/demo-data-generator";
import { faker } from "../../../core/demo-data/faker";
import { centersWithProbability } from "./fixtures/centers";
import { addDefaultChildPhoto } from "../../../../../.storybook/utils/addDefaultChildPhoto";
import { genders } from "../model/genders";
import { FileService } from "../../../core/file/file.service";
import { firstValueFrom } from "rxjs";

export class DemoChildConfig {
  count: number;
}

@Injectable()
export class DemoChildGenerator extends DemoDataGenerator<Child> {
  static count: number;

  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoUserProvider.provider({count: 150})]`
   * @param config The configuration specifying the number of entities the service should generate.
   */
  static provider(config: DemoChildConfig) {
    return [
      { provide: DemoChildGenerator, useClass: DemoChildGenerator },
      { provide: DemoChildConfig, useValue: config },
    ];
  }

  static generateEntity(id: string) {
    const child = new Child(id);
    child.name = faker.name.firstName() + " " + faker.name.lastName();
    child.projectNumber = id;
    child["religion"] = faker.helpers.arrayElement(religions);
    child.gender = faker.helpers.arrayElement(genders.slice(1));
    child.dateOfBirth = faker.dateOfBirth(5, 20);
    child["motherTongue"] = faker.helpers.arrayElement(languages);
    child.center = faker.helpers.arrayElement(centersWithProbability);
    child.phone =
      "+" +
      faker.datatype.number({ min: 10, max: 99 }) +
      " " +
      faker.datatype.number({ min: 10000000, max: 99999999 });

    child.admissionDate = faker.date.past(child.age - 4);

    for (const i of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
    }

    if (faker.datatype.number(100) > 90) {
      DemoChildGenerator.makeChildDropout(child);
    }

    // add default photo for easier use in storybook stories
    addDefaultChildPhoto(child);

    return child;
  }

  private static makeChildDropout(child: Child) {
    child.dropoutDate = faker.date.between(child.admissionDate, new Date());
    child.dropoutRemarks = faker.lorem.sentence();
    child.dropoutType = faker.helpers.arrayElement(dropoutTypes);
    child.status = $localize`:Child status:Dropout`;
  }

  constructor(
    public config: DemoChildConfig,
    private fileService: FileService
  ) {
    super();
  }

  generateEntities(): Child[] {
    const data = [];
    for (let i = 1; i <= this.config.count; i++) {
      data.push(DemoChildGenerator.generateEntity(String(i)));
    }
    // this.addFiles(data);
    return data;
  }

  async addFiles(children: Child[]) {
    const fileNames = await fetch("assets/data/files.txt")
      .then((res) => res.text())
      .then((res) => res.split("\n"));
    let fileNum = 0;
    for (let child of children) {
      for (let j = 1; j < 12; j++) {
        const fileName = fileNames[fileNum];
        const type = this.getContentType(fileName);
        await fetch(`assets/data/${fileName}`)
          .then((res) => res.blob())
          .then((file) =>
            firstValueFrom(
              this.fileService.uploadFile(
                { type } as File,
                child._id,
                `file${j.toString()}`,
                file
              )
            )
          );
        console.log("uploaded file", fileNum, fileName);
        fileNum = (fileNum + 1) % 1064;
      }
    }
    console.log("done");
  }

  getContentType(fileName: string): string {
    const contentTypeMap = new Map<string, string>([
      ["jpg", "image/jpeg"],
      ["jpeg", "image/jpeg"],
      ["png", "image/png"],
      ["heic", "image/heic"],
      ["mp4", "video/mp4"],
      ["mov", "video/H264"],
    ]);
    return (
      contentTypeMap.get(fileName.split(".")[1].toLowerCase()) || "image/jpeg"
    );
  }
}
