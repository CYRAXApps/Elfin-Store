import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { useSiteSettings } from '../context/SiteSettingsContext';

export function ContactUs() {
  const { settings } = useSiteSettings();

  const businessInfo = {
    businessName: settings.general?.storeName || settings.contact?.businessName || 'ELECTRO STORE',
    businessAddress: settings.general?.businessAddress || settings.contact?.address || '',
    businessPhone: settings.general?.phone || settings.contact?.phone || '',
    businessEmail: settings.general?.storeEmail || settings.contact?.email || '',
    supportPhone: settings.general?.phone || settings.contact?.phone || '',
    supportEmail: settings.general?.supportEmail || settings.contact?.supportEmail || settings.contact?.email || '',
    businessHours: settings.general?.businessHours || settings.contact?.openingHours || settings.footer?.businessHours || '',
    gstin: settings.tax?.gstin || settings.contact?.gstin || ''
  };

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Strict validation
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setErrorMsg('Please fill in your name, email address, and message.');
      setSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      setSubmitting(false);
      return;
    }

    try {
      let inquiryId = `INQ-${Math.floor(100000 + Math.random() * 900000)}`;

      // Submit through authoritative server endpoint (handles validation, rate limiting & notification dispatch)
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, inquiryId })
        });
        const resData = await response.json();
        if (response.ok && resData.success) {
          inquiryId = resData.inquiryId || inquiryId;
        } else if (!response.ok) {
          throw new Error(resData.error || 'Failed to submit inquiry through server');
        }
      } catch (apiErr: any) {
        // Resilient fallback: direct write to Firestore collection 'inquiries' if offline/API fails
        const nowIso = new Date().toISOString();
        const inquiryData = {
          inquiryId,
          name: form.name.trim().slice(0, 100),
          email: form.email.trim().toLowerCase().slice(0, 150),
          phone: form.phone.trim().slice(0, 25),
          subject: form.subject.trim().slice(0, 200) || 'General Inquiry',
          message: form.message.trim().slice(0, 5000),
          status: 'new',
          internalNotes: [],
          createdAt: nowIso,
          updatedAt: nowIso
        };
        await addDoc(collection(db, 'inquiries'), inquiryData);
      }

      setSuccessMsg(`Your inquiry has been received (ID: ${inquiryId}). Our team will respond shortly.`);
      setForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 max-w-6xl pt-4 pb-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
          Get in Touch
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3 tracking-tight">
          We're Here to Help
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-2">
          Have a question regarding products, order tracking, warranty claims, or enterprise purchases? Reach out to our dedicated support team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Contact Info Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-8 space-y-6">
            <h3 className="text-xl font-bold">Contact Information</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fill out the form or reach out directly through our verified customer care channels.
            </p>

            <div className="space-y-4 text-xs pt-2">
              {(businessInfo.supportPhone || businessInfo.businessPhone) && (
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Support Hotline</p>
                    <p className="font-semibold text-white">{businessInfo.supportPhone || businessInfo.businessPhone}</p>
                    {businessInfo.businessHours && (
                      <p className="text-[10px] text-slate-400">{businessInfo.businessHours}</p>
                    )}
                  </div>
                </div>
              )}

              {(businessInfo.supportEmail || businessInfo.businessEmail) && (
                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Support Email</p>
                    <p className="font-semibold text-white">{businessInfo.supportEmail || businessInfo.businessEmail}</p>
                    <p className="text-[10px] text-slate-400">Response within 24 business hours</p>
                  </div>
                </div>
              )}

              {businessInfo.businessAddress && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Registered Office</p>
                    <p className="font-semibold text-white leading-relaxed">{businessInfo.businessAddress}</p>
                  </div>
                </div>
              )}

              {businessInfo.gstin && (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <span className="text-slate-500">GSTIN: </span>
                  <span className="font-mono text-slate-300 font-bold">{businessInfo.gstin}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-xs text-blue-900 flex items-start gap-3">
            <ShieldCheck size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-blue-950 mb-1">Official Authorized Store</h4>
              <p className="text-slate-600 leading-relaxed">
                All order transactions and customer data are protected by strict privacy guidelines and encrypted infrastructure.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Send Us a Message</h3>

            {successMsg && (
              <div className="p-4 mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-xs font-semibold">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 mb-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 text-xs font-semibold">
                <AlertCircle size={18} className="text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter full name"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:border-blue-600 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:border-blue-600 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">Mobile / Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Enter mobile number"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:border-blue-600 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Enter subject"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:border-blue-600 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">Message *</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Enter your message"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:border-blue-600 text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Send size={14} />
                {submitting ? 'Sending Message...' : 'Send Inquiry'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
