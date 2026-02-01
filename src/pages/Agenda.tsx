
import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';

const Agenda: React.FC = () => {
  const events = [
    { time: '09:00', vehicle: 'Toyota Corolla', client: 'Marcos Oliveira', place: 'Rua das Flores, 123' },
    { time: '11:30', vehicle: 'Fiat Pulse', client: 'Renata Souza', place: 'Auto Center Leste' },
    { time: '15:00', vehicle: 'Hyundai HB20', client: 'Bruno Pires', place: 'Condomínio Solar' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Minha Agenda</h2>
        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
          <ChevronLeft size={18} className="text-slate-400" />
          <span className="font-bold text-slate-700 text-sm">Janeiro, 2024</span>
          <ChevronRight size={18} className="text-slate-400" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {[12, 13, 14, 15, 16, 17, 18].map((day, i) => (
            <div 
              key={day} 
              className={`flex flex-col items-center min-w-[50px] p-3 rounded-2xl transition-all ${
                i === 2 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'
              }`}
            >
              <span className="text-[10px] uppercase font-bold">{['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'][i]}</span>
              <span className="text-lg font-bold">{day}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-6">
          {events.map((event, i) => (
            <div key={i} className="relative pl-8 border-l-2 border-dashed border-slate-100 last:border-0 pb-6">
              <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
              <div className="bg-slate-50 p-4 rounded-[2rem] space-y-2 group active:scale-[0.98] transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Clock size={16} />
                    <span className="font-bold text-sm">{event.time}</span>
                  </div>
                  <Calendar size={16} className="text-slate-300" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{event.vehicle}</h4>
                  <p className="text-xs text-slate-500 font-medium uppercase">{event.client}</p>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <MapPin size={14} />
                  <span>{event.place}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Agenda;
