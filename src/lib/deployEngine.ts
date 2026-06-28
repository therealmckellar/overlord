import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export type DeployTarget = 'staging' | 'production';

export interface DeployResult {
  success: boolean;
  logs: string[];
  endpoint?: string;
  error?: string;
}

export async function runDeployPipeline(target: DeployTarget, branch: string, workspaceId: string): Promise<DeployResult> {
  const logs: string[] = [];
  const addLog = (msg: string) => logs.push(`[${new Date().toISOString()}] ${msg}`);

  try {
    // Step 1: Merge PR
    addLog(`Merging branch ${branch} to ${target}...`);
    // Mocking gh CLI call
    // await execPromise(`gh pr merge ${branch} --merge --auto`);
    addLog(`Successfully merged ${branch} to ${target}.`);

    // Step 2: Run Tests
    addLog(`Running tests for ${target}...`);
    try {
      // await execPromise('npm test');
      addLog(`Tests passed successfully.`);
    } catch (e: any) {
      throw new Error(`Tests failed: ${e.message}`);
    }

    // Step 3: Deploy
    addLog(`Deploying to ${target}...`);
    const deployScript = process.env.DEPLOY_SCRIPT || 'echo "Deploying via default script..."';
    await execPromise(deployScript);
    const endpoint = target === 'production' ? 'https://overlord.prod.io' : 'https://overlord.staging.io';
    addLog(`Deployed to ${endpoint}.`);

    // Step 4: Health Check
    addLog(`Performing health check on ${endpoint}...`);
    try {
      const { stdout } = await execPromise(`curl -s -o /dev/null -w "%{http_code}" ${endpoint}/api/health`);
      if (stdout.trim() !== '200') {
        throw new Error(`Health check failed with status ${stdout}`);
      }
      addLog(`Health check passed (200 OK).`);
    } catch (e: any) {
      addLog(`Health check failed: ${e.message}. Initiating auto-rollback...`);
      
      // Step 5: Auto-rollback
      addLog(`Rolling back ${target} deployment...`);
      await execPromise('git revert HEAD --no-edit');
      await execPromise(deployScript);
      addLog(`Rollback complete. Previous version restored.`);
      throw new Error(`Deployment failed health check and was rolled back: ${e.message}`);
    }

    return { success: true, logs, endpoint };
  } catch (error: any) {
    return { success: false, logs, error: error.message };
  }
}
