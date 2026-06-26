import React, { useState } from 'react';
import { X, Edit2, Pause, Play, FileText } from 'lucide-react';
import { useKanbanStore, type KanbanTask, type TaskStatus, type TaskPriority } from '@/stores/kanbanStore';

export const TaskEditModal = ({ task, isOpen, onClose, onSave }: { 
  task: KanbanTask | null, 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (updates: Partial<KanbanTask>) => void 
}) => {
  const [formData, setFormData] = useState<Partial<KanbanTask>>({});

  React.useEffect(() => {
    if (task) setFormData(task);
  }, [task]);

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Edit Task</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
            <input 
              type="text" 
              value={formData.title || ''} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
            <textarea 
              value={formData.description || ''} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500 h-24 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Context</label>
            <textarea 
              value={formData.context || ''} 
              onChange={e => setFormData({...formData, context: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500 h-24 resize-none"
              placeholder="Additional notes, links, instructions..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Priority</label>
              <select 
                value={formData.priority || 'medium'} 
                onChange={e => setFormData({...formData, priority: e.target.value as TaskPriority})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
              <select 
                value={formData.status || 'todo'} 
                onChange={e => setFormData({...formData, status: e.target.value as TaskStatus})}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="paused">Paused</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
