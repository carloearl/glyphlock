import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function WordOfTheDay() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex justify-center px-4 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300"
        style={{
          background: isOpen 
            ? 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(99,102,241,0.25))'
            : 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))',
          border: '2px solid rgba(59,130,246,0.4)',
          color: '#60A5FA',
          boxShadow: isOpen 
            ? '0 0 30px rgba(59,130,246,0.5), inset 0 0 20px rgba(59,130,246,0.1)'
            : '0 0 20px rgba(59,130,246,0.3)',
        }}
      >
        <span className="text-lg">✨</span>
        <span>Word of the Day</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 transition-transform" />
        ) : (
          <ChevronDown className="w-4 h-4 transition-transform" />
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm" 
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setIsOpen(false)}>
          <div 
            className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(30,40,90,0.95), rgba(20,30,80,0.95))',
              border: '2px solid rgba(59,130,246,0.3)',
              boxShadow: '0 0 40px rgba(59,130,246,0.4), inset 0 0 30px rgba(59,130,246,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <iframe 
              src="https://claude.site/public/artifacts/039c6690-430b-4293-9ce7-53f1cb2ec8ee/embed"
              title="word-of-the-day"
              width="100%"
              height="500"
              frameBorder="0"
              allow="clipboard-write"
              allowFullScreen
              className="block"
            />
          </div>
        </div>
      )}
    </div>
  );
}