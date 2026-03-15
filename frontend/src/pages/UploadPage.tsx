import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  CloudUpload,
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { getDocuments, uploadDocument, deleteDocument } from '../lib/api';
import type { RegulationType, Document } from '../types';

const TYPES: RegulationType[] = ['Law', 'Decree', 'Circular', 'Announcement'];

const statusConfig: Record<string, { icon: React.FC<any>; label: string; color: string }> = {
  pending: { icon: Clock, label: 'Pending', color: 'text-yellow-500' },
  processing: { icon: Loader, label: 'Processing', color: 'text-blue-500' },
  completed: { icon: CheckCircle, label: 'Completed', color: 'text-green-500' },
  failed: { icon: XCircle, label: 'Failed', color: 'text-red-500' },
};

const UploadPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: '',
    source_url: '',
    regulation_type: '' as RegulationType | '',
    published_date: '',
    tags: '',
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: getDocuments,
  });

  const uploadMutation = useMutation({
    mutationFn: (data: FormData) => uploadDocument(data),
    onSuccess: () => {
      toast.success(isArabic ? 'تم رفع المستند بنجاح' : 'Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedFile(null);
      setForm({ title: '', source_url: '', regulation_type: '', published_date: '', tags: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || t('error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDocument(id),
    onSuccess: () => {
      toast.success(isArabic ? 'تم حذف المستند' : 'Document deleted');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: () => toast.error(t('error')),
  });

  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      if (!form.title) {
        setForm((prev) => ({ ...prev, title: acceptedFiles[0].name.replace(/\.[^.]+$/, '') }));
      }
    }
  }, [form.title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    multiple: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error(isArabic ? 'الرجاء اختيار ملف' : 'Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (form.title) formData.append('title', form.title);
    if (form.source_url) formData.append('source_url', form.source_url);
    if (form.regulation_type) formData.append('regulation_type', form.regulation_type);
    if (form.published_date) formData.append('published_date', form.published_date);
    if (form.tags) formData.append('tags', form.tags);

    uploadMutation.mutate(formData);
  };

  const StatusIcon = ({ status }: { status: string }) => {
    const cfg = statusConfig[status] || statusConfig.pending;
    const Icon = cfg.icon;
    return <Icon size={16} className={clsx(cfg.color, status === 'processing' && 'animate-spin')} />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-primary">{t('uploadDocuments')}</h1>

      {/* Upload form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={clsx(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
              isDragActive
                ? 'border-accent bg-accent/5'
                : selectedFile
                ? 'border-green-400 bg-green-50'
                : 'border-gray-200 hover:border-accent hover:bg-gray-50'
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              {selectedFile ? (
                <>
                  <CheckCircle size={40} className="text-green-500" />
                  <div>
                    <p className="font-medium text-gray-800">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    {isArabic ? 'إزالة' : 'Remove'}
                  </button>
                </>
              ) : (
                <>
                  <CloudUpload size={40} className="text-gray-300" />
                  <div>
                    <p className="font-medium text-gray-600">
                      {isDragActive ? (isArabic ? 'أفلت الملف هنا' : 'Drop file here') : t('dragAndDrop')}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">{t('supportedFormats')}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('documentTitle')}</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder={isArabic ? 'عنوان المستند' : 'Document title'}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('sourceUrl')}</label>
              <input
                type="url"
                value={form.source_url}
                onChange={(e) => setForm((p) => ({ ...p, source_url: e.target.value }))}
                placeholder="https://fra.gov.eg/..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('regulationTypeLabel')}</label>
              <select
                value={form.regulation_type}
                onChange={(e) => setForm((p) => ({ ...p, regulation_type: e.target.value as RegulationType }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">{t('allTypes')}</option>
                {TYPES.map((type) => (
                  <option key={type} value={type}>{t(type.toLowerCase())}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('publishedDate')}</label>
              <input
                type="date"
                value={form.published_date}
                onChange={(e) => setForm((p) => ({ ...p, published_date: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('tagsLabel')}</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                placeholder={isArabic ? 'ترخيص، رأس المال، متطلبات' : 'license, capital, requirements'}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedFile || uploadMutation.isPending}
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary hover:bg-primary-light text-white rounded-xl font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploadMutation.isPending ? (
              <><Loader size={18} className="animate-spin" /> {t('loading')}</>
            ) : (
              <><Upload size={18} /> {t('uploadButton')}</>
            )}
          </button>
        </form>
      </div>

      {/* Uploaded documents list */}
      <div>
        <h2 className="text-lg font-bold text-primary mb-4">{t('uploadedDocuments')}</h2>

        {isLoading ? (
          <div className="text-center py-8 text-gray-400">
            <Loader size={24} className="animate-spin mx-auto" />
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc: Document) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-primary text-sm truncate">{doc.title || doc.filename}</p>
                    <p className="text-xs text-gray-400">{doc.filename}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <StatusIcon status={doc.status} />
                    <span className="text-xs text-gray-500 capitalize">{t(doc.status)}</span>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(doc.id)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Upload size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {isArabic ? 'لا توجد مستندات مرفوعة' : 'No documents uploaded yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
