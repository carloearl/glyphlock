/**
 * KeyboardShortcutsDialog - Displays all shortcuts
 */
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

const SECTIONS = [
  {
    title: "Global",
    shortcuts: [
      { keys: "/", desc: "Focus search bar" },
      { keys: "Esc", desc: "Close modal / clear search & filter" },
      { keys: "?", desc: "Open this shortcuts dialog" },
    ],
  },
  {
    title: "Song Deck (when focused)",
    shortcuts: [
      { keys: "Space", desc: "Toggle play/pause" },
      { keys: "J", desc: "Select previous track" },
      { keys: "K", desc: "Select next track" },
      { keys: "F", desc: "Toggle favorite" },
      { keys: "A", desc: "Toggle archive" },
      { keys: "Enter", desc: "Edit selected track" },
    ],
  },
  {
    title: "Profile Panel (when focused)",
    shortcuts: [
      { keys: "N", desc: "Create new profile" },
      { keys: "↑ / ↓", desc: "Navigate profiles" },
      { keys: "Enter", desc: "Switch to selected profile" },
    ],
  },
];

export default function KeyboardShortcutsDialog({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Keyboard className="w-5 h-5 text-cyan-400" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2">{section.title}</h4>
              <div className="space-y-1">
                {section.shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-800/40">
                    <span className="text-xs text-slate-300">{s.desc}</span>
                    <kbd className="text-[10px] font-mono bg-slate-700 text-slate-200 px-2 py-0.5 rounded border border-slate-600">{s.keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}