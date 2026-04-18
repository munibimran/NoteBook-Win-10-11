/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  X, 
  Search, 
  Settings as SettingsIcon, 
  MoreHorizontal, 
  Undo, 
  Redo, 
  ChevronDown,
  Monitor,
  Moon,
  Sun,
  Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Note, Settings, DEFAULT_SETTINGS } from './types';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const INITIAL_NOTE: Note = {
  id: generateId(),
  title: 'Untitled',
  content: '',
  isDirty: false,
  lastModified: Date.now(),
};

export default function App() {
  const [tabs, setTabs] = useState<Note[]>(() => {
    const saved = localStorage.getItem('win11-notepad-tabs');
    return saved ? JSON.parse(saved) : [INITIAL_NOTE];
  });
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    const saved = localStorage.getItem('win11-notepad-active-tab');
    return saved || (tabs.length > 0 ? tabs[0].id : INITIAL_NOTE.id);
  });
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('win11-notepad-settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeNote = useMemo(() => 
    tabs.find(t => t.id === activeTabId) || tabs[0], 
    [tabs, activeTabId]
  );

  // Persistence
  useEffect(() => {
    localStorage.setItem('win11-notepad-tabs', JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem('win11-notepad-active-tab', activeTabId);
  }, [activeTabId]);

  useEffect(() => {
    localStorage.setItem('win11-notepad-settings', JSON.stringify(settings));
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const createTab = () => {
    const newTab = { ...INITIAL_NOTE, id: generateId() };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      setTabs([INITIAL_NOTE]);
      setActiveTabId(INITIAL_NOTE.id);
      return;
    }
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const updateContent = (content: string) => {
    setTabs(tabs.map(t => 
      t.id === activeTabId 
        ? { ...t, content, isDirty: true, lastModified: Date.now() } 
        : t
    ));
  };

  const updateCursorLoc = (e: any) => {
    const text = e.target.value;
    const pos = e.target.selectionStart;
    const lines = text.substr(0, pos).split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      // Mock save - just clear dirty flag
      setTabs(tabs.map(t => t.id === activeTabId ? { ...t, isDirty: false } : t));
    }
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      setShowSearch(prev => !prev);
    }
    if (e.ctrlKey && e.key === 't') {
      e.preventDefault();
      createTab();
    }
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      createTab();
    }
  };

  const exportFile = () => {
    const element = document.createElement("a");
    const file = new Blob([activeNote.content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${activeNote.title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${settings.darkMode ? 'bg-[#0a0a0a] text-white' : 'bg-[#f3f3f3] text-black'}`}>
      
      {/* Title Bar / Tabs Area */}
      <nav className={`flex items-end h-11 px-2 shrink-0 ${settings.darkMode ? 'bg-[#202020]' : 'bg-[#e0e0e0] border-b border-gray-300'}`}>
        <div className="flex items-center gap-0.5 max-w-full overflow-x-auto no-scrollbar pt-1.5">
          {tabs.map((tab) => (
            <motion.div
              layoutId={tab.id}
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`
                group flex items-center gap-2 h-9 px-3 min-w-[120px] max-w-[200px] cursor-pointer rounded-t-lg transition-all text-xs font-medium relative top-[1px]
                ${activeTabId === tab.id 
                  ? (settings.darkMode ? 'bg-[#2b2b2b] text-white' : 'bg-[#ffffff] text-black shadow-sm') 
                  : (settings.darkMode ? 'text-gray-400 hover:bg-[#282828]' : 'text-gray-600 hover:bg-gray-200')}
              `}
            >
              <span className="truncate flex-1">{tab.title}{tab.isDirty ? '*' : ''}</span>
              <button 
                onClick={(e) => closeTab(tab.id, e)}
                className={`p-0.5 rounded-md hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity`}
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
          <button 
            onClick={createTab}
            className={`p-2 rounded-md transition-colors ${settings.darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/10 text-gray-600'}`}
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1 h-full px-2">
           <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-md transition-colors ${settings.darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/10 text-gray-600'}`}
          >
            <SettingsIcon size={16} />
          </button>
        </div>
      </nav>

      {/* Ribbon / Controls */}
      <div className={`flex items-center justify-between px-4 py-2 shrink-0 border-b ${settings.darkMode ? 'border-white/5' : 'border-black/5'}`}>
        <div className="flex items-center gap-4 text-xs">
          <button className="hover:opacity-60 transition-opacity">File</button>
          <button className="hover:opacity-60 transition-opacity">Edit</button>
          <button className="hover:opacity-60 transition-opacity">View</button>
        </div>

        <div className="flex items-center gap-2">
          {showSearch && (
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className={`flex items-center h-8 px-2 rounded-md ${settings.darkMode ? 'bg-white/5 ring-1 ring-white/10' : 'bg-black/5 ring-1 ring-black/10'}`}
             >
                <Search size={14} className="text-gray-500 mr-2" />
                <input 
                  autoFocus
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find"
                  className="bg-transparent border-none outline-none text-xs w-32"
                />
                <button onClick={() => setShowSearch(false)} className="hover:text-red-500 ml-2">
                  <X size={12} />
                </button>
             </motion.div>
          )}
          {!showSearch && (
            <button 
              onClick={() => setShowSearch(true)}
              className={`p-1.5 rounded-md ${settings.darkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
            >
              <Search size={14} />
            </button>
          )}
          <button 
            onClick={exportFile}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors`}
          >
            Save
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        <textarea
          ref={textareaRef}
          value={activeNote.content}
          onChange={(e) => {
            updateContent(e.target.value);
            updateCursorLoc(e);
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={updateCursorLoc}
          onMouseUp={updateCursorLoc}
          spellCheck={false}
          className={`
            flex-1 w-full bg-transparent resize-none p-4 outline-none leading-relaxed
            ${settings.fontFamily === 'font-mono' ? 'font-mono' : 'font-sans'}
            ${settings.wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'}
          `}
          style={{ fontSize: `${settings.fontSize}px` }}
          placeholder="Start typing..."
        />

        {/* Floating Settings Side Panel */}
        <AnimatePresence>
          {showSettings && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettings(false)}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`absolute top-0 right-0 h-full w-80 z-20 p-6 flex flex-col gap-6 ${settings.darkMode ? 'bg-[#202020] text-white shadow-2xl' : 'bg-white text-black shadow-xl ring-1 ring-black/5'}`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Settings</h2>
                  <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Appearance</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSettings({ ...settings, darkMode: false })}
                        className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${!settings.darkMode ? 'border-blue-500 bg-blue-500/10' : 'border-transparent bg-black/5 hover:bg-black/10'}`}
                      >
                        <Sun size={18} />
                        <span className="text-xs">Light</span>
                      </button>
                      <button 
                        onClick={() => setSettings({ ...settings, darkMode: true })}
                        className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${settings.darkMode ? 'border-blue-500 bg-blue-500/10' : 'border-transparent bg-white/5 hover:bg-white/10'}`}
                      >
                        <Moon size={18} />
                        <span className="text-xs">Dark</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Editor</label>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Type size={16} />
                        <span className="text-sm">Font Size</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setSettings({...settings, fontSize: settings.fontSize - 1})}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/5 hover:bg-black/10"
                        >-</button>
                        <span className="text-sm font-medium w-6 text-center">{settings.fontSize}</span>
                        <button 
                          onClick={() => setSettings({...settings, fontSize: settings.fontSize + 1})}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/5 hover:bg-black/10"
                        >+</button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MoreHorizontal size={16} />
                        <span className="text-sm">Word Wrap</span>
                      </div>
                      <button 
                        onClick={() => setSettings({ ...settings, wordWrap: !settings.wordWrap })}
                        className={`w-12 h-6 rounded-full relative transition-colors ${settings.wordWrap ? 'bg-blue-600' : 'bg-gray-400'}`}
                      >
                        <motion.div 
                          animate={{ x: settings.wordWrap ? 24 : 4 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full"
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-white/10 text-center">
                  <p className="text-[10px] text-gray-500">Notepad Clone v1.0.0</p>
                  <p className="text-[10px] text-gray-500 italic">Built for Windows 10 & 11</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Status Bar */}
      <footer className={`flex items-center justify-between px-3 h-8 text-[11px] shrink-0 border-t ${settings.darkMode ? 'bg-[#191919] border-white/5 text-gray-400' : 'bg-[#f3f3f3] border-gray-300 text-gray-600'}`}>
        <div className="flex items-center gap-6">
          <span>{activeNote.content.length} characters</span>
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
        </div>
        
        <div className="flex items-center gap-6">
          <span>100%</span>
          <span>Windows (CRLF)</span>
          <span>UTF-8</span>
        </div>
      </footer>
    </div>
  );
}
