import { Customer, Region, VisitStatus } from '../types';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';

// --- Helper Functions for Database Mapping ---
const mapDbToCustomer = (row: any): Customer => ({
  id: row.id,
  shopName: row.shop_name,
  managerName: row.manager_name,
  phone: row.phone,
  mainRegion: row.main_region,
  subRegion: row.sub_region,
  whatsappLink: row.whatsapp_link,
  mapLink: row.map_link,
  visitStatus: row.visit_status as VisitStatus
});

const mapCustomerToDb = (customer: Customer) => ({
  id: customer.id,
  shop_name: customer.shopName,
  manager_name: customer.managerName,
  phone: customer.phone,
  main_region: customer.mainRegion,
  sub_region: customer.subRegion,
  whatsapp_link: customer.whatsappLink,
  map_link: customer.mapLink,
  visit_status: customer.visitStatus
});

export const dataService = {
  /**
   * Get all customers
   */
  getCustomers: async (): Promise<Customer[]> => {
    // 1. Try Internal DB (Fastest, works offline)
    const localData = await db.customers.toArray();
    
    // 2. Try Sync with Supabase if available
    if (supabase && localData.length === 0) {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        const mapped = data.map(mapDbToCustomer);
        // Cache in local DB
        await db.customers.bulkPut(mapped);
        return mapped;
      }
    }
    
    return localData;
  },

  /**
   * Save or Update a Customer
   */
  saveCustomer: async (customer: Customer): Promise<void> => {
    // 1. Save to Internal DB
    await db.customers.put(customer);

    // 2. Sync to Supabase (Background)
    if (supabase) {
      const dbPayload = mapCustomerToDb(customer);
      supabase.from('customers').upsert(dbPayload).then(({ error }) => {
        if (error) console.warn("Supabase sync failed:", error);
      });
    }
  },

  /**
   * Delete Customer
   */
  deleteCustomer: async (id: string): Promise<void> => {
    // 1. Delete from Internal DB
    await db.customers.delete(id);

    // 2. Sync to Supabase
    if (supabase) {
      supabase.from('customers').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn("Supabase delete failed:", error);
      });
    }
  },

  /**
   * Get Regions
   */
  getRegions: async (): Promise<Region[]> => {
    // 1. Internal DB
    let regions = await db.regions.toArray();
    
    // 2. If empty, it might be first load, wait for population or fetch from Supabase
    if (regions.length === 0 && supabase) {
      const { data, error } = await supabase.from('regions').select('*').order('name');
      if (!error && data && data.length > 0) {
        regions = data as Region[];
        await db.regions.bulkPut(regions);
      }
    }

    // Return what we have (or default populated by Dexie)
    return regions.length > 0 ? regions : await db.regions.toArray();
  },

  /**
   * Save Region
   */
  saveRegion: async (region: Region): Promise<void> => {
    // Stringify ID for consistency if needed, but Dexie handles mixed types well.
    // We keep strict to the type definition.
    await db.regions.put(region);

    if (supabase) {
      supabase.from('regions').upsert({
        id: region.id.toString(),
        name: region.name,
        subregions: region.subregions
      }).then(({ error }) => {
        if (error) console.warn("Supabase region sync failed:", error);
      });
    }
  },

  /**
   * Delete Region
   */
  deleteRegion: async (id: string | number): Promise<void> => {
    await db.regions.delete(id);

    if (supabase) {
      supabase.from('regions').delete().eq('id', id.toString()).then(({ error }) => {
        if (error) console.warn("Supabase region delete failed:", error);
      });
    }
  },
  
  /**
   * Bulk Import
   */
  bulkImportCustomers: async (newCustomers: Customer[]): Promise<void> => {
    // Bulk add to local DB
    await db.customers.bulkPut(newCustomers);

    // Sync to Supabase
    if (supabase) {
      const dbCustomers = newCustomers.map(mapCustomerToDb);
      supabase.from('customers').upsert(dbCustomers).then(({ error }) => {
        if (error) console.warn("Supabase bulk import failed:", error);
      });
    }
  },

  /**
   * Reset Weekly Visits
   */
  resetWeeklyVisits: async (): Promise<void> => {
    // 1. Update Local DB
    // Dexie specific: Get keys, then bulk update, or iterate.
    // Efficient way:
    await db.customers.toCollection().modify({ visitStatus: VisitStatus.NOT_DONE });

    // 2. Sync Supabase
    if (supabase) {
      supabase
        .from('customers')
        .update({ visit_status: VisitStatus.NOT_DONE })
        .neq('id', '00000000-0000-0000-0000-000000000000') // Dummy condition to update all
        .then(({ error }) => {
          if (error) console.warn("Supabase reset failed:", error);
        });
    }
  }
};
