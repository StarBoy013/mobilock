'use client';

import { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';

export default function ManualEntry({ 
  onSubmit, 
  onClose 
}: { 
  onSubmit: (id: string) => void;
  onClose: () => void;
}) {
  const [id, setId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (id.trim()) {
      onSubmit(id.trim());
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-bg-base/95 backdrop-blur flex flex-col animate-fade-in">
      <div className="h-12 flex items-center justify-between px-4 border-b border-border-subtle">
        <h3 className="text-sm font-semibold text-text-primary">Manual Entry</h3>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto">
          <label className="block text-center text-text-secondary text-sm mb-4">
            Enter Student University ID
          </label>
          <input
            type="text"
            autoFocus
            value={id}
            onChange={(e) => setId(e.target.value.toUpperCase())}
            placeholder="e.g. U-2024-0042"
            className="w-full h-16 bg-bg-surface border-2 border-border-subtle rounded-xl text-center text-xl font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors mb-6 uppercase"
          />
          <button
            type="submit"
            disabled={!id.trim()}
            className="w-full h-14 bg-primary text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:shadow-none"
          >
            Verify Pass <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
