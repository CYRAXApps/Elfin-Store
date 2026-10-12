import React, { useState } from 'react';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, Eye, ExternalLink, 
  Smartphone, Monitor, Globe, Check, AlertCircle, Link2, 
  Tag, Layout, Navigation as NavIcon, ChevronRight
} from 'lucide-react';
import { SiteSettings } from '../../context/SiteSettingsContext';

interface NavigationCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function NavigationCmsEditor({ formState, setFormState }: NavigationCmsEditorProps) {
  const [navSection, setNavSection] = useState<'header' | 'footer' | 'mobile'>('header');

  // Header state
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('/shop');
  const [newVisibility, setNewVisibility] = useState<'all' | 'desktop' | 'mobile'>('all');
  const [newBadge, setNewBadge] = useState('');
  const [newTarget, setNewTarget] = useState<'_self' | '_blank'>('_self');
  const [showAddForm, setShowAddForm] = useState(false);

  const navItems = formState.header?.navItems || [];

  const updateNavItems = (newItems: typeof navItems) => {
    const ordered = newItems.map((item, idx) => ({ ...item, order: idx + 1 }));
    setFormState(prev => ({
      ...prev,
      header: {
        ...prev.header,
        navItems: ordered
      }
    }));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const newItem = {
      id: `nav-${Date.now()}`,
      label: newLabel.trim(),
      url: newUrl.trim() || '/shop',
      internalRoute: newUrl.startsWith('http') ? undefined : newUrl.trim(),
      externalUrl: newUrl.startsWith('http') ? newUrl.trim() : undefined,
      enabled: true,
      order: navItems.length + 1,
      visibility: newVisibility,
      showOnDesktop: newVisibility !== 'mobile',
      showOnMobile: newVisibility !== 'desktop',
      badge: newBadge.trim() || undefined,
      target: newTarget
    };

    updateNavItems([...navItems, newItem]);
    setNewLabel('');
    setNewUrl('/shop');
    setNewBadge('');
    setNewVisibility('all');
    setNewTarget('_self');
    setShowAddForm(false);
  };

  const handleToggleItem = (index: number) => {
    const updated = [...navItems];
    updated[index].enabled = !updated[index].enabled;
    updateNavItems(updated);
  };

  const handleDeleteItem = (index: number) => {
    const updated = navItems.filter((_, i) => i !== index);
    updateNavItems(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= navItems.length) return;

    const updated = [...navItems];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    updateNavItems(updated);
  };

  // Footer navigation state & handlers
  const footer = formState.footer || {
    columns: [],
    copyrightText: '',
    copyrightYear: ''
  };

  const updateFooter = (updates: Partial<typeof footer>) => {
    setFormState(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        ...updates
      }
    }));
  };

  const addColumn = () => {
    const newCol = {
      id: `col-${Date.now()}`,
      title: 'New Navigation Column',
      enabled: true,
      order: (footer.columns?.length || 0) + 1,
      links: [
        { label: 'Shop Products', url: '/shop' },
        { label: 'Special Deals', url: '/shop?sale=true' }
      ]
    };
    updateFooter({
      columns: [...(footer.columns || []), newCol]
    });
  };

  const updateColumn = (index: number, updates: any) => {
    const newCols = [...(footer.columns || [])];
    newCols[index] = { ...newCols[index], ...updates };
    updateFooter({ columns: newCols });
  };

  const removeColumn = (index: number) => {
    const newCols = (footer.columns || []).filter((_, i) => i !== index);
    updateFooter({ columns: newCols });
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newCols = [...(footer.columns || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newCols.length) return;
    const temp = newCols[index];
    newCols[index] = newCols[targetIdx];
    newCols[targetIdx] = temp;
    updateFooter({ columns: newCols });
  };

  const addLinkToColumn = (colIndex: number) => {
    const newCols = [...(footer.columns || [])];
    const currentLinks = newCols[colIndex].links || [];
    newCols[colIndex].links = [...currentLinks, { label: 'New Link', url: '/shop' }];
    updateFooter({ columns: newCols });
  };

  const updateColumnLink = (colIndex: number, linkIndex: number, field: 'label' | 'url', val: string) => {
    const newCols = [...(footer.columns || [])];
    const currentLinks = [...(newCols[colIndex].links || [])];
    currentLinks[linkIndex] = { ...currentLinks[linkIndex], [field]: val };
    newCols[colIndex].links = currentLinks;
    updateFooter({ columns: newCols });
  };

  const removeColumnLink = (colIndex: number, linkIndex: number) => {
    const newCols = [...(footer.columns || [])];
    newCols[colIndex].links = (newCols[colIndex].links || []).filter((_, i) => i !== linkIndex);
    updateFooter({ columns: newCols });
  };

  return (
    <div className="space-y-6" id="navigation-cms-editor">
      {/* Header Banner */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <NavIcon className="text-blue-600" size={20} /> Navigation Management
        </h2>
        <p className="text-slate-500 text-xs mt-1">
          Manage header menus, footer link columns, and mobile navigation in one central location.
        </p>
      </div>

      {/* Navigation Sub-Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setNavSection('header')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            navSection === 'header'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Monitor size={14} />
          <span>Header Menu ({navItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setNavSection('footer')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            navSection === 'footer'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layout size={14} />
          <span>Footer Links ({footer.columns?.length || 0} Columns)</span>
        </button>

        <button
          type="button"
          onClick={() => setNavSection('mobile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            navSection === 'mobile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Smartphone size={14} />
          <span>Mobile Navigation</span>
        </button>
      </div>

      {/* 1. HEADER MENU TAB */}
      {navSection === 'header' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Header Menu Links</h3>
              <p className="text-xs text-slate-500">Configure top navigation links, destination paths, badges, and device visibility.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>{showAddForm ? 'Cancel' : 'Add Link'}</span>
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddItem} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">New Header Link</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Label</label>
                  <input
                    type="text"
                    required
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Flash Deals"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">URL / Route</label>
                  <input
                    type="text"
                    required
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="/shop or https://..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Badge (Optional)</label>
                  <input
                    type="text"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    placeholder="e.g. HOT, NEW, 50% OFF"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Visibility</label>
                  <select
                    value={newVisibility}
                    onChange={(e) => setNewVisibility(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="all">Desktop & Mobile</option>
                    <option value="desktop">Desktop Only</option>
                    <option value="mobile">Mobile Only</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Add to Navigation
                </button>
              </div>
            </form>
          )}

          <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white">
            {navItems.map((item, index) => (
              <div key={item.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-400 w-5">#{index + 1}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${item.enabled ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 bg-red-500 text-white rounded text-[10px] font-bold">
                          {item.badge}
                        </span>
                      )}
                      {item.visibility === 'desktop' && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                          <Monitor size={10} /> Desktop
                        </span>
                      )}
                      {item.visibility === 'mobile' && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                          <Smartphone size={10} /> Mobile
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono truncate block mt-0.5">{item.url}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleItem(index)}
                    className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                      item.enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.enabled ? 'Active' : 'Disabled'}
                  </button>

                  <div className="flex items-center">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={index === navItems.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(index)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. FOOTER LINKS TAB */}
      {navSection === 'footer' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Footer Link Columns</h3>
              <p className="text-xs text-slate-500">Configure vertical navigation columns displayed across the website footer.</p>
            </div>
            <button
              type="button"
              onClick={addColumn}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Column</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(footer.columns || []).map((col, colIdx) => (
              <div key={col.id || colIdx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-mono font-bold text-slate-400">#{colIdx + 1}</span>
                    <input
                      type="text"
                      value={col.title}
                      onChange={(e) => updateColumn(colIdx, { title: e.target.value })}
                      placeholder="Column Title"
                      className="text-xs font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 flex-1 focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={colIdx === 0}
                      onClick={() => moveColumn(colIdx, 'up')}
                      className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={colIdx === (footer.columns?.length || 0) - 1}
                      onClick={() => moveColumn(colIdx, 'down')}
                      className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeColumn(colIdx)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Column Links List */}
                <div className="space-y-2">
                  {(col.links || []).map((link, linkIdx) => (
                    <div key={linkIdx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateColumnLink(colIdx, linkIdx, 'label', e.target.value)}
                        placeholder="Link Label"
                        className="w-1/2 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold"
                      />
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => updateColumnLink(colIdx, linkIdx, 'url', e.target.value)}
                        placeholder="/path"
                        className="w-1/2 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => removeColumnLink(colIdx, linkIdx)}
                        className="p-1 text-slate-400 hover:text-red-500 shrink-0 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addLinkToColumn(colIdx)}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Add Link</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. MOBILE NAVIGATION TAB */}
      {navSection === 'mobile' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Mobile Bottom Navigation Bar</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Sticky navigation bar shown at the bottom of mobile screens.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formState.header?.mobileBottomNav?.enabled ?? true}
                    onChange={(e) => {
                      setFormState(prev => ({
                        ...prev,
                        header: {
                          ...prev.header,
                          mobileBottomNav: {
                            ...prev.header?.mobileBottomNav,
                            enabled: e.target.checked,
                            items: prev.header?.mobileBottomNav?.items || []
                          }
                        }
                      }));
                    }}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {formState.header?.mobileBottomNav?.enabled !== false && (
              <div className="p-4 space-y-3">
                {(formState.header?.mobileBottomNav?.items || []).sort((a, b) => a.order - b.order).map((item, idx) => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => {
                          const items = [...(formState.header?.mobileBottomNav?.items || [])];
                          items[idx] = { ...items[idx], label: e.target.value };
                          setFormState(prev => ({
                            ...prev,
                            header: {
                              ...prev.header,
                              mobileBottomNav: {
                                ...prev.header?.mobileBottomNav,
                                enabled: prev.header?.mobileBottomNav?.enabled ?? true,
                                items
                              }
                            }
                          }));
                        }}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold w-36 bg-white outline-none focus:border-blue-500"
                        placeholder="Label"
                      />
                      <select
                        value={item.icon}
                        onChange={(e) => {
                          const items = [...(formState.header?.mobileBottomNav?.items || [])];
                          items[idx] = { ...items[idx], icon: e.target.value };
                          setFormState(prev => ({
                            ...prev,
                            header: {
                              ...prev.header,
                              mobileBottomNav: {
                                ...prev.header?.mobileBottomNav,
                                enabled: prev.header?.mobileBottomNav?.enabled ?? true,
                                items
                              }
                            }
                          }));
                        }}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:border-blue-500"
                      >
                        <option value="Home">Home Icon</option>
                        <option value="Grid">Shop / Categories Icon</option>
                        <option value="Search">Search Icon</option>
                        <option value="Heart">Wishlist Icon</option>
                        <option value="ShoppingCart">Cart Icon</option>
                        <option value="User">Account Icon</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(e) => {
                            const items = [...(formState.header?.mobileBottomNav?.items || [])];
                            items[idx] = { ...items[idx], enabled: e.target.checked };
                            setFormState(prev => ({
                              ...prev,
                              header: {
                                ...prev.header,
                                mobileBottomNav: {
                                  ...prev.header?.mobileBottomNav,
                                  enabled: prev.header?.mobileBottomNav?.enabled ?? true,
                                  items
                                }
                              }
                            }));
                          }}
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-700">Enabled</span>
                      </label>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            const items = [...(formState.header?.mobileBottomNav?.items || [])];
                            const temp = items[idx - 1];
                            items[idx - 1] = items[idx];
                            items[idx] = temp;
                            items.forEach((it, i) => it.order = i + 1);
                            setFormState(prev => ({ ...prev, header: { ...prev.header, mobileBottomNav: { ...prev.header?.mobileBottomNav, enabled: prev.header?.mobileBottomNav?.enabled ?? true, items } } }));
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === (formState.header?.mobileBottomNav?.items?.length || 0) - 1}
                          onClick={() => {
                            const items = [...(formState.header?.mobileBottomNav?.items || [])];
                            const temp = items[idx + 1];
                            items[idx + 1] = items[idx];
                            items[idx] = temp;
                            items.forEach((it, i) => it.order = i + 1);
                            setFormState(prev => ({ ...prev, header: { ...prev.header, mobileBottomNav: { ...prev.header?.mobileBottomNav, enabled: prev.header?.mobileBottomNav?.enabled ?? true, items } } }));
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NavigationCmsEditor;
