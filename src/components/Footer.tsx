import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Facebook, Twitter, Instagram, Youtube, Linkedin, MessageCircle,
  Phone, Mail, MapPin, Clock, ShieldCheck, CreditCard, Send, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

export function Footer() {
  const { settings } = useSiteSettings();
  const footer = settings.footer;
  const general = settings.general;

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsletterFeedback, setNewsletterFeedback] = useState<{
    type: 'success' | 'already' | 'error';
    text: string;
  } | null>(null);

  if (footer?.enabled === false) {
    return null;
  }

  const storeName = general?.storeName || '';
  const shortStoreName = general?.shortStoreName || (storeName ? storeName.split(' ')[0] : '');

  let logoPart1 = shortStoreName || storeName || 'Store';
  let logoPart2 = '';

  if (storeName && shortStoreName && storeName.toLowerCase().startsWith(shortStoreName.toLowerCase())) {
    logoPart1 = storeName.slice(0, shortStoreName.length);
    logoPart2 = storeName.slice(shortStoreName.length).trim();
  } else if (storeName) {
    const parts = storeName.split(' ');
    logoPart1 = parts[0];
    logoPart2 = parts.slice(1).join(' ');
  }

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawEmail = newsletterEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!rawEmail || !emailRegex.test(rawEmail)) {
      setNewsletterFeedback({
        type: 'error',
        text: 'Please enter a valid email address.'
      });
      setTimeout(() => setNewsletterFeedback(null), 5000);
      return;
    }

    setIsSubmitting(true);
    setNewsletterFeedback(null);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: rawEmail })
      });

      const data = await res.json();

      if (!res.ok) {
        setNewsletterFeedback({
          type: 'error',
          text: data?.error || 'Something went wrong. Please try again.'
        });
      } else if (data.alreadySubscribed) {
        setNewsletterFeedback({
          type: 'already',
          text: "You're already subscribed."
        });
        setNewsletterEmail('');
      } else {
        setNewsletterFeedback({
          type: 'success',
          text: "You're subscribed!"
        });
        setNewsletterEmail('');
      }
    } catch (err) {
      setNewsletterFeedback({
        type: 'error',
        text: 'Something went wrong. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNewsletterFeedback(null), 5000);
    }
  };

  const activeColumns = (footer?.columns || [])
    .filter(col => col.enabled !== false)
    .sort((a, b) => (a.sortOrder ?? (a as any).order ?? 0) - (b.sortOrder ?? (b as any).order ?? 0));

  return (
    <footer className="bg-slate-950 text-slate-400 pt-12 sm:pt-16 pb-8 border-t border-slate-900">
      <div className="container mx-auto px-4 sm:px-4 max-w-7xl">
        
        {/* Optional Newsletter Section */}
        {footer?.showNewsletter !== false && (
          <div className="mb-12 pb-12 border-b border-slate-800/80">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-xl text-center lg:text-left">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-1 block">Stay In The Loop</span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {footer?.newsletterTitle || 'Subscribe to VIP Flash Deals & Drops'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {footer?.newsletterSubtitle || 'Receive curated discounts, tech release notifications, and exclusive subscriber coupon codes.'}
                </p>
              </div>

              <div className="w-full lg:w-auto min-w-[320px] max-w-md">
                {newsletterFeedback ? (
                  <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${
                    newsletterFeedback.type === 'error'
                      ? 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
                      : newsletterFeedback.type === 'already'
                      ? 'bg-amber-950/80 border border-amber-500/40 text-amber-300'
                      : 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                  }`}>
                    {newsletterFeedback.type === 'error' ? (
                      <AlertCircle size={16} className="text-rose-400 shrink-0" />
                    ) : (
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    )}
                    <span>{newsletterFeedback.text}</span>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder={footer?.newsletterPlaceholder || 'Enter your email address'}
                      required
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500 disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>
                        {isSubmitting
                          ? 'Subscribing...'
                          : (footer?.newsletterButtonText || 'Subscribe')}
                      </span>
                      <Send size={13} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-12 mb-12">
          
          {/* Brand & Bio Column */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              {(() => {
                const footerLogo = (footer?.footerLogo || footer?.customLogoUrl || settings.branding?.primaryLogo || general?.storeLogoUrl || '/assets/logo.svg').trim();
                if (footerLogo) {
                  return (
                    <img
                      src={footerLogo}
                      alt={storeName}
                      className="object-contain object-left shrink-0"
                      style={{
                        width: 'auto',
                        maxWidth: `${settings.branding?.logoSizes?.footerWidth || 160}px`,
                        height: 'auto',
                        maxHeight: '50px',
                        objectFit: 'contain',
                        objectPosition: 'left center'
                      }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.endsWith('/assets/logo.svg')) {
                          target.src = '/assets/logo.svg';
                        }
                      }}
                    />
                  );
                }
                return (
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-1">
                    <span className="text-blue-500">{logoPart1}</span>
                    {logoPart2 && <span>{logoPart2}</span>}
                  </span>
                );
              })()}
            </div>

            {(footer?.aboutText || general?.storeDescription) && (
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pr-4">
                {footer?.aboutText || general?.storeDescription}
              </p>
            )}

            {/* Contact Details */}
            {footer?.showContactInfo !== false && (() => {
              const displayPhone = footer?.phone || general?.phone || settings.contact?.phone;
              const displayEmail = footer?.email || general?.storeEmail || settings.contact?.email;
              const displayAddress = footer?.address || general?.businessAddress || settings.contact?.address;
              const displayHours = footer?.businessHours || general?.businessHours || settings.contact?.openingHours;

              if (!displayPhone && !displayEmail && !displayAddress && !displayHours) return null;

              return (
                <div className="flex flex-col gap-3 text-xs sm:text-sm text-slate-300">
                  {displayPhone && (
                    <div className="flex items-center gap-3">
                      <Phone size={15} className="text-blue-500 shrink-0" />
                      <span>{displayPhone}</span>
                    </div>
                  )}
                  {displayEmail && (
                    <div className="flex items-center gap-3">
                      <Mail size={15} className="text-blue-500 shrink-0" />
                      <span>{displayEmail}</span>
                    </div>
                  )}
                  {displayAddress && (
                    <div className="flex items-start gap-3">
                      <MapPin size={15} className="text-blue-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{displayAddress}</span>
                    </div>
                  )}
                  {displayHours && (
                    <div className="flex items-center gap-3 text-slate-400">
                      <Clock size={15} className="text-blue-500 shrink-0" />
                      <span>{displayHours}</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Spacer */}
          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Dynamic Navigation Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {activeColumns.length > 0 ? (
              activeColumns.map((col) => (
                <div key={col.id} className="space-y-4">
                  <h4 className="text-white font-bold uppercase tracking-wider text-xs">{col.title}</h4>
                  <ul className="space-y-2.5 text-xs font-medium">
                    {col.links?.map((link, i) => (
                      <li key={i}>
                        <Link to={link.url} className="text-slate-400 hover:text-blue-400 transition-colors">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <>
                <div className="space-y-4">
                  <h4 className="text-white font-bold uppercase tracking-wider text-xs">Categories</h4>
                  <ul className="space-y-2.5 text-xs font-medium">
                    <li><Link to="/shop?category=Smartphones" className="text-slate-400 hover:text-blue-400 transition-colors">Smartphones</Link></li>
                    <li><Link to="/shop?category=Laptops" className="text-slate-400 hover:text-blue-400 transition-colors">Laptops & PCs</Link></li>
                    <li><Link to="/shop?category=Audio" className="text-slate-400 hover:text-blue-400 transition-colors">Audio & Headphones</Link></li>
                    <li><Link to="/shop?category=Wearables" className="text-slate-400 hover:text-blue-400 transition-colors">Smart Wearables</Link></li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="text-white font-bold uppercase tracking-wider text-xs">Customer Support</h4>
                  <ul className="space-y-2.5 text-xs font-medium">
                    <li><Link to="/orders" className="text-slate-400 hover:text-blue-400 transition-colors">Track Your Order</Link></li>
                    <li><Link to="/support" className="text-slate-400 hover:text-blue-400 transition-colors">Help Center & FAQs</Link></li>
                    <li><Link to="/support?tab=warranty" className="text-slate-400 hover:text-blue-400 transition-colors">Warranty Claims</Link></li>
                    <li><Link to="/support?tab=returns" className="text-slate-400 hover:text-blue-400 transition-colors">Returns & Refunds</Link></li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="text-white font-bold uppercase tracking-wider text-xs">Company</h4>
                  <ul className="space-y-2.5 text-xs font-medium">
                    <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors">About Electro Store</Link></li>
                    <li><Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                    <li><Link to="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
                    <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact Us</Link></li>
                  </ul>
                </div>
              </>
            )}
          </div>

        </div>

        {/* Badges Bar (Payment & Security) */}
        {((footer?.showPaymentBadges !== false && (footer?.paymentBadges?.length || 0) > 0) ||
          (footer?.showSecurityBadges !== false && (footer?.securityBadges?.length || 0) > 0)) && (
          <div className="pt-8 pb-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
            {footer?.showSecurityBadges !== false && (footer?.securityBadges?.length || 0) > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Security & Trust:</span>
                <div className="flex flex-wrap gap-2">
                  {footer.securityBadges.map((badge, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-emerald-400" /> {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {footer?.showPaymentBadges !== false && (footer?.paymentBadges?.length || 0) > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Accepted Payment:</span>
                <div className="flex flex-wrap gap-2">
                  {footer.paymentBadges.map((badge, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
                      <CreditCard size={12} className="text-blue-400" /> {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Bar: Copyright, Bottom Links & Socials */}
        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-500 font-medium">
          <p>
            &copy; {footer?.copyrightYear || new Date().getFullYear()}{' '}
            {footer?.copyrightText || `${general?.storeName || 'Store'}. All rights reserved.`}
          </p>

          {/* Bottom Legal Links */}
          {footer?.bottomLinks && footer.bottomLinks.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {footer.bottomLinks.map((bl, i) => (
                <Link key={i} to={bl.url} className="hover:text-slate-300 transition-colors">
                  {bl.label}
                </Link>
              ))}
            </div>
          )}

          {/* Social Links */}
          {(footer?.showSocialLinks !== false && settings.socialMedia?.showSocialIcons !== false && settings.socialMedia?.showInFooter !== false) && (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {(settings.socialMedia?.facebookEnabled !== false && (settings.socialMedia?.facebookUrl || footer?.socialLinks?.facebook)) && (
                <a
                  href={settings.socialMedia?.facebookUrl || footer?.socialLinks?.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="p-2 bg-slate-900 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <Facebook size={15} />
                </a>
              )}
              {(settings.socialMedia?.xEnabled !== false && (settings.socialMedia?.xUrl || footer?.socialLinks?.twitter)) && (
                <a
                  href={settings.socialMedia?.xUrl || footer?.socialLinks?.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="p-2 bg-slate-900 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <Twitter size={15} />
                </a>
              )}
              {(settings.socialMedia?.instagramEnabled !== false && (settings.socialMedia?.instagramUrl || footer?.socialLinks?.instagram)) && (
                <a
                  href={settings.socialMedia?.instagramUrl || footer?.socialLinks?.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="p-2 bg-slate-900 hover:bg-pink-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <Instagram size={15} />
                </a>
              )}
              {(settings.socialMedia?.youtubeEnabled !== false && (settings.socialMedia?.youtubeUrl || footer?.socialLinks?.youtube)) && (
                <a
                  href={settings.socialMedia?.youtubeUrl || footer?.socialLinks?.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="p-2 bg-slate-900 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <Youtube size={15} />
                </a>
              )}
              {(settings.socialMedia?.linkedinEnabled !== false && (settings.socialMedia?.linkedinUrl || footer?.socialLinks?.linkedin)) && (
                <a
                  href={settings.socialMedia?.linkedinUrl || footer?.socialLinks?.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="p-2 bg-slate-900 hover:bg-blue-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <Linkedin size={15} />
                </a>
              )}
              {(settings.socialMedia?.whatsappEnabled !== false && (settings.socialMedia?.whatsappUrl || footer?.socialLinks?.whatsapp)) && (
                <a
                  href={
                    (settings.socialMedia?.whatsappUrl || footer?.socialLinks?.whatsapp || '').startsWith('http')
                      ? (settings.socialMedia?.whatsappUrl || footer?.socialLinks?.whatsapp)
                      : `https://wa.me/${(settings.socialMedia?.whatsappUrl || footer?.socialLinks?.whatsapp || '').replace(/[^0-9]/g, '')}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="p-2 bg-slate-900 hover:bg-emerald-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <MessageCircle size={15} />
                </a>
              )}
            </div>
          )}
        </div>

      </div>
    </footer>
  );
}

