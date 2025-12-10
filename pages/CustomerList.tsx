import React, { useEffect, useState, useRef } from 'react';
import { Customer, Region, VisitStatus } from '../types';
import { dataService } from '../services/dataService';
import { CustomerModal } from '../components/CustomerModal';
import { Search, Map, Phone, Edit, Trash2, Plus, Upload, Download, Filter, ExternalLink } from 'lucide-react';

export const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [filterRegion, setFilterRegion] = useState('');
  const [filterSubRegion, setFilterSubRegion] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [c, r] = await Promise.all([
      dataService.getCustomers(),
      dataService.getRegions()
    ]);
    setCustomers(c);
    setRegions(r);
    setLoading(false);
  };

  const handleSave = async (customer: Customer) => {
    try {
      await dataService.saveCustomer(customer);
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      alert("فشل الحفظ. تأكد من الاتصال بالإنترنت وصلاحيات قاعدة البيانات.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا العميل؟")) {
      try {
        await dataService.deleteCustomer(id);
        loadData();
      } catch (error) {
        console.error(error);
        alert("فشل الحذف. يرجى التأكد من تعطيل RLS في Supabase أو منح الصلاحيات.");
      }
    }
  };

  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) {
      alert("لا توجد بيانات لتصديرها");
      return;
    }

    // Add BOM for Excel utf-8 compatibility
    const BOM = "\uFEFF"; 
    const headers = ["المنطقة", "المنطقة الفرعية", "اسم المحل", "المدير", "الهاتف", "رابط الواتساب", "رابط الخريطة", "الحالة"];
    
    const csvRows = filteredCustomers.map(c => [
      `"${c.mainRegion || ''}"`,
      `"${c.subRegion || ''}"`,
      `"${c.shopName || ''}"`,
      `"${c.managerName || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.whatsappLink || ''}"`,
      `"${c.mapLink || ''}"`,
      `"${c.visitStatus || ''}"`
    ].join(","));

    const csvContent = BOM + [headers.join(","), ...csvRows].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const newCustomers: Customer[] = [];

      // Start from 1 to skip header if it exists. 
      // Simple heuristic: check if first line contains "manager_name"
      let startIndex = 0;
      if (lines[0].includes('manager_name') || lines[0].includes('اسم المحل')) startIndex = 1;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple CSV split (assumes no commas in fields for simplicity, usually needs robust regex)
        const cols = line.split(',');
        
        if (cols.length >= 3) {
          // Mapping based on: main_region,sub_region,shop_name,manager_name,phone,whatsapp,map,status
          const statusRaw = cols[7]?.trim() || '';
          let status = VisitStatus.NOT_DONE;
          if (statusRaw.includes('تمت')) status = VisitStatus.DONE;
          else if (statusRaw.includes('مؤجل')) status = VisitStatus.POSTPONED;

          newCustomers.push({
            id: crypto.randomUUID(),
            mainRegion: cols[0]?.trim() || '',
            subRegion: cols[1]?.trim() || '',
            shopName: cols[2]?.trim() || 'Unknown',
            managerName: cols[3]?.trim() || '',
            phone: cols[4]?.trim() || '',
            whatsappLink: cols[5]?.trim() || '',
            mapLink: cols[6]?.trim() || '',
            visitStatus: status
          });
        }
      }

      try {
        await dataService.bulkImportCustomers(newCustomers);
        loadData();
        alert(`تم استيراد ${newCustomers.length} عميل بنجاح`);
      } catch (error) {
        console.error(error);
        alert("فشل الاستيراد. تحقق من البيانات أو الصلاحيات.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Filter Logic
  const filteredCustomers = customers.filter(c => {
    const matchesRegion = filterRegion ? c.mainRegion === filterRegion : true;
    const matchesSub = filterSubRegion ? c.subRegion === filterSubRegion : true;
    const matchesStatus = filterStatus ? c.visitStatus === filterStatus : true;
    const matchesSearch = searchQuery 
      ? c.shopName.includes(searchQuery) || c.managerName.includes(searchQuery) || c.phone.includes(searchQuery)
      : true;
    
    return matchesRegion && matchesSub && matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: VisitStatus) => {
    switch (status) {
      case VisitStatus.DONE: return 'bg-green-100 text-green-700 border-green-200';
      case VisitStatus.POSTPONED: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const selectedRegionObj = regions.find(r => r.name === filterRegion);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">قائمة العملاء</h1>
        <div className="flex gap-2 flex-wrap">
           <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleCSVUpload}
            accept=".csv"
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <Upload size={18} />
            <span className="hidden sm:inline">استيراد</span>
          </button>
          
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            <Download size={18} />
            <span className="hidden sm:inline">تصدير</span>
          </button>

          <button 
            onClick={() => { setCurrentCustomer(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={18} />
            <span>إضافة عميل</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="بحث (اسم، هاتف)..."
            className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="relative">
           <Filter className="absolute right-3 top-2.5 text-gray-400" size={18} />
           <select 
             className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none bg-transparent"
             value={filterRegion}
             onChange={e => { setFilterRegion(e.target.value); setFilterSubRegion(''); }}
           >
             <option value="">جميع المناطق</option>
             {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
           </select>
        </div>

        <select 
           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
           value={filterSubRegion}
           onChange={e => setFilterSubRegion(e.target.value)}
           disabled={!filterRegion}
         >
           <option value="">المنطقة الفرعية</option>
           {selectedRegionObj?.subregions.map((s, i) => <option key={i} value={s}>{s}</option>)}
        </select>

        <select 
           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
           value={filterStatus}
           onChange={e => setFilterStatus(e.target.value)}
         >
           <option value="">جميع الحالات</option>
           {Object.values(VisitStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-700 text-sm font-semibold">
              <tr>
                <th className="p-4 whitespace-nowrap">اسم المحل</th>
                <th className="p-4 whitespace-nowrap">المدير</th>
                <th className="p-4 whitespace-nowrap">الهاتف</th>
                <th className="p-4 whitespace-nowrap">المنطقة</th>
                <th className="p-4 whitespace-nowrap">الحالة</th>
                <th className="p-4 text-center whitespace-nowrap">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">جاري التحميل...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">لا يوجد عملاء مطابقين</td></tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition group">
                    <td className="p-4 font-medium text-gray-800">{customer.shopName}</td>
                    <td className="p-4 text-gray-600">{customer.managerName}</td>
                    <td className="p-4 text-gray-600" dir="ltr">{customer.phone}</td>
                    <td className="p-4 text-gray-600">
                      <div className="flex flex-col text-sm">
                        <span>{customer.mainRegion}</span>
                        <span className="text-xs text-gray-400">{customer.subRegion}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs border font-medium ${getStatusColor(customer.visitStatus)}`}>
                        {customer.visitStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {customer.whatsappLink && (
                          <a href={customer.whatsappLink} target="_blank" rel="noreferrer" className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100" title="واتساب">
                            <Phone size={16} />
                          </a>
                        )}
                        {customer.mapLink && (
                          <a href={customer.mapLink} target="_blank" rel="noreferrer" className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="الخريطة">
                            <Map size={16} />
                          </a>
                        )}
                        <button 
                          onClick={() => { setCurrentCustomer(customer); setIsModalOpen(true); }}
                          className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        customer={currentCustomer}
        regions={regions}
      />
    </div>
  );
};