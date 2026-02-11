import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { STORAGE_KEYS } from '../config';

export function useGlyphBotPersistence(currentUser) {
  const [currentChatId, setCurrentChatId] = useState(null);
  const [savedChats, setSavedChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fullHistory, setFullHistory] = useState([]);

  const loadSavedChats = useCallback(async () => {
    if (!currentUser?.email) return;

    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('loadGlyphBotChats', {
        includeArchived: false
      });

      if (data?.success) {
        setSavedChats(data.chats || []);
      }
    } catch (e) {
      console.error('[Load Error]', e);
      setSavedChats([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    if (currentUser?.email) loadSavedChats();
  }, [currentUser?.email, loadSavedChats]);

  const trackMessage = useCallback((message) => {
    if (!message?.role) return;

    setFullHistory(prev => {
      // DEDUPLICATION: Prevent duplicate messages
      const messageId = message.id || `${message.role}-${Date.now()}`;
      const isDuplicate = prev.some(m => 
        (m.id === messageId) || 
        (m.role === message.role && m.content === message.content && 
         Math.abs(new Date(m.timestamp || 0).getTime() - new Date(message.timestamp || Date.now()).getTime()) < 200)
      );

      if (isDuplicate) {
        console.warn('[Persistence] Duplicate message blocked:', messageId);
        return prev;
      }

      const messageWithId = { ...message, id: messageId };
      const updated = [...prev, messageWithId];
      
      // AUTOSAVE: Always save to backend after each message
      if (currentUser?.email) {
        const chatIdToUse = currentChatId;
        base44.functions.invoke('saveGlyphBotChat', {
          chatId: chatIdToUse || null,
          messages: updated,
          title: generateChatTitle(updated),
          provider: 'AUTO',
          persona: 'GENERAL'
        }).then(response => {
          if (response.data?.success && response.data?.chatId && !chatIdToUse) {
            setCurrentChatId(response.data.chatId);
            localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID, response.data.chatId);
            console.log('[AutoSave] New chat created:', response.data.chatId);
          } else {
            console.log('[AutoSave] Chat updated:', chatIdToUse);
          }
        }).catch(e => console.error('[AutoSave]', e));
      }
      return updated;
    });
  }, [currentUser?.email, currentChatId]);

  const initializeHistory = useCallback((messages) => {
    if (!Array.isArray(messages)) return;

    if (fullHistory.length === 0 && messages.length > 0) {
      setFullHistory(messages);
      localStorage.setItem(STORAGE_KEYS.FULL_HISTORY, JSON.stringify(messages));
    }
  }, [fullHistory.length]);

  const saveChat = useCallback(async (messages, options = {}) => {
    if (!currentUser?.email) {
      throw new Error('Not authenticated');
    }

    const historyToSave = fullHistory.length > messages.length ? fullHistory : messages;
    if (!historyToSave.length) throw new Error('No messages');

    try {
      const { data } = await base44.functions.invoke('saveGlyphBotChat', {
        chatId: currentChatId,
        messages: historyToSave,
        title: options.title || generateChatTitle(historyToSave),
        provider: options.provider || 'AUTO',
        persona: options.persona || 'GENERAL'
      });

      if (!data?.success) throw new Error(data?.error || 'Save failed');

      const newId = data.chatId;
      setCurrentChatId(newId);
      localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID, newId);
      
      await loadSavedChats();
      return data.chat;
    } catch (e) {
      console.error('[Save Error]', e);
      throw e;
    }
  }, [currentUser?.email, currentChatId, fullHistory, loadSavedChats]);

  const loadChat = useCallback(async (chatId) => {
    if (!chatId || !currentUser?.email) return null;

    try {
      const chats = await base44.entities.GlyphBotChat.filter(
        { userId: currentUser.email },
        '-updated_date',
        200
      );

      const chat = chats.find(c => {
        const cid = c.id || c._id || c.entity_id;
        return cid === chatId;
      });

      if (!chat) return null;

      const resolvedId = chat.id || chat._id || chat.entity_id;
      setCurrentChatId(resolvedId);
      localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID, resolvedId);

      let history = [];
      try {
        history = JSON.parse(chat.fullHistory || '[]');
        if (typeof history === 'string') history = JSON.parse(history);
      } catch {
        history = [];
      }

      setFullHistory(history);
      localStorage.setItem(STORAGE_KEYS.FULL_HISTORY, JSON.stringify(history));

      const visibleMessages = history.filter(m => m.id !== 'welcome-1');

      return {
        ...chat,
        messages: history,
        visibleMessages
      };
    } catch (e) {
      console.error('[Persistence] Failed to load chat:', chatId, e);
      return null;
    }
  }, [currentUser?.email]);

  const startNewChat = useCallback(() => {
    setCurrentChatId(null);
    setFullHistory([]);
  }, []);

  const archiveChat = useCallback(async (chatId) => {
    if (!chatId) return false;

    console.log('[Persistence] Calling backend function archiveGlyphBotChat');

    try {
      const response = await base44.functions.invoke('archiveGlyphBotChat', {
        chatId
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Archive failed');
      }

      if (chatId === currentChatId) startNewChat();
      await loadSavedChats();
      return true;
    } catch (e) {
      console.error('[Persistence] Archive failed:', e);
      return false;
    }
  }, [currentChatId, loadSavedChats, startNewChat]);

  const unarchiveChat = useCallback(async (chatId) => {
    if (!chatId) return false;

    console.log('[Persistence] Calling backend function unarchiveGlyphBotChat');

    try {
      const response = await base44.functions.invoke('unarchiveGlyphBotChat', {
        chatId
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Unarchive failed');
      }

      await loadSavedChats();
      return true;
    } catch (e) {
      console.error('[Persistence] Unarchive failed:', e);
      return false;
    }
  }, [loadSavedChats]);

  const deleteChat = useCallback(async (chatId) => {
    if (!chatId) return false;

    console.log('[Persistence] Calling backend function deleteGlyphBotChat');

    try {
      const response = await base44.functions.invoke('deleteGlyphBotChat', {
        chatId
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Delete failed');
      }

      // Always start fresh after delete
      startNewChat();
      await loadSavedChats();
      return true;
    } catch (e) {
      console.error('[Persistence] Delete failed:', e);
      return false;
    }
  }, [loadSavedChats, startNewChat]);

  const getArchivedChats = useCallback(async () => {
    if (!currentUser?.email) return [];

    try {
      const response = await base44.functions.invoke('loadGlyphBotChats', {
        includeArchived: true
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Load failed');
      }

      const allChats = response.data.chats || [];
      return allChats.filter(c => c.isArchived === true);
    } catch (e) {
      console.error('[Persistence] Failed to load archived chats:', e);
      return [];
    }
  }, [currentUser?.email]);

  return {
    currentChatId,
    savedChats,
    isLoading,
    fullHistory,
    trackMessage,
    initializeHistory,
    saveChat,
    archiveChat,
    loadChat,
    startNewChat,
    loadSavedChats,
    getArchivedChats,
    unarchiveChat,
    deleteChat,
    STORAGE_KEYS
  };
}

function generateChatTitle(messages) {
  const first = messages.find(m => m.role === 'user');
  if (!first?.content) return `Chat ${new Date().toLocaleDateString()}`;
  return first.content.length > 40 ? first.content.slice(0, 40) + '...' : first.content;
}

export default useGlyphBotPersistence;