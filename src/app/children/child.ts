import { Entity } from '../entity/entity';

export class Child extends Entity{
    name: String;
    pn: Number; //project number
    religion: String;
    gender: Boolean; //M or F
    dateOfBirth: Date;
    motherTongue: String;
    admission: Date;
    placeOfBirth: String;
    center: String;
    birthCertificate: String;
    currentStatus: {
        projectStatus: String;
        socialworker: String;
        address: {
            text: String;
            visit: String;
            villageAddress: String;
        }
    }

    getPrefix(): string{
        return 'child:';
    }


};