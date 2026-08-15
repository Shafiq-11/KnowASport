import { jsPDF } from 'jspdf';
import { formatDate, formatDateShort, formatPrice, formatTime } from '../utils/formatters.js';

export const passPdfService = {
  /**
   * Generate and trigger download of a high-quality Registration Pass PDF
   */
  async downloadRegistrationPass({ registration, event, user, qrDataUrl }) {
    if (!registration) {
      throw new Error('Registration details are missing.');
    }

    const regEvent = event || registration.event || {};
    const isConfirmed = registration.status === 'confirmed';
    const isFree = registration.payment_status === 'not_required' || registration.total_fee === 0;
    const isTeam = registration.participation_type === 'team';
    const checkInRequired = regEvent.check_in_required !== false;

    // 1. Initialize A4 Portrait Document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    // 2. Background Paper
    doc.setFillColor(248, 250, 252); // #F8FAFC
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // 3. Main Pass Card Container
    const cardX = margin;
    const cardY = 16;
    const cardWidth = contentWidth;
    const cardHeight = 265;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240); // #E2E8F0
    doc.setLineWidth(0.5);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, 'FD');

    // 4. Header Bar (Dark Navy #0B1120 with Gold Top Border)
    const headerHeight = 36;
    doc.setFillColor(11, 17, 32); // #0B1120
    doc.rect(cardX, cardY, cardWidth, headerHeight, 'F');

    // Gold Top Stripe
    doc.setFillColor(245, 158, 11); // #F59E0B
    doc.rect(cardX, cardY, cardWidth, 2.5, 'F');

    // KnowASport Brand Logo Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('KNOW', cardX + 8, cardY + 14);

    doc.setTextColor(245, 158, 11); // Amber 'A'
    doc.text('A', cardX + 32, cardY + 14);

    doc.setTextColor(255, 255, 255);
    doc.text('SPORT', cardX + 37, cardY + 14);

    // Subtitle
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225); // #CBD5E1
    doc.text('OFFICIAL DIGITAL REGISTRATION PASS', cardX + 8, cardY + 21);
    doc.text('TAMIL NADU SPORTS NETWORK', cardX + 8, cardY + 26);

    // Status Badge in Header (Right aligned)
    const statusText = isConfirmed ? 'CONFIRMED' : isFree ? 'FREE PASS' : 'PENDING';
    const statusBg = isConfirmed ? [22, 163, 74] : [217, 119, 6];
    doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
    doc.roundedRect(cardX + cardWidth - 36, cardY + 9, 28, 8, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(statusText, cardX + cardWidth - 22, cardY + 14.5, { align: 'center' });

    // 5. Event Details Section
    let currentY = cardY + headerHeight + 8;

    // Sport Category Tag
    doc.setFillColor(254, 243, 199); // #FEF3C7
    doc.roundedRect(cardX + 8, currentY, 28, 6, 1.5, 1.5, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9); // #B45309
    doc.text((regEvent.sport_name || 'SPORTS').toUpperCase(), cardX + 22, currentY + 4.2, { align: 'center' });

    // Entry Type Tag
    const entryLabel = isTeam
      ? `TEAM EVENT (${registration.team_size || regEvent.team_size || 1} SQUAD)`
      : 'INDIVIDUAL EVENT';
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(cardX + 39, currentY, 46, 6, 1.5, 1.5, 'F');
    doc.setTextColor(71, 85, 105);
    doc.text(entryLabel, cardX + 62, currentY + 4.2, { align: 'center' });

    currentY += 10;

    // Event Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // #0F172A
    const eventTitle = regEvent.title || 'Tournament Event';
    const splitTitle = doc.splitTextToSize(eventTitle, cardWidth - 16);
    doc.text(splitTitle, cardX + 8, currentY);

    currentY += splitTitle.length * 6 + 2;

    // Organizer Name
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const orgName = regEvent.organizer?.organization_name || 'Verified Sports Council';
    doc.text(`Organized by ${orgName}`, cardX + 8, currentY);

    currentY += 6;

    // Divider Line
    doc.setDrawColor(241, 245, 249);
    doc.line(cardX + 8, currentY, cardX + cardWidth - 8, currentY);

    currentY += 6;

    // Key Specs Grid (2 Columns: Date/Time & Venue/City)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184); // Label color
    doc.text('EVENT DATE & TIME', cardX + 8, currentY);
    doc.text('VENUE LOCATION', cardX + cardWidth / 2, currentY);

    currentY += 5;

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const dateStr = formatDate(regEvent.start_date) || 'To be announced';
    const timeStr = regEvent.start_time ? formatTime(regEvent.start_time) : '09:00 AM IST';
    doc.text(`${dateStr} • ${timeStr}`, cardX + 8, currentY);

    const venueStr = regEvent.venue_name || 'Sports Arena';
    const cityStr = `${regEvent.city_name || 'Tamil Nadu'}`;
    doc.text(`${venueStr}, ${cityStr}`, cardX + cardWidth / 2, currentY);

    currentY += 8;

    // 6. Participant / Team Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX + 8, currentY, cardWidth - 16, 24, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('PARTICIPANT DETAILS', cardX + 12, currentY + 6);

    const primaryParticipant = registration.participants?.[0]?.full_name || user?.name || user?.email || 'Registered Athlete';

    if (isTeam) {
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Team: ${registration.team_name || 'Sports Squad'}`, cardX + 12, currentY + 13);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Captain: ${primaryParticipant} • Squad: ${registration.team_size || 1} Players`, cardX + 12, currentY + 19);
    } else {
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(primaryParticipant, cardX + 12, currentY + 13);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Single Athlete Entry • Category: Open`, cardX + 12, currentY + 19);
    }

    currentY += 28;

    // 7. Security Verification Box (Registration ID, Pass Code & QR Code)
    const qrBoxHeight = 88;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(cardX + 8, currentY, cardWidth - 16, qrBoxHeight, 3, 3, 'FD');

    // Registration ID Banner
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('REGISTRATION ID', cardX + cardWidth / 2, currentY + 7, { align: 'center' });

    doc.setFontSize(13);
    doc.setFont('courier', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(registration.registration_number || 'KAS-2026-000000', cardX + cardWidth / 2, currentY + 13, { align: 'center' });

    // Embedded QR Code (Centered)
    const qrSize = 42;
    const qrX = cardX + (cardWidth - qrSize) / 2;
    const qrY = currentY + 16;

    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    } else {
      // Fallback Box
      doc.setFillColor(241, 245, 249);
      doc.rect(qrX, qrY, qrSize, qrSize, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('QR Pass', qrX + qrSize / 2, qrY + qrSize / 2, { align: 'center' });
    }

    // Prominent Pass Code Badge Box
    const passCodeY = qrY + qrSize + 3;
    const passCodeWidth = 56;
    const passCodeX = cardX + (cardWidth - passCodeWidth) / 2;

    doc.setFillColor(254, 243, 199); // #FEF3C7
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(passCodeX, passCodeY, passCodeWidth, 10, 2, 2, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('PASS CODE', passCodeX + passCodeWidth / 2, passCodeY + 3.5, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('courier', 'bold');
    doc.setTextColor(120, 53, 15);
    doc.text(registration.pass_code || 'KAS7X92P', passCodeX + passCodeWidth / 2, passCodeY + 8.2, { align: 'center' });

    // Check-in requirement caption
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const checkinNotice = checkInRequired
      ? 'Show this QR code or Pass Code at the venue entrance reporting desk for check-in.'
      : 'Direct entry confirmed. Check-in not required for this event.';
    doc.text(checkinNotice, cardX + cardWidth / 2, passCodeY + 14, { align: 'center' });

    currentY += qrBoxHeight + 6;

    // 8. Payment & Fee Summary Strip
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(cardX + 8, currentY, cardWidth - 16, 12, 2, 2, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Payment Amount:', cardX + 12, currentY + 7.5);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const feeText = isFree ? 'Free Registration (₹0)' : formatPrice(registration.total_fee || regEvent.entry_fee);
    doc.text(feeText, cardX + 42, currentY + 7.5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Payment Status:', cardX + cardWidth - 62, currentY + 7.5);

    doc.setTextColor(isConfirmed ? 22 : 180, isConfirmed ? 163 : 83, isConfirmed ? 74 : 9);
    doc.text(registration.payment_status ? registration.payment_status.toUpperCase().replace('_', ' ') : 'CONFIRMED', cardX + cardWidth - 12, currentY + 7.5, { align: 'right' });

    currentY += 16;

    // 9. Footer Terms & Security Stamp
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    const terms1 = '• This registration pass is non-transferable and issued exclusively to the registered athlete/team.';
    const terms2 = '• Please arrive 30 minutes prior to match schedule with a valid Government Photo ID.';
    const terms3 = `• Verified digital document issued via KnowASport Platform • ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    doc.text(terms1, cardX + 8, currentY);
    doc.text(terms2, cardX + 8, currentY + 4);
    doc.text(terms3, cardX + 8, currentY + 8);

    // 10. Generate and Save PDF
    const cleanTitle = (regEvent.title || 'Event')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30);
    const regCode = registration.registration_number || registration.pass_code || 'PASS';
    const fileName = `KnowASport-${cleanTitle}-${regCode}.pdf`;

    doc.save(fileName);
    return true;
  },
};
