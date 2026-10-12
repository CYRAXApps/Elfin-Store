import React, { useState } from 'react';
import { SiteSettings } from '../../context/SiteSettingsContext';
import { Plus, Trash2, Eye, Calendar, Sparkles, CheckCircle2, AlertCircle, Layers, ArrowUp, ArrowDown } from 'lucide-react';

interface BannersPopupsCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function BannersPopupsCmsEditor({ formState, setFormState }: BannersPopupsCmsEditorProps) {
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);

  const banners = formState.bannersAndPopups || [];

  const handleAddBanner = () => {
    const newId = `bp-${Date.now()}`;
    const newBanner = {
      id: newId,
      type: 'popup' as const,
      title: 'Special Promotional Offer',
      subtitle: 'Limited Time Deal',
      description: 'Get extra 10% instant discount on orders above ₹2,000! Use coupon code: SAVE10 at checkout.',
      image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
      buttonText: 'Shop Deals Now',
      url: '/shop?sale=true',
      deviceTargeting: 'all' as const,
      frequency: 'once_per_session' as const,
      active: true,
      order: banners.length + 1,
      showCloseButton: true,
      publishStatus: 'published' as const,
      schedule: {
        start: '',
        end: '',
      },
    };

    setFormState({
      ...formState,
      bannersAndPopups: [...banners, newBanner],
    });
    setActivePreviewId(newId);
  };

  const handleUpdate = (idx: number, field: string, value: any) => {
    const copy = [...banners];
    copy[idx] = { ...copy[idx], [field]: value };
    setFormState({ ...formState, bannersAndPopups: copy });
  };

  const handleUpdateSchedule = (idx: number, key: 'start' | 'end', value: string) => {
    const copy = [...banners];
    const currSched = copy[idx].schedule || {};
    copy[idx] = {
      ...copy[idx],
      schedule: { ...currSched, [key]: value },
    };
    setFormState({ ...formState, bannersAndPopups: copy });
  };

  const handleDelete = (idx: number) => {
    const copy = banners.filter((_, i) => i !== idx);
    setFormState({ ...formState, bannersAndPopups: copy });
  };

  const handleMoveOrder = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === banners.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const copy = [...banners];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    // Re-index order numbers
    copy.forEach((item, i) => {
      item.order = i + 1;
    });
    setFormState({ ...formState, bannersAndPopups: copy });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="text-amber-500" size={20} />
            <span>Banners, Modals & Promotional Popups</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Manage high-conversion customer modals, header strip announcements, and promotional site banners.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddBanner}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus size={16} /> Add New Banner / Popup
        </button>
      </div>

      {banners.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
          <Layers className="mx-auto text-slate-300 mb-3" size={36} />
          <h3 className="text-sm font-bold text-slate-700">No Banners or Popups Configured</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">Create your first modal popup or header announcement strip.</p>
          <button
            type="button"
            onClick={handleAddBanner}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Create Banner Now
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {banners.map((bp, idx) => (
            <div
              key={bp.id || idx}
              className={`p-5 bg-white border rounded-2xl transition-all shadow-xs space-y-4 ${
                bp.active ? 'border-slate-300' : 'border-slate-200 opacity-80 bg-slate-50/50'
              }`}
            >
              {/* Item Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center">
                    {bp.order || idx + 1}
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      {bp.type === 'popup' ? 'Modal Popup' : bp.type === 'strip' ? 'Announcement Strip' : 'Page Banner'}
                    </span>
                    <h3 className="text-sm font-black text-slate-900">{bp.title || 'Untitled Banner'}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveOrder(idx, 'down')}
                    disabled={idx === banners.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePreviewId(activePreviewId === bp.id ? null : bp.id)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Eye size={14} /> {activePreviewId === bp.id ? 'Hide Preview' : 'Live Preview'}
                  </button>

                  {/* Active Toggle */}
                  <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bp.active}
                      onChange={(e) => handleUpdate(idx, 'active', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className={`text-xs font-bold ${bp.active ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {bp.active ? 'Active' : 'Disabled'}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete banner"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Banner / Popup Title</label>
                  <input
                    type="text"
                    value={bp.title || ''}
                    onChange={(e) => handleUpdate(idx, 'title', e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter banner or popup title"
                  />
                </div>

                {/* Subtitle */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle / Badge</label>
                  <input
                    type="text"
                    value={bp.subtitle || ''}
                    onChange={(e) => handleUpdate(idx, 'subtitle', e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter subtitle or badge"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description / Offer Details</label>
                  <textarea
                    rows={2}
                    value={bp.description || ''}
                    onChange={(e) => handleUpdate(idx, 'description', e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter offer description"
                  />
                </div>

                {/* Image URL */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Image URL (Optional)</label>
                  <input
                    type="text"
                    value={bp.image || ''}
                    onChange={(e) => handleUpdate(idx, 'image', e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter image URL"
                  />
                </div>

                {/* Button Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={bp.buttonText || ''}
                    onChange={(e) => handleUpdate(idx, 'buttonText', e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter button text"
                  />
                </div>

                {/* Button Link */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Button Link URL</label>
                  <input
                    type="text"
                    value={bp.url || ''}
                    onChange={(e) => handleUpdate(idx, 'url', e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter link URL"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Format</label>
                  <select
                    value={bp.type}
                    onChange={(e) => handleUpdate(idx, 'type', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold outline-none"
                  >
                    <option value="popup">Modal Popup (Centered Dialog)</option>
                    <option value="strip">Top Header Announcement Strip</option>
                    <option value="banner">Storefront Banner Box</option>
                  </select>
                </div>

                {/* Device Targeting */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Device Targeting</label>
                  <select
                    value={bp.deviceTargeting}
                    onChange={(e) => handleUpdate(idx, 'deviceTargeting', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold outline-none"
                  >
                    <option value="all">All Devices (Desktop & Mobile)</option>
                    <option value="desktop">Desktop Only</option>
                    <option value="mobile">Mobile Only</option>
                  </select>
                </div>

                {/* Display Frequency */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Frequency</label>
                  <select
                    value={bp.frequency}
                    onChange={(e) => handleUpdate(idx, 'frequency', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold outline-none"
                  >
                    <option value="once_per_session">Once Per Session</option>
                    <option value="always">Every Page Visit</option>
                  </select>
                </div>

                {/* Publish Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Publication Status</label>
                  <select
                    value={bp.publishStatus || 'published'}
                    onChange={(e) => handleUpdate(idx, 'publishStatus', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold outline-none"
                  >
                    <option value="published">Published Live</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="scheduled">Scheduled by Date</option>
                  </select>
                </div>

                {/* Schedule Start */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <Calendar size={12} className="inline mr-1 text-slate-400" /> Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={bp.schedule?.start || ''}
                    onChange={(e) => handleUpdateSchedule(idx, 'start', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs outline-none"
                  />
                </div>

                {/* Schedule End */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <Calendar size={12} className="inline mr-1 text-slate-400" /> End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={bp.schedule?.end || ''}
                    onChange={(e) => handleUpdateSchedule(idx, 'end', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs outline-none"
                  />
                </div>

                {/* Close Button Option */}
                <div className="md:col-span-2 flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bp.showCloseButton !== false}
                      onChange={(e) => handleUpdate(idx, 'showCloseButton', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-xs font-bold text-slate-700">Display Dismiss / Close Button</span>
                  </label>
                </div>
              </div>

              {/* In-Editor Live Visual Preview */}
              {activePreviewId === bp.id && (
                <div className="pt-4 border-t border-slate-100">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                    Live Rendering Preview:
                  </span>
                  {bp.type === 'popup' ? (
                    <div className="p-6 bg-slate-900/90 rounded-2xl flex items-center justify-center">
                      <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl border border-slate-200">
                        {bp.image && (
                          <div className="h-40 bg-slate-100 overflow-hidden">
                            <img src={bp.image} alt={bp.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-5 text-center space-y-2">
                          {bp.subtitle && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                              {bp.subtitle}
                            </span>
                          )}
                          <h4 className="text-base font-black text-slate-900">{bp.title}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed">{bp.description}</p>
                          {bp.buttonText && (
                            <div className="pt-2">
                              <span className="inline-block px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md">
                                {bp.buttonText}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : bp.type === 'strip' ? (
                    <div className="bg-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center justify-between gap-4 text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-300 shrink-0" />
                        <span><strong>{bp.title}:</strong> {bp.description}</span>
                      </div>
                      {bp.buttonText && (
                        <span className="px-3 py-1 bg-white text-blue-900 text-[11px] font-bold rounded-lg shrink-0">
                          {bp.buttonText}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">{bp.subtitle}</span>
                        <h4 className="text-base font-black">{bp.title}</h4>
                        <p className="text-xs text-blue-100">{bp.description}</p>
                      </div>
                      {bp.buttonText && (
                        <span className="px-4 py-2 bg-white text-slate-900 font-bold rounded-xl text-xs shrink-0 shadow-md">
                          {bp.buttonText}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
