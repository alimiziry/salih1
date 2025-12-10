export enum VisitStatus {
  DONE = "تمت",
  NOT_DONE = "لم تتم",
  POSTPONED = "مؤجل"
}

export interface Customer {
  id: string;
  shopName: string;
  managerName: string;
  phone: string;
  mainRegion: string;
  subRegion: string;
  whatsappLink: string;
  mapLink: string;
  visitStatus: VisitStatus;
}

export interface Region {
  id: number | string;
  name: string;
  subregions: string[];
}

export interface Stats {
  totalCustomers: number;
  visitsDone: number;
  visitsPending: number;
  visitsPostponed: number;
}