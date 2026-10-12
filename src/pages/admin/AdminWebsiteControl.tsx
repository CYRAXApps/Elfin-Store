import React, { useState, useEffect } from 'react';
import { useSiteSettings, SiteSettings, defaultSiteSettings, mergeWithDefaults } from '../../context/SiteSettingsContext';
import { HomepageCmsEditor } from '../../components/admin/HomepageCmsEditor';
import { NavigationCmsEditor } from '../../components/admin/NavigationCmsEditor';
import { FooterCmsEditor } from '../../components/admin/FooterCmsEditor';
import { WebsiteContentCmsEditor } from '../../components/admin/WebsiteContentCmsEditor';
import { AppearanceCmsEditor } from '../../components/admin/AppearanceCmsEditor';
import { SeoCmsEditor } from '../../components/admin/SeoCmsEditor';
import { SocialMediaCmsEditor } from '../../components/admin/SocialMediaCmsEditor';
import { AdvancedCmsEditor } from '../../components/admin/AdvancedCmsEditor';
import { HardcodedDetailsAuditor } from '../../components/admin/HardcodedDetailsAuditor';
import { useAuth } from '../../context/AuthContext';
import {
  Globe, Palette, Layout, Navigation, FileText,
  Sliders, Eye, Save, Send, RotateCcw, AlertTriangle, CheckCircle2,
  ExternalLink, Clock, Home, ChevronDown, ChevronUp, X, UploadCloud, Loader2, Code
} from 'lucide-react';

export interface AdminWebsiteControlProps {
  initialSubTab?: string;
}

export function AdminWebsiteControl({ initialSubTab }: AdminWebsiteControlProps = {}) {
  const { user } = useAuth();
  const {
    settings: activePublishedSettings,
    liveSettings,
    draftSettings,
    hasUnpublishedDraft,
    loading: settingsLoading,
    saveDraft,
    publishSettings,
    revertDraft,
    resetCmsToDefaults
  } = useSiteSettings();

  const resolveTabKey = (tab?: string) => {
    if (!tab) return 'homepage';
    if (tab === 'content' || tab === 'websiteContent' || tab === 'pages' || tab === 'customPages' || tab === 'legalPages' || tab === 'policies' || tab === 'faqs') {
      return 'content';
    }
    if (tab === 'appearance' || tab === 'theme' || tab === 'branding') {
      return 'appearance';
    }
    if (tab === 'navigation' || tab === 'header') {
      return 'navigation';
    }
    if (tab === 'footer') {
      return 'footer';
    }
    if (tab === 'seo' || tab === 'social') {
      return 'seo';
    }
    if (tab === 'advanced') {
      return 'advanced';
    }
    if (tab === 'hardcoded_auditor' || tab === 'auditor' || tab === 'codebase' || tab === 'replace' || tab === 'hardcoded') {
      return 'hardcoded_auditor';
    }
    return 'homepage';
  };

  const [activeSubTab, setActiveSubTab] = useState<string>(() => resolveTabKey(initialSubTab));
  const [showAdvancedSection, setShowAdvancedSection] = useState(false);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(resolveTabKey(initialSubTab));
    }
  }, [initialSubTab]);

  // Form state initialized with active draft or published settings
  const [formState, _setFormState] = useState<SiteSettings>(() => {
    const raw = draftSettings || liveSettings || activePublishedSettings;
    return mergeWithDefaults(raw);
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const setFormState = (valOrFn: React.SetStateAction<SiteSettings>) => {
    _setFormState(valOrFn);
    setIsDirty(true);
  };

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [resettingCms, setResettingCms] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  // Sync state when published or draft settings load or update
  useEffect(() => {
    if (!settingsLoading) {
      const source = draftSettings || liveSettings || activePublishedSettings;
      if (source && (!isDirty || !isInitialized)) {
        _setFormState(mergeWithDefaults(source));
        setIsInitialized(true);
      }
    }
  }, [settingsLoading, draftSettings, liveSettings, activePublishedSettings, isDirty, isInitialized]);

  const handleResetUnsaved = () => {
    const source = draftSettings || liveSettings || activePublishedSettings;
    _setFormState(mergeWithDefaults(source));
    setIsDirty(false);
    setSuccessMsg('Unsaved changes discarded. Form reset to last saved state.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to discard them?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const validateForm = (): string | null => {
    if (!formState.general.storeName || !formState.general.storeName.trim()) {
      return 'Store Name cannot be empty.';
    }
    return null;
  };

  const handleSaveDraft = async () => {
    const valErr = validateForm();
    if (valErr) {
      setErrorMsg(valErr);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!user || user.role !== 'admin') {
      setErrorMsg('Access Denied: Only administrators have permission to save website configuration.');
      return;
    }
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await saveDraft(formState, user?.email || 'admin');
      _setFormState(mergeWithDefaults(formState));
      setIsDirty(false);
      setSuccessMsg('Draft settings saved! You can preview or publish when ready.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const valErr = validateForm();
    if (valErr) {
      setErrorMsg(valErr);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!user || user.role !== 'admin') {
      setErrorMsg('Access Denied: Only administrators have permission to publish website configuration.');
      return;
    }
    setPublishing(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await publishSettings(formState, user?.email || 'admin');
      _setFormState(mergeWithDefaults(formState));
      setIsDirty(false);
      setSuccessMsg('All site settings published live to storefront!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish settings');
    } finally {
      setPublishing(false);
    }
  };

  const handleResetCmsToDefaults = async () => {
    if (!user || user.role !== 'admin') {
      setErrorMsg('Access Denied: Only administrators have permission to reset website configuration.');
      return;
    }
    setResettingCms(true);
    setErrorMsg('');
    try {
      await resetCmsToDefaults(user?.email || 'admin');
      _setFormState(mergeWithDefaults(defaultSiteSettings));
      setIsDirty(false);
      setSuccessMsg('Website Control Center configuration successfully reset to default state!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset CMS configuration');
    } finally {
      setResettingCms(false);
    }
  };

  const mainSections = [
    {
      id: 'homepage',
      label: 'Homepage',
      icon: Home
    },
    {
      id: 'navigation',
      label: 'Header & Navigation',
      icon: Navigation
    },
    {
      id: 'footer',
      label: 'Footer',
      icon: Layout
    },
    {
      id: 'content',
      label: 'Website Content',
      icon: FileText
    },
    {
      id: 'appearance',
      label: 'Website Appearance',
      icon: Palette
    },
    {
      id: 'seo',
      label: 'SEO & Social',
      icon: Globe
    },
    {
      id: 'hardcoded_auditor',
      label: 'Hardcoded Details Auditor',
      icon: Code
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner & Management Overview (Store Settings Theme) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Website Control Center</h1>

              {/* Status Indicator Pill */}
              {isDirty ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Unsaved Edits
                </span>
              ) : hasUnpublishedDraft ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Draft Saved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Published Live
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1">
              Simplify your website management: configure homepage, navigation, footer, pages, theme appearance, and SEO without technical complexity.
            </p>
          </div>

          {/* Action Bar (Preview -> Save Draft -> Publish Live) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Preview storefront draft"
            >
              <Eye size={14} />
              <span>Preview Store</span>
            </button>

            {isDirty && (
              <button
                type="button"
                onClick={handleResetUnsaved}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                title="Discard unsaved edits"
              >
                <RotateCcw size={13} />
                <span>Discard</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin text-blue-600" /> : <Save size={14} />}
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmModal({
                open: true,
                title: 'Publish Website Changes Live?',
                message: 'This will publish your current website configuration live to all customers browsing the store.',
                onConfirm: handlePublish
              })}
              disabled={publishing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              {publishing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={14} />
                  <span>Publish Live</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Tabs (Store Settings Style) */}
        <div className="flex items-center gap-1.5 mt-5 border-t border-slate-100 pt-3 overflow-x-auto no-scrollbar scroll-smooth">
          {mainSections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSubTab === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSubTab(sec.id)}
                className={`min-h-[42px] px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Icon size={16} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Feedback Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl font-semibold text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
            <X size={14} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl font-semibold text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg('')} className="text-rose-600 hover:text-rose-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* MAIN SECTION CONTENT */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm min-h-[400px]">
        {/* 2. HOMEPAGE */}
        {activeSubTab === 'homepage' && (
          <HomepageCmsEditor formState={formState} setFormState={setFormState} />
        )}

        {/* 3. HEADER & NAVIGATION */}
        {activeSubTab === 'navigation' && (
          <NavigationCmsEditor formState={formState} setFormState={setFormState} />
        )}

        {/* 4. FOOTER */}
        {activeSubTab === 'footer' && (
          <FooterCmsEditor formState={formState} setFormState={setFormState} />
        )}

        {/* 5. WEBSITE CONTENT */}
        {activeSubTab === 'content' && (
          <WebsiteContentCmsEditor formState={formState} setFormState={setFormState} />
        )}

        {/* 6. WEBSITE APPEARANCE */}
        {activeSubTab === 'appearance' && (
          <AppearanceCmsEditor formState={formState} setFormState={setFormState} />
        )}

        {/* 7. SEO & SOCIAL */}
        {activeSubTab === 'seo' && (
          <div className="space-y-10">
            <SeoCmsEditor formState={formState} setFormState={setFormState} />
            <div className="border-t border-slate-200 pt-8">
              <SocialMediaCmsEditor formState={formState} setFormState={setFormState} />
            </div>
          </div>
        )}

        {/* 12. ADVANCED */}
        {activeSubTab === 'advanced' && (
          <AdvancedCmsEditor formState={formState} setFormState={setFormState} />
        )}

        {/* 13. HARDCODED DETAILS AUDITOR */}
        {activeSubTab === 'hardcoded_auditor' && (
          <HardcodedDetailsAuditor />
        )}
      </div>

      {/* ADVANCED COLLAPSIBLE OPTION FOR STORE OWNERS */}
      <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
        <button
          type="button"
          onClick={() => setShowAdvancedSection(!showAdvancedSection)}
          className="w-full flex items-center justify-between text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-slate-500" />
            <span className="text-xs font-bold">Advanced System Settings</span>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">For technical maintenance only</span>
          </div>
          {showAdvancedSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAdvancedSection && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
            <p className="text-xs text-slate-500">
              Normal store owners do not need to modify technical settings. Technical controls remain preserved here without cluttering the main Website Control Center.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('advanced')}
                className="px-3.5 py-2 bg-white border border-slate-200 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders size={14} /> Open Advanced System Controls
              </button>

              <button
                type="button"
                onClick={() => setConfirmModal({
                  open: true,
                  title: 'Reset Website Control Center to Defaults?',
                  message: 'This will reset all website settings (homepage, header, footer, content, appearance, SEO) back to original application defaults. Product, order, and customer data will NOT be modified.',
                  onConfirm: handleResetCmsToDefaults
                })}
                disabled={resettingCms}
                className="px-3.5 py-2 bg-white border border-rose-200 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} /> Reset CMS to Defaults
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Live Draft Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4">
          <div className="bg-slate-900 text-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-slate-700 shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 text-slate-950 p-2 rounded-xl">
                  <Eye size={18} />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                    <span>Storefront Draft Preview</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                      {hasUnpublishedDraft ? 'Unpublished Draft' : 'Current Configuration'}
                    </span>
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Interactively inspect how your draft appears before publishing to customers.
                  </p>
                </div>
              </div>

              {/* Viewport Controls */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${previewDevice === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('tablet')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${previewDevice === 'tablet' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Tablet (768px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${previewDevice === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Mobile (375px)
                  </button>
                </div>

                <a
                  href="/?preview=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <ExternalLink size={14} /> Open in Tab
                </a>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Close Preview Modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Preview Frame */}
            <div className="flex-1 bg-slate-950 flex items-center justify-center p-2 sm:p-4 overflow-auto">
              <div
                className="h-full transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-white"
                style={{
                  width: previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? '768px' : '375px',
                  maxWidth: '100%',
                }}
              >
                <iframe
                  src="/?preview=true"
                  title="Draft Preview Storefront"
                  className="w-full h-full border-0"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">
                Draft changes do NOT affect live customer storefront until <strong>Publish Live</strong> is clicked.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold cursor-pointer"
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewModal(false);
                    handlePublish();
                  }}
                  disabled={publishing}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Send size={14} /> {publishing ? 'Publishing...' : 'Publish Live Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal?.open && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-slate-900 mb-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                <AlertTriangle size={22} />
              </div>
              <h3 className="text-base font-black tracking-tight">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const cb = confirmModal.onConfirm;
                  setConfirmModal(null);
                  cb();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Confirm & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
