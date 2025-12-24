import React from 'react';

export const VoiceCard = ({ title, description, isSelected, icon }: any) => {
  return (
    <div className={w-full p-6 rounded-3xl border-2 transition-all cursor-pointer mb-4 
      ${isSelected 
        ? 'border-purple-500 bg-purple-50 shadow-lg' 
        : 'border-gray-100 bg-white shadow-sm'}`}>
      
      <div className="flex flex-col items-center text-center space-y-4">
        <h3 className={`text-xl font-bold ${isSelected ? 'text-purple-600' : 'text-gray-800'}`}>
          {title}
        </h3>
        
        {isSelected && (
          <div className="bg-purple-500 rounded-full p-2 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        <p className="text-gray-500 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};