import React from 'react';
import { Check } from 'lucide-react';

const StepWizard = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = index <= currentStep;

          return (
            <div key={index} className="flex flex-col items-center flex-1">
              {/* Step Circle */}
              <button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm mb-2 transition-all ${
                  isCompleted
                    ? 'bg-brand text-white'
                    : isCurrent
                    ? 'bg-brand text-white ring-2 ring-brand ring-offset-2 ring-offset-bg'
                    : 'bg-surface-overlay text-gray-400 cursor-not-allowed'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
              </button>

              {/* Step Label */}
              <p
                className={`text-xs font-medium text-center max-w-[60px] ${
                  isCurrent ? 'text-brand' : isCompleted ? 'text-brand/80' : 'text-gray-500'
                }`}
              >
                {step}
              </p>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute h-1 ${
                    isCompleted ? 'bg-brand' : 'bg-surface-overlay'
                  }`}
                  style={{
                    width: 'calc(100% / ' + steps.length + ' - 20px)',
                    left: 'calc(50% + 25px)',
                    top: '20px',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepWizard;
