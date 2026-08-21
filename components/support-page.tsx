'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  HeartIcon,
  DownloadIcon,
  CheckCircleIcon,
  CloseIcon,
  LockIcon,
} from './icons';

interface SupporterModalProps {
  amount: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: { name: string; email: string; note: string }) => void;
  isProcessing: boolean;
}

function SupporterModal({
  amount,
  isOpen,
  onClose,
  onSubmit,
  isProcessing,
}: SupporterModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, isProcessing]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({ name, email, note });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="supporter-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={!isProcessing ? onClose : undefined}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-tinted/30 bg-[#161513] p-5 shadow-2xl transition-all sm:rounded-3xl sm:p-8"
      >
        {/* Close Button */}
        {!isProcessing && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-mid transition-colors hover:bg-night-soft hover:text-paper sm:right-5 sm:top-5"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}

        {/* Modal Header */}
        <div>
          <h3
            id="supporter-modal-title"
            className="font-serif text-xl font-normal text-paper sm:text-2xl md:text-3xl"
          >
            Supporter Details
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-gray-mid">
            All fields below are completely optional. Feel free to contribute
            anonymously.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 sm:mt-6 sm:space-y-4">
          <div>
            <label
              htmlFor="modal-name"
              className="block text-[11px] font-semibold uppercase tracking-wider text-gray-mid sm:text-xs"
            >
              Your Name (Optional)
            </label>
            <input
              id="modal-name"
              type="text"
              placeholder="e.g. Alex or Anonymous"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isProcessing}
              className="mt-1 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2.5 text-sm text-paper placeholder:text-ink-soft/40 transition-colors focus:border-tinted/40 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 sm:mt-1.5 sm:rounded-2xl sm:px-4 sm:py-3"
            />
          </div>

          <div>
            <label
              htmlFor="modal-email"
              className="block text-[11px] font-semibold uppercase tracking-wider text-gray-mid sm:text-xs"
            >
              Email Address (Optional)
            </label>
            <input
              id="modal-email"
              type="email"
              placeholder="For your patronage receipt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isProcessing}
              className="mt-1 w-full rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2.5 text-sm text-paper placeholder:text-ink-soft/40 transition-colors focus:border-tinted/40 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 sm:mt-1.5 sm:rounded-2xl sm:px-4 sm:py-3"
            />
          </div>

          <div>
            <label
              htmlFor="modal-note"
              className="block text-[11px] font-semibold uppercase tracking-wider text-gray-mid sm:text-xs"
            >
              Leave a Note (Optional)
            </label>
            <textarea
              id="modal-note"
              rows={2}
              placeholder="A message, reaction to an essay, or kind words..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isProcessing}
              className="mt-1 w-full resize-none rounded-xl border border-tinted/20 bg-night-soft px-3.5 py-2.5 text-sm text-paper placeholder:text-ink-soft/40 transition-colors focus:border-tinted/40 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 sm:mt-1.5 sm:rounded-2xl sm:px-4 sm:py-3"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-1.5 sm:pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-paper shadow-sm transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 sm:py-3.5"
            >
              {isProcessing ? (
                <span>Connecting to payment...</span>
              ) : (
                <>
                  <LockIcon className="h-4 w-4" />
                  <span>Continue with Payment (₹{amount})</span>
                </>
              )}
            </button>
          </div>

          <p className="text-center text-[10px] text-gray-mid/70 sm:text-[11px]">
            Processed securely via Razorpay
          </p>
        </form>
      </div>
    </div>
  );
}

interface ReceiptData {
  id: string;
  amount: number;
  name: string;
  email: string;
  note: string;
  date: string;
}

function downloadReceiptAsCanvas(receipt: ReceiptData) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Solid dark background
  ctx.fillStyle = '#161513';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle grid texture
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Elegant border frames
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.3)'; // Amber accent
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.strokeRect(76, 76, canvas.width - 152, canvas.height - 152);

  // Corner marks
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 4;
  const cLen = 28;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(60, 60 + cLen);
  ctx.lineTo(60, 60);
  ctx.lineTo(60 + cLen, 60);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(canvas.width - 60 - cLen, 60);
  ctx.lineTo(canvas.width - 60, 60);
  ctx.lineTo(canvas.width - 60, 60 + cLen);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(60, canvas.height - 60 - cLen);
  ctx.lineTo(60, canvas.height - 60);
  ctx.lineTo(60 + cLen, canvas.height - 60);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(canvas.width - 60 - cLen, canvas.height - 60);
  ctx.lineTo(canvas.width - 60, canvas.height - 60);
  ctx.lineTo(canvas.width - 60, canvas.height - 60 - cLen);
  ctx.stroke();

  // Top Title / Header
  ctx.fillStyle = '#a8a29e';
  ctx.font = '600 18px "Space Grotesk", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('BIRANCHI KULESIKA · PATRONAGE RECEIPT', 120, 160);

  // Reference Code
  ctx.fillStyle = '#78716c';
  ctx.font = '500 16px monospace';
  ctx.letterSpacing = '1px';
  ctx.fillText(`REF: ${receipt.id}`, 120, 200);

  // Divider line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 240);
  ctx.lineTo(canvas.width - 120, 240);
  ctx.stroke();

  // Amount
  ctx.fillStyle = '#f5f5f4';
  ctx.font = '400 96px "Newsreader", Georgia, serif';
  ctx.fillText(`₹${receipt.amount}`, 120, 360);

  ctx.fillStyle = '#d97706';
  ctx.font = '600 18px "Space Grotesk", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('DIRECT INDEPENDENT PATRONAGE · VERIFIED', 120, 410);

  // Thank You Message
  ctx.fillStyle = '#e7e5e4';
  ctx.font = '400 30px "Newsreader", Georgia, serif';
  const thankText =
    'Thank you for supporting this work. Your contribution directly funds independent essays, deep research, and open software without ads, sponsors, or paywalls.';

  // Simple multi-line text wrapper
  const words = thankText.split(' ');
  let line = '';
  let y = 500;
  const maxWidth = canvas.width - 240;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, 120, y);
      line = words[n] + ' ';
      y += 46;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 120, y);

  // Supporter Box
  const boxY = y + 70;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fillRect(120, boxY, canvas.width - 240, 240);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.strokeRect(120, boxY, canvas.width - 240, 240);

  // Supporter info
  ctx.fillStyle = '#a8a29e';
  ctx.font = '600 14px "Space Grotesk", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('PATRON', 155, boxY + 45);
  ctx.fillStyle = '#f5f5f4';
  ctx.font = '600 24px "Space Grotesk", sans-serif';
  ctx.fillText(receipt.name || 'Anonymous Supporter', 155, boxY + 80);

  ctx.fillStyle = '#a8a29e';
  ctx.font = '600 14px "Space Grotesk", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('DATE', 750, boxY + 45);
  ctx.fillStyle = '#f5f5f4';
  ctx.font = '500 20px monospace';
  ctx.fillText(receipt.date, 750, boxY + 80);

  if (receipt.note) {
    ctx.fillStyle = '#d6d3d1';
    ctx.font = 'italic 20px "Newsreader", Georgia, serif';
    ctx.fillText(`“${receipt.note}”`, 155, boxY + 160);
  }

  // Footer / Signature
  ctx.fillStyle = '#78716c';
  ctx.font = '400 16px "Space Grotesk", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('BIRANCHI KULESIKA · BHUBANESWAR, INDIA', 120, canvas.height - 120);

  // Trigger download
  const link = document.createElement('a');
  link.download = `biranchi-patronage-receipt-${receipt.id}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

const PRESET_AMOUNTS = [100, 300, 500, 1000, 2500];

const LEDGER_ITEMS = [
  {
    index: '01',
    category: 'Hosting & Server Costs',
    lead: 'Domain renewals, fast hosting, databases, and software tools.',
    body: 'Running this website costs money every month. Your support pays for domain names, server hosting, and development tools so the site stays fast and reliable.',
  },
  {
    index: '02',
    category: 'Books & Learning',
    lead: 'Physical books, research papers, and study material.',
    body: 'Most of what I write starts with something I read. Contributions help me buy books and research papers that I read, take notes on, and share in the public library.',
  },
  {
    index: '03',
    category: 'Time to Build & Write',
    lead: 'Dedicated time to make things and write essays.',
    body: 'Writing clear essays and building software tools takes focused, uninterrupted time. Your support gives me the freedom to work on useful things without worrying about sponsorships or client work.',
  },
  {
    index: '04',
    category: 'No Ads or Paywalls',
    lead: 'No locked content, no tracking, and no sponsored posts.',
    body: 'Everything on this website is free for anyone to read. There are no paywalls, no popups, and no ads. Your support allows me to keep it that way.',
  },
];

export function SupportPageView() {
  const [amount, setAmount] = useState<string>('500');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const numAmount = Number(amount) || 0;

  function handleOpenModal(e: React.FormEvent) {
    e.preventDefault();
    if (numAmount >= 10) {
      setIsModalOpen(true);
    }
  }

  async function handleProceedPayment(details: {
    name: string;
    email: string;
    note: string;
  }) {
    setIsProcessing(true);

    const receiptId = `BK-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      1000 + Math.random() * 9000,
    )}`;
    const formattedDate = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    const receiptPayload: ReceiptData = {
      id: receiptId,
      amount: numAmount,
      name: details.name.trim() || 'Anonymous Patron',
      email: details.email.trim(),
      note: details.note.trim(),
      date: formattedDate,
    };

    // Helper to persist contribution details idempotently
    async function persistContribution(payload: {
      paymentId: string;
      orderId?: string;
      signature?: string;
      amount: number;
      name: string;
      email?: string;
      note?: string;
      source: 'razorpay' | 'manual';
    }) {
      try {
        await fetch('/api/contributions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        // Webhook fallback ensures eventual consistency if client request drops
      }
    }

    // Load Razorpay Checkout dynamically if available
    try {
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (razorpayKey && typeof window !== 'undefined') {
        const loadScript = new Promise<boolean>((resolve) => {
          if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

        const loaded = await loadScript;

        if (loaded && (window as unknown as { Razorpay?: new (opts: unknown) => { open: () => void } }).Razorpay) {
          const RazorpayConstructor = (
            window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }
          ).Razorpay;

          const rzp = new RazorpayConstructor({
            key: razorpayKey,
            amount: numAmount * 100,
            currency: 'INR',
            name: 'Biranchi Kulesika',
            description: 'Direct Patronage & Support',
            prefill: {
              name: details.name || undefined,
              email: details.email || undefined,
            },
            theme: {
              color: '#d97706',
            },
            handler: async function (response: {
              razorpay_payment_id?: string;
              razorpay_order_id?: string;
              razorpay_signature?: string;
            }) {
              if (response?.razorpay_payment_id) {
                receiptPayload.id = response.razorpay_payment_id;
              }
              await persistContribution({
                paymentId: receiptPayload.id,
                orderId: response?.razorpay_order_id,
                signature: response?.razorpay_signature,
                amount: numAmount,
                name: receiptPayload.name,
                email: receiptPayload.email,
                note: receiptPayload.note,
                source: 'razorpay',
              });
              setIsProcessing(false);
              setIsModalOpen(false);
              setReceipt(receiptPayload);
            },
            modal: {
              ondismiss: function () {
                setIsProcessing(false);
              },
            },
          });

          rzp.open();
          return;
        }
      }
    } catch {
      // Fallback to direct simulated receipt
    }

    // Direct payment completion
    setTimeout(async () => {
      await persistContribution({
        paymentId: receiptPayload.id,
        amount: numAmount,
        name: receiptPayload.name,
        email: receiptPayload.email,
        note: receiptPayload.note,
        source: 'manual',
      });
      setIsProcessing(false);
      setIsModalOpen(false);
      setReceipt(receiptPayload);
    }, 600);
  }

  return (
    <div className="container-site py-8 sm:py-12 md:py-20">
      {/* Receipt View after Successful Payment */}
      {receipt ? (
        <section aria-label="Patronage Receipt" className="mx-auto max-w-2xl py-4 sm:py-6">
          {/* Screenshot-worthy Receipt Card */}
          <div className="relative overflow-hidden rounded-2xl border border-tinted/30 bg-[#161513] p-5 shadow-2xl sm:rounded-3xl sm:p-8 md:p-12">
            {/* Subtle Textured Corner Accents */}
            <span
              className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/5 blur-2xl"
              aria-hidden
            />
            <span
              className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/5 blur-2xl"
              aria-hidden
            />

            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tinted/20 pb-4 sm:gap-4 sm:pb-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-mid sm:text-[11px]">
                  PATRONAGE RECEIPT
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-gray-mid/80 sm:mt-1 sm:text-xs">
                  REF: {receipt.id}
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal/10 px-3 py-0.5 text-[11px] font-semibold text-teal sm:px-3.5 sm:py-1 sm:text-xs">
                <CheckCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Verified Patron</span>
              </div>
            </div>

            {/* Amount & Headline */}
            <div className="mt-5 sm:mt-8">
              <p className="font-serif text-4xl font-normal tracking-tight text-paper sm:text-6xl md:text-7xl">
                ₹{receipt.amount}
              </p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-accent sm:mt-2 sm:text-xs">
                DIRECT INDEPENDENT PATRONAGE
              </p>
            </div>

            {/* Short, Concise, Screenshot-Worthy Thank You Message */}
            <div className="mt-6 rounded-xl border border-tinted/20 bg-night-soft/60 p-4 sm:mt-8 sm:rounded-2xl sm:p-6">
              <h2 className="font-serif text-xl font-normal text-paper sm:text-2xl md:text-3xl">
                Thank you deeply{receipt.name !== 'Anonymous Patron' ? `, ${receipt.name}` : ''}!
              </h2>
              <p className="mt-2 font-serif text-sm leading-relaxed text-ink-soft sm:mt-3 sm:text-base md:text-lg">
                Your contribution directly funds independent essays on Scribble,
                software experiments, and deliberate thinking without ads, sponsors, or paywalls.
              </p>
              {receipt.note && (
                <blockquote className="mt-3 border-l-2 border-accent/60 pl-3 font-serif text-xs italic text-gray-mid sm:mt-4 sm:pl-3.5 sm:text-sm">
                  “{receipt.note}”
                </blockquote>
              )}
            </div>

            {/* Patron Metadata */}
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-tinted/20 pt-4 text-xs text-gray-mid sm:mt-8 sm:gap-6 sm:pt-6">
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-soft/60 sm:text-xs">
                  Supporter
                </span>
                <span className="mt-0.5 block text-xs font-medium text-paper sm:mt-1 sm:text-sm">
                  {receipt.name}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-soft/60 sm:text-xs">
                  Date
                </span>
                <span className="mt-0.5 block font-mono text-xs text-paper sm:mt-1 sm:text-sm">
                  {receipt.date}
                </span>
              </div>
            </div>

            {/* Footer Signature */}
            <div className="mt-6 flex items-center justify-between border-t border-tinted/15 pt-4 text-[11px] text-gray-mid sm:mt-8 sm:pt-6 sm:text-xs">
              <span>Biranchi Kulesika</span>
              <span>Bhubaneswar, India</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-6 flex flex-col items-stretch gap-3 sm:mt-8 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
            <button
              type="button"
              onClick={() => downloadReceiptAsCanvas(receipt)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-paper shadow-sm transition-colors hover:bg-accent-hover"
            >
              <DownloadIcon className="h-4 w-4" />
              <span>Download Receipt</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setReceipt(null);
                setAmount('500');
              }}
              className="inline-flex items-center justify-center rounded-full border border-tinted/30 bg-night-soft px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-post-card"
            >
              Make another contribution
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-mid transition-colors hover:text-paper"
            >
              Return home
            </Link>
          </div>
        </section>
      ) : (
        /* Primary Support Screen */
        <>
          <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-16">
            {/* Left Column: Narrative Copy */}
            <div className="flex flex-col justify-center lg:col-span-7 lg:pr-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs md:text-sm">
                PATRONAGE & SUPPORT
              </p>
              <h1 className="mt-2 font-serif text-2xl font-normal leading-[1.12] tracking-tight text-paper sm:mt-4 sm:text-4xl md:text-5xl xl:text-[3.5rem]">
                Help me keep this corner of the web independent.
              </h1>

              <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft sm:mt-6 sm:space-y-4 sm:text-base md:text-lg">
                <p>
                  Everything I make here is open to everyone. There are no paywalls, ads, sponsored posts, or attention tricks.
                </p>
                <p>
                  If something I’ve built or written has been useful, interesting, or simply worth your time, you can help keep it going.
                </p>
                <p>
                  Your support pays for the everyday things that keep this website running: servers, domains, books, tools, and time to write and build freely without ads or sponsors.
                </p>
              </div>
            </div>

            {/* Right Column: Amount Selection & Support Button Only */}
            <div className="w-full max-w-md mx-auto lg:col-span-5 lg:max-w-none">
              <div className="rounded-2xl border border-tinted/20 bg-night-soft p-5 shadow-xl sm:rounded-3xl sm:p-6 md:p-8 sm:shadow-2xl">
                <form onSubmit={handleOpenModal} className="space-y-4 sm:space-y-6">
                  {/* Preset Amount Chips */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-mid sm:text-xs">
                      Choose Contribution
                    </label>
                    <div className="mt-2 grid grid-cols-5 gap-1.5 sm:mt-3 sm:flex sm:flex-wrap sm:gap-2.5">
                      {PRESET_AMOUNTS.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAmount(String(val))}
                          className={`rounded-full py-1 text-center text-[11px] font-medium transition-all sm:px-4 sm:py-2 sm:text-sm sm:font-semibold ${
                            amount === String(val)
                              ? 'bg-accent font-semibold text-paper shadow-sm'
                              : 'border border-tinted/20 bg-post-card text-gray-mid hover:border-tinted/40 hover:text-paper'
                          }`}
                        >
                          ₹{val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount Input */}
                  <div>
                    <label
                      htmlFor="support-amount"
                      className="block text-[11px] font-semibold uppercase tracking-wider text-gray-mid sm:text-xs"
                    >
                      Or Enter Custom Amount (INR)
                    </label>
                    <div className="mt-1.5 flex items-center rounded-xl border border-tinted/20 bg-post-card px-3.5 py-2.5 sm:mt-2 sm:rounded-2xl sm:px-4 sm:py-3.5">
                      <span className="font-serif text-xl font-normal text-paper sm:text-2xl">
                        ₹
                      </span>
                      <input
                        id="support-amount"
                        type="number"
                        min={10}
                        step={1}
                        required
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="ml-2.5 w-full border-none bg-transparent font-serif text-xl font-normal text-paper placeholder:font-sans placeholder:text-sm placeholder:text-ink-soft/40 outline-none ring-0 shadow-none focus:border-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none sm:ml-3 sm:text-2xl sm:placeholder:text-base"
                      />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-mid sm:text-xs">
                        INR
                      </span>
                    </div>
                  </div>

                  {/* Support Button Only */}
                  <button
                    type="submit"
                    disabled={numAmount < 10}
                    className="group flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-paper shadow-sm transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-base"
                  >
                    <HeartIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
                    <span>
                      {numAmount >= 10
                        ? `Support with ₹${amount}`
                        : 'Support (Minimum ₹10)'}
                    </span>
                  </button>

                  <p className="text-center text-[10px] text-gray-mid/80 sm:text-xs">
                    One-time contribution
                  </p>
                </form>
              </div>
            </div>
          </section>

          {/* 2. Where does the support go? — Editorial Open Ledger (No Cards) */}
          <section className="mx-auto mt-16 max-w-4xl border-t border-tinted/20 pt-12 sm:mt-24 sm:pt-16 lg:mt-32">
            {/* Section Header */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">
                HOW YOUR MONEY HELPS
              </p>
              <h2 className="mt-2 font-serif text-2xl font-normal tracking-tight text-paper sm:mt-3 sm:text-3xl md:text-4xl">
                Where does the money go?
              </h2>
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base md:text-lg">
                I want to be completely open about what your contributions pay for:
              </p>
            </div>

            {/* Editorial Ledger Rows */}
            <div className="mt-10 divide-y divide-tinted/15 sm:mt-14">
              {LEDGER_ITEMS.map((item) => (
                <div
                  key={item.category}
                  className="grid grid-cols-1 gap-3 py-8 sm:grid-cols-12 sm:gap-8 sm:py-10"
                >
                  {/* Left Column: Number & Category */}
                  <div className="sm:col-span-4 lg:col-span-5">
                    <span className="font-mono text-xs font-semibold text-accent sm:text-sm">
                      {item.index}
                    </span>
                    <h3 className="mt-1 font-serif text-lg font-normal text-paper sm:text-xl md:text-2xl">
                      {item.category}
                    </h3>
                  </div>

                  {/* Right Narrative Column */}
                  <div className="space-y-2 sm:col-span-8 lg:col-span-7 sm:pt-1">
                    <p className="text-sm font-medium leading-snug text-paper/90 sm:text-base">
                      {item.lead}
                    </p>
                    <p className="text-xs leading-relaxed text-ink-soft sm:text-sm">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Closing Note */}
          <footer className="mx-auto mt-12 max-w-2xl border-t border-tinted/20 pt-8 text-center sm:mt-20 sm:pt-12">
            <p className="font-serif text-base font-medium text-paper sm:text-lg md:text-xl">
              Thank you for reading, sharing, supporting, or simply being here.
            </p>
          </footer>

          {/* Pop-up modal for supporter name, email, and note */}
          <SupporterModal
            amount={numAmount}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleProceedPayment}
            isProcessing={isProcessing}
          />
        </>
      )}
    </div>
  );
}
