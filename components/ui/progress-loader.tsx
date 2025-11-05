'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface LoaderStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  description?: string;
}

export interface ProgressLoaderProps {
  isVisible: boolean;
  title: string;
  steps: LoaderStep[];
  currentStep?: string;
  overallProgress?: number;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

export const ProgressLoader: React.FC<ProgressLoaderProps> = ({
  isVisible,
  title,
  steps,
  currentStep,
  overallProgress,
  onClose,
  showCloseButton = true,
  className = ''
}) => {
  if (!isVisible) return null;

  const getStepIcon = (step: LoaderStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepTextColor = (step: LoaderStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-700';
      case 'loading':
        return 'text-blue-700';
      case 'error':
        return 'text-red-700';
      case 'pending':
      default:
        return 'text-gray-500';
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const calculatedProgress = overallProgress !== undefined ? overallProgress : (completedSteps / totalSteps) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className={`w-full max-w-md mx-4 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            {showCloseButton && onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso</span>
              <span>{Math.round(calculatedProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${calculatedProgress}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  step.status === 'loading' 
                    ? 'bg-blue-50 border border-blue-200' 
                    : step.status === 'completed'
                    ? 'bg-green-50 border border-green-200'
                    : step.status === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex-shrink-0">
                  {getStepIcon(step)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${getStepTextColor(step)}`}>
                    {step.label}
                  </div>
                  {step.description && (
                    <div className="text-sm text-gray-500 mt-1">
                      {step.description}
                    </div>
                  )}
                </div>
                {step.status === 'loading' && (
                  <div className="flex-shrink-0">
                    <div className="animate-pulse">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Current Step Indicator */}
          {currentStep && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm text-blue-700">
                  {steps.find(step => step.id === currentStep)?.label || 'Procesando...'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Hook para manejar el estado del loader
export const useProgressLoader = () => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [steps, setSteps] = React.useState<LoaderStep[]>([]);
  const [currentStep, setCurrentStep] = React.useState<string | undefined>();
  const [overallProgress, setOverallProgress] = React.useState<number | undefined>();

  const startLoader = (title: string, initialSteps: LoaderStep[]) => {
    setSteps(initialSteps);
    setCurrentStep(undefined);
    setOverallProgress(undefined);
    setIsVisible(true);
  };

  const updateStep = (stepId: string, updates: Partial<LoaderStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const setStepStatus = (stepId: string, status: LoaderStep['status'], description?: string) => {
    updateStep(stepId, { status, description });
    if (status === 'loading') {
      setCurrentStep(stepId);
    } else if (status === 'completed' || status === 'error') {
      setCurrentStep(undefined);
    }
  };

  const setProgress = (progress: number) => {
    setOverallProgress(progress);
  };

  const closeLoader = () => {
    setIsVisible(false);
    setCurrentStep(undefined);
    setOverallProgress(undefined);
  };

  return {
    isVisible,
    steps,
    currentStep,
    overallProgress,
    startLoader,
    updateStep,
    setStepStatus,
    setProgress,
    closeLoader
  };
};

// Componente específico para liquidaciones
export const LiquidationLoader: React.FC<{
  isVisible: boolean;
  onClose?: () => void;
  currentStep?: string;
  progress?: number;
}> = ({ isVisible, onClose, currentStep, progress }) => {
  const liquidationSteps: LoaderStep[] = [
    {
      id: 'debug',
      label: 'Verificando datos de la tabla',
      status: 'pending',
      description: 'Analizando estructura de datos...'
    },
    {
      id: 'mensajeros',
      label: 'Obteniendo mensajeros únicos',
      status: 'pending',
      description: 'Buscando mensajeros en la base de datos...'
    },
    {
      id: 'pedidos',
      label: 'Cargando pedidos del día',
      status: 'pending',
      description: 'Recopilando pedidos por mensajero...'
    },
    {
      id: 'calculations',
      label: 'Calculando liquidaciones',
      status: 'pending',
      description: 'Procesando totales y montos...'
    },
    {
      id: 'finalization',
      label: 'Finalizando proceso',
      status: 'pending',
      description: 'Preparando datos para mostrar...'
    }
  ];

  return (
    <ProgressLoader
      isVisible={isVisible}
      title="Procesando Liquidaciones"
      steps={liquidationSteps}
      currentStep={currentStep}
      overallProgress={progress}
      onClose={onClose}
      className="max-w-lg"
    />
  );
};
