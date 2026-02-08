import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../../constants';
import { AppCard } from '../../components/ui/AppCard';
import { Todo } from '../../types';

interface PendingTasksWidgetProps {
  tasks: Todo[];
}

const PendingTasksWidget: React.FC<PendingTasksWidgetProps> = ({ tasks }) => {
  const navigate = useNavigate();

  return (
    <AppCard className="p-6 h-full">
      <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-50 rounded-lg text-orange-600">
                <ICONS.Check className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Tasks</h3>
          </div>
          <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      {tasks.length > 0 ? (
          <div className="space-y-3">
              {tasks.slice(0, 3).map(todo => (
                  <div key={todo.id} className="flex items-start gap-3 p-2 hover:bg-orange-50/50 rounded-lg transition-colors cursor-pointer" onClick={() => navigate('/todo')}>
                      <div className="mt-0.5"><div className="w-4 h-4 rounded-full border-2 border-orange-200" /></div>
                      <p className="text-xs font-bold text-slate-700 line-clamp-2">{todo.text}</p>
                  </div>
              ))}
              {tasks.length > 3 && (
                  <button onClick={() => navigate('/todo')} className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-orange-600 mt-2">
                      +{tasks.length - 3} more
                  </button>
              )}
          </div>
      ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-xs font-bold text-slate-500">All caught up!</p>
              <button onClick={() => navigate('/todo')} className="text-[10px] text-orange-600 font-bold hover:underline mt-1">Add new</button>
          </div>
      )}
    </AppCard>
  );
};

export default PendingTasksWidget;
