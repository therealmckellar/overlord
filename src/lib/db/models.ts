import mongoose from 'mongoose';

const WorkspaceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  status: { type: String, default: 'active' },
  pr_url: String,
  pr_number: Number,
  updated_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
});

export const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', WorkspaceSchema);

const CommentSchema = new mongoose.Schema({
  workspace_id: { type: String, required: true, index: true },
  author: String,
  content: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

export const WorkspaceComment = mongoose.models.WorkspaceComment || mongoose.model('WorkspaceComment', CommentSchema);

const GoalSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  status: { type: String, default: 'pending' },
  priority: { type: String, default: 'medium' },
  created_at: { type: Date, default: Date.now },
});

export const Goal = mongoose.models.Goal || mongoose.model('Goal', GoalSchema);

const AgentConfigSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  model: String,
  system_prompt: String,
  temperature: { type: Number, default: 0.7 },
  max_tokens: { type: Number, default: 4096 },
  updated_at: { type: Date, default: Date.now },
});

export const AgentConfig = mongoose.models.AgentConfig || mongoose.model('AgentConfig', AgentConfigSchema);
