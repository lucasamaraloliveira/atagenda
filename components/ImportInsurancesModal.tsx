'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileDown, Info, AlertCircle, CheckCircle2, FileText, Download } from 'lucide-react';
import { Insurance } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';

interface ImportInsurancesModalProps {
  onClose: () => void;
  onImport: (insurances: Insurance[]) => void;
  existingInsurances: Insurance[];
}

export default function ImportInsurancesModal({ onClose, onImport, existingInsurances }: ImportInsurancesModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templateColumns = [
    { key: 'name', label: 'Nome do Convênio', required: true, example: 'Bradesco Saúde' },
    { key: 'status', label: 'Status', required: true, example: 'Ativo' },
  ];

  const downloadTemplate = () => {
    const header = templateColumns.map(c => c.label).join(';');
    const exampleRow = templateColumns.map(c => c.example).join(';');
    const csvContent = "\uFEFF" + header + "\n" + exampleRow;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_importacao_convenios.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setErrors([]);
      } else {
        toast.error('Por favor, selecione um arquivo CSV.');
      }
    }
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      
      if (lines.length < 2) {
        setErrors(['O arquivo está vazio ou contém apenas o cabeçalho.']);
        setIsProcessing(false);
        return;
      }

      const importedInsurances: Insurance[] = [];
      const newErrors: string[] = [];
      const processedNames = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';').map(v => v.trim());
        const ins: any = { id: Math.random().toString(36).substr(2, 9), patients: 0 };
        let rowErrors = false;
        
        templateColumns.forEach((col, index) => {
          const val = values[index];
          if (col.required && !val) {
            newErrors.push(`Linha ${i + 1}: Campo "${col.label}" é obrigatório.`);
            rowErrors = true;
          }
          
          if (col.key === 'status' && val) {
            const status = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
            if (status !== 'Ativo' && status !== 'Inativo') {
              newErrors.push(`Linha ${i + 1}: Status "${val}" é inválido. Use "Ativo" ou "Inativo".`);
              rowErrors = true;
            }
            ins.status = status;
          } else {
            ins[col.key] = val || '';
          }
        });

        if (rowErrors) continue;

        // Duplicate Check (Name)
        const nameKey = ins.name.toLowerCase();
        
        // 1. Check within file
        if (processedNames.has(nameKey)) {
          newErrors.push(`Linha ${i + 1}: Convênio duplicado no arquivo ("${ins.name}").`);
          continue;
        }

        // 2. Check against existing insurances
        const isExisting = existingInsurances.some(v => 
          v.name.toLowerCase() === nameKey
        );

        if (isExisting) {
          newErrors.push(`Linha ${i + 1}: Convênio já cadastrado no sistema ("${ins.name}").`);
          continue;
        }

        processedNames.add(nameKey);
        importedInsurances.push(ins as Insurance);
      }

      if (newErrors.length > 0) {
        setErrors(newErrors.slice(0, 10)); // Show first 10 errors
        if (newErrors.length > 10) {
          setErrors(prev => [...prev, `... e mais ${newErrors.length - 10} erros.`]);
        }
        setIsProcessing(false);
      } else {
        onImport(importedInsurances);
        toast.success(`${importedInsurances.length} convênios importados com sucesso!`);
        setIsProcessing(false);
        onClose();
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-white animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Importar Convênios</h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Módulo de Importação Massiva</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[70vh] no-scrollbar">
          {/* Instructions Box */}
          <div className="mb-8 p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <FileText size={80} className="text-indigo-600" />
            </div>
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="mt-1">
                <Info size={20} className="text-indigo-600" />
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Instruções do Arquivo</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    Para garantir que a importação ocorra sem erros, utilize o nosso modelo padrão. O arquivo deve ser um <strong>CSV separado por ponto e vírgula (;)</strong>.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {templateColumns.map(col => (
                    <div key={col.key} className="flex items-center gap-2 text-[10px]">
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", col.required ? "bg-red-400" : "bg-slate-300")} />
                      <span className="font-bold text-slate-500 uppercase tracking-tighter">{col.label}</span>
                      {col.required && <span className="text-red-500 text-[8px] font-black">*</span>}
                    </div>
                  ))}
                </div>

                <button 
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-[0.98]"
                >
                  <Download size={14} />
                  Baixar Planilha Modelo (.CSV)
                </button>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div 
            className={cn(
              "border-2 border-dashed rounded-[2.5rem] p-10 transition-all flex flex-col items-center justify-center text-center group cursor-pointer",
              isDragging ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-indigo-400 bg-slate-50/50",
              file && "border-emerald-400 bg-emerald-50/30"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const droppedFile = e.dataTransfer.files[0];
              if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
                setFile(droppedFile);
                setErrors([]);
              } else {
                toast.error('Por favor, selecione um arquivo CSV.');
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv"
              onChange={handleFileChange}
            />

            {!file ? (
              <>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 mb-4 group-hover:scale-110 transition-transform">
                  <Upload size={32} />
                </div>
                <h4 className="font-bold text-slate-900 leading-tight">Arraste seu arquivo aqui</h4>
                <p className="text-xs text-slate-500 mt-2">Ou clique para selecionar de sua pasta</p>
                <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-bold">Suporta apenas arquivos .CSV</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-500 mb-4 animate-in zoom-in">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="font-bold text-slate-900 leading-tight">Arquivo Selecionado</h4>
                <p className="text-xs text-emerald-600 font-bold mt-2 uppercase tracking-tight">{file.name}</p>
                <p className="text-[10px] text-slate-400 mt-4 underline hover:text-indigo-600">Clique para trocar o arquivo</p>
              </>
            )}
          </div>

          {/* Error List */}
          {errors.length > 0 && (
            <div className="mt-8 p-6 bg-red-50 rounded-[2rem] border border-red-100 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-2 text-red-600 mb-4">
                <AlertCircle size={18} />
                <h4 className="font-bold text-sm uppercase tracking-wider">Erros Identificados na Validação</h4>
              </div>
              <ul className="space-y-2">
                {errors.map((error, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    {error}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-red-400 mt-4 italic font-medium">Ajuste os campos indicados acima na sua planilha e tente novamente.</p>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-white rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button 
            disabled={!file || isProcessing}
            onClick={processFile}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando...
              </>
            ) : (
              'Iniciar Importação'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
