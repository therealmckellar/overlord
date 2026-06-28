import { Handoff } from '../stores/handoffStore';

export const handoffEngine = {
  async createHandoffPackage(taskId: string, fromAgent: string, toAgent: string, taskData: any): Promise<Partial<Handoff>> {
    // In a real scenario, this would call an LLM to summarize the taskData
    const summary = `Task ${taskId} transitioned from ${fromAgent} to ${toAgent}. Work completed on primary objectives.`;
    
    return {
      taskId,
      fromAgent,
      toAgent,
      summary,
      filesModified: taskData.filesModified || [],
      decisions: taskData.decisions || [],
      openQuestions: taskData.openQuestions || [],
      context: taskData.context || {},
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
  },

  async queueHandoff(handoffData: Partial<Handoff>) {
    const response = await fetch('/api/handoff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(handoffData),
    });
    return response.json();
  }
};
