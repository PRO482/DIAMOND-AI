
import React from 'react';
import { Camera, Image as ImageIcon, Mic, X } from 'lucide-react';
import RainbowText from './RainbowText';

interface PermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  // Added 'microphone' to the allowed types to fix the type mismatch in App.tsx
  type: 'camera' | 'gallery' | 'microphone';
}

const PermissionDialog: React.FC<PermissionDialogProps> = ({ isOpen, onClose, onConfirm, type }) => {
  if (!isOpen) return null;

  // Helper to get the correct icon based on permission type
  const getIcon = () => {
    switch (type) {
      case 'camera': return <Camera className="text-purple-600 w-10 h-10" />;
      case 'gallery': return <ImageIcon className="text-purple-600 w-10 h-10" />;
      case 'microphone': return <Mic className="text-purple-600 w-10 h-10" />;
      default: return <ImageIcon className="text-purple-600 w-10 h-10" />;
    }
  };

  // Helper to get the correct label based on permission type
  const getLabel = () => {
    switch (type) {
      case 'camera': return 'camera';
      case 'gallery': return 'photo gallery';
      case 'microphone': return 'microphone';
      default: return 'resources';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div className="p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6">
            {getIcon()}
          </div>
          <h3 className="text-2xl font-bold mb-2">
            <RainbowText>Permission Needed</RainbowText>
          </h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            DIAMOND AI requests your permission to access the {getLabel()} to better serve you, master.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-colors shadow-lg"
            >
              Allow Access
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
            >
              Deny
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionDialog;
