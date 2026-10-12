import React, { useState, useMemo, useEffect } from 'react';
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Layers,
  ChevronRight,
  Plus,
  Trash2,
  ShieldCheck,
  Truck,
  Zap,
  Clock,
  Download,
  RotateCcw,
  Sparkles,
  Info,
  HelpCircle,
  Building2,
  Navigation
} from 'lucide-react';
import {
  INDIA_GEOGRAPHIC_DIRECTORY,
  StateData,
  DistrictData,
  SubDivisionData,
  PincodeRecord,
  DeliveryCoverageConfig,
  fetchOnlinePostOfficesByBranch
} from '../../../services/indiaGeographicData';
import { lookupPincode, INDIAN_STATES } from '../../../services/pincodeService';
import { PincodeDisplay } from '../../common/PincodeDisplay';
import {
  lookupExactCanonicalPincode,
  evaluatePincodeServiceability,
  validateIndianPincode,
  CanonicalPincodeRecord
} from '../../../services/canonicalPincodeService';

interface DeliveryCoverageManagerProps {
  coverageConfig?: DeliveryCoverageConfig;
  onSaveCoverage: (config: DeliveryCoverageConfig, summaryText: string) => Promise<void> | void;
  isSaving?: boolean;
}

export function DeliveryCoverageManager({
  coverageConfig,
  onSaveCoverage,
  isSaving = false,
}: DeliveryCoverageManagerProps) {
  // 1. Hierarchy Selection State
  const [selectedStateName, setSelectedStateName] = useState<string>('West Bengal');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('Kolkata');
  const [selectedSubDivisionName, setSelectedSubDivisionName] = useState<string>('ALL');

  // 2. Search & Filter State
  const [pincodeSearchQuery, setPincodeSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // 3. Quick Pincode Checker State
  const [testerPincode, setTesterPincode] = useState<string>('');
  const [testerResult, setTesterResult] = useState<{
    pincode: string;
    officeName?: string;
    subDivision?: string;
    district?: string;
    state?: string;
    locality?: string;
    isDelivering: boolean;
    deliveryType?: string;
    transitDays?: number;
    codAvailable?: boolean;
    message?: string;
    notFound?: boolean;
    record?: CanonicalPincodeRecord;
  } | null>(null);
  const [isTestingPin, setIsTestingPin] = useState<boolean>(false);

  // 4. Custom Pincode Adder in Current Division
  const [customPinInput, setCustomPinInput] = useState<string>('');
  const [customOfficeName, setCustomOfficeName] = useState<string>('');
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);
  const [isResolvingPin, setIsResolvingPin] = useState<boolean>(false);

  // 5. Local Editable Coverage Config
  const [localConfig, setLocalConfig] = useState<DeliveryCoverageConfig>(() => {
    if (coverageConfig) return coverageConfig;
    return {
      mode: 'all_except_excluded',
      coveredStates: ['West Bengal', 'Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Gujarat'],
      coveredDistricts: ['Kolkata', 'North 24 Parganas', 'South 24 Parganas', 'Howrah', 'Bengaluru Urban', 'Mumbai Suburban', 'Pune', 'New Delhi', 'South Delhi', 'Chennai', 'Hyderabad'],
      coveredSubDivisions: [],
      activePincodes: [],
      excludedPincodes: [],
      pincodeRules: {},
      lastUpdated: new Date().toISOString(),
      notes: 'Standard Delivery coverage across key metro districts and divisions with automated PIN resolution.'
    };
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Sync when prop changes
  useEffect(() => {
    if (coverageConfig) {
      setLocalConfig(coverageConfig);
    }
  }, [coverageConfig]);

  // Current State Data
  const currentStateData = useMemo(() => {
    return INDIA_GEOGRAPHIC_DIRECTORY.find((s) => s.name === selectedStateName) || null;
  }, [selectedStateName]);

  // Districts for selected State
  const districtList: DistrictData[] = useMemo(() => {
    if (currentStateData) return currentStateData.districts;
    return [];
  }, [currentStateData]);

  // Sync selected district when state changes
  useEffect(() => {
    if (districtList.length > 0) {
      if (!districtList.some((d) => d.name === selectedDistrictName)) {
        setSelectedDistrictName(districtList[0].name);
        setSelectedSubDivisionName('ALL');
      }
    } else {
      setSelectedDistrictName('');
      setSelectedSubDivisionName('ALL');
    }
  }, [selectedStateName, districtList]);

  // Current District Data
  const currentDistrictData = useMemo(() => {
    return districtList.find((d) => d.name === selectedDistrictName) || null;
  }, [districtList, selectedDistrictName]);

  // Sub-divisions for selected District
  const subDivisionList: SubDivisionData[] = useMemo(() => {
    if (currentDistrictData) return currentDistrictData.subDivisions;
    return [];
  }, [currentDistrictData]);

  // Automatic Pincode List derived from selected State -> District -> Sub-divisions
  const automaticPincodeList: PincodeRecord[] = useMemo(() => {
    if (!currentDistrictData) return [];

    let rawList: PincodeRecord[] = [];
    if (selectedSubDivisionName === 'ALL') {
      // Gather all sub-divisions in this district
      currentDistrictData.subDivisions.forEach((sd) => {
        rawList.push(...sd.pincodes);
      });
    } else {
      const foundSd = currentDistrictData.subDivisions.find((sd) => sd.name === selectedSubDivisionName);
      if (foundSd) {
        rawList = [...foundSd.pincodes];
      }
    }

    // Attach custom added PIN codes for this district
    const customRules = localConfig.pincodeRules || {};
    Object.entries(customRules).forEach(([pin, rule]: [string, any]) => {
      // If already in rawList, override values
      const existingIdx = rawList.findIndex((item) => item.pincode === pin);
      if (existingIdx >= 0) {
        rawList[existingIdx] = {
          ...rawList[existingIdx],
          isActive: rule.isActive,
          deliveryType: rule.deliveryType || rawList[existingIdx].deliveryType,
          codAvailable: rule.codAvailable !== undefined ? rule.codAvailable : rawList[existingIdx].codAvailable,
          transitDays: rule.transitDays || rawList[existingIdx].transitDays
        };
      } else if (
        rule.district === selectedDistrictName ||
        (rule.state === selectedStateName && selectedSubDivisionName === 'ALL')
      ) {
        rawList.push({
          pincode: pin,
          officeName: (rule as any).postOfficeNames?.[0] || `Post Office (${pin})`,
          division: (rule as any).division || (selectedSubDivisionName !== 'ALL' ? selectedSubDivisionName : selectedDistrictName),
          district: rule.district || selectedDistrictName,
          state: rule.state || selectedStateName,
          deliveryType: rule.deliveryType || 'Standard',
          codAvailable: rule.codAvailable !== undefined ? rule.codAvailable : true,
          isActive: rule.isActive !== false,
          transitDays: rule.transitDays || 3
        });
      }
    });

    // Determine active status based on localConfig rules
    return rawList.map((item) => {
      const pin = item.pincode;
      const rule = localConfig.pincodeRules?.[pin];

      let isDelivering = true;
      if (localConfig.mode === 'only_selected') {
        isDelivering = localConfig.activePincodes?.includes(pin) || (rule?.isActive ?? false);
      } else {
        isDelivering = !(localConfig.excludedPincodes?.includes(pin) || (rule && rule.isActive === false));
      }

      return {
        ...item,
        isActive: isDelivering,
        deliveryType: rule?.deliveryType || item.deliveryType || 'Standard',
        codAvailable: rule?.codAvailable !== undefined ? rule.codAvailable : item.codAvailable ?? true,
        transitDays: rule?.transitDays || item.transitDays || (item.deliveryType === 'SameDay' ? 1 : item.deliveryType === 'Express' ? 2 : 3),
      };
    });
  }, [currentDistrictData, selectedSubDivisionName, localConfig, selectedDistrictName, selectedStateName]);

  // Filtered pincodes by search and status
  const displayedPincodes = useMemo(() => {
    return automaticPincodeList.filter((item) => {
      // Status filter
      if (statusFilter === 'active' && !item.isActive) return false;
      if (statusFilter === 'inactive' && item.isActive) return false;

      // Text query
      if (pincodeSearchQuery.trim()) {
        const q = pincodeSearchQuery.trim().toLowerCase();
        const matchesPin = item.pincode.toLowerCase().includes(q);
        const matchesOffice = item.officeName.toLowerCase().includes(q);
        const matchesDivision = item.division.toLowerCase().includes(q);
        return matchesPin || matchesOffice || matchesDivision;
      }
      return true;
    });
  }, [automaticPincodeList, statusFilter, pincodeSearchQuery]);

  // Helper to toggle a single PIN code's active/delivering status
  const handleTogglePincode = (pincode: string, currentActive: boolean) => {
    const nextActive = !currentActive;
    setLocalConfig((prev) => {
      const newRules = { ...(prev.pincodeRules || {}) };
      newRules[pincode] = {
        ...(newRules[pincode] || {}),
        isActive: nextActive,
      };

      let newActivePins = [...(prev.activePincodes || [])];
      let newExcludedPins = [...(prev.excludedPincodes || [])];

      if (nextActive) {
        newExcludedPins = newExcludedPins.filter((p) => p !== pincode);
        if (!newActivePins.includes(pincode)) newActivePins.push(pincode);
      } else {
        newActivePins = newActivePins.filter((p) => p !== pincode);
        if (!newExcludedPins.includes(pincode)) newExcludedPins.push(pincode);
      }

      return {
        ...prev,
        pincodeRules: newRules,
        activePincodes: newActivePins,
        excludedPincodes: newExcludedPins,
        lastUpdated: new Date().toISOString()
      };
    });
    setHasUnsavedChanges(true);
  };

  // Helper to update delivery speed / type for a PIN
  const handleUpdateDeliveryType = (pincode: string, type: 'Standard' | 'Express' | 'SameDay') => {
    setLocalConfig((prev) => {
      const newRules = { ...(prev.pincodeRules || {}) };
      const transit = type === 'SameDay' ? 1 : type === 'Express' ? 2 : 3;
      newRules[pincode] = {
        ...(newRules[pincode] || {}),
        isActive: newRules[pincode]?.isActive ?? true,
        deliveryType: type,
        transitDays: transit
      };
      return {
        ...prev,
        pincodeRules: newRules,
        lastUpdated: new Date().toISOString()
      };
    });
    setHasUnsavedChanges(true);
  };

  // Helper to toggle COD for a PIN
  const handleToggleCod = (pincode: string, currentCod: boolean) => {
    setLocalConfig((prev) => {
      const newRules = { ...(prev.pincodeRules || {}) };
      newRules[pincode] = {
        ...(newRules[pincode] || {}),
        isActive: newRules[pincode]?.isActive ?? true,
        codAvailable: !currentCod
      };
      return {
        ...prev,
        pincodeRules: newRules,
        lastUpdated: new Date().toISOString()
      };
    });
    setHasUnsavedChanges(true);
  };

  // Bulk: Enable All in current view with explicit scope & confirmation
  const handleBulkEnable = () => {
    const scopeLabel = selectedSubDivisionName === 'ALL'
      ? `${selectedDistrictName} district`
      : `${selectedSubDivisionName} division`;

    const count = displayedPincodes.length;
    if (count === 0) return;

    const confirmed = window.confirm(`Enable delivery for ${count} PIN codes in ${scopeLabel}?`);
    if (!confirmed) return;

    setLocalConfig((prev) => {
      const newRules = { ...(prev.pincodeRules || {}) };
      const newActivePins = [...(prev.activePincodes || [])];
      let newExcludedPins = [...(prev.excludedPincodes || [])];

      displayedPincodes.forEach((p) => {
        newRules[p.pincode] = {
          ...(newRules[p.pincode] || {}),
          pincode: p.pincode,
          isActive: true,
          deliveryStatus: 'DELIVERING',
          updatedAt: new Date().toISOString()
        };
        newExcludedPins = newExcludedPins.filter((x) => x !== p.pincode);
        if (!newActivePins.includes(p.pincode)) newActivePins.push(p.pincode);
      });

      return {
        ...prev,
        pincodeRules: newRules,
        activePincodes: newActivePins,
        excludedPincodes: newExcludedPins,
        lastUpdated: new Date().toISOString()
      };
    });
    setHasUnsavedChanges(true);
  };

  // Bulk: Disable All in current view with explicit scope & confirmation
  const handleBulkDisable = () => {
    const scopeLabel = selectedSubDivisionName === 'ALL'
      ? `${selectedDistrictName} district`
      : `${selectedSubDivisionName} division`;

    const count = displayedPincodes.length;
    if (count === 0) return;

    const confirmed = window.confirm(`Disable delivery for ${count} PIN codes in ${scopeLabel}?`);
    if (!confirmed) return;

    setLocalConfig((prev) => {
      const newRules = { ...(prev.pincodeRules || {}) };
      let newActivePins = [...(prev.activePincodes || [])];
      const newExcludedPins = [...(prev.excludedPincodes || [])];

      displayedPincodes.forEach((p) => {
        newRules[p.pincode] = {
          ...(newRules[p.pincode] || {}),
          pincode: p.pincode,
          isActive: false,
          deliveryStatus: 'EXCLUDED',
          updatedAt: new Date().toISOString()
        };
        newActivePins = newActivePins.filter((x) => x !== p.pincode);
        if (!newExcludedPins.includes(p.pincode)) newExcludedPins.push(p.pincode);
      });

      return {
        ...prev,
        pincodeRules: newRules,
        activePincodes: newActivePins,
        excludedPincodes: newExcludedPins,
        lastUpdated: new Date().toISOString()
      };
    });
    setHasUnsavedChanges(true);
  };

  // Add Custom Pincode using authoritative India Post lookup
  const handleAddCustomPin = async () => {
    const val = validateIndianPincode(customPinInput);
    if (!val.isValid || !val.cleanPin) {
      alert(val.error || 'Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setIsResolvingPin(true);
    try {
      const lookup = await lookupExactCanonicalPincode(val.cleanPin, localConfig);
      if (!lookup.success || lookup.notFound || !lookup.record) {
        alert('PIN code not found in the official India Post postal directory. Please enter a valid Indian postal PIN code.');
        setIsResolvingPin(false);
        return;
      }

      const rec = lookup.record;
      setLocalConfig((prev) => {
        const newRules = { ...(prev.pincodeRules || {}) };
        newRules[val.cleanPin] = {
          pincode: val.cleanPin,
          state: rec.state,
          district: rec.district,
          division: rec.division,
          postOfficeNames: rec.postOfficeNames,
          localityNames: rec.localityNames,
          isActive: true,
          deliveryStatus: 'DELIVERING',
          deliveryType: 'Standard',
          deliverySpeed: 'STANDARD',
          codAvailable: true,
          codEnabled: true,
          transitDays: 3,
          source: 'AdminAuthoritativeLookup',
          updatedAt: new Date().toISOString()
        };

        const newActive = [...(prev.activePincodes || [])];
        if (!newActive.includes(val.cleanPin)) newActive.push(val.cleanPin);

        return {
          ...prev,
          pincodeRules: newRules,
          activePincodes: newActive,
          lastUpdated: new Date().toISOString()
        };
      });

      setCustomPinInput('');
      setCustomOfficeName('');
      setIsAddingCustom(false);
      setHasUnsavedChanges(true);
    } catch {
      alert('Failed to resolve PIN code with postal network. Please try again.');
    } finally {
      setIsResolvingPin(false);
    }
  };

  // Quick PIN Code Tester: Exact 6-digit lookup without inferring or creating fake records
  const handleTestPincode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = validateIndianPincode(testerPincode);
    if (!val.isValid || !val.cleanPin) {
      setTesterResult({
        pincode: val.cleanPin || testerPincode,
        isDelivering: false,
        message: val.error || 'Please enter a valid 6-digit Indian postal PIN code.'
      });
      return;
    }

    setIsTestingPin(true);
    setTesterResult(null);

    try {
      const res = await lookupExactCanonicalPincode(val.cleanPin, localConfig);

      if (!res.success || res.notFound || !res.record) {
        setTesterResult({
          pincode: val.cleanPin,
          notFound: true,
          isDelivering: false,
          message: 'PIN code not found in official India Post directory.'
        });
        return;
      }

      setTesterResult({
        pincode: res.record.pincode,
        officeName: res.record.postOfficeNames[0] || 'Post Office',
        subDivision: res.record.division,
        district: res.record.district,
        state: res.record.state,
        locality: res.record.localityNames.join(', '),
        isDelivering: res.record.deliveryStatus === 'DELIVERING',
        deliveryType: res.record.deliverySpeed === 'SAME_DAY' ? 'SameDay' : res.record.deliverySpeed === 'EXPRESS' ? 'Express' : 'Standard',
        transitDays: res.record.transitDays || 3,
        codAvailable: res.record.codEnabled,
        record: res.record,
        message: res.record.deliveryStatus === 'DELIVERING'
          ? `✓ Active Delivery: We are currently delivering to ${res.record.district}, ${res.record.state}.`
          : `✗ Excluded / Inactive: Delivery is currently suspended or excluded for this PIN code.`
      });
    } catch {
      setTesterResult({
        pincode: val.cleanPin,
        isDelivering: false,
        message: 'Failed to verify PIN code serviceability.'
      });
    } finally {
      setIsTestingPin(false);
    }
  };

  // Save all changes
  const handleSaveAll = async () => {
    // Generate clean human-readable summary
    const totalDelivering = displayedPincodes.filter((p) => p.isActive).length;
    const summary = localConfig.mode === 'only_selected'
      ? `Selected Serviceable Zones: ${selectedStateName} (${selectedDistrictName}) & configured PIN codes`
      : `All Serviceable PIN Codes across India (${localConfig.excludedPincodes?.length || 0} excluded)`;

    await onSaveCoverage(localConfig, summary);
    setHasUnsavedChanges(false);
    setSaveSuccessMsg('Coverage area & PIN code rules successfully saved!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Export as CSV
  const handleExportCsv = () => {
    const headers = 'PIN Code,Post Office / Locality,Sub-division,District,State,Delivering,Speed,COD,Transit Days\n';
    const rows = automaticPincodeList
      .map((p) => `${p.pincode},"${p.officeName}","${p.division}","${p.district}","${p.state}",${p.isActive ? 'YES' : 'NO'},${p.deliveryType},${p.codAvailable ? 'YES' : 'NO'},${p.transitDays}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `delivery_coverage_${selectedDistrictName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-blue-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-semibold tracking-wide border border-blue-400/30">
              <Navigation size={12} />
              Geographic Routing & Fulfillment Engine
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Delivery Coverage Area by State → District → Sub-divisions
            </h2>
            <p className="text-xs text-blue-200/80 max-w-2xl leading-relaxed">
              Select any State, District, and Division areas to automatically generate their full PIN code directory.
              Audit and toggle live serviceability, delivery speeds, and payment options for each area.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasUnsavedChanges && (
              <span className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-xl border border-amber-500/30 font-semibold animate-pulse">
                Unsaved changes
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              {isSaving ? 'Saving...' : 'Save Coverage Area'}
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            {saveSuccessMsg}
          </div>
        )}
      </div>

      {/* Quick Pincode Checker / Verifier Tool */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-blue-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Which PIN Code Works? Instant Coverage Checker
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Search any 6-digit Indian PIN code to test route coverage</span>
        </div>

        <form onSubmit={handleTestPincode} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={testerPincode}
              onChange={(e) => setTesterPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit PIN code (e.g. 700091, 560100, 400050)"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <MapPin size={15} className="absolute left-3 top-3 text-slate-400" />
          </div>
          <button
            type="submit"
            disabled={isTestingPin || testerPincode.length !== 6}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {isTestingPin ? <RotateCcw size={14} className="animate-spin" /> : <Search size={14} />}
            Check Route
          </button>
        </form>

        {testerResult && (
          <div className={`mt-3 p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs ${
            testerResult.notFound
              ? 'bg-slate-50 border-slate-300 text-slate-800'
              : testerResult.isDelivering
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-start gap-3">
              {testerResult.notFound ? (
                <XCircle size={18} className="text-slate-500 shrink-0 mt-0.5" />
              ) : testerResult.isDelivering ? (
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-2 flex-wrap">
                  <PincodeDisplay pincode={testerResult.pincode} badge />
                  {!testerResult.notFound && (
                    <>
                      <span className="text-slate-900 font-semibold">{testerResult.officeName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        testerResult.isDelivering ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {testerResult.isDelivering ? 'Delivering' : 'Excluded'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {testerResult.deliveryType || 'Standard'} Speed
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        testerResult.codAvailable ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {testerResult.codAvailable ? 'COD Available' : 'Prepaid Only'}
                      </span>
                    </>
                  )}
                </div>

                {testerResult.notFound ? (
                  <p className="text-slate-600 font-medium">
                    PIN code not found. No record exists in the official India Post postal directory.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-[11px] text-slate-700 pt-1">
                      <div><strong className="text-slate-900">State:</strong> {testerResult.state}</div>
                      <div><strong className="text-slate-900">District:</strong> {testerResult.district}</div>
                      <div><strong className="text-slate-900">Division:</strong> {testerResult.subDivision}</div>
                      <div><strong className="text-slate-900">Locality:</strong> {testerResult.locality || testerResult.officeName}</div>
                    </div>
                    <p className="text-[11px] font-medium pt-0.5">
                      {testerResult.message}
                    </p>
                  </>
                )}
              </div>
            </div>

            {!testerResult.notFound && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleTogglePincode(testerResult.pincode, testerResult.isDelivering)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs ${
                    testerResult.isDelivering
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {testerResult.isDelivering ? 'Block / Exclude PIN' : 'Enable Delivery to PIN'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cascading State → District → Sub-divisions Selector Box */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Geographic Cascading Selector
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-slate-500">Coverage Policy:</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setLocalConfig((p) => ({ ...p, mode: 'all_except_excluded' }));
                  setHasUnsavedChanges(true);
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  localConfig.mode === 'all_except_excluded'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Deliver All (Exclude Selected)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalConfig((p) => ({ ...p, mode: 'only_selected' }));
                  setHasUnsavedChanges(true);
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  localConfig.mode === 'only_selected'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Geo-fenced (Selected PINs Only)
              </button>
            </div>
          </div>
        </div>

        {/* 3 Steps: State -> District -> Sub-divisions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. STATE */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>1. Select State</span>
              <span className="text-[10px] text-blue-600 font-bold uppercase">Step 1</span>
            </label>
            <select
              value={selectedStateName}
              onChange={(e) => setSelectedStateName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400">
              Selected: <strong className="text-slate-700">{selectedStateName}</strong>
            </p>
          </div>

          {/* 2. DISTRICT */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>2. Select District</span>
              <span className="text-[10px] text-blue-600 font-bold uppercase">Step 2</span>
            </label>
            <select
              value={selectedDistrictName}
              onChange={(e) => setSelectedDistrictName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              {districtList.length > 0 ? (
                districtList.map((dist) => (
                  <option key={dist.name} value={dist.name}>
                    {dist.name} ({dist.subDivisions.length} Division areas)
                  </option>
                ))
              ) : (
                <option value="">No pre-mapped districts</option>
              )}
            </select>
            <p className="text-[10px] text-slate-400">
              Active District: <strong className="text-slate-700">{selectedDistrictName || 'None'}</strong>
            </p>
          </div>

          {/* 3. SUB-DIVISIONS */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>3. Sub-divisions / Divisions</span>
              <span className="text-[10px] text-blue-600 font-bold uppercase">Step 3</span>
            </label>
            <select
              value={selectedSubDivisionName}
              onChange={(e) => setSelectedSubDivisionName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              <option value="ALL">
                ★ All Sub-divisions in {selectedDistrictName} ({automaticPincodeList.length} PINs)
              </option>
              {subDivisionList.map((sub) => (
                <option key={sub.name} value={sub.name}>
                  {sub.name} ({sub.pincodes.length} PINs)
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400">
              Division: <strong className="text-slate-700">{selectedSubDivisionName === 'ALL' ? 'All Divisions' : selectedSubDivisionName}</strong>
            </p>
          </div>
        </div>

        {/* Selected Area Breadcrumb / Path */}
        <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80 flex items-center flex-wrap gap-2 text-xs">
          <span className="text-slate-400 font-semibold">Active Path:</span>
          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {selectedStateName}
          </span>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            {selectedDistrictName || 'All Districts'}
          </span>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
            {selectedSubDivisionName === 'ALL' ? 'All Sub-divisions' : selectedSubDivisionName}
          </span>
          <span className="ml-auto text-[11px] font-bold text-slate-500">
            Total {automaticPincodeList.length} Automatic PIN Codes
          </span>
        </div>
      </div>

      {/* Automatic Pincode List Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Controls Topbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-slate-700" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Automatic PIN Code List ({displayedPincodes.length} shown)
            </h4>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Filter Search */}
            <div className="relative">
              <input
                type="text"
                value={pincodeSearchQuery}
                onChange={(e) => setPincodeSearchQuery(e.target.value)}
                placeholder="Filter by PIN or Locality..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-blue-500 w-44"
              />
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="all">All Status</option>
              <option value="active">Delivering Only</option>
              <option value="inactive">Excluded Only</option>
            </select>

            {/* Bulk Actions with explicit scope */}
            <button
              type="button"
              onClick={handleBulkEnable}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title={`Enable all in ${selectedSubDivisionName === 'ALL' ? selectedDistrictName + ' District' : selectedSubDivisionName + ' Division'}`}
            >
              Enable All ({displayedPincodes.length})
            </button>
            <button
              type="button"
              onClick={handleBulkDisable}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title={`Disable all in ${selectedSubDivisionName === 'ALL' ? selectedDistrictName + ' District' : selectedSubDivisionName + ' Division'}`}
            >
              Disable All ({displayedPincodes.length})
            </button>
            <button
              type="button"
              onClick={() => setIsAddingCustom(!isAddingCustom)}
              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus size={13} />
              Add PIN
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              title="Download CSV"
            >
              <Download size={13} />
              CSV
            </button>
          </div>
        </div>

        {/* Add Custom PIN Dropdown Form */}
        {isAddingCustom && (
          <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex flex-col md:flex-row items-center gap-3 text-xs">
            <span className="font-bold text-blue-900 shrink-0">Add PIN to {selectedDistrictName}:</span>
            <input
              type="text"
              value={customPinInput}
              onChange={(e) => setCustomPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit PIN code"
              className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-mono font-bold w-36"
            />
            <input
              type="text"
              value={customOfficeName}
              onChange={(e) => setCustomOfficeName(e.target.value)}
              placeholder="Post office / locality name"
              className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs flex-1"
            />
            <button
              type="button"
              onClick={handleAddCustomPin}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer shrink-0"
            >
              Save PIN
            </button>
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer shrink-0"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200">
                <th className="p-3 w-28">PIN Code</th>
                <th className="p-3">Post Office / Locality</th>
                <th className="p-3">Sub-division / Division</th>
                <th className="p-3">District & State</th>
                <th className="p-3 w-36">Delivery Speed</th>
                <th className="p-3 w-24">COD</th>
                <th className="p-3 w-32 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedPincodes.length > 0 ? (
                displayedPincodes.map((item) => (
                  <tr
                    key={item.pincode}
                    className={`transition-colors ${
                      item.isActive ? 'hover:bg-blue-50/40' : 'bg-slate-50/60 opacity-60'
                    }`}
                  >
                    {/* PIN Code */}
                    <td className="p-3">
                      <PincodeDisplay pincode={item.pincode} badge />
                    </td>

                    {/* Office Name */}
                    <td className="p-3 font-semibold text-slate-900">
                      {item.officeName}
                    </td>

                    {/* Sub-division */}
                    <td className="p-3 text-slate-600">
                      <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                        {item.division}
                      </span>
                    </td>

                    {/* District & State */}
                    <td className="p-3 text-slate-500">
                      {item.district}, {item.state}
                    </td>

                    {/* Delivery Speed Dropdown */}
                    <td className="p-3">
                      <select
                        value={item.deliveryType || 'Standard'}
                        onChange={(e) => handleUpdateDeliveryType(item.pincode, e.target.value as any)}
                        disabled={!item.isActive}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 cursor-pointer disabled:opacity-40"
                      >
                        <option value="SameDay">⚡ Same Day (1d)</option>
                        <option value="Express">🚀 Express (2d)</option>
                        <option value="Standard">📦 Standard (3-5d)</option>
                      </select>
                    </td>

                    {/* COD Option */}
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleToggleCod(item.pincode, item.codAvailable ?? true)}
                        disabled={!item.isActive}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          item.codAvailable
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {item.codAvailable ? 'COD ✓' : 'Prepaid'}
                      </button>
                    </td>

                    {/* Delivering Toggle Switch */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePincode(item.pincode, item.isActive ?? true)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                          item.isActive
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                        }`}
                      >
                        {item.isActive ? (
                          <>
                            <CheckCircle2 size={12} />
                            Delivering
                          </>
                        ) : (
                          <>
                            <XCircle size={12} />
                            Excluded
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <MapPin size={24} className="mx-auto text-slate-400 mb-2" />
                    <p className="font-semibold text-slate-700">No PIN codes found for this criteria.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Use the "Add PIN" button above to register a custom PIN code into this district and division.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Showing <strong>{displayedPincodes.length}</strong> PIN codes &bull; Delivering:{' '}
            <strong className="text-emerald-600">
              {displayedPincodes.filter((p) => p.isActive).length}
            </strong>{' '}
            &bull; Excluded:{' '}
            <strong className="text-rose-600">
              {displayedPincodes.filter((p) => !p.isActive).length}
            </strong>
          </div>
          <div className="text-[11px]">
            Coverage Mode: <strong className="text-slate-800">{localConfig.mode}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
