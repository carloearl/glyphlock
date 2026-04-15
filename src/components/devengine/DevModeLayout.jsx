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

// Connect to siteBuilder agent
async function callAgent(message) {
  try {
    const conversation = await base44.agents.createConversation({
      agent_name: 'siteBuilder',
      metadata: { source: 'dev_engine' }
    });
    
    await base44.agents.addMessage(conversation, {
      role: 'user',
      content: '[DEV ENGINE MODE] ' + message
    });
    
    // Wait for response
    return new Promise((resolve) => {
      const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
        const lastMsg = data.messages[data.messages.length - 1];
        if (lastMsg?.role === 'assistant' && lastMsg?.content) {
          unsubscribe();
          resolve({ success: true, content: lastMsg.content, toolCalls: lastMsg.tool_calls });
        }
      });
      
      setTimeout(() => {
        unsubscribe();
        resolve({ error: 'Timeout waiting for agent response' });
      }, 60000);
    });
  } catch (err) {
    console.error('Agent error:', err);
    return { error: err.message };
  }
}

export default function DevModeLayout() {
  const [fileTree, setFileTree] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [diff, setDiff] = useState(null);
  const [backups, setBackups] = useState([]);
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(function loadTreeOnMount() {
    let cancelled = false;

    async function loadTree() {
      setStatus('Loading file tree...');
      try {
        const { data } = await base44.functions.invoke('devGetFileTree', {});
        if (cancelled) return;
        
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

    loadTree();

    return function cleanup() {
      cancelled = true;
    };
  }, []);

  async function handleSelectFile(path) {
    setSelectedFile(path);
    setAnalysis(null);
    setProposal(null);
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
    if (!selectedFile) return;
    setIsBusy(true);
    setStatus('Analyzing via agent…');
    
    const result = await callAgent(`[EXPLAIN MODE] Analyze the file ${selectedFile} and explain its purpose, structure, and any issues`);
    setIsBusy(false);

    if (result && result.content) {
      setAnalysis(result.content);
      setStatus('Analysis complete');
    } else {
      setStatus('Analysis failed');
    }
  }

  async function handleProposeChange(instructions) {
    if (!selectedFile || !fileContent) return;
    setIsBusy(true);
    setStatus('Agent generating proposal…');

    const result = await callAgent(`[BUILD MODE] For file ${selectedFile}, propose changes: ${instructions}\n\nShow the complete updated code.`);
    setIsBusy(false);

    if (result && result.content) {
      const codeMatch = result.content.match(/```[\w]*\n([\s\S]*?)\n```/);
      const proposed = codeMatch ? codeMatch[1] : result.content;
      setProposal(proposed);
      setDiff([
        { type: 'remove', text: 'Original version' },
        { type: 'add', text: 'Proposed changes ready' }
      ]);
      setStatus('Proposal ready');
    } else {
      setStatus('Proposal failed');
    }
  }

  async function handleApplyChange() {
    if (!selectedFile || !proposal) return;
    setIsBusy(true);
    setStatus('Applying via agent…');

    const result = await callAgent(`[BUILD MODE] Write the following code to ${selectedFile}:\n\n\`\`\`\n${proposal}\n\`\`\``);
    setIsBusy(false);

    if (result && !result.error) {
      setFileContent(proposal);
      setStatus('Change applied successfully');
      toast.success('File updated by agent');
      setProposal(null);
      setDiff(null);
    } else {
      setStatus('Apply failed: ' + (result?.error || 'Unknown error'));
      toast.error('Failed to apply changes');
    }
  }

  function handleRejectChange() {
    setProposal(null);
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

  // Import StatusBar
  const StatusBar = React.lazy(() => import('./StatusBar'));

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
                onClick={() => window.location.reload()}
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
                const result = await callDevFunction('devGetBackups', { path: selectedFile || 'all' });
                if (result.backups && result.backups.length > 0) {
                  return '📝 ACTION LOG:\n' + result.backups.slice(0, 10)
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
      <React.Suspense fallback={<div className="h-8 bg-slate-900" />}>
      <StatusBar status={status} busy={isBusy} selectedFile={selectedFile} />
      </React.Suspense>
      </div>
      );
      }