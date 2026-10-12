import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Shield, FileText, Truck, RotateCcw, AlertTriangle,
  Phone, Mail, MessageCircle, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

export function LegalPage() {
  const location = useLocation();
  const path = location.pathname.toLowerCase().replace(/^\//, '');
  const { settings } = useSiteSettings();

  const policies = settings.policies || {};
  const customPages = settings.customPages || [];
  const contact = settings.contact;
  const general = settings.general;

  // Identify matching policy or custom page
  let policyKey = 'terms';
  let title = 'Terms & Conditions';
  let icon = <FileText size={28} className="text-blue-600" />;
  let updatedDate = 'September 2026';
  let content = '';

  if (path.includes('privacy')) {
    policyKey = 'privacy';
    title = policies.privacy?.title || 'Privacy Policy';
    icon = <Shield size={28} className="text-blue-600" />;
    content = policies.privacy?.content || '';
    updatedDate = policies.privacy?.lastUpdated || updatedDate;
  } else if (path.includes('shipping')) {
    policyKey = 'shipping';
    title = policies.shipping?.title || 'Shipping & Delivery Policy';
    icon = <Truck size={28} className="text-blue-600" />;
    content = policies.shipping?.content || '';
    updatedDate = policies.shipping?.lastUpdated || updatedDate;
  } else if (path.includes('return') || path.includes('refund') || path.includes('cancellation')) {
    policyKey = path.includes('cancellation') ? 'cancellation' : (path.includes('refund') ? 'refund' : 'return');
    title = policies[policyKey]?.title || 'Returns & Refunds Policy';
    icon = <RotateCcw size={28} className="text-blue-600" />;
    content = policies[policyKey]?.content || '';
    updatedDate = policies[policyKey]?.lastUpdated || updatedDate;
  } else if (path.includes('warranty')) {
    policyKey = 'warranty';
    title = policies.warranty?.title || 'Warranty & RMA Policy';
    icon = <Shield size={28} className="text-blue-600" />;
    content = policies.warranty?.content || '';
    updatedDate = policies.warranty?.lastUpdated || updatedDate;
  } else {
    // Check if custom page matches
    const matchedCustomPage = customPages.find(p => p.slug.toLowerCase() === path || path.includes(p.slug.toLowerCase()));
    if (matchedCustomPage) {
      title = matchedCustomPage.title;
      content = matchedCustomPage.content;
      updatedDate = matchedCustomPage.updatedAt || updatedDate;
    } else {
      policyKey = 'terms';
      title = policies.terms?.title || 'Terms of Service';
      icon = <FileText size={28} className="text-blue-600" />;
      content = policies.terms?.content || '';
      updatedDate = policies.terms?.lastUpdated || updatedDate;
    }
  }

  const storeLegalName = contact.businessName || general.storeName || 'ELECTRO STORE';
  const supportPhone = contact.phone || general.phone || '';
  const supportEmail = contact.supportEmail || general.supportEmail || '';
  const whatsappNumber = contact.whatsapp || general.whatsappNumber || '';

  const policyNavItems = [
    { label: 'Shipping & Delivery', path: '/shipping-policy', active: path.includes('shipping') },
    { label: 'Returns & Refunds', path: '/returns-refunds', active: path.includes('return') || path.includes('refund') },
    { label: 'Privacy Policy', path: '/privacy', active: path.includes('privacy') },
    { label: 'Terms & Conditions', path: '/terms', active: path.includes('terms') || (!path.includes('shipping') && !path.includes('return') && !path.includes('privacy')) },
  ];

  return (
    <div className="container mx-auto px-3 sm:px-4 max-w-6xl pt-4 pb-10 sm:pb-14">
      {/* Top Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full">
          Store Trust & Legal Guidelines
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3 tracking-tight">
          {title}
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-2">
          Last updated: {updatedDate} • {storeLegalName}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar Navigation */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-2">
              Legal & Store Policies
            </h3>
            {policyNavItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  item.active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{item.label}</span>
                <ChevronRight size={14} className={item.active ? 'text-white' : 'text-slate-400'} />
              </Link>
            ))}

            {/* Also list any custom legal pages */}
            {customPages.filter(p => p.published !== false && p.slug !== 'about' && p.slug !== 'contact').map((cp) => {
              const isActive = path === cp.slug.toLowerCase();
              return (
                <Link
                  key={cp.id}
                  to={`/${cp.slug}`}
                  className={`w-full text-left p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{cp.title}</span>
                  <ChevronRight size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                </Link>
              );
            })}
          </div>

          {/* Customer Support Fast Help */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 shadow-sm">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" /> Have Questions?
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our customer care team is available Mon-Sat to assist with policy questions, warranty claims, or order tracking.
            </p>

            <div className="space-y-2.5 pt-2 text-xs border-t border-slate-800">
              <a href={`tel:${supportPhone}`} className="flex items-center gap-2 text-slate-300 hover:text-blue-400 transition-colors">
                <Phone size={14} className="text-blue-400" /> {supportPhone}
              </a>
              <a href={`mailto:${supportEmail}`} className="flex items-center gap-2 text-slate-300 hover:text-blue-400 transition-colors">
                <Mail size={14} className="text-blue-400" /> {supportEmail}
              </a>
              {whatsappNumber && (
                <a href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-400 hover:underline">
                  <MessageCircle size={14} /> WhatsApp Support
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Main Content */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-3 bg-blue-50 rounded-xl">
                {icon}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">{title}</h2>
                <p className="text-xs text-slate-400">Published by {storeLegalName}</p>
              </div>
            </div>

            {/* Dynamic Content Body */}
            {content ? (
              <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed space-y-4">
                {content}
              </div>
            ) : (
              <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 space-y-6 leading-relaxed">
                {path.includes('privacy') && (
                  <>
                    <section>
                      <h3 className="text-base font-bold text-slate-900 mb-2">1. Information We Collect</h3>
                      <p>
                        {storeLegalName} collects information you provide directly during account registration, checkout, customer inquiries, and device interactions. This includes your name, delivery address, contact email, and telephone number. Payment credentials (card numbers, UPI VPA) are securely processed through Razorpay's PCI-DSS compliant infrastructure and are never stored on our database.
                      </p>
                    </section>
                    <section>
                      <h3 className="text-base font-bold text-slate-900 mb-2">2. How We Use Your Information</h3>
                      <p>
                        Your information is utilized solely to process orders, generate GST tax invoices, provide live shipment tracking updates, and deliver responsive customer support. We do not sell, rent, or trade your personal data with third-party advertisers.
                      </p>
                    </section>
                    <section>
                      <h3 className="text-base font-bold text-slate-900 mb-2">3. Security and Data Protection</h3>
                      <p>
                        We employ 256-bit SSL encryption and strict Firebase security rules to prevent unauthorized access. Session tokens are securely handled and authenticated server-side.
                      </p>
                    </section>
                  </>
                )}

                {path.includes('shipping') && (
                  <>
                    <section>
                      <h3 className="text-base font-bold text-slate-900 mb-2">1. Delivery Timeline & Methods</h3>
                      <p>
                        We dispatch orders within 24 to 48 business hours of payment confirmation. Standard express delivery across India takes approximately 3 to 5 business days depending on the destination PIN code.
                      </p>
                    </section>
                    <section>
                      <h3 className="text-base font-bold text-slate-900 mb-2">2. Shipping Charges</h3>
                      <p>
                        Orders with a cart value equal to or greater than ₹500 qualify for <strong>FREE Standard Express Delivery</strong>. Orders below ₹500 incur a nominal flat shipping fee of ₹50.
                      </p>
                    </section>
                    <section>
                      <h3 className="text-base font-bold text-slate-900 mb-2">3. Real-Time Tracking & Proof of Delivery</h3>
                      <p>
                        Upon handover to our logistics partners (BlueDart, Delhivery, DTDC, XpressBees), a tracking number (AWB) is assigned and updated in your customer account dashboard and order confirmation email.
                      </p>
                    </section>
                  </>
                )}

                {(path.includes('return') || path.includes('refund')) && (
                  <>
                    <section>
                      <h3 className="text-base font-bold text-slate-900 mb-2">1. Return Window</h3>
                      <p>
                        We offer a <strong>7-Day Replacement / Return Guarantee</strong> for products received in damaged condition, defective condition, or differing from the product description.
                      </p>
                    </section>
                    <section>
                      <h3 className="text-base font-bold text-slate-900 mb-2">2. Eligibility Conditions</h3>
                      <p>
                        Items must be returned in their original packaging including box, brand seal, manuals, warranty cards, and all bundled accessories. Serial numbers and IMEI numbers must match our recorded invoice.
                      </p>
                    </section>
                    <section>
                      <h3 className="text-base font-bold text-slate-900 mb-2">3. Refund Processing</h3>
                      <p>
                        Approved refunds are processed back to the original payment source (credit/debit card, UPI account) within 5 to 7 business days following reverse pickup and warehouse inspection.
                      </p>
                    </section>
                  </>
                )}

                {!path.includes('privacy') && !path.includes('shipping') && !path.includes('return') && !path.includes('refund') && (
                  <>
                    <section>
                      <h3 className="text-base font-bold text-slate-900 mb-2">1. Agreement to Terms</h3>
                      <p>
                        By accessing and shopping at {storeLegalName}, you agree to comply with our store terms, privacy standards, and applicable consumer laws. All products sold are 100% brand-new and genuine with manufacturer warranty.
                      </p>
                    </section>
                    <section>
                      <h3 className="text-base font-bold text-slate-900 mb-2">2. Pricing, Invoicing & GST Compliance</h3>
                      <p>
                        All prices listed are in Indian Rupees (INR) and are inclusive of standard 18% Goods and Services Tax (GST). A valid computer-generated GST tax invoice is issued for every transaction.
                      </p>
                    </section>
                    <section>
                      <h3 className="text-base font-bold text-slate-900 mb-2">3. Limitation of Liability</h3>
                      <p>
                        {storeLegalName} shall not be held liable for indirect or consequential damages arising from improper hardware usage or unapproved third-party firmware modifications.
                      </p>
                    </section>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
