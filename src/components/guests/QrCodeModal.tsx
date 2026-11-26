import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Download, Printer, X } from 'lucide-react';
import { buildGuestDisplayGreeting } from '../../lib/utils';

interface QrCodeModalProps {
  guestName: string;
  isFamilyInvitation: boolean;
  eventTitle: string;
  inviteUrl: string;
  onClose: () => void;
}

export function QrCodeModal({
  guestName,
  isFamilyInvitation,
  eventTitle,
  inviteUrl,
  onClose,
}: QrCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const displayGuest = buildGuestDisplayGreeting(guestName, isFamilyInvitation);

  useEffect(() => {
    void QRCode.toDataURL(inviteUrl, {
      width: 520,
      margin: 2,
      color: {
        dark: '#1C1917',
        light: '#FFFFFF',
      },
    }).then(setQrDataUrl);
  }, [inviteUrl]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `invite-qr-${guestName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
    a.click();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-stone-200 rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-stone-500">{eventTitle}</p>
            <h3 className="text-xl font-display font-semibold text-stone-900 mt-0.5">
              QR Pass for {displayGuest}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR modal"
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 flex flex-col items-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code for ${displayGuest}`}
              className="w-52 h-52 rounded-lg"
            />
          ) : (
            <div className="w-52 h-52 flex items-center justify-center text-xs text-stone-500">
              Generating QR...
            </div>
          )}
          <p className="text-[11px] font-mono text-stone-500 mt-3 break-all text-center">
            {inviteUrl}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#8B1E2F] text-white rounded-lg hover:bg-[#741827]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-stone-100 text-stone-800 rounded-lg hover:bg-stone-200"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-stone-100 text-stone-800 rounded-lg hover:bg-stone-200"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>
  );
}
