'use client';

import { useEffect, useState, useRef } from 'react';
import { UploadCloud, Brain, CheckCircle2, AlertCircle, FileText, BarChart2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { getModelInfo, setActiveModel, trainModel } from '@/lib/api';
import type { ModelInfo, TrainMetrics } from '@/types';

export default function TrainingPage() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [trainMetrics, setTrainMetrics] = useState<TrainMetrics | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const fetchModelInfo = async () => {
    try {
      const info = await getModelInfo();
      setModelInfo(info);
    } catch (error) {
      console.error('Failed to load model info:', error);
      addToast('Failed to load model details', 'error');    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelInfo();
  }, []);

  const handleToggleActiveModel = async () => {
    if (!modelInfo?.has_custom_model) return;
    
    try {
      const newStatus = !modelInfo.is_custom_active;
      await setActiveModel(newStatus);
      setModelInfo({ ...modelInfo, is_custom_active: newStatus });
      addToast({
        title: `Switched to ${newStatus ? 'Custom' : 'Default'} Model`,
        type: 'success'
      });
    } catch (error) {
      addToast('Failed to switch model', 'error');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    const isCsvOrJson = file.name.endsWith('.csv') || file.name.endsWith('.json');
    if (!isCsvOrJson) {
      addToast({ title: 'Invalid file type', message: 'Please upload a CSV or JSON file.', type: 'error' });
      return;
    }

    setIsTraining(true);
    setTrainMetrics(null);
    
    try {
      const metrics = await trainModel(file);
      setTrainMetrics(metrics);
      addToast({ title: 'Model trained successfully', type: 'success' });
      await fetchModelInfo(); // Refresh model info
    } catch (error: any) {
      console.error('Training error:', error);
      addToast({ title: 'Training failed', message: error.message || 'An error occurred during training', type: 'error' });
    } finally {
      setIsTraining(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">AI Model Training</h2>
          <p className="text-slate-400 mt-1">Train custom classification models on your own ticket data.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">AI Model Training</h2>
        <p className="text-slate-400 mt-1">Train custom classification models on your own ticket data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Model Status */}
        <Card className="bg-admin-surface border-white/[0.06] p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Brain className="text-svk-accent" /> Current Model
            </h3>
            {modelInfo?.has_custom_model && (
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={modelInfo?.is_custom_active || false}
                    onChange={handleToggleActiveModel}
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${modelInfo?.is_custom_active ? 'bg-svk-accent' : 'bg-slate-700'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${modelInfo?.is_custom_active ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <div className="ml-3 text-sm font-medium text-slate-300">
                  {modelInfo?.is_custom_active ? 'Using Custom Model' : 'Using Default Model'}
                </div>
              </label>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Active Model</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold text-white">{modelInfo?.label || 'Default AI Model'}</span>
                {modelInfo?.is_custom_active && <Badge variant="success">Active</Badge>}
              </div>
            </div>

            {modelInfo?.accuracy && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Model Accuracy</p>
                <div className="flex items-center gap-3">
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden max-w-[200px]">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${modelInfo.accuracy * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-emerald-400">
                    {Math.round(modelInfo.accuracy * 100)}%
                  </span>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-slate-400 mb-2">Supported Categories ({modelInfo?.categories?.length || 0})</p>
              <div className="flex flex-wrap gap-2">
                {modelInfo?.categories?.map(cat => (
                  <Badge key={cat} variant="outline" className="text-slate-300 border-white/10 bg-black/20">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Training Interface */}
        <Card className="bg-admin-surface border-white/[0.06] p-6">
          <h3 className="text-lg font-medium text-white mb-6">Train New Model</h3>
          
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive 
                ? 'border-svk-accent bg-svk-accent/5' 
                : 'border-white/10 hover:border-white/20 bg-black/20'
            } ${isTraining ? 'opacity-50 pointer-events-none' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isTraining ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-svk-accent animate-spin" />
                <div>
                  <p className="text-white font-medium">Training model...</p>
                  <p className="text-slate-400 text-sm mt-1">This might take a few minutes</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                  <UploadCloud size={32} />
                </div>
                <div>
                  <p className="text-white font-medium">Drag & drop your training data</p>
                  <p className="text-slate-400 text-sm mt-1">CSV or JSON containing tickets and categories</p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv,.json"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </Button>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>
              Your dataset must contain "issue_description" and "category" columns. 
              Aim for at least 50 examples per category for best results.
            </p>
          </div>
        </Card>
      </div>

      {/* Training Results */}
      {trainMetrics && (
        <Card className="bg-admin-surface border-emerald-500/30 p-6 shadow-[0_0_15px_rgba(16,185,129,0.1)] animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Training Complete</h3>
              <p className="text-sm text-slate-400">New model is ready to use</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-black/20 p-4 rounded-lg border border-white/5">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <BarChart2 size={16} /> <span className="text-sm">Accuracy</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {Math.round((trainMetrics.test_accuracy || 0) * 100)}%
              </p>
            </div>
            <div className="bg-black/20 p-4 rounded-lg border border-white/5">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <FileText size={16} /> <span className="text-sm">Samples Processed</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {trainMetrics.n_samples?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-black/20 p-4 rounded-lg border border-white/5">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Brain size={16} /> <span className="text-sm">Categories Identified</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {trainMetrics.categories?.length || 0}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              variant="primary" 
              onClick={() => {
                if (!modelInfo?.is_custom_active) {
                  handleToggleActiveModel();
                }
              }}
              disabled={modelInfo?.is_custom_active}
            >
              {modelInfo?.is_custom_active ? 'Model is Active' : 'Activate New Model'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
