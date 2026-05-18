interface SessionStyleToggleProps {
  currentStyle: 'cerita' | 'tanya' | 'ngobrol';
  onSelect: (s: 'cerita' | 'tanya' | 'ngobrol') => void;
}

export const SessionStyleToggle = ({ 
  currentStyle, 
  onSelect 
}: SessionStyleToggleProps) => {
  return (
    <div className="px-6 mb-2">
      <p className="text-[10px] tracking-[0.2em] text-rose/30 uppercase font-medium mb-3">Hari ini mau gimana?</p>
      <div className="flex gap-2 p-1 bg-offwhite/5 rounded-full w-full max-w-[400px]">
        <button
          onClick={() => onSelect('cerita')}
          className={`flex-1 py-2 px-1 rounded-full text-[10px] font-medium transition-all duration-300 ${
            currentStyle === 'cerita' 
              ? 'bg-rose text-[#12100f] shadow-lg shadow-rose/10' 
              : 'text-rose/50 hover:text-rose/80'
          }`}
        >
          Dengerin
        </button>
        <button
          onClick={() => onSelect('ngobrol')}
          className={`flex-1 py-2 px-1 rounded-full text-[10px] font-medium transition-all duration-300 ${
            currentStyle === 'ngobrol' 
              ? 'bg-rose text-[#12100f] shadow-lg shadow-rose/10' 
              : 'text-rose/50 hover:text-rose/80'
          }`}
        >
          Ngobrol
        </button>
        <button
          onClick={() => onSelect('tanya')}
          className={`flex-1 py-2 px-1 rounded-full text-[10px] font-medium transition-all duration-300 ${
            currentStyle === 'tanya' 
              ? 'bg-rose text-[#12100f] shadow-lg shadow-rose/10' 
              : 'text-rose/50 hover:text-rose/80'
          }`}
        >
          Tanya
        </button>
      </div>
    </div>
  );
};
