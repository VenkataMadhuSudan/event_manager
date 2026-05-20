"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Download, Loader2, ArrowLeft, User, Mail, Phone, Users, CheckCircle2, QrCode } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface Event {
  id: string;
  name: string;
  slug?: string;
  event_date?: string;
  last_date_to_register?: string;
  type?: string;
  duration?: string;
  venue?: string;
  details?: string;
  banner_url?: string;
  poster_url?: string;
}

interface Student {
  id: string;
  name: string;
  qr_code: string;
  eventId?: string;
  event?: string;
  participants?: number;
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  const [loading, setLoading] = useState(false);
  const [fetchingEvent, setFetchingEvent] = useState(true);
  const [eventDetails, setEventDetails] = useState<Event | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [successData, setSuccessData] = useState<Student | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success) {
        if (eventId) {
          const event = data.events.find((e: Event) => e.id === eventId);
          if (event) {
            setEventDetails(event);
          }
        }
        setAllEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setFetchingEvent(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string | number | boolean | null> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    if (eventId) {
      data.eventId = eventId;
      if (eventDetails) {
        data.event = eventDetails.name;
      }
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const json = await res.json();

      if (res.ok && json.success) {
        toast.success("Registration Successful!");
        setSuccessData(json.student);
      } else {
        toast.error(json.error || "Something went wrong.");
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = async () => {
    if (!successData?.qr_code) return;

    toast.loading("Generating your high-fidelity ticket...", { id: "ticket-gen" });

    // Look up full details of this event from allEvents
    const selectedEvent = allEvents.find(e => e.id === successData.eventId || e.name === successData.event) || eventDetails;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.error("Failed to generate ticket graphics.");
        return;
      }

      // Helper to load image safely
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(e);
          img.src = src;
        });
      };

      // Helper to draw rounded rectangle
      const drawRoundedRect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        c.beginPath();
        c.moveTo(x + r, y);
        c.lineTo(x + w - r, y);
        c.quadraticCurveTo(x + w, y, x + w, y + r);
        c.lineTo(x + w, y + h - r);
        c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        c.lineTo(x + r, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - r);
        c.lineTo(x, y + r);
        c.quadraticCurveTo(x, y, x + r, y);
        c.closePath();
      };

      // Helper to wrap text
      const wrapText = (c: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = c.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            c.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        c.fillText(line, x, currentY);
      };

      // 1. Draw beautiful Premium Light Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 800, 1200);
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(0.6, '#f8fafc');
      bgGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 800, 1200);

      const glowGrad = ctx.createRadialGradient(0, 0, 50, 0, 0, 500);
      glowGrad.addColorStop(0, 'rgba(14, 165, 233, 0.08)');
      glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, 800, 1200);

      const glowGrad2 = ctx.createRadialGradient(800, 400, 50, 800, 400, 400);
      glowGrad2.addColorStop(0, 'rgba(99, 102, 241, 0.06)');
      glowGrad2.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGrad2;
      ctx.fillRect(0, 0, 800, 1200);

      const glowGrad3 = ctx.createRadialGradient(100, 1000, 50, 100, 1000, 500);
      glowGrad3.addColorStop(0, 'rgba(34, 211, 238, 0.08)');
      glowGrad3.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGrad3;
      ctx.fillRect(0, 0, 800, 1200);

      const bgUrl = selectedEvent?.poster_url || selectedEvent?.banner_url;
      if (bgUrl) {
        try {
          const bgImg = await loadImage(bgUrl);
          const canvasRatio = canvas.width / canvas.height;
          const imgRatio = bgImg.width / bgImg.height;
          let drawW, drawH, drawX, drawY;

          if (imgRatio > canvasRatio) {
            drawH = canvas.height;
            drawW = bgImg.width * (canvas.height / bgImg.height);
            drawX = (canvas.width - drawW) / 2;
            drawY = 0;
          } else {
            drawW = canvas.width;
            drawH = bgImg.height * (canvas.width / bgImg.width);
            drawX = 0;
            drawY = (canvas.height - drawH) / 2;
          }

          ctx.save();
          ctx.globalAlpha = 0.12;
          ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
          ctx.restore();
        } catch (err) {
          console.warn("External background load failed.", err);
        }
      }

      ctx.save();
      ctx.fillStyle = 'rgba(14, 165, 233, 0.04)';
      for (let x = 30; x < 770; x += 25) {
        for (let y = 30; y < 1170; y += 25) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      ctx.lineWidth = 12;
      const borderGrad = ctx.createLinearGradient(0, 0, 800, 1200);
      borderGrad.addColorStop(0, '#0284c7');
      borderGrad.addColorStop(0.5, '#6366f1');
      borderGrad.addColorStop(1, '#38bdf8');
      ctx.strokeStyle = borderGrad;
      ctx.strokeRect(6, 6, 788, 1188);

      const currentEventName = selectedEvent?.name || successData.event || 'EVENT';
      const subText = `• ${currentEventName.toUpperCase()} OFFICIAL ENTRY PASS •`;
      ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      const textW = ctx.measureText(subText).width;
      
      ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
      drawRoundedRect(ctx, 400 - textW / 2 - 16, 55, textW + 32, 28, 6);
      ctx.fill();

      ctx.fillStyle = '#0369a1';
      ctx.fillText(subText, 400, 73);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, 105);
      ctx.lineTo(720, 105);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
      ctx.fillText('OFFICIAL ENTRY PASS FOR THE EVENT', 400, 145);

      const titleGrad = ctx.createLinearGradient(150, 0, 650, 0);
      titleGrad.addColorStop(0, '#0f172a');
      titleGrad.addColorStop(0.5, '#0369a1');
      titleGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = titleGrad;
      ctx.font = 'italic bold 52px "Segoe UI", Arial, sans-serif';
      wrapText(ctx, currentEventName.toUpperCase(), 400, 195, 600, 54);

      const boxX = 60;
      const boxY = 320;
      const boxW = 680;
      const boxH = 280;

      ctx.save();
      ctx.shadowColor = 'rgba(15, 23, 42, 0.05)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 12);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.moveTo(boxX + 1.5, boxY + 12);
      ctx.quadraticCurveTo(boxX + 1.5, boxY + 1.5, boxX + 12, boxY + 1.5);
      ctx.lineTo(boxX + 12, boxY + boxH - 12);
      ctx.quadraticCurveTo(boxX + 1.5, boxY + boxH - 1.5, boxX + 1.5, boxY + boxH - 12);
      ctx.closePath();
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
      ctx.fillText('ATTENDEE NAME', boxX + 40, boxY + 50);
      
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
      ctx.fillText(successData.name, boxX + 40, boxY + 80);
      
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
      ctx.fillText('EVENT DATE & TIME', boxX + 40, boxY + 135);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
      const eventDate = selectedEvent?.event_date;
      const displayDate = eventDate ? new Date(eventDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'To Be Announced';
      ctx.fillText(displayDate, boxX + 40, boxY + 160);
      
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
      ctx.fillText('VENUE LOCATION', boxX + 40, boxY + 215);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 17px "Segoe UI", Arial, sans-serif';
      ctx.fillText(selectedEvent?.venue || 'JNTU-H Campus', boxX + 40, boxY + 245);

      const qrSize = 220;
      const qrX = boxX + boxW - qrSize - 30;
      const qrY = boxY + (boxH - qrSize) / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(15, 23, 42, 0.06)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 4;
      drawRoundedRect(ctx, qrX, qrY, qrSize, qrSize, 12);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      const qrImg = await loadImage(successData.qr_code);
      ctx.drawImage(qrImg, qrX + 15, qrY + 15, qrSize - 30, qrSize - 30);

      const stubY = 660;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, stubY, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(800, stubY, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(35, stubY);
      ctx.lineTo(765, stubY);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PRESENT THIS SECURE QR FOR SCANNING AT GATE ADMISSION', 400, 800);
      
      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`TEAM CAPACITY / SIZE: ${successData.participants || 1} PAX`, 400, 830);

      ctx.save();
      ctx.fillStyle = '#0f172a';
      const barcodeX = 240;
      const barcodeY = 965;
      const barcodeH = 34;
      
      let curX = barcodeX;
      const linePattern = [2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 2, 1, 3];
      for (let i = 0; i < linePattern.length; i++) {
        const w = linePattern[i] * 2.3;
        ctx.fillRect(curX, barcodeY, w, barcodeH);
        curX += w + (i % 2 === 0 ? 3 : 5);
      }
      ctx.restore();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`POWERED BY EVENTHUB • JNTU-H INCUBATION CENTRE • © ${new Date().getFullYear()}`, 400, 1135);

      const ticketDataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = ticketDataUrl;
      
      const eventNameFile = currentEventName.replace(/\s+/g, '_').toLowerCase();
      const userNameFile = successData.name.replace(/\s+/g, '_').toLowerCase();
      link.download = `${eventNameFile}_ticket_${userNameFile}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Ticket downloaded successfully!", { id: "ticket-gen" });
    } catch (err) {
      console.error("Failed to generate ticket image:", err);
      toast.error("Error generating printable ticket card. Downloading raw QR instead.", { id: "ticket-gen" });
      
      const link = document.createElement('a');
      link.href = successData.qr_code;
      
      const currentEventName = selectedEvent?.name || successData.event || 'EVENT';
      const eventNameFile = currentEventName.replace(/\s+/g, '_').toLowerCase();
      const userNameFile = successData.name.replace(/\s+/g, '_').toLowerCase();
      link.download = `${eventNameFile}_ticket_${userNameFile}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (fetchingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-black dark:text-white" />
      </div>
    );
  }

  if (successData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl max-w-md w-full p-10 shadow-[20px_20px_0px_0px_rgba(0,0,0,0.1)] dark:shadow-[20px_20px_0px_0px_rgba(255,255,255,0.05)] text-center space-y-8 border-t-8 border-black dark:border-white"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center bg-black dark:bg-white text-white dark:text-black shadow-xl transform -rotate-6">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-black dark:text-white uppercase tracking-tighter italic">Secured <span className="text-zinc-500 underline">Entry</span></h2>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              Attendee: <span className="text-black dark:text-white font-black">{successData.name}</span>
            </p>
          </div>
          
          <div className="flex justify-center p-8 bg-white dark:bg-white/5 border-4 border-dashed border-zinc-200 dark:border-zinc-800 shadow-inner group">
            <div className="relative">
              <Image 
                src={successData.qr_code} 
                alt="Ticket QR" 
                width={224} 
                height={224} 
                className="object-contain" 
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-10 transition-opacity bg-black">
                <QrCode className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <button
              onClick={downloadQR}
              className="flex items-center justify-center gap-2 w-full py-5 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 font-black transition-all shadow-xl uppercase tracking-widest text-xs"
            >
              <Download className="w-5 h-5" />
              Save Ticket
            </button>
            <button
              onClick={() => setSuccessData(null)}
              className="w-full py-5 bg-transparent border-2 border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-black transition-all uppercase tracking-widest text-xs"
            >
              Register Another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back to Hub</span>
        </Link>

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-sky-600 text-white mb-6 shadow-xl transform rotate-3">
              <QrCode className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 italic">
              {eventDetails ? (
                <>Join <span className="text-sky-600">Event</span></>
              ) : (
                <>Secure <span className="text-sky-600">Ticket</span></>
              )}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">
              {eventDetails ? `Registration for ${eventDetails.name}` : 'Join our next premium experience.'}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input name="name" type="text" required placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:border-sky-600 outline-none transition-all font-bold" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input name="email" type="email" required placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:border-sky-600 outline-none transition-all font-bold" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input name="phone" type="tel" required placeholder="+1 234 567 890"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:border-sky-600 outline-none transition-all font-bold" />
              </div>
            </div>

            {!eventId && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Event Selection</label>
                <div className="relative">
                  <select name="event" required
                    className="w-full pl-6 pr-10 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:border-sky-600 outline-none transition-all font-black uppercase tracking-widest text-xs appearance-none">
                    <option value="">Select an Event</option>
                    {allEvents.map(e => (
                      <option key={e.id} value={e.name}>{e.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Number of Participants</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input name="participants" type="number" min="1" max="10" defaultValue="1"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:border-sky-600 outline-none transition-all font-bold" />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-5 bg-sky-600 text-white hover:bg-black transition-all font-black uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {loading ? 'Processing...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-black" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}

