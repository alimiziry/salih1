import React, { useEffect, useState } from 'react';
import { Customer, VisitStatus } from '../types';
import { dataService } from '../services/dataService';
import { StatCard } from '../components/StatCard';
import { Users, CheckCircle, Clock, MapPin, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await dataService.getCustomers();
    setCustomers(data);
  };

  const handleResetVisits = async () => {
    if (window.confirm("هل أنت متأكد من تصفير عداد الزيارات الأسبوعي لجميع العملاء؟\nسيتم تحويل جميع الحالات إلى 'لم تتم'.")) {
      setIsResetting(true);
      try {
        await dataService.resetWeeklyVisits();
        await loadData(); // Reload data to update UI without page refresh
        // alert("تم تصفير الزيارات بنجاح."); // Optional: removed to make it faster
      } catch (error) {
        console.error(error);
        alert("حدث خطأ أثناء تصفير الزيارات.");
      } finally {
        setIsResetting(false);
      }
    }
  };

  const total = customers.length;
  const done = customers.filter(c => c.visitStatus === VisitStatus.DONE).length;
  const postponed = customers.filter(c => c.visitStatus === VisitStatus.POSTPONED).length;
  const pending = customers.filter(c => c.visitStatus === VisitStatus.NOT_DONE).length;

  // Prepare chart data
  const regionCounts = customers.reduce((acc, curr) => {
    acc[curr.mainRegion] = (acc[curr.mainRegion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(regionCounts).map(region => ({
    name: region,
    count: regionCounts[region]
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
        <button 
          onClick={handleResetVisits}
          disabled={isResetting}
          className={`flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition ${isResetting ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="إعادة تعيين جميع الحالات إلى 'لم تتم'"
        >
          <RefreshCw size={18} className={isResetting ? "animate-spin" : ""} />
          <span>تصفير الزيارات الأسبوعية</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="إجمالي العملاء" 
          value={total} 
          icon={<Users size={24} />} 
          colorClass="bg-blue-500" 
        />
        <StatCard 
          title="زيارات تمت" 
          value={done} 
          icon={<CheckCircle size={24} />} 
          colorClass="bg-green-500" 
        />
        <StatCard 
          title="زيارات مؤجلة" 
          value={postponed} 
          icon={<Clock size={24} />} 
          colorClass="bg-yellow-500" 
        />
        <StatCard 
          title="لم تتم زيارتهم" 
          value={pending} 
          icon={<MapPin size={24} />} 
          colorClass="bg-red-500" 
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6">توزيع العملاء حسب المنطقة</h3>
        <div className="h-80 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f3f4f6' }}
              />
              <Legend />
              <Bar dataKey="count" name="عدد العملاء" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};