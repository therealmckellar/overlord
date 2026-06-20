'use client';

import React, { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { PERSONAS, PersonaSlug } from '@/lib/personas';
import { ChevronDown, UserCircle } from 'lucide-react';

export const PersonaSelector = () => {
  const { activePersona, setActivePersona } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentPersona = PERSONAS[activePersona as PersonaSlug] || PERSONAS.david;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 transition-all duration-200 group"
      >
        <div 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: currentPersona.color }}
        />
        <span className="text-xs font-medium text-zinc-300 group-hover:text-white">
          {currentPersona.name}
        </span>
        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {Object.values(PERSONAS).map((persona) => (
              <button
                key={persona.slug}
                onClick={() => {
                  setActivePersona(persona.slug);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left text-xs transition-colors ${
                  activePersona === persona.slug 
                    ? 'bg-zinc-800 text-white' 
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <div 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: persona.color }}
                />
                <span className="flex-1 font-medium">{persona.name}</span>
                {activePersona === persona.slug && (
                  <div className="w-1 h-1 rounded-full bg-white" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
