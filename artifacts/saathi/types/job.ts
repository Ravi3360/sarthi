export type SalaryPeriod = 'day' | 'month';

export interface JobListing {
  id: string;
  title: string;
  titleHi: string;
  occupationTag: string;
  salary: number;
  salaryPeriod: SalaryPeriod;
  location: {
    area: string;
    lat: number;
    lng: number;
  };
  employerName: string;
  employerRating: number;
  distanceKm: number;
  postedAt: string;
}
