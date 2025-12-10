import React, { useEffect, useState } from 'react';
import { Region } from '../types';
import { dataService } from '../services/dataService';
import { Plus, Trash2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';

export const RegionManager: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newRegionName, setNewRegionName] = useState('');
  const [expandedRegion, setExpandedRegion] = useState<string | number | null>(null);
  
  // For subregion adding
  const [newSubRegionName, setNewSubRegionName] = useState('');

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      const data = await dataService.getRegions();
      setRegions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddRegion = async () => {
    if (!newRegionName.trim()) return;
    try {
      const newRegion: Region = {
        id: crypto.randomUUID(),
        name: newRegionName,
        subregions: []
      };
      await dataService.saveRegion(newRegion);
      setNewRegionName('');
      setIsAdding(false);
      loadRegions();
    } catch (e) {
      console.error(e);
      alert("فشل إضافة المنطقة. تأكد من الصلاحيات.");
    }
  };

  const handleDeleteRegion = async (id: string | number) => {
    if (confirm("سيتم حذف المنطقة وجميع المناطق الفرعية. هل أنت متأكد؟")) {
      try {
        await dataService.deleteRegion(id);
        loadRegions();
      } catch (e) {
        console.error(e);
        alert("فشل الحذف. تأكد من الصلاحيات.");
      }
    }
  };

  const handleAddSubRegion = async (regionId: string | number) => {
    if (!newSubRegionName.trim()) return;
    try {
      const region = regions.find(r => r.id === regionId);
      if (!region) return;

      const updatedRegion = {
        ...region,
        subregions: [...region.subregions, newSubRegionName]
      };

      await dataService.saveRegion(updatedRegion);
      setNewSubRegionName('');
      loadRegions();
    } catch (e) {
      console.error(e);
      alert("فشل إضافة المنطقة الفرعية.");
    }
  };

  const handleDeleteSubRegion = async (regionId: string | number, subIndex: number) => {
    try {
      const region = regions.find(r => r.id === regionId);
      if (!region) return;

      const updatedSubregions = region.subregions.filter((_, idx) => idx !== subIndex);
      const updatedRegion = { ...region, subregions: updatedSubregions };

      await dataService.saveRegion(updatedRegion);
      loadRegions();
    } catch (e) {
      console.error(e);
      alert("فشل حذف المنطقة الفرعية.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">إدارة المناطق</h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          <span>منطقة جديدة</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4 items-center animate-fade-in">
          <input 
            autoFocus
            type="text" 
            placeholder="اسم المنطقة الرئيسية" 
            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
            value={newRegionName}
            onChange={e => setNewRegionName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddRegion()}
          />
          <button onClick={handleAddRegion} className="p-2 bg-green-500 text-white rounded hover:bg-green-600"><Save size={18} /></button>
          <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"><X size={18} /></button>
        </div>
      )}

      <div className="grid gap-4">
        {regions.map(region => (
          <div key={region.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div 
              className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
              onClick={() => setExpandedRegion(expandedRegion === region.id ? null : region.id)}
            >
              <div className="flex items-center gap-3">
                {expandedRegion === region.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                <h3 className="font-bold text-lg text-gray-800">{region.name}</h3>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{region.subregions.length} مناطق فرعية</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteRegion(region.id); }}
                className="text-red-400 hover:text-red-600 p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {expandedRegion === region.id && (
              <div className="p-4 border-t border-gray-100 bg-white animate-fade-in">
                 <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      placeholder="أضف منطقة فرعية..." 
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                      value={newSubRegionName}
                      onChange={e => setNewSubRegionName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddSubRegion(region.id)}
                    />
                    <button 
                      onClick={() => handleAddSubRegion(region.id)}
                      className="bg-secondary text-white px-4 py-2 rounded text-sm hover:bg-slate-700"
                    >
                      إضافة
                    </button>
                 </div>

                 <ul className="space-y-2">
                   {region.subregions.map((sub, idx) => (
                     <li key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 group">
                       <span className="text-gray-700">{sub}</span>
                       <button 
                         onClick={() => handleDeleteSubRegion(region.id, idx)}
                         className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                       >
                         <Trash2 size={16} />
                       </button>
                     </li>
                   ))}
                   {region.subregions.length === 0 && <li className="text-gray-400 text-sm italic text-center p-2">لا توجد مناطق فرعية</li>}
                 </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};