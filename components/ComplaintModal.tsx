
import React, { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ComplaintModal: React.FC<ComplaintModalProps> = ({ isOpen, onClose }) => {
  const [complaint, setComplaint] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneNumber = "9082270409";
    const message = encodeURIComponent(`Feedback/Complaint from Diamond AI User: ${complaint}`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors md:hidden">
               <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h2 className="text-xl font-bold rainbow-text">FEEDBACK/COMPLAINT</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2 font-bold">
            Describe your feedback or issue master:
          </label>
          <textarea
            required
            className="w-full h-32 p-3 border-2 border-gray-100 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none resize-none transition-all text-gray-800"
            placeholder="Type your feedback or complaint here..."
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
          />
          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <button
              type="submit"
              className="flex-[2] py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-95 shadow-md"
            >
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplaintModal;
