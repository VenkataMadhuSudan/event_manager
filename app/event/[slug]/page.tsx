"use client";

import { useState, useEffect, use, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Download, Loader2, ArrowLeft, User, Mail, Phone, Users, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface Event {
  id: string;
  name: string;
  slug: string;
  event_date?: string;
  end_date?: string;
  last_date_to_register?: string;
  last_date_to_cancel?: string;
  type?: string;
  duration?: string;
  venue?: string;
  details?: string;
  status?: string;
  mode?: string;
  banner_url?: string;
  poster_url?: string;
  max_attendees?: number;
  current_attendees?: number;
}

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventId: string;
  participants: number;
  qr_code: string;
  status: string;
  created_at?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export default function EventRegistrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [loading, setLoading] = useState(false);
  const [fetchingEvent, setFetchingEvent] = useState(true);
  const [eventDetails, setEventDetails] = useState<Event | null>(null);
  const [successData, setSuccessData] = useState<Student | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [posterError, setPosterError] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchEventDetails = useCallback(async () => {
    try {
      // Fetch event info
      const res = await fetch(`/api/events/${slug}`);
      const data = await res.json();
      if (data.success) {
        setEventDetails(data.event);
        
        // Also check if user is logged in and registered
        const userRes = await fetch('/api/user/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
          
          // Check if this user is registered for this specific event
          const regRes = await fetch('/api/user/events');
          if (regRes.ok) {
            const regData = await regRes.json();
            const existingReg = regData.registered?.find((r: Student) => r.eventId === data.event.id);
            if (existingReg) {
              setIsRegistered(true);
              setSuccessData(existingReg);
            }
          }
        }
      } else {
        toast.error("Event not found");
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      toast.error("Network error");
    } finally {
      setFetchingEvent(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string | number | boolean | null> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    if (eventDetails) {
      data.eventId = eventDetails.id;
      data.event = eventDetails.name;
      if (user) {
        data.user_id = user.id;
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
        if (json.waitlisted) {
          toast.success("You've been added to the waitlist! We'll notify you if a spot opens up.", { duration: 5000 });
        } else {
          toast.success("Registration Successful! Check your email for the confirmation.");
        }
        setSuccessData(json.student);
        setIsRegistered(true);
        fetchEventDetails();
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

  const handleCancel = async () => {
    if (!successData?.id) return;
    if (!confirm('Are you sure you want to cancel your registration? This action cannot be undone.')) return;
    setCancelling(true);
    try {
      const res = await fetch('/api/register/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: successData.id }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Registration cancelled successfully.');
        setSuccessData(null);
        setIsRegistered(false);
        fetchEventDetails();
      } else {
        toast.error(json.error || 'Could not cancel registration.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const downloadQR = async () => {
    if (!successData?.qr_code) return;

    toast.loading("Generating your high-fidelity ticket...", { id: "ticket-gen" });

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
      bgGrad.addColorStop(0, '#ffffff'); // Clean white top
      bgGrad.addColorStop(0.6, '#f8fafc'); // Soft slate-50
      bgGrad.addColorStop(1, '#e0f2fe'); // Soft sky blue bottom
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 800, 1200);

      // 2. Draw modern light glowing aurora blobs in the corners
      const glowGrad = ctx.createRadialGradient(0, 0, 50, 0, 0, 500);
      glowGrad.addColorStop(0, 'rgba(14, 165, 233, 0.08)'); // Sky blue aura
      glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, 800, 1200);

      const glowGrad2 = ctx.createRadialGradient(800, 400, 50, 800, 400, 400);
      glowGrad2.addColorStop(0, 'rgba(99, 102, 241, 0.06)'); // Indigo aura
      glowGrad2.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGrad2;
      ctx.fillRect(0, 0, 800, 1200);

      const glowGrad3 = ctx.createRadialGradient(100, 1000, 50, 100, 1000, 500);
      glowGrad3.addColorStop(0, 'rgba(34, 211, 238, 0.08)'); // Cyan aura
      glowGrad3.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGrad3;
      ctx.fillRect(0, 0, 800, 1200);

      // 3. Try to load poster/banner image as a subtle elegant background watermark
      const bgUrl = eventDetails?.poster_url || eventDetails?.banner_url;
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
          ctx.globalAlpha = 0.12; // Watermark opacity
          ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
          ctx.restore();
        } catch (err) {
          console.warn("External background load failed (CORS/network). Defaulting to beautiful light gradient.", err);
        }
      }

      // Draw subtle modern dotted grid pattern to fill card detail and texture
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

      // Draw premium holographic sky-blue gradient border
      ctx.lineWidth = 12;
      const borderGrad = ctx.createLinearGradient(0, 0, 800, 1200);
      borderGrad.addColorStop(0, '#0284c7'); // sky-600
      borderGrad.addColorStop(0.5, '#6366f1'); // indigo-500
      borderGrad.addColorStop(1, '#38bdf8'); // sky-400
      ctx.strokeStyle = borderGrad;
      ctx.strokeRect(6, 6, 788, 1188);

      // 4. Draw Header Sub-Badge (featuring Event Name instead of JNTU-H)
      const currentEventName = eventDetails?.name || 'EVENT';
      const subText = `• ${currentEventName.toUpperCase()} OFFICIAL ENTRY PASS •`;
      ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      const textW = ctx.measureText(subText).width;
      
      ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
      drawRoundedRect(ctx, 400 - textW / 2 - 16, 55, textW + 32, 28, 6);
      ctx.fill();

      ctx.fillStyle = '#0369a1'; // Deep sky blue
      ctx.fillText(subText, 400, 73);

      // Header separator line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, 105);
      ctx.lineTo(720, 105);
      ctx.stroke();

      // 5. Draw Event Title Area (Fills space, highly styled)
      ctx.fillStyle = '#64748b'; // Slate 500
      ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
      ctx.fillText('OFFICIAL ENTRY PASS FOR THE EVENT', 400, 145);

      // Text gradient for event title
      const titleGrad = ctx.createLinearGradient(150, 0, 650, 0);
      titleGrad.addColorStop(0, '#0f172a'); // Slate-900
      titleGrad.addColorStop(0.5, '#0369a1'); // Sky-700
      titleGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = titleGrad;
      ctx.font = 'italic bold 52px "Segoe UI", Arial, sans-serif';
      wrapText(ctx, currentEventName.toUpperCase(), 400, 195, 600, 54);

      // 6. Draw Details Card/Box (Glassmorphic look)
      const boxX = 60;
      const boxY = 320;
      const boxW = 680;
      const boxH = 280; // Adjusted height for QR and text

      // Draw drop shadow for the frosted card
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

      // Sleek solid sky-blue visual strip down the left edge of the details card
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.moveTo(boxX + 1.5, boxY + 12);
      ctx.quadraticCurveTo(boxX + 1.5, boxY + 1.5, boxX + 12, boxY + 1.5);
      ctx.lineTo(boxX + 12, boxY + boxH - 12);
      ctx.quadraticCurveTo(boxX + 1.5, boxY + boxH - 1.5, boxX + 1.5, boxY + boxH - 12);
      ctx.closePath();
      ctx.fill();

      // Left Column Texts (Details Stacked Vertically)
      ctx.textAlign = 'left';
      
      // Detail 1: ATTENDEE NAME
      ctx.fillStyle = '#64748b'; // Slate 500
      ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
      ctx.fillText('ATTENDEE NAME', boxX + 40, boxY + 50);
      
      ctx.fillStyle = '#0f172a'; // Deep Navy
      ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
      ctx.fillText(successData.name, boxX + 40, boxY + 80);
      
      // Detail 2: EVENT DATE & TIME
      ctx.fillStyle = '#64748b'; // Slate 500
      ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
      ctx.fillText('EVENT DATE & TIME', boxX + 40, boxY + 135);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
      const eventDate = eventDetails?.event_date;
      const displayDate = eventDate ? new Date(eventDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'To Be Announced';
      ctx.fillText(displayDate, boxX + 40, boxY + 160);
      
      // Detail 3: VENUE LOCATION
      ctx.fillStyle = '#64748b'; // Slate 500
      ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
      ctx.fillText('VENUE LOCATION', boxX + 40, boxY + 215);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 17px "Segoe UI", Arial, sans-serif';
      ctx.fillText(eventDetails?.venue || 'JNTU-H Campus', boxX + 40, boxY + 245);

      // Right Column QR Code
      const qrSize = 220;
      const qrX = boxX + boxW - qrSize - 30; // Positioned on the right side of the card
      const qrY = boxY + (boxH - qrSize) / 2; // Vertically centered inside the card

      // Draw QR container background with light shadow and blue border
      ctx.save();
      ctx.shadowColor = 'rgba(15, 23, 42, 0.06)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e0f2fe'; // light sky-blue border
      ctx.lineWidth = 4;
      drawRoundedRect(ctx, qrX, qrY, qrSize, qrSize, 12);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Load QR Image
      const qrImg = await loadImage(successData.qr_code);
      ctx.drawImage(qrImg, qrX + 15, qrY + 15, qrSize - 30, qrSize - 30);


      // 7. Stub circles (cutouts) and Dashed tear stub line
      const stubY = 660; // Moved lower due to unified card
      ctx.save();
      // Cut circular stubs on the left and right edges
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, stubY, 32, 0, Math.PI * 2); // Left cutout
      ctx.fill();
      ctx.beginPath();
      ctx.arc(800, stubY, 32, 0, Math.PI * 2); // Right cutout
      ctx.fill();
      ctx.restore();

      // Connect stubs with a premium dashed scanning tear line
      ctx.save();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(35, stubY);
      ctx.lineTo(765, stubY);
      ctx.stroke();
      ctx.restore();


      // 8. Bottom Helper Instructions & Authenticity Elements (Filling the bottom area nicely)
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PRESENT THIS SECURE QR FOR SCANNING AT GATE ADMISSION', 400, 800);
      
      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`TEAM CAPACITY / SIZE: ${successData.participants || 1} PAX`, 400, 830);


      // 9. Styled Authentic Barcode to fill the bottom stub beautifully
      ctx.save();
      ctx.fillStyle = '#0f172a';
      const barcodeX = 240;
      const barcodeY = 965; // Positioned comfortably at the bottom
      const barcodeH = 34;
      
      let curX = barcodeX;
      const linePattern = [2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 2, 1, 3];
      for (let i = 0; i < linePattern.length; i++) {
        const w = linePattern[i] * 2.3;
        ctx.fillRect(curX, barcodeY, w, barcodeH);
        curX += w + (i % 2 === 0 ? 3 : 5);
      }
      ctx.restore();

      // 10. Footer Brand
      ctx.fillStyle = '#94a3b8'; // Slate 400
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`POWERED BY EVENTHUB • JNTU-H INCUBATION CENTRE • © ${new Date().getFullYear()}`, 400, 1135);

      // Trigger actual download
      const ticketDataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = ticketDataUrl;
      
      // Filename formatted as: eventname_ticket_participant.png
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
      
      // Safe fallback - download raw QR
      const link = document.createElement('a');
      link.href = successData.qr_code;
      
      const currentEventName = eventDetails?.name || 'EVENT';
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
      <div className="min-h-screen bg-white">
        <div className="w-full h-[400px] bg-gray-100">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="max-w-7xl mx-auto px-8 -mt-20 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-8 bg-white p-12 shadow-2xl">
            <div className="flex gap-6">
              <div className="space-y-2 flex-1"><Skeleton className="h-3 w-12" /><Skeleton className="h-8 w-full" /></div>
              <div className="space-y-2 flex-1"><Skeleton className="h-3 w-12" /><Skeleton className="h-8 w-full" /></div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-12">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="lg:col-span-5 bg-white p-12 shadow-2xl space-y-10">
            <Skeleton className="h-10 w-2/3" />
            <div className="space-y-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-2 w-20" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }


  if (!eventDetails || eventDetails.status === 'CANCELLED') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
        <h1 className="text-6xl font-black text-red-600 mb-4 uppercase tracking-tighter italic">
          {eventDetails?.status === 'CANCELLED' ? 'CANCELLED' : 'Oops!'}
        </h1>
        <p className="text-xl text-red-900 font-bold mb-8">
          {eventDetails?.status === 'CANCELLED'
            ? 'This event has been cancelled by the organizer.'
            : 'This event link seems to be invalid or expired.'}
        </p>
        <Link href="/" className="px-8 py-4 bg-gray-900 text-white font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">
          Back to Home
        </Link>
      </div>
    );
  }

  const maxAttendees = eventDetails?.max_attendees;
  const currentAttendees = eventDetails?.current_attendees || 0;
  const isFull = maxAttendees ? currentAttendees >= maxAttendees : false;

  // Deadline helpers
  const now = new Date();
  const registrationDeadlinePassed = eventDetails?.last_date_to_register
    ? now > new Date(eventDetails.last_date_to_register)
    : false;
  const cancellationDeadlinePassed = eventDetails?.last_date_to_cancel
    ? now > new Date(eventDetails.last_date_to_cancel)
    : false;
  const eventStarted = eventDetails?.event_date
    ? now > new Date(eventDetails.event_date)
    : false;
  const canCancel = isRegistered && successData?.status !== 'CANCELLED' && !cancellationDeadlinePassed && !eventStarted;

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: 'full',
      timeStyle: 'short',
    });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Hero Banner Section */}
      <div className="relative w-full h-[300px] md:h-[450px] bg-gray-900 overflow-hidden">
        {eventDetails.banner_url && !bannerError ? (
          <Image
            src={eventDetails.banner_url}
            alt="Event Banner"
            fill
            className="object-cover opacity-60"
            priority
            unoptimized
            onError={() => setBannerError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-sky-950 to-sky-950 opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 to-transparent" />

        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <Link href="/my-events" className="absolute top-8 left-8 inline-flex items-center gap-2 text-white/80 hover:text-white transition-all font-black uppercase tracking-widest text-[10px] bg-black/20 backdrop-blur-md px-4 py-2 border border-white/10 group">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>

          <div className="space-y-4 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl">
              {eventDetails.type || 'Official Event'}
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-2xl italic">
              {eventDetails.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 -mt-20 relative z-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Left Column: Event Details & Poster */}
          <div className="lg:col-span-7 space-y-12">
            <div className="bg-white p-8 md:p-12 shadow-2xl border-l-[12px] border-sky-600">
              <div className="flex flex-wrap gap-6 mb-10">
                {eventDetails.event_date && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date &amp; Time</span>
                    <span className="text-xl font-black text-gray-900 uppercase tracking-tighter">{formatDateTime(eventDetails.event_date)}</span>
                  </div>
                )}
                <div className="w-px h-12 bg-gray-100 hidden md:block" />
                {eventDetails.venue && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Venue</span>
                    <span className="text-xl font-black text-gray-900 uppercase tracking-tighter">{eventDetails.venue}</span>
                  </div>
                )}
              </div>

              {eventDetails.details && (
                <div className="prose prose-indigo max-w-none">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">About The Event</h3>
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                    {eventDetails.details}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-12 pt-12 border-t border-gray-100">
                {eventDetails.duration && (
                  <div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Duration</div>
                    <div className="font-black text-gray-900">{eventDetails.duration}</div>
                  </div>
                )}
                {eventDetails.last_date_to_register && (
                  <div>
                    <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Reg. Deadline</div>
                    <div className={`font-black text-sm ${registrationDeadlinePassed ? 'text-gray-400 line-through' : 'text-red-600'}`}>
                      {formatDateTime(eventDetails.last_date_to_register)}
                    </div>
                    {registrationDeadlinePassed && <div className="text-[9px] text-gray-400 font-bold uppercase">Closed</div>}
                  </div>
                )}
                {eventDetails.last_date_to_cancel && (
                  <div>
                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Cancel By</div>
                    <div className={`font-black text-sm ${cancellationDeadlinePassed ? 'text-gray-400 line-through' : 'text-amber-600'}`}>
                      {formatDateTime(eventDetails.last_date_to_cancel)}
                    </div>
                    {cancellationDeadlinePassed && <div className="text-[9px] text-gray-400 font-bold uppercase">Expired</div>}
                  </div>
                )}
              </div>
            </div>

            {eventDetails.poster_url && !posterError ? (
              <div className="relative aspect-[3/4] w-full shadow-2xl overflow-hidden group">
                <Image
                  src={eventDetails.poster_url}
                  alt="Event Poster"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  unoptimized
                  onError={() => setPosterError(true)}
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10" />
              </div>
            ) : null}
          </div>

          {/* Right Column: Registration Form OR Ticket */}
          <div className="lg:col-span-5 sticky top-8">
            <AnimatePresence mode="wait">
              {successData ? (
                <motion.div 
                  key="ticket"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] border-t-[12px] p-8 md:p-12 space-y-10 ${
                    successData.status === 'WAITLISTED' ? 'border-amber-400' : 'border-blue-500'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 text-white flex items-center justify-center ${
                        successData.status === 'WAITLISTED' ? 'bg-amber-400' : 'bg-blue-500'
                      }`}>
                        {successData.status === 'WAITLISTED' ? <Clock className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                      </div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                        {successData.status === 'WAITLISTED' ? 'Waitlisted' : 'Registered'}
                      </h2>
                    </div>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
                      {successData.status === 'WAITLISTED'
                        ? "You're on the waitlist — we'll email you if a spot opens"
                        : 'Entry Ticket Secured'}
                    </p>
                  </div>

                  {successData.status === 'WAITLISTED' ? (
                    <div className="p-6 bg-amber-50 border border-amber-100 rounded-lg text-center space-y-2">
                      <p className="text-sm font-bold text-amber-800">You are in the waitlist queue. If someone cancels, you&apos;ll be automatically confirmed and receive your QR ticket by email.</p>
                    </div>
                  ) : (
                    <div className="flex justify-center p-8 bg-gray-50 border-4 border-dashed border-gray-200 shadow-inner group">
                      {successData.qr_code && (
                        <Image
                          src={successData.qr_code}
                          alt="Entry QR"
                          width={256}
                          height={256}
                          className="object-contain"
                        />
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Attendee</p>
                        <p className="text-lg font-black text-gray-900">{successData.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Size</p>
                        <p className="text-lg font-black text-gray-900">{successData.participants} Pax</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {successData.status !== 'WAITLISTED' && (
                      <button
                        onClick={downloadQR}
                        className="w-full py-5 bg-green-600 text-white font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl hover:bg-green-700 flex items-center justify-center gap-3"
                      >
                        <Download className="w-5 h-5" />
                        Download Ticket
                      </button>
                    )}
                    {canCancel && (
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="w-full py-4 border-2 border-red-500 text-red-600 font-black transition-all uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        {cancelling ? 'Cancelling...' : 'Cancel Registration'}
                      </button>
                    )}
                    {isRegistered && !canCancel && !eventStarted && eventDetails?.last_date_to_cancel && cancellationDeadlinePassed && (
                      <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Cancellation deadline has passed
                      </p>
                    )}
                  </div>
                </motion.div>
              ) : isFull ? (
                <motion.div 
                  key="waitlist"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] border-t-[12px] border-amber-400 p-8 md:p-12 space-y-8"
                >
                  <div className="space-y-2">
                    <span className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-black uppercase tracking-[0.3em] rounded">
                      Event Full
                    </span>
                    <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-gray-900 mt-2">
                      JOIN THE <span className="text-amber-400">WAITLIST</span>
                    </h2>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
                      All {maxAttendees} spots are taken — secure your place in the queue
                    </p>
                  </div>

                  <div className="p-5 bg-amber-50/60 border border-amber-100 rounded-lg text-sm text-amber-800 font-medium leading-relaxed">
                    If a registered participant cancels, you&apos;ll be automatically promoted and receive a confirmation email with your QR ticket.
                  </div>

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <label htmlFor="wl-name" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <User className="w-3 h-3" /> Full Name
                      </label>
                      <input
                        id="wl-name" name="name" type="text" required
                        placeholder="Ex: Alexander Pierce"
                        defaultValue={user?.name || ''}
                        className="w-full px-0 py-3 bg-transparent border-b-2 border-gray-100 focus:border-amber-400 outline-none font-bold text-lg transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="wl-email" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Email
                      </label>
                      <input
                        id="wl-email" name="email" type="email" required
                        placeholder="alex@example.com"
                        defaultValue={user?.email || ''}
                        className="w-full px-0 py-3 bg-transparent border-b-2 border-gray-100 focus:border-amber-400 outline-none font-bold text-lg transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="wl-phone" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Phone className="w-3 h-3" /> Phone Number
                      </label>
                      <input
                        id="wl-phone" name="phone" type="tel" required
                        placeholder="+91 00000 00000"
                        className="w-full px-0 py-3 bg-transparent border-b-2 border-gray-100 focus:border-amber-400 outline-none font-bold text-lg transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="wl-participants" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Users className="w-3 h-3" /> Participants
                      </label>
                      <input
                        id="wl-participants" name="participants" type="number" min="1" max="10" defaultValue="1"
                        className="w-full px-0 py-3 bg-transparent border-b-2 border-gray-100 focus:border-amber-400 outline-none font-bold text-lg transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || registrationDeadlinePassed}
                      className="w-full py-6 bg-amber-400 text-white font-black text-sm uppercase tracking-[0.3em] transition-all shadow-2xl hover:bg-amber-500 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      {registrationDeadlinePassed ? 'Registration Closed' : 'Join Waitlist'}
                    </button>
                  </form>
                </motion.div>
              ) : registrationDeadlinePassed ? (
                <motion.div
                  key="deadline-passed"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] border-t-[12px] border-gray-400 p-8 md:p-12 space-y-8"
                >
                  <div className="space-y-2">
                    <span className="inline-block px-3 py-1 bg-gray-100 border border-gray-200 text-gray-500 text-[9px] font-black uppercase tracking-[0.3em] rounded">Registration Closed</span>
                    <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-gray-900 mt-2">Registration <span className="text-gray-400">Ended</span></h2>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">The deadline to register for this event has passed.</p>
                  </div>
                  <Link href="/" className="w-full py-5 bg-gray-900 text-white font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl hover:bg-black flex items-center justify-center gap-3">
                    Browse Other Events
                  </Link>
                </motion.div>
              ) : (
                <motion.div 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] p-8 md:p-12 space-y-10"
                >
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Register <span className="text-sky-600">Now</span></h2>
                    <div className="flex items-center justify-between gap-4 mt-2">
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Reserve your spot in seconds</p>
                      {maxAttendees !== undefined && maxAttendees !== null && maxAttendees > 0 && (
                        <span className={`text-[9px] font-black uppercase px-2 py-1 border shrink-0 rounded ${
                          maxAttendees - currentAttendees <= 5 
                            ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}>
                          {maxAttendees - currentAttendees} spots left
                        </span>
                      )}
                    </div>
                    
                    {maxAttendees !== undefined && maxAttendees !== null && maxAttendees > 0 && (
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-3 border border-gray-200/50 shadow-inner">
                        <div 
                          className={`h-full transition-all duration-1000 ${
                            (currentAttendees / maxAttendees) >= 0.9 
                              ? 'bg-red-500' 
                              : (currentAttendees / maxAttendees) >= 0.7 
                                ? 'bg-amber-500' 
                                : 'bg-sky-600'
                          }`}
                          style={{ width: `${Math.min(100, (currentAttendees / maxAttendees) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <form className="space-y-8" onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <User className="w-3 h-3" /> Full Name
                        </label>
                        <input
                          id="name" name="name" type="text" required
                          placeholder="Ex: Alexander Pierce"
                          defaultValue={user?.name || ''}
                          className="w-full px-0 py-3 bg-transparent border-b-2 border-gray-100 focus:border-sky-600 outline-none font-bold text-lg transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="email" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Mail className="w-3 h-3" /> Email
                        </label>
                        <input
                          id="email" name="email" type="email" required
                          placeholder="alex@example.com"
                          defaultValue={user?.email || ''}
                          className="w-full px-0 py-3 bg-transparent border-b-2 border-gray-100 focus:border-sky-600 outline-none font-bold text-lg transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Phone className="w-3 h-3" /> Phone Number
                        </label>
                        <input
                          id="phone" name="phone" type="tel" required
                          placeholder="+91 00000 00000"
                          className="w-full px-0 py-3 bg-transparent border-b-2 border-gray-100 focus:border-sky-600 outline-none font-bold text-lg transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="participants" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Users className="w-3 h-3" /> Team Size / Participants
                        </label>
                        <input
                          id="participants" name="participants" type="number" min="1" 
                          max={maxAttendees ? maxAttendees - currentAttendees : 10} 
                          defaultValue="1"
                          className="w-full px-0 py-3 bg-transparent border-b-2 border-gray-100 focus:border-sky-600 outline-none font-bold text-lg transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-6 bg-sky-600 text-white font-black text-sm uppercase tracking-[0.3em] transition-all shadow-2xl hover:shadow-sky-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Confirm Attendance"}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

