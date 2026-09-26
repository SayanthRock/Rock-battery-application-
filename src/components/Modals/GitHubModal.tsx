/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Github, 
  ExternalLink, 
  GitBranch, 
  UploadCloud, 
  Check, 
  Copy, 
  AlertCircle, 
  CheckCircle2,
  Terminal, 
  ArrowRight, 
  Sparkles,
  Download,
  FolderGit2,
  RefreshCw,
  KeyRound,
  HelpCircle
} from 'lucide-react';
import { triggerHaptic } from '../../services/haptics';

interface GitHubModalProps {
  isDark: boolean;
  onClose: () => void;
  hapticEnabled?: boolean;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  isDark,
  onClose,
  hapticEnabled = true,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('rock_battery_github_user') || 'sayanth';
  });
  const [repoName, setRepoName] = useState<string>(() => {
    return localStorage.getItem('rock_battery_github_repo') || 'rock-battery';
  });
  const [token, setToken] = useState<string>('');
  const [repoStatus, setRepoStatus] = useState<'idle' | 'checking' | 'exists' | 'not_found' | 'error'>('idle');

  useEffect(() => {
    localStorage.setItem('rock_battery_github_user', username);
  }, [username]);

  useEffect(() => {
    localStorage.setItem('rock_battery_github_repo', repoName);
  }, [repoName]);

  const checkRepoStatus = async () => {
    if (!username || !repoName) return;
    setRepoStatus('checking');
    try {
      const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repoName)}`);
      if (res.status === 200) {
        setRepoStatus('exists');
      } else if (res.status === 404) {
        setRepoStatus('not_found');
      } else {
        setRepoStatus('error');
      }
    } catch {
      setRepoStatus('error');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    triggerHaptic('selection', { effectiveReducedMotion: false, hapticEnabled });
    setTimeout(() => {
      setCopiedCmd(null);
    }, 2500);
  };

  const cleanUser = username.trim() || 'sayanth';
  const cleanRepo = repoName.trim() || 'rock-battery';
  const repoUrl = `https://github.com/${cleanUser}/${cleanRepo}`;
  const newRepoUrl = `https://github.com/new?name=${encodeURIComponent(cleanRepo)}&description=${encodeURIComponent('Rock Battery Web Companion & Hardware Telemetry')}`;
  
  const tokenToUse = token.trim() || '<YOUR_GITHUB_TOKEN>';
  const tokenPushCmd = `git remote add origin https://${tokenToUse}@github.com/${cleanUser}/${cleanRepo}.git 2>/dev/null || git remote set-url origin https://${tokenToUse}@github.com/${cleanUser}/${cleanRepo}.git && git branch -M main && git push -u origin main`;
  const cloneCmd = `git clone https://github.com/${cleanUser}/${cleanRepo}.git`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="modal-github-sync"
        className={`w-full max-w-xl rounded-[28px] p-6 max-h-[92vh] overflow-y-auto transition-all ${
          isDark
            ? 'bg-[#161b22] border border-[#30363d] text-neutral-100 shadow-2xl'
            : 'bg-white border border-neutral-200 text-neutral-900 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-700/20 dark:border-neutral-700/60 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[12px] bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                <span>GitHub Repository Hub</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  main branch clean
                </span>
              </h3>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Connect, create, and upload to your GitHub repository
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Target Config Card */}
          <div 
            className={`rounded-[22px] p-4.5 border ${
              isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
                <FolderGit2 className="w-4 h-4 text-emerald-400" />
                <span>GitHub Target Configuration</span>
              </div>
              <button
                type="button"
                onClick={checkRepoStatus}
                disabled={repoStatus === 'checking'}
                className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${repoStatus === 'checking' ? 'animate-spin text-emerald-400' : ''}`} />
                <span>Check Status</span>
              </button>
            </div>

            {/* Inputs for Owner / Repo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  GitHub Username / Org
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="sayanth"
                  className={`w-full px-3 py-1.5 rounded-[12px] font-mono text-xs border ${
                    isDark 
                      ? 'bg-[#161b22] border-[#30363d] text-neutral-100 focus:border-emerald-500' 
                      : 'bg-white border-neutral-300 text-neutral-900 focus:border-emerald-600'
                  } outline-none transition-colors`}
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="rock-battery"
                  className={`w-full px-3 py-1.5 rounded-[12px] font-mono text-xs border ${
                    isDark 
                      ? 'bg-[#161b22] border-[#30363d] text-neutral-100 focus:border-emerald-500' 
                      : 'bg-white border-neutral-300 text-neutral-900 focus:border-emerald-600'
                  } outline-none transition-colors`}
                />
              </div>
            </div>

            {/* Live status check result */}
            {repoStatus === 'not_found' && (
              <div className="mb-3 p-2.5 rounded-[14px] bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <strong>Repository not found on GitHub yet (404).</strong>
                  <br />
                  GitHub requires you to create the empty repository first before any code can be uploaded. Click the green button below to create it in 5 seconds!
                </div>
              </div>
            )}

            {repoStatus === 'exists' && (
              <div className="mb-3 p-2.5 rounded-[14px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] leading-relaxed flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <div>
                  <strong>Repository is live on GitHub!</strong> You are ready to push updates.
                </div>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <a
                id="btn-create-github-repo"
                href={newRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-[14px] text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>1. Create Repo on GitHub</span>
                <ExternalLink className="w-3 h-3 text-white/80" />
              </a>

              <a
                id="btn-open-github-repo"
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-[14px] text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center gap-1.5 transition-colors border border-neutral-700"
              >
                <Github className="w-3.5 h-3.5" />
                <span>2. Open Repo</span>
                <ExternalLink className="w-3 h-3 text-neutral-400" />
              </a>
            </div>
          </div>

          {/* Upload Method 1: AI Studio One-Click Export */}
          <div 
            className={`rounded-[20px] p-4 border space-y-2 ${
              isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-[8px] bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-emerald-400">
                Recommended: AI Studio Native One-Click Export
              </h4>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed pl-8">
              In Google AI Studio, click the <strong>Settings / Menu (three dots)</strong> in the top-right header &rarr; select <strong>Export to GitHub</strong> &rarr; select <strong className="text-white font-mono">{cleanUser}/{cleanRepo}</strong>. This handles authorization securely and pushes all commits directly.
            </p>
          </div>

          {/* Upload Method 2: Push via Personal Access Token */}
          <div 
            className={`rounded-[20px] p-4 border space-y-2 ${
              isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-[8px] bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold text-xs">
                B
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-sky-400">
                Push via GitHub Personal Access Token (PAT)
              </h4>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed pl-8">
              Generate a classic or fine-grained token at <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline inline-flex items-center gap-0.5">github.com/settings/tokens <ExternalLink className="w-2.5 h-2.5" /></a> with <code className="px-1 py-0.5 rounded bg-neutral-800 text-sky-300 text-[10px]">repo</code> permissions.
            </p>

            <div className="pl-8 space-y-2 pt-1">
              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Optional: Paste Your Token to Auto-Generate Command
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className={`w-full px-3 py-1.5 rounded-[12px] font-mono text-xs border ${
                      isDark 
                        ? 'bg-[#161b22] border-[#30363d] text-neutral-100 focus:border-sky-500' 
                        : 'bg-white border-neutral-300 text-neutral-900 focus:border-sky-600'
                    } outline-none transition-colors pr-8`}
                  />
                  <KeyRound className="w-3.5 h-3.5 text-neutral-500 absolute right-2.5 top-2.5" />
                </div>
              </div>

              <div className="relative">
                <pre className="p-2.5 rounded-[12px] bg-black/60 border border-neutral-800 font-mono text-[10px] text-neutral-300 overflow-x-auto whitespace-pre-wrap break-all">
                  {tokenPushCmd}
                </pre>
                <button
                  onClick={() => copyToClipboard(tokenPushCmd, 'tokenPush')}
                  className="absolute right-2 top-2 p-1.5 rounded-[8px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
                  title="Copy command"
                >
                  {copiedCmd === 'tokenPush' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Upload Method 3: Local Clone */}
          <div 
            className={`rounded-[20px] p-4 border space-y-2 ${
              isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-[8px] bg-neutral-600/30 text-neutral-300 flex items-center justify-center font-bold text-xs">
                C
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-300">
                Clone on Your Local Computer
              </h4>
            </div>

            <div className="pl-8 pt-1">
              <div className="relative">
                <pre className="p-2.5 rounded-[12px] bg-black/60 border border-neutral-800 font-mono text-[10px] text-neutral-300 overflow-x-auto">
                  {cloneCmd}
                </pre>
                <button
                  onClick={() => copyToClipboard(cloneCmd, 'clone')}
                  className="absolute right-2 top-2 p-1.5 rounded-[8px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
                  title="Copy command"
                >
                  {copiedCmd === 'clone' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-neutral-700/20 dark:border-neutral-700/60 pt-4">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
            <span>Branch: <span className="text-emerald-400 font-bold">main</span></span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-300">v1.4.0</span>
          </div>
          <button
            id="close-github-modal-btn"
            onClick={onClose}
            className="px-5 py-2.5 rounded-[16px] text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
