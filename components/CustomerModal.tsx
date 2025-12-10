import React, { useState, useEffect } from 'react';
import { Customer, Region, VisitStatus } from '../types';
import { X } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customer?: Customer | null;
  regions: Region[];
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSave, customer, regions }) => {
  const [formData, setFormData] = useState<Customer>({
    id: '',
    shopName: '',
    managerName: '',
    phone: '',
    mainRegion: '',
    subRegion: '',
    whatsappLink: '',
    mapLink: '',
    visitStatus: VisitStatus.NOT_DONE
  });

  useEffect(() => {
    if (customer) {
      setFormData(customer);
    } else {
      setFormData({
        id: crypto.randomUUID(),
        shopName: '',
        managerName: '',
        phone: '',
        mainRegion: '',
        subRegion: '',
        whatsappLink: '',
        mapLink: '',
        visitStatus: VisitStatus.NOT_DONE
      });
    }
  }, [customer, isOpen]);

  // Handle phone change to auto-generate WA link if empty
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      phone: val,
      whatsappLink: prev.whatsappLink === '' || prev.whatsappLink.includes('wa.me') 
        ? `https://wa.me/${val.replace(/\D/g,'')}` 
        : prev.whatsappLink
    }));
  };

  const selectedRegion = regions.find(r => r.name === formData.mainRegion);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            {customer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم المحل</label>
              <input
                required
                type="text"
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                value={formData.shopName}
                onChange={e => setFormData({...formData, shopName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم المدير</label>
              <input
                type="text"
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                value={formData.managerName}
                onChange={e => setFormData({...formData, managerName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
              <input
                required
                type="text"
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="964xxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">حالة الزيارة</label>
              <select
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                value={formData.visitStatus}
                onChange={e => setFormData({...formData, visitStatus: e.target.value as VisitStatus})}
              >
                {Object.values(VisitStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المنطقة الرئيسية</label>
              <select
                required
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                value={formData.mainRegion}
                onChange={e => setFormData({...formData, mainRegion: e.target.value, subRegion: ''})}
              >
                <option value="">اختر المنطقة</option>
                {regions.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المنطقة الفرعية</label>
              <select
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                value={formData.subRegion}
                onChange={e => setFormData({...formData, subRegion: e.target.value})}
                disabled={!selectedRegion}
              >
                <option value="">اختر المنطقة الفرعية</option>
                {selectedRegion?.subregions.map((sub, idx) => (
                  <option key={idx} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            
             <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">رابط الواتساب</label>
              <input
                type="url"
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none ltr text-left"
                value={formData.whatsappLink}
                onChange={e => setFormData({...formData, whatsappLink: e.target.value})}
                dir="ltr"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">رابط الخريطة</label>
              <input
                type="url"
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none ltr text-left"
                value={formData.mapLink}
                onChange={e => setFormData({...formData, mapLink: e.target.value})}
                dir="ltr"
              />
            </div>

          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-blue-700 font-medium shadow-sm"
            >
              حفظ البيانات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};