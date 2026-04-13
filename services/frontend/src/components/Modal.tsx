import { FC, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm pt-20">
      
      {/* Overlay click area stays full screen */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* Modal box */}
      <div className="relative bg-[#1a1a1a] border-2 border-[#00d2ff] rounded-xl p-8 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto shadow-[0_0_20px_rgba(0,210,255,0.3)] animate-modalIn">

        {/* Content */}
        <div className="text-gray-300 font-sans leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-transparent border-2 border-[#ff4ec8] text-[#ff4ec8] rounded-full font-bold hover:bg-[#ff4ec8] hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(255,78,200,0.2)]"
          >
            Close
          </button>
        </div>

        {/* Animation */}
        <style jsx>{`
          @keyframes modalIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          .animate-modalIn {
            animation: modalIn 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Modal;
