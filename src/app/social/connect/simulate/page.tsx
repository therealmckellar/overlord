'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Globe, Lock, ShieldCheck, Check } from 'lucide-react';

const PLATFORMS_DETAIL: Record<string, {
  name: string;
  icon: string;
  brandColor: string;
  logoText: string;
  defaultHandle: string;
}> = {
  x: { name: 'X / Twitter', icon: '𝕏', brandColor: 'from-[#14171A] to-[#000000]', logoText: '𝕏', defaultHandle: '@overlord_hq' },
  linkedin: { name: 'LinkedIn', icon: 'in', brandColor: 'from-[#0A66C2] to-[#004182]', logoText: 'LinkedIn', defaultHandle: 'rich-mckellar' },
  instagram: { name: 'Instagram', icon: '📷', brandColor: 'from-[#E1306C] to-[#C13584]', logoText: 'Instagram', defaultHandle: '@overlord_art' },
  facebook: { name: 'Facebook', icon: 'f', brandColor: 'from-[#1877F2] to-[#0E52B0]', logoText: 'Facebook', defaultHandle: 'RichMcKellar' },
  tiktok: { name: 'TikTok', icon: '♪', brandColor: 'from-[#010101] to-[#EE1D52]', logoText: 'TikTok', defaultHandle: '@overlord_tok' },
  youtube: { name: 'YouTube', icon: '▶', brandColor: 'from-[#FF0000] to-[#C00000]', logoText: 'YouTube', defaultHandle: 'Overlord Channel' },
  reddit: { name: 'Reddit', icon: '🤖', brandColor: 'from-[#FF4500] to-[#D03800]', logoText: 'Reddit', defaultHandle: 'u/overlord_admin' },
};

function SimulateConnectContent() {
  const searchParams = useSearchParams();
  const platform = searchParams.get('platform') || 'x';
  const detail = PLATFORMS_DETAIL[platform] || PLATFORMS_DETAIL.x;

  const [accountName, setAccountName] = useState(`${detail.name} Business`);
  const [handle, setHandle] = useState(detail.defaultHandle);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAuthorize = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/social/accounts/connect/${platform}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_name: accountName.trim(),
          platform_user_id: handle.trim(),
          access_token: `mock_sandbox_token_${Math.random().toString(36).substring(2)}`,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        // Post message to parent dashboard window to sync social accounts
        window.opener?.postMessage({ type: 'social_connected', platform }, '*');
        setTimeout(() => {
          window.close();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080c] bg-radial-[circle_at_center,var(--color-slate-900)_0%,#06080c_100%] text-slate-100 flex flex-col items-center justify-center p-4">
      {/* Background neon effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-10 pointer-events-none" />

      <div className="w-full max-w-md bg-[#0d1117] border border-[#1e293b] rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-all duration-300">
        {/* Subtle Cyber Glowing Border */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 to-blue-600" />

        {/* Brand connection header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">OVERLORD</span>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 font-mono tracking-wide">SANDBOX</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Globe className="w-4 h-4 text-cyan-500 animate-pulse" />
            <span className="text-xs font-mono">Secure Authorization</span>
          </div>
        </div>

        {success ? (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-1">Authorization Approved</h3>
            <p className="text-xs text-slate-400 max-w-[280px]">
              Connection established for <span className="text-cyan-400 font-mono">{handle}</span>. Returning to dashboard...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-lg text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  OL
                </div>
                <div className="text-slate-500 font-mono text-xs">── connects to ──</div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${detail.brandColor} flex items-center justify-center font-bold text-lg text-white shadow-lg`}>
                  {detail.icon}
                </div>
              </div>
              <h2 className="text-base font-semibold text-slate-200">
                Authorize Overlord to access {detail.name}
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Connect your account to allow the Autonomous Intelligence to read social feeds, track brand mentions, analyze competitor trends, and compile metrics.
              </p>
            </div>

            {/* Simulated input form */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Account Name / Label
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Username / Handle
                </label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Scope details */}
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Permissions:</strong> View account info, read public feed, retrieve engagements. No direct password access.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-400">
                <Lock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Security:</strong> Stored locally inside your sandboxed Overlord DB configuration.
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.close()}
                className="flex-1 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-slate-300 font-medium py-2 rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAuthorize}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium py-2 rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Authorize App'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SimulateConnectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#06080c] text-slate-400 flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    }>
      <SimulateConnectContent />
    </Suspense>
  );
}
