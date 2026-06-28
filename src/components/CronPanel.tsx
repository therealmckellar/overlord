'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, Trash2, Plus, Filter, ExternalLink } from 'lucide-react';

interface CronJob {
  id: string;
  name: string;
  prompt: string;
  schedule: string;
  state: 'scheduled' | 'paused' | 'disabled' | 'running';
  profile: string;
  lastRun: string | null;
  nextRun: string | null;
  deliver: string;
}

export default function CronPanel() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [profileFilter, setProfileFilter] = useState('all');

  const [newJob, setNewJob] = useState({
    prompt: '',
    schedule: '',
    name: '',
    deliver: 'local',
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cron');
      const data = await res.json();
      setJobs(data);
    } catch (e) {
      console.error('Failed to fetch cron jobs', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob),
      });
      if (res.ok) {
        await fetchJobs();
        setShowCreate(false);
        setNewJob({ prompt: '', schedule: '', name: '', deliver: 'local' });
      }
    } catch (e) {
      console.error('Failed to create cron job', e);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'scheduled': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'disabled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'running': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredJobs = profileFilter === 'all' 
    ? jobs 
    : jobs.filter(j => j.profile === profileFilter);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-secondary)] text-[var(--text)]">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold">Cron Jobs</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md">
            <Filter className="w-3 h-3 text-[var(--text-muted)]" />
            <select 
              value={profileFilter} 
              onChange={(e) => setProfileFilter(e.target.value)}
              className="bg-transparent text-xs outline-none text-[var(--text-secondary)]"
            >
              <option value="all">All Profiles</option>
              <option value="default">Default</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <button 
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)] text-white rounded-md text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3 h-3" /> Create Job
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-sm text-[var(--text-muted)]">Loading cron jobs...</div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-[var(--text-muted)] border-b border-[var(--border)]">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Schedule</th>
                <th className="p-3 font-medium">State</th>
                <th className="p-3 font-medium">Profile</th>
                <th className="p-3 font-medium">Last Run</th>
                <th className="p-3 font-medium">Next Run</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td className="p-3">
                    <div className="font-medium text-[var(--text)]">{job.name}</div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px]">{job.prompt}</div>
                  </td>
                  <td className="p-3 font-mono text-[var(--text-secondary)]">{job.schedule}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${getStateColor(job.state)}`}>
                      {job.state}
                    </span>
                  </td>
                  <td className="p-3 text-[var(--text-secondary)]">{job.profile}</td>
                  <td className="p-3 text-[var(--text-muted)]">{job.lastRun || 'Never'}</td>
                  <td className="p-3 text-[var(--text-muted)]">{job.nextRun || 'N/A'}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-secondary)] hover:text-[var(--text)]" title={job.state === 'paused' ? 'Resume' : 'Pause'}>
                        {job.state === 'paused' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                      </button>
                      <button className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-secondary)] hover:text-[var(--text)]" title="Trigger Now">
                        <ExternalLink className="w-3 h-3" />
                      </button>
                      <button className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded text-red-400/70 hover:text-red-400" title="Delete">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-[var(--text-muted)]">No cron jobs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-semibold">Create Cron Job</h3>
              <button onClick={() => setShowCreate(false)} className="text-[var(--text-muted)] hover:text-[var(--text)]">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--text-muted)]">Name (Optional)</label>
                <input 
                  value={newJob.name}
                  onChange={(e) => setNewJob({...newJob, name: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md text-sm outline-none focus:border-[var(--accent)]"
                  placeholder="e.g. Daily Summary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--text-muted)]">Prompt <span className="text-red-400">*</span></label>
                <textarea 
                  required
                  value={newJob.prompt}
                  onChange={(e) => setNewJob({...newJob, prompt: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md text-sm outline-none focus:border-[var(--accent)] min-h-[80px]"
                  placeholder="What should the agent do?"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--text-muted)]">Schedule <span className="text-red-400">*</span></label>
                <input 
                  required
                  value={newJob.schedule}
                  onChange={(e) => setNewJob({...newJob, schedule: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md text-sm font-mono outline-none focus:border-[var(--accent)]"
                  placeholder="e.g. every 30m or 0 9 * * *"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--text-muted)]">Delivery Target</label>
                <select 
                  value={newJob.deliver}
                  onChange={(e) => setNewJob({...newJob, deliver: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md text-sm outline-none focus:border-[var(--accent)]"
                >
                  <option value="local">Local Console</option>
                  <option value="origin">Origin System</option>
                  <option value="telegram">Telegram</option>
                  <option value="discord">Discord</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-md text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  Create Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
