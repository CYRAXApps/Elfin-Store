import React from 'react';
import { Check, Clock, Package, Truck, CheckCircle2, XCircle, RotateCcw, DollarSign } from 'lucide-react';
import { Order } from '../../../types';
import { formatOrderDateTime } from './orderUtils';

interface OrderTimelineProps {
  order: Order;
}

export function OrderTimeline({ order }: OrderTimelineProps) {
  const isCancelled = order.status === 'cancelled';
  const isReturned = order.status === 'returned';
  const isRefunded = order.status === 'refunded';

  // Standard progressive flow
  const steps = [
    {
      key: 'placed',
      title: 'Order Placed',
      desc: 'Customer submitted checkout',
      icon: Package,
      time: order.createdAt ? formatOrderDateTime(order.createdAt) : undefined,
      isCompleted: true, // Always completed once order exists
      isActive: order.status === 'pending'
    },
    {
      key: 'payment',
      title: 'Payment Confirmed',
      desc: order.payment?.paymentStatus === 'captured' 
        ? `${order.payment?.provider || 'Razorpay'} Verified` 
        : (order.payment?.paymentStatus === 'refunded' ? 'Refunded' : 'Awaiting confirmation'),
      icon: CheckCircle2,
      time: order.payment?.verifiedAt ? formatOrderDateTime(order.payment.verifiedAt) : undefined,
      isCompleted: order.payment?.paymentStatus === 'captured' || ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'].includes(order.status),
      isActive: order.status === 'confirmed'
    },
    {
      key: 'processing',
      title: 'Processing',
      desc: 'Packed & ready at warehouse',
      icon: Clock,
      time: order.status === 'processing' && order.updatedAt ? formatOrderDateTime(order.updatedAt) : undefined,
      isCompleted: ['processing', 'shipped', 'out_for_delivery', 'delivered'].includes(order.status),
      isActive: order.status === 'processing'
    },
    {
      key: 'shipped',
      title: 'Shipped',
      desc: order.carrier ? `${order.carrier}${order.trackingNumber ? ` (#${order.trackingNumber})` : ''}` : 'In Transit',
      icon: Truck,
      time: (['shipped', 'out_for_delivery', 'delivered'].includes(order.status)) && order.updatedAt ? formatOrderDateTime(order.updatedAt) : undefined,
      isCompleted: ['shipped', 'out_for_delivery', 'delivered'].includes(order.status),
      isActive: order.status === 'shipped' || order.status === 'out_for_delivery'
    },
    {
      key: 'delivered',
      title: 'Delivered',
      desc: order.estimatedDelivery ? `Est: ${order.estimatedDelivery}` : 'Delivered to customer',
      icon: Check,
      time: order.status === 'delivered' && order.updatedAt ? formatOrderDateTime(order.updatedAt) : undefined,
      isCompleted: order.status === 'delivered',
      isActive: order.status === 'delivered'
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Clock size={14} className="text-blue-600" /> Order Timeline & Journey
        </h3>
        {order.estimatedDelivery && order.status !== 'delivered' && !isCancelled && (
          <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            Est. Delivery: <strong className="text-slate-800 font-bold">{order.estimatedDelivery}</strong>
          </span>
        )}
      </div>

      {/* Exception banner if Cancelled / Returned / Refunded */}
      {isCancelled && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
          <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Order Cancelled</p>
            <p className="text-rose-700 mt-0.5">
              {order.cancellationReason || 'This order was cancelled by the store owner.'}
            </p>
            {order.cancelledAt && (
              <p className="text-[11px] text-rose-500 mt-1">
                Cancelled on {formatOrderDateTime(order.cancelledAt)}
              </p>
            )}
          </div>
        </div>
      )}

      {isReturned && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-2.5 text-xs text-orange-800">
          <RotateCcw size={18} className="text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Order Returned</p>
            <p className="text-orange-700 mt-0.5">
              {order.returnReason || 'Item returned by customer and received at warehouse.'}
            </p>
            {order.returnedAt && (
              <p className="text-[11px] text-orange-500 mt-1">
                Returned on {formatOrderDateTime(order.returnedAt)}
              </p>
            )}
          </div>
        </div>
      )}

      {isRefunded && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-2.5 text-xs text-purple-800">
          <DollarSign size={18} className="text-purple-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Order Refunded</p>
            <p className="text-purple-700 mt-0.5">
              Refund processed for this order. {order.payment?.refundId ? `Gateway Ref: ${order.payment.refundId}` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Horizontal / Vertical Stepper */}
      <div className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isFinished = step.isCompleted && !isCancelled;
            const isCurrent = step.isActive && !isCancelled;

            return (
              <div 
                key={step.key}
                className={`relative flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 p-2.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-blue-50/80 border-blue-200 shadow-sm'
                    : isFinished
                    ? 'bg-slate-50/70 border-slate-200'
                    : 'bg-white border-dashed border-slate-200 opacity-60'
                }`}
              >
                {/* Node icon */}
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isFinished
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Icon size={14} />
                </div>

                <div className="flex-1 sm:text-center min-w-0">
                  <p className={`text-xs font-bold leading-tight ${isCurrent ? 'text-blue-900' : isFinished ? 'text-slate-800' : 'text-slate-400'}`}>
                    {step.title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5" title={step.desc}>
                    {step.desc}
                  </p>
                  {step.time && (
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {step.time}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
