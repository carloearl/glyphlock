/**
 * MusicSuitePanel — DEPRECATED SHELL.
 *
 * This used to carry its own duplicate tab rail, which silently drifted out of
 * sync with the real console (features got added here and never appeared in the
 * DJ Booth). There is now exactly ONE music console: UnifiedMusicConsole.
 * This file stays only so any older mount point keeps working.
 */
import React from 'react';
import UnifiedMusicConsole from '@/components/mixer/UnifiedMusicConsole';

export default function MusicSuitePanel() {
  return <UnifiedMusicConsole />;
}