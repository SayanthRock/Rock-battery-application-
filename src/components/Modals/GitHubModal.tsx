/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Github, 
  ExternalLink, 
  GitBranch, 
  UploadCloud, 
  Check, 
  Copy, 
  AlertCircle, 
  Terminal, 
  ArrowRight, 
  Sparkles,
  Download,
  FolderGit2
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    triggerHaptic('selection', { effectiveReducedMotion: false, hapticEnabled });
    setTimeout(() => {
      setCopiedCmd(null);
    }, 2500);
  };

  const repoUrl = 'https://github.com/sayanth/rock-battery';
  const newRepoUrl = 'https://github.com/new?name=rock-battery';
  const tokenPushCmd = 'git push https://<YOUR_GITHUB_TOKEN>@github.com/sayanth/rock-battery.git main';
  const cloneCmd = 'git clone https://github.com/sayanth/rock-battery.git';

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
                Repository link, upload methods, and troubleshooting guide
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
          {/* Repository Target Banner */}
          <div 
            className={`rounded-[22px] p-4.5 border ${
              isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
                <FolderGit2 className="w-4 h-4 text-emerald-400" />
                <span>Target Repository</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                sayanth/rock-battery
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <a
                id="btn-open-github-repo"
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] px-3.5 py-2 rounded-[14px] text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center gap-1.5 transition-colors border border-neutral-700"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Open on GitHub</span>
                <ExternalLink className="w-3 h-3 text-neutral-400" />
              </a>

              <a
                id="btn-create-github-repo"
                href={newRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] px-3.5 py-2 rounded-[14px] text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Create Repo on GitHub</span>
                <ExternalLink className="w-3 h-3 text-emerald-400" />
              </a>
            </div>

            {/* 404 Troubleshooting Note */}
            <div className="mt-3 p-2.5 rounded-[14px] bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <strong>Seeing a 404 on GitHub?</strong> This happens if the repository hasn&apos;t been created under your GitHub account yet. Click <strong>&ldquo;Create Repo on GitHub&rdquo;</strong> above to create it with one click!
              </div>
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
                1
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-emerald-400">
                Recommended: AI Studio Native Export
              </h4>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed pl-8">
              In Google AI Studio, click the <strong>Settings / Menu</strong> (top right of your screen) &rarr; select <strong>Export to GitHub</strong> &rarr; pick <strong>sayanth/rock-battery</strong>. This authenticates securely via OAuth and pushes all commits instantly.
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
                2
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-sky-400">
                Direct Push via GitHub Personal Access Token (PAT)
              </h4>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed pl-8">
              Generate a classic or fine-grained token at <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline inline-flex items-center gap-0.5">github.com/settings/tokens <ExternalLink className="w-2.5 h-2.5" /></a> with <code className="px-1 py-0.5 rounded bg-neutral-800 text-sky-300 text-[10px]">repo</code> permissions, then execute:
            </p>

            <div className="pl-8 pt-1">
              <div className="relative">
                <pre className="p-2.5 rounded-[12px] bg-black/50 border border-neutral-800 font-mono text-[10px] text-neutral-300 overflow-x-auto">
                  {tokenPushCmd}
                </pre>
                <button
                  onClick={() => copyToClipboard(tokenPushCmd, 'tokenPush')}
                  className="absolute right-2 top-2 p-1 rounded-[8px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
                  title="Copy command"
                >
                  {copiedCmd === 'tokenPush' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-neutral-400 mt-1 italic">
                Tip: You can also paste your token directly into the AI Studio chat and tell the assistant to push!
              </p>
            </div>
          </div>

          {/* Upload Method 3: Local Clone & Push */}
          <div 
            className={`rounded-[20px] p-4 border space-y-2 ${
              isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-[8px] bg-neutral-600/30 text-neutral-300 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-300">
                Clone on Your Local Computer
              </h4>
            </div>

            <div className="pl-8 pt-1">
              <div className="relative">
                <pre className="p-2.5 rounded-[12px] bg-black/50 border border-neutral-800 font-mono text-[10px] text-neutral-300 overflow-x-auto">
                  {cloneCmd}
                </pre>
                <button
                  onClick={() => copyToClipboard(cloneCmd, 'clone')}
                  className="absolute right-2 top-2 p-1 rounded-[8px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
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
          <span className="text-xs font-mono text-neutral-400">
            Commit HEAD: <span className="text-emerald-400 font-bold">4194886</span>
          </span>
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
