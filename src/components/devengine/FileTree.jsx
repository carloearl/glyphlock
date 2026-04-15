import React from 'react';

function isBlockedNodePath(path) {
  const value = String(path || '').toLowerCase();
  return value.includes('internal_index') || value.includes('/mobile/') || value.includes('/security/') || value.startsWith('components/mobile/') || value.startsWith('components/security/');
}

function TreeNode(props) {
  const { node, depth, selectedPath, onSelect } = props;
  if (isBlockedNodePath(node.path)) return null;
  const filteredChildren = Array.isArray(node.children)
    ? node.children.filter((child) => !isBlockedNodePath(child.path))
    : [];
  const isSelected = node.path === selectedPath;
  const isFolder = filteredChildren.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={function clickNode() {
          if (!isFolder) {
            onSelect(node.path);
          }
        }}
        className={
          'w-full text-left px-2 py-1 text-xs font-mono flex items-center ' +
          (isSelected ? 'bg-emerald-500/20 text-emerald-200' : 'text-slate-200 hover:bg-slate-900')
        }
        style={{ paddingLeft: 8 + depth * 10 }}
      >
        <span className="mr-1 text-[10px] text-slate-500">
          {isFolder ? '▸' : '•'}
        </span>
        <span>{node.name}</span>
      </button>

      {isFolder &&
        filteredChildren.map(function renderChild(child) {
          return (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          );
        })}
    </div>
  );
}

export default function FileTree(props) {
  const { tree, selectedPath, onSelect } = props;

  if (!Array.isArray(tree) || tree.length === 0) {
    return (
      <div className="p-3 text-[11px] text-slate-500">
        No files available or tree not loaded.
      </div>
    );
  }

  return (
    <div className="py-2">
      {tree.map(function renderRoot(node) {
        return (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}