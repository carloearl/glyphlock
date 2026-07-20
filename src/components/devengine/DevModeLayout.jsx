import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import HoverTooltip from '@/components/ui/HoverTooltip';
import AIConsole from './AIConsole';
import FileTree from './FileTree';
import MonacoViewer from './MonacoViewer';
import VirtualTerminal from './VirtualTerminal';
import DiffViewer from './DiffViewer';
import ApprovalPanel from './ApprovalPanel';
import StatusBar from './StatusBar';

function buildDiffRows(diffText, original, proposed) {
  if (diffText && typeof diffText === 'string') {
    return diffText.split('\n').slice(0, 400).map(line =>
      line.startsWith('+') ? { type: 'add', text: line.slice(1) }
        : line.startsWith('-') ? { type: 'remove', text: line.slice(1) }
        : { type: 'context', text: line });
  }
  return [
    { type: 'remove', text: `Original (${(original || '').split('\n').length} lines)` },
    { type: 'add', text: `Proposed (${(proposed || '').split('\n').length} lines)` }
  ];
}

export default function DevModeLayout() {
  const [fileTree, setFileTree] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [proposalMeta, setProposalMeta] = useState(null);
  const [diff, setDiff] = useState(null);
  const [backups, setBackups] = useState([]);
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

  async function loadTree() {
    setStatus('Loading file tree...');
    try {
      const { data } = await base44.functions.invoke('devGetFileTree', {});
      if (data.success && data.tree) {
        setFileTree(data.tree);
        setStatus(`Loaded ${data.total_files} files`);
      } else {
        setStatus('Failed to load file tree');
      }
    } catch (error) {
      console.error('File tree error:', error);
      setStatus('Error loading files');
    }
  }

  useEffect(() => { loadTree(); }, []);

  async function handleSelectFile(path) {
    setSelectedFile(path);
    setAnalysis(null);
    setProposal(null);
    setProposalMeta(null);
    setDiff(null);
    setStatus('Loading file...');
    setIsBusy(true);
    
    try {
      const { data } = await base44.functions.invoke('devGetFileContent', { file_path: path });
      setIsBusy(false);

      if (data.success && data.content) {
        setFileContent(data.content);
        setStatus(`Loaded ${data.lines} lines`);
      } else {
        setStatus('Failed to load file');
        setFileContent('// File content unavailable');
      }
    } catch (error) {
      console.error('File load error:', error);
      setIsBusy(false);
      setStatus('Error loading file');
      setFileContent('// Error: ' + error.message);
    }
  }

  async function handleAnalyzeFile() {
    if (!selectedFile || !fileContent) return;
    setIsBusy(true);
    setStatus('AI analyzing file...');
    try {
      const { data } = await base44.functions.invoke('devAnalyzeFile', {
        filePath: selectedFile,
        fileContent,
        explicitUserTrigger: true
      });
      if (data.success) {
        setAnalysis(data.analysis);
        setStatus('Analysis complete');
      } else {
        setStatus('Analysis failed: ' + (data.error || 'unknown'));
      }
    } catch (error) {
      setStatus('Analysis failed: ' + (error?.response?.data?.error || error.message));
    }
    setIsBusy(false);
  }

  async function handleProposeChange(instructions) {
    if (!selectedFile || !fileContent) return;
    setIsBusy(true);
    setStatus('AI generating proposal...');
    try {
      const { data } = await base44.functions.invoke('devProposeChange', {
        filePath: selectedFile,
        fileContent,
        changeDescription: instructions,
        explicitUserTrigger: true
      });
      if (data.success && data.proposal?.modifiedCode) {
        setProposal(data.proposal.modifiedCode);
        setProposalMeta({ id: data.proposalId, explanation: data.proposal.explanation, risk: data.proposal.risk });
        setDiff(buildDiffRows(data.proposal.diff, fileContent, data.proposal.modifiedCode));
        setStatus(`Proposal ready — risk: ${data.proposal.risk || 'unknown'}`);
      } else {
        setStatus('Proposal failed: ' + (data.error || 'no code returned'));
      }
    } catch (error) {
      setStatus('Proposal failed: ' + (error?.response?.data?.error || error.message));
    }
    setIsBusy(false);
  }

  async function handleApplyChange() {
    if (!selectedFile || !proposal || !proposalMeta?.id) return;
    setIsBusy(true);
    setStatus('Approving & logging change...');
    try {
      const { data } = await base44.functions.invoke('devApplyDiff', {
        proposalId: proposalMeta.id,
        filePath: selectedFile,
        modifiedCode: proposal,
        originalContent: fileContent,
        approved: true
      });
      if (data.success) {
        setFileContent(proposal);
        setStatus('Approved — backup saved, change logged');
        toast.success('Proposal approved and logged with backup');
        setProposal(null);
        setProposalMeta(null);
        setDiff(null);
      } else {
        setStatus('Apply failed: ' + (data.error || 'Unknown error'));
        toast.error('Failed to apply changes');
      }
    } catch (error) {
      setStatus('Apply failed: ' + (error?.response?.data?.error || error.message));
      toast.error('Failed to apply changes');
    }
    setIsBusy(false);
  }

  function handleRejectChange() {
    setProposal(null);
    setProposalMeta(null);
    setDiff(null);
    setStatus('Proposal discarded');
  }

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setStatus('Uploading files to agent…');
    const uploaded = [];

    for (const file of files) {
      try {
        const { data } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push({ name: file.name, url: data.file_url });
        toast.success(`Uploaded ${file.name}`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploadedFiles(prev => [...prev, ...uploaded]);
    setStatus('Files uploaded');
    e.target.value = null;
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-50">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="flex flex-1 overflow-hidden">
      
      {/* Left: File Tree */}
      <div className="w-64 border-r border-slate-800 overflow-y-auto">
        <div className="px-3 py-2 text-xs font-semibold tracking-wide uppercase text-slate-400 border-b border-slate-800 flex items-center justify-between">
          <span>Files ({fileTree.length})</span>
          <div className="flex gap-1">
            <HoverTooltip content="Refresh file tree">
              <Button
                onClick={loadTree}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </HoverTooltip>
            <HoverTooltip content="Upload files">
              <Button
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <Upload className="w-3 h-3" />
              </Button>
            </HoverTooltip>
          </div>
        </div>
        <FileTree
          tree={fileTree}
          selectedPath={selectedFile}
          onSelect={handleSelectFile}
        />
        
        {uploadedFiles.length > 0 && (
          <div className="px-3 py-2 border-t border-slate-800">
            <div className="text-xs text-slate-400 mb-2">Uploaded Files:</div>
            {uploadedFiles.map((f, i) => (
              <div key={i} className="text-xs text-green-400 truncate mb-1">
                ✓ {f.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Middle: Console + Diff */}
      <div className="flex flex-col flex-1 border-r border-slate-800">
        <div className="flex-1 flex flex-col">
          <AIConsole
            selectedFile={selectedFile}
            analysis={analysis}
            proposal={proposal}
            proposalMeta={proposalMeta}
            onAnalyze={handleAnalyzeFile}
            onPropose={handleProposeChange}
            busy={isBusy}
          />
          <div className="border-t border-slate-800 h-64">
            <DiffViewer
              path={selectedFile}
              original={fileContent}
              proposed={proposal}
              diff={diff}
            />
          </div>
        </div>
        <ApprovalPanel
          selectedFile={selectedFile}
          proposal={proposal}
          diff={diff}
          onApprove={handleApplyChange}
          onReject={handleRejectChange}
          backups={backups}
          busy={isBusy}
          status={status}
        />
      </div>

      {/* Right: Code Viewer + Terminal */}
      <div className="w-[32rem] flex flex-col">
        <div className="flex-1 border-b border-slate-800">
          <MonacoViewer
            path={selectedFile}
            code={proposal || fileContent}
          />
        </div>
        <div className="h-56">
          <VirtualTerminal
            onCommand={async function onCommand(cmd) {
              const parts = cmd.trim().split(' ');
              const command = parts[0];
              const args = parts.slice(1);

              // TREE - Show file tree structure
              if (command === 'tree') {
                if (fileTree.length === 0) return '📁 No files loaded';
                return '📂 File Tree:\n' + JSON.stringify(fileTree, null, 2);
              }

              // STATUS - System status
              if (command === 'status') {
                return `
        📊 SYSTEM STATUS
        ━━━━━━━━━━━━━━━━
        Status: ${status}
        Selected File: ${selectedFile || 'none'}
        Backups: ${backups.length}
        Files Loaded: ${fileTree.length}
        `;
              }

              // FILES - List all files
              if (command === 'files' || command === 'ls') {
                if (fileTree.length === 0) return '❌ No files loaded';
                const flatFiles = [];
                function flatten(nodes, prefix = '') {
                  nodes.forEach(n => {
                    if (!n.children) {
                      flatFiles.push(prefix + n.name);
                    } else {
                      flatFiles.push(prefix + '📁 ' + n.name + '/');
                      flatten(n.children, prefix + '  ');
                    }
                  });
                }
                flatten(fileTree);
                const display = flatFiles.slice(0, 30).join('\n');
                return display + (flatFiles.length > 30 ? `\n... ${flatFiles.length - 30} more files` : '');
              }

              // ENTITIES - List entities
              if (command === 'entities') {
                const entities = fileTree.filter(f => f.path?.startsWith('entities/'));
                if (entities.length === 0) return '❌ No entities found';
                return '📦 ENTITIES:\n' + entities.map(e => '  • ' + e.name).join('\n');
              }

              // FUNCTIONS - List backend functions
              if (command === 'functions') {
                const functions = fileTree.filter(f => f.path?.startsWith('functions/'));
                if (functions.length === 0) return '❌ No functions found';
                return '⚙️ BACKEND FUNCTIONS:\n' + functions.map(f => '  • ' + f.name).join('\n');
              }

              // PAGES - List pages
              if (command === 'pages') {
                const pages = fileTree.filter(f => f.path?.startsWith('pages/'));
                if (pages.length === 0) return '❌ No pages found';
                return '📄 PAGES:\n' + pages.map(p => '  • ' + p.name).join('\n');
              }

              // CAT - Show file content
              if (command === 'cat') {
                if (!args[0]) return '❌ Usage: cat <filename>';
                if (selectedFile && selectedFile.includes(args[0])) {
                  return fileContent || '❌ File content not loaded';
                }
                return `❌ File "${args[0]}" not found or not selected`;
              }

              // LOG - Action log
              if (command === 'log') {
                const result = await base44.functions.invoke('devGetBackups', { path: selectedFile || 'all' });
                const backupsData = result?.data;
                if (backupsData?.backups && backupsData.backups.length > 0) {
                  return '📝 ACTION LOG:\n' + backupsData.backups.slice(0, 10)
                    .map(b => `  ${b.timestamp} - ${b.path}`)
                    .join('\n');
                }
                return '❌ No action log available';
              }

              return `❌ Command not found: ${command}\n💡 Type "help" for available commands`;
            }}
          />
        </div>
      </div>
      </div>

      {/* Status Bar */}
      <StatusBar status={status} busy={isBusy} selectedFile={selectedFile} />
      </div>
      );
      }