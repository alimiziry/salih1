import Dexie, { Table } from 'dexie';
import { Customer, Region } from '../types';

export class CRMDatabase extends Dexie {
  customers!: Table<Customer>;
  regions!: Table<Region>;

  constructor() {
    super('CRMDatabase');
    // Define tables and indexes
    (this as any).version(1).stores({
      customers: 'id, shopName, managerName, phone, mainRegion, visitStatus',
      regions: 'id, name'
    });
  }
}

export const db = new CRMDatabase();

// Initialize default regions if DB is empty
(db as any).on('populate', () => {
  db.regions.bulkAdd([
    { id: "1", name: "دهوك", subregions: ["ملا عيدان", "مالطا", "نوهدرا سنتر", "السياحية", "حي العسكري"] },
    { id: "2", name: "دوميز", subregions: ["مجمع دوميز 1", "مجمع دوميز 2", "الحي الصناعي"] },
    { id: "3", name: "سيميل", subregions: ["سيميل سنتر", "كيستي", "شاريا"] },
    { id: "4", name: "شيلادزي", subregions: ["سنتر", "افرخى", "بازيفى"] }
  ]);
});