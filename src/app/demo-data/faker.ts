import * as fakerOriginal from 'faker/locale/en_IND';

fakerOriginal.seed(1);

fakerOriginal.date.birthdate = (minAge: number, maxAge: number): Date => {
  const currentYear = (new Date()).getFullYear();
  const latest = new Date();
  latest.setFullYear(currentYear - minAge);
  const earliest = new Date();
  earliest.setFullYear(currentYear - maxAge);
  return faker.date.between(earliest, latest);
};

export const faker = fakerOriginal;
