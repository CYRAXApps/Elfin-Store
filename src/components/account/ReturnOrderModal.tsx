import React, { useState, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  CreditCard,
  Camera,
  Trash2
} from 'lucide-react';
import { Order, OrderItem } from '../../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
import { formatFullAddressString } from '../../services/pincodeService';

interface ReturnOrderModalProps {
  order: Order;
  preSelectedProductId?: string;
  userId: string;
  userEmail: string;
  userName: string;
  onClose: () => void;
  onSuccess: (returnId: string) => void;
}

interface ReturnItemSelection {
  selected: boolean;
  quantity: number;
  reason: string;
  condition: string;
  resolution: 'refund' | 'replacement';
  imageFile?: File | null;
  imagePreview?: string | null;
}

export function ReturnOrderModal({
  order,
  preSelectedProductId,
  userId,
  userEmail,
  userName,
  onClose,
  onSuccess
}: ReturnOrderModalProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, ReturnItemSelection>>({});

  const [overallReason, setOverallReason] = useState<string>('Defective or Not Working');
  const [comments, setComments] = useState<string>('');
  const [preferredResolution, setPreferredResolution] = useState<'refund' | 'replacement'>('refund');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize selection state for all items
  useEffect(() => {
    const initial: Record<string, any> = {};
    (order?.items || []).forEach((item) => {
      const pId = item.productId || `prod-${(item.name || 'item').toLowerCase().replace(/\s+/g, '-')}`;
      const isPreSelected = preSelectedProductId ? pId === preSelectedProductId : true;
      initial[pId] = {
        selected: isPreSelected,
        quantity: item.quantity || 1,
        reason: 'Defective or Not Working',
        condition: 'Opened - with original box and accessories',
        resolution: 'refund'
      };
    });
    setSelectedItems(initial);
  }, [order, preSelectedProductId]);

  const toggleItemSelection = (pId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [pId]: {
        ...prev[pId],
        selected: !prev[pId]?.selected
      }
    }));
  };

  const updateItemQty = (pId: string, qty: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [pId]: {
        ...prev[pId],
        quantity: Math.max(1, qty)
      }
    }));
  };

  
  const updateItemImage = (pId: string, file: File | null) => {
    setSelectedItems((prev) => ({
      ...prev,
      [pId]: {
        ...prev[pId],
        imageFile: file,
        imagePreview: file ? URL.createObjectURL(file) : null
      }
    }));
  };

  const updateItemReason = (pId: string, reason: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [pId]: {
        ...prev[pId],
        reason
      }
    }));
  };

  const selectedCount = Object.keys(selectedItems).filter((k) => selectedItems[k]?.selected).length;

    const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrorMsg(null);

    const itemsToReturn: any[] = [];
    try {
      for (const item of order.items) {
        const pId = item.productId || `prod-${item.name.toLowerCase().replace(/\s+/g, '-')}`;
        const sel = selectedItems[pId];
        if (sel && sel.selected) {
          if (!sel.imageFile && !sel.imagePreview) {
            setErrorMsg(`Photo proof is mandatory for return/replacement requests. Please attach a photo for "${item.name}".`);
            setSubmitting(false);
            return;
          }

          let uploadedImageUrl = null;
          if (sel.imageFile) {
            try {
              const imageRef = ref(storage, `returns/${order.id}/${pId}_${Date.now()}`);
              const uploadWithTimeout = () => {
                return new Promise<any>((resolve, reject) => {
                  const timeout = setTimeout(() => {
                    reject(new Error("Firebase Storage timeout"));
                  }, 4000); 
                  uploadBytes(imageRef, sel.imageFile!)
                    .then((snapshot) => { clearTimeout(timeout); resolve(snapshot); })
                    .catch((err) => { clearTimeout(timeout); reject(err); });
                });
              };
              const snapshot = await uploadWithTimeout();
              uploadedImageUrl = await getDownloadURL(snapshot.ref);
            } catch (err) {
              console.warn("Firebase Storage upload timed out, converting to local data url fallback", err);
              // Read file as base64 Data URL fallback so photo is never lost
              try {
                uploadedImageUrl = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = () => resolve('');
                  reader.readAsDataURL(sel.imageFile!);
                });
              } catch (readErr) {
                console.error("Failed to read image file", readErr);
              }
            }
          }

          itemsToReturn.push({
            productId: pId,
            productName: item.name,
            sku: item.sku || '',
            quantity: sel.quantity || 1,
            unitPrice: item.unitPrice,
            reason: sel.reason || overallReason,
            condition: sel.condition || 'Opened with packaging',
            requestedResolution: preferredResolution,
            image: uploadedImageUrl
          });
        }
      }

      if (itemsToReturn.length === 0) {
        setErrorMsg('Please select at least one item to return or replace.');
        setSubmitting(false);
        return;
      }

      const payload = {
        orderId: order.id,
        userId,
        customerName: userName || userEmail.split('@')[0] || 'Customer',
        customerEmail: userEmail,
        items: itemsToReturn,
        overallReason,
        requestedResolution: preferredResolution,
        comments: comments.trim(),
        pickupAddress: order.shippingAddress
      };

      const res = await fetch('/api/support/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then((r) => r.json());

      if (res.success || res.id) {
        const retNum = res.returnNumber || res.id || 'RET-' + Date.now().toString().slice(-6);
        setSuccessMsg(`Return / Replacement request #${retNum} submitted successfully! Our logistics partner will contact you for doorstep pickup.`);
        setTimeout(() => {
          onSuccess(res.id || retNum);
        }, 2200);
      } else {
        setErrorMsg(res.error || 'Failed to submit return request. Please try again.');
        setSubmitting(false);
      }
    } catch (err: any) {
      console.error('Error submitting return:', err);
      setErrorMsg(err.message || 'An error occurred while submitting your return request.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <RotateCcw size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Return or Replace Items
              </h3>
              <p className="text-[11px] text-slate-500">
                Order #{order.invoiceNumber || order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmitReturn} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={15} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 7-Day Guarantee Banner */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
            <ShieldCheck size={17} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">7-Day Hassle-Free Return / Replacement Guarantee</p>
              <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                Eligible for doorstep pickup, free return shipping, and instant refund or replacement upon verification.
              </p>
            </div>
          </div>

          {/* Resolution Choice: Refund vs Replacement */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Requested Resolution <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPreferredResolution('refund')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  preferredResolution === 'refund'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <CreditCard size={16} className={preferredResolution === 'refund' ? 'text-blue-600' : 'text-slate-400'} />
                <div>
                  <p className={`text-xs font-bold ${preferredResolution === 'refund' ? 'text-blue-900' : 'text-slate-800'}`}>
                    Refund to Source
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Original payment method / UPI
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPreferredResolution('replacement')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  preferredResolution === 'replacement'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <RefreshCw size={16} className={preferredResolution === 'replacement' ? 'text-blue-600' : 'text-slate-400'} />
                <div>
                  <p className={`text-xs font-bold ${preferredResolution === 'replacement' ? 'text-blue-900' : 'text-slate-800'}`}>
                    Free Replacement
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Same product new unit
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Item Selector List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">
                Select Items to Return / Replace ({selectedCount} of {(order?.items || []).length} selected)
              </label>
            </div>

            <div className="space-y-2.5">
              {(order?.items || []).map((item, idx) => {
                const pId = item.productId || `prod-${(item.name || 'item').toLowerCase().replace(/\s+/g, '-')}`;
                const state: ReturnItemSelection = selectedItems[pId] || {
                  selected: true,
                  quantity: item.quantity,
                  reason: overallReason,
                  condition: 'unopened',
                  resolution: 'refund',
                  imageFile: null,
                  imagePreview: null,
                };
                const optImg = getOptimizedImageUrl(item.image, { width: 100, quality: 75 });

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all ${
                      state.selected
                        ? 'border-blue-300 bg-blue-50/30'
                        : 'border-slate-200 bg-slate-50/40 opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={state.selected}
                        onChange={() => toggleItemSelection(pId)}
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        id={`item-cb-${idx}`}
                      />

                      <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        {optImg ? (
                          <img src={optImg} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                        ) : (
                          <Package size={16} className="text-slate-300 m-auto" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <label htmlFor={`item-cb-${idx}`} className="text-xs font-bold text-slate-900 block truncate cursor-pointer">
                          {item.name}
                        </label>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          ₹{Number(item.unitPrice ?? item.price ?? 0).toLocaleString('en-IN')} • Qty: {item.quantity}
                        </p>

                        {state.selected && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                Reason for Item
                              </label>
                              <select
                                value={state.reason}
                                onChange={(e) => updateItemReason(pId, e.target.value)}
                                className="w-full text-[11px] p-1.5 rounded-lg border border-slate-200 bg-white"
                              >
                                <option value="Defective or Not Working">Defective or Not Working</option>
                                <option value="Damaged in Transit">Damaged in Transit</option>
                                <option value="Wrong Item / Spec Received">Wrong Item / Spec Received</option>
                                <option value="Missing Accessories in Box">Missing Accessories in Box</option>
                                <option value="Quality Not as Expected">Quality Not as Expected</option>
                                <option value="No Longer Needed">No Longer Needed</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                Return Quantity (Max: {item.quantity})
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={item.quantity}
                                value={state.quantity}
                                onChange={(e) => updateItemQty(pId, parseInt(e.target.value) || 1)}
                                className="w-full text-[11px] p-1.5 rounded-lg border border-slate-200 bg-white"
                              />
                            </div>
                            
                            {/* Photo Upload for Item */}
                            <div className="col-span-1 sm:col-span-2 mt-2">
                              <label className="flex items-center justify-between text-[10px] font-bold text-slate-700 mb-1">
                                <span>Add Photo <span className="text-rose-500 font-bold">*</span></span>
                                <span className="text-rose-600 font-bold text-[9px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Mandatory</span>
                              </label>
                              {!state.imagePreview ? (
                                <div 
                                  className="w-full h-16 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center cursor-pointer"
                                  onClick={() => document.getElementById(`file-upload-${pId}`)?.click()}
                                >
                                  <div className="flex flex-col items-center text-slate-500">
                                    <Camera size={16} className="mb-0.5" />
                                    <span className="text-[10px] font-semibold">Upload Image</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative inline-block w-16 h-16 rounded-xl border border-slate-200 overflow-hidden group">
                                  <img src={state.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                    <button
                                      type="button"
                                      onClick={() => updateItemImage(pId, null)}
                                      className="p-1 bg-white text-rose-600 hover:bg-rose-50 rounded shadow-sm"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              )}
                              <input 
                                id={`file-upload-${pId}`}
                                type="file" 
                                accept="image/jpeg, image/png, image/webp"
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) updateItemImage(pId, file);
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comments and Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Issue Details & Comments <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={2}
              placeholder="Describe the issue or defect to help our inspection team..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Pickup Address Confirmation */}
          {order.shippingAddress && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
                <MapPin size={12} className="text-slate-500" /> Doorstep Pickup Address
              </span>
              <p className="font-semibold text-slate-900">{order.shippingAddress.fullName} ({order.shippingAddress.phone})</p>
              <p className="text-slate-600 text-[11px] mt-0.5">{formatFullAddressString(order.shippingAddress)}</p>
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedCount === 0 || !!successMsg}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  Submit Request ({preferredResolution === 'refund' ? 'Refund' : 'Replace'})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
