import React, { useRef, useState } from 'react';
import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  BADGE_PRESETS as PRESET_TEMPLATES,
  computeCoverCropRect,
  formatBadgeFilename,
  isConsultantRole,
} from '../../utils/badgeHelpers';

/**
 * Renders the authentic series-style CBI 7-Point Gold Star Shield or FBI Gold Eagle Shield SVG.
 */
function SeriesMetallicShield({ badgeStyle = 'CBI', acronym = 'C.B.I.' }) {
  if (badgeStyle === 'FBI') {
    return (
      <svg
        viewBox="0 0 120 140"
        className="w-24 h-28 drop-shadow-[0_6px_14px_rgba(0,0,0,0.6)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="fbiGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
          <linearGradient id="fbiNavy" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        {/* Top Gold Eagle Wings */}
        <path
          d="M20 26 C38 10, 50 18, 60 12 C70 18, 82 10, 100 26 C86 30, 74 28, 60 32 C46 28, 34 30, 20 26 Z"
          fill="url(#fbiGold)"
          stroke="#713f12"
          strokeWidth="1.5"
        />
        {/* Outer Gold Federal Shield */}
        <path
          d="M18 32 L102 32 L102 78 C102 106, 60 128, 60 128 C60 128, 18 106, 18 78 Z"
          fill="url(#fbiGold)"
          stroke="#713f12"
          strokeWidth="2.5"
        />
        {/* Inner Navy Blue Shield */}
        <path
          d="M26 40 L94 40 L94 76 C94 99, 60 118, 60 118 C60 118, 26 99, 26 76 Z"
          fill="url(#fbiNavy)"
          stroke="url(#fbiGold)"
          strokeWidth="2"
        />
        {/* Center Gold Seal Circle */}
        <circle
          cx="60"
          cy="72"
          r="20"
          fill="url(#fbiNavy)"
          stroke="url(#fbiGold)"
          strokeWidth="2.5"
        />
        {/* Vertical Scales & Stars */}
        <path
          d="M60 56 L60 88 M48 66 L72 66"
          stroke="url(#fbiGold)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Bottom Gold Ribbon */}
        <rect
          x="36"
          y="94"
          width="48"
          height="14"
          rx="3"
          fill="url(#fbiGold)"
        />
        <text
          x="60"
          y="104"
          textAnchor="middle"
          fill="#0f172a"
          fontSize="9"
          fontWeight="bold"
          fontFamily="Georgia, serif"
        >
          {acronym.replace(/\./g, '')}
        </text>
      </svg>
    );
  }

  // Default: Series-Accurate CBI 7-Point Gold California Star inside Blue/Gold Law Enforcement Shield
  return (
    <svg
      viewBox="0 0 120 140"
      className="w-24 h-28 drop-shadow-[0_6px_14px_rgba(0,0,0,0.6)]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="cbiGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
        <linearGradient id="cbiBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>

      {/* Outer Gold Shield Frame */}
      <path
        d="M60 8 C78 14, 104 16, 104 42 C104 88, 60 130, 60 130 C60 130, 16 88, 16 42 C16 16, 42 14, 60 8 Z"
        fill="url(#cbiGold)"
        stroke="#713f12"
        strokeWidth="2.5"
      />

      {/* Inner Dark Rim */}
      <path
        d="M60 15 C75 20, 96 22, 96 44 C96 83, 60 121, 60 121 C60 121, 24 83, 24 44 C24 22, 45 20, 60 15 Z"
        fill="#0f172a"
        stroke="url(#cbiGold)"
        strokeWidth="1.5"
      />

      {/* California 7-Point Gold Star */}
      <polygon
        points="60,24 68,45 90,39 76,58 92,75 69,74 60,95 51,74 28,75 44,58 30,39 52,45"
        fill="url(#cbiGold)"
        stroke="#713f12"
        strokeWidth="1.5"
      />

      {/* Center Blue State Seal Medallion */}
      <circle
        cx="60"
        cy="60"
        r="17"
        fill="url(#cbiBlue)"
        stroke="url(#cbiGold)"
        strokeWidth="2.2"
      />
      <text
        x="60"
        y="58"
        textAnchor="middle"
        fill="#fef08a"
        fontSize="6"
        fontWeight="bold"
      >
        STATE OF
      </text>
      <text
        x="60"
        y="66"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="6.5"
        fontWeight="bold"
      >
        CALIFORNIA
      </text>

      {/* Bottom Gold Banner */}
      <rect
        x="34"
        y="99"
        width="52"
        height="13"
        rx="3"
        fill="url(#cbiGold)"
      />
      <text
        x="60"
        y="108.5"
        textAnchor="middle"
        fill="#0f172a"
        fontSize="8.5"
        fontWeight="bold"
        fontFamily="Georgia, serif"
      >
        {acronym}
      </text>
    </svg>
  );
}

/**
 * Interactive CBI / FBI Credential & Badge Studio embedded inside /characters.
 * Features:
 * 1. Authentic series-style CBI (Seasons 1-6) and FBI (Seasons 6-7) laminated ID credentials.
 * 2. Custom User Photo Upload from device (<input type="file" accept="image/*" />) OR cast portrait selection.
 * 3. Full user flexibility: every single field (Name, Agency, Acronym, Rank, Specialty, Field Office, Badge Number)
 *    is a free-text input that the user can define however they want.
 * 4. High-resolution PNG export via HTML5 Canvas.
 *
 * @param {Object} props
 * @param {Array} props.castList - Main cast array providing fallback avatar portraits
 */
export default function AgentBadgeGenerator({ castList = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Badge style & freely editable text fields
  const [badgeStyle, setBadgeStyle] = useState('CBI');
  const [agentName, setAgentName] = useState('Patrick Jane');
  const [department, setDepartment] = useState(PRESET_TEMPLATES.CBI.department);
  const [agency, setAgency] = useState(PRESET_TEMPLATES.CBI.agency);
  const [acronym, setAcronym] = useState(PRESET_TEMPLATES.CBI.acronym);
  const [rank, setRank] = useState(PRESET_TEMPLATES.CBI.rank);
  const [specialty, setSpecialty] = useState(PRESET_TEMPLATES.CBI.specialty);
  const [office, setOffice] = useState(PRESET_TEMPLATES.CBI.office);
  const [badgeNumber, setBadgeNumber] = useState(PRESET_TEMPLATES.CBI.badgeNumber);

  // Photo state: Either user-uploaded custom photo DataURL or a cast portrait
  const [uploadedPhotoDataUrl, setUploadedPhotoDataUrl] = useState(null);
  const [selectedPortraitIndex, setSelectedPortraitIndex] = useState(0);

  const selectedCast = castList[selectedPortraitIndex] || castList[0];
  const activePhotoUrl =
    uploadedPhotoDataUrl ||
    selectedCast?.character?.image?.medium ||
    selectedCast?.person?.image?.medium ||
    '/favicon.svg';

  /**
   * Applies the official CBI or FBI series template while allowing full manual edits afterward.
   */
  const handleApplyPreset = (presetKey) => {
    const preset = PRESET_TEMPLATES[presetKey];
    if (!preset) return;
    setBadgeStyle(preset.style);
    setDepartment(preset.department);
    setAgency(preset.agency);
    setAcronym(preset.acronym);
    setRank(preset.rank);
    setSpecialty(preset.specialty);
    setOffice(preset.office);
    setBadgeNumber(preset.badgeNumber);
  };

  /**
   * Reads a user-selected image file from their computer/phone into a local Data URL.
   */
  const handlePhotoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * Renders the authentic series-style CBI/FBI laminated ID card (including the user's
   * uploaded photo and 7-point gold star / eagle shield) onto an HTML5 Canvas and downloads as PNG.
   */
  const handleDownloadBadgePng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 760;
    canvas.height = 460;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawCardContents = (loadedImg) => {
      const isFbi = badgeStyle === 'FBI';

      // Outer Dark Leather Wallet Frame
      ctx.fillStyle = '#0e0e14';
      ctx.fillRect(0, 0, 760, 460);

      // Inner Laminated White/Silver Credential Card (Series-authentic style)
      const cardGrad = ctx.createLinearGradient(20, 20, 740, 440);
      cardGrad.addColorStop(0, '#f8fafc');
      cardGrad.addColorStop(0.5, '#f1f5f9');
      cardGrad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = cardGrad;
      ctx.fillRect(18, 18, 724, 424);

      // Top Official Department Header Bar (Navy Blue for CBI/FBI)
      ctx.fillStyle = isFbi ? '#0f172a' : '#1e3a8a';
      ctx.fillRect(18, 18, 724, 78);

      // Gold Stripe under Header
      ctx.fillStyle = '#eab308';
      ctx.fillRect(18, 96, 724, 7);

      // Header Department & Agency Titles
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText((department || '').toUpperCase().slice(0, 58), 38, 44);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Georgia, serif';
      ctx.fillText((agency || '').toUpperCase().slice(0, 42), 38, 77);

      // Top-Right Large Acronym Stamp (C.B.I. or F.B.I.)
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 34px Georgia, serif';
      ctx.textAlign = 'right';
      ctx.fillText((acronym || 'C.B.I.').slice(0, 10), 720, 74);
      ctx.textAlign = 'left';

      // Rank / Role Authorization Banner Strip
      ctx.fillStyle = rank.toLowerCase().includes('consultant') ? '#b91c1c' : '#1d4ed8';
      ctx.fillRect(18, 103, 724, 34);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(
        `${(rank || 'SPECIAL AGENT').toUpperCase()}  •  ID #${badgeNumber || 'CBI-0492'}`,
        38,
        126
      );

      // Left Photo Box (Aspect-preserving top-biased cover crop so uploaded photos never stretch!)
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(38, 156, 175, 215);
      if (loadedImg) {
        const crop = computeCoverCropRect(
          loadedImg.naturalWidth || loadedImg.width,
          loadedImg.naturalHeight || loadedImg.height,
          175,
          215
        );
        ctx.drawImage(
          loadedImg,
          crop.sx,
          crop.sy,
          crop.sw,
          crop.sh,
          38,
          156,
          175,
          215
        );
      }
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 3;
      ctx.strokeRect(38, 156, 175, 215);

      // Center Agent Credentials Text
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('NAME OF CREDENTIAL HOLDER', 236, 172);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 30px Georgia, serif';
      ctx.fillText((agentName || 'Patrick Jane').slice(0, 24), 236, 206);

      // Specialty Field
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('SPECIALTY & ASSIGNMENT', 236, 244);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText((specialty || 'Behavioral Profiling').slice(0, 38), 236, 267);

      // Field Office Field
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('ASSIGNED FIELD OFFICE / JURISDICTION', 236, 304);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText((office || 'Sacramento HQ').slice(0, 38), 236, 326);

      // Authorized Signature Line
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(236, 366);
      ctx.lineTo(520, 366);
      ctx.stroke();

      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'italic 18px Georgia, serif';
      ctx.fillText(agentName || 'Patrick Jane', 245, 360);

      // Right Metallic Gold Shield Seal on Canvas
      const cx = 635;
      const cy = 255;
      ctx.beginPath();
      ctx.arc(cx, cy, 68, 0, Math.PI * 2);
      ctx.fillStyle = '#fef9c3';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ca8a04';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 52, 0, Math.PI * 2);
      ctx.fillStyle = isFbi ? '#0f172a' : '#1e3a8a';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#eab308';
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText((acronym || 'C.B.I.').slice(0, 6), cx, cy + 6);
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('OFFICIAL SEAL', cx, cy + 24);
      ctx.textAlign = 'left';

      // Bottom Footer Security Strip
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(18, 396, 724, 46);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(
        'OFFICIAL LAW ENFORCEMENT CREDENTIAL • PROPERTY OF DEPARTMENT OF JUSTICE',
        38,
        424
      );
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`SERIAL: ${badgeNumber}`, 720, 424);

      const filename = formatBadgeFilename(agentName, badgeStyle);
      try {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch {
        // Fallback if a remote cast photo taints the canvas due to CORS headers
        if (loadedImg) {
          drawCardContents(null);
        }
      }
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => drawCardContents(img);
    img.onerror = () => drawCardContents(null);
    img.src = activePhotoUrl;
  };

  const isConsultantRank = isConsultantRole(rank);

  return (
    <div className="mb-8 glass-panel rounded-3xl p-5 sm:p-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <BadgeCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400 block">
              Series-Authentic CBI &amp; FBI Credential Studio
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#f5f5f5] font-serif-title">
              Create Your Own CBI or FBI Badge with Your Photo
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/50 transition cursor-pointer shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isOpen ? 'Close Badge Studio' : 'Open Badge Creator'}</span>
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-7 items-start animate-fade-slide">
          {/* Left 5 Cols: Full Customization Controls */}
          <div className="lg:col-span-5 space-y-3.5">
            {/* Series Template Quick Presets */}
            <div>
              <span className="block text-xs font-semibold text-zinc-300 mb-1.5">
                1. Choose Series Badge Template (Or Customize Below)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('CBI')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    badgeStyle === 'CBI'
                      ? 'bg-blue-700 text-white border-amber-400 shadow'
                      : 'bg-zinc-900 text-zinc-300 border-white/10 hover:text-white'
                  }`}
                >
                  ★ CBI Badge (Seasons 1–6)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('FBI')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    badgeStyle === 'FBI'
                      ? 'bg-blue-900 text-white border-amber-400 shadow'
                      : 'bg-zinc-900 text-zinc-300 border-white/10 hover:text-white'
                  }`}
                >
                  🦅 FBI Badge (Seasons 6–7)
                </button>
              </div>
            </div>

            {/* Upload User Photo or Pick Cast Photo */}
            <div className="rounded-2xl bg-[#0d0d13] border border-white/15 p-3.5 space-y-2.5">
              <span className="block text-xs font-semibold text-zinc-200">
                2. Upload Your Own Photo (or Pick a Cast Portrait)
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Photo from Device</span>
                </button>

                {uploadedPhotoDataUrl && (
                  <button
                    type="button"
                    onClick={() => setUploadedPhotoDataUrl(null)}
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs text-zinc-300 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-red-400" />
                    <span>Use Cast Photo</span>
                  </button>
                )}
              </div>

              {!uploadedPhotoDataUrl && (
                <div>
                  <label
                    htmlFor="badge-avatar-select"
                    className="block text-[11px] font-medium text-zinc-400 mb-1"
                  >
                    Or select a character portrait:
                  </label>
                  <select
                    id="badge-avatar-select"
                    value={selectedPortraitIndex}
                    onChange={(e) => setSelectedPortraitIndex(Number(e.target.value))}
                    className="w-full h-9 rounded-xl bg-black border border-white/15 px-3 text-xs text-zinc-200"
                  >
                    {castList.map((c, idx) => (
                      <option key={c.person?.id || idx} value={idx}>
                        {c.character?.name} ({c.person?.name})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Free-Text Input Fields for Complete User Flexibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label
                  htmlFor="badge-agent-name"
                  className="block text-xs font-semibold text-zinc-300 mb-1"
                >
                  Full Name on Credential
                </label>
                <input
                  id="badge-agent-name"
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Type your name..."
                  className="w-full h-9 rounded-xl bg-[#0d0d13] border border-white/15 px-3 text-xs text-[#f5f5f5]"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="badge-agency-input"
                  className="block text-xs font-semibold text-zinc-300 mb-1"
                >
                  Agency / Bureau Name (Custom or Preset)
                </label>
                <input
                  id="badge-agency-input"
                  type="text"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  placeholder="e.g. CALIFORNIA BUREAU OF INVESTIGATION"
                  className="w-full h-9 rounded-xl bg-[#0d0d13] border border-white/15 px-3 text-xs text-[#f5f5f5]"
                />
              </div>

              <div>
                <label
                  htmlFor="badge-acronym-input"
                  className="block text-xs font-semibold text-zinc-300 mb-1"
                >
                  Badge Acronym
                </label>
                <input
                  id="badge-acronym-input"
                  type="text"
                  maxLength={8}
                  value={acronym}
                  onChange={(e) => setAcronym(e.target.value)}
                  placeholder="e.g. C.B.I. or F.B.I."
                  className="w-full h-9 rounded-xl bg-[#0d0d13] border border-white/15 px-3 text-xs text-[#f5f5f5]"
                />
              </div>

              <div>
                <label
                  htmlFor="badge-rank-input"
                  className="block text-xs font-semibold text-zinc-300 mb-1"
                >
                  Rank / Title
                </label>
                <input
                  id="badge-rank-input"
                  type="text"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  placeholder="e.g. INDEPENDENT CONSULTANT"
                  className="w-full h-9 rounded-xl bg-[#0d0d13] border border-white/15 px-3 text-xs text-[#f5f5f5]"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="badge-specialty-input"
                  className="block text-xs font-semibold text-zinc-300 mb-1"
                >
                  Your Custom Specialty &amp; Skills
                </label>
                <input
                  id="badge-specialty-input"
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Type any specialty (e.g. Cold Reading, Hypnosis, Cyber Forensics)..."
                  className="w-full h-9 rounded-xl bg-[#0d0d13] border border-white/15 px-3 text-xs text-[#f5f5f5]"
                />
              </div>

              <div>
                <label
                  htmlFor="badge-office-input"
                  className="block text-xs font-semibold text-zinc-300 mb-1"
                >
                  Field Office / Unit
                </label>
                <input
                  id="badge-office-input"
                  type="text"
                  value={office}
                  onChange={(e) => setOffice(e.target.value)}
                  placeholder="e.g. Sacramento HQ"
                  className="w-full h-9 rounded-xl bg-[#0d0d13] border border-white/15 px-3 text-xs text-[#f5f5f5]"
                />
              </div>

              <div>
                <label
                  htmlFor="badge-serial-input"
                  className="block text-xs font-semibold text-zinc-300 mb-1"
                >
                  Badge Serial ID
                </label>
                <input
                  id="badge-serial-input"
                  type="text"
                  value={badgeNumber}
                  onChange={(e) => setBadgeNumber(e.target.value)}
                  placeholder="e.g. CBI-0492-CA"
                  className="w-full h-9 rounded-xl bg-[#0d0d13] border border-white/15 px-3 text-xs text-[#f5f5f5]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadBadgePng}
              className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/60 transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download Credential Badge (PNG)</span>
            </button>
          </div>

          {/* Right 7 Cols: Series-Authentic Laminated CBI / FBI Credential Card inside Leather Holder */}
          <div className="lg:col-span-7">
            <div className="p-3 sm:p-4 rounded-3xl bg-gradient-to-b from-zinc-900 via-[#0d0d12] to-black border-2 border-zinc-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
              {/* Laminated Credential Interior (Authentic White/Silver Series ID Card) */}
              <div className="rounded-2xl overflow-hidden border-2 border-slate-300 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-900 shadow-inner">
                {/* Top Navy Blue Department Header */}
                <div
                  className={`px-5 py-3.5 border-b-4 border-amber-400 flex items-center justify-between gap-3 ${
                    badgeStyle === 'FBI'
                      ? 'bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900'
                      : 'bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-amber-300 block truncate">
                      {department}
                    </span>
                    <h3 className="text-base sm:text-xl font-extrabold text-white font-serif-title tracking-wide truncate">
                      {agency}
                    </h3>
                  </div>

                  <span className="text-2xl sm:text-3xl font-extrabold font-serif-title text-amber-300 tracking-wider shrink-0">
                    {acronym}
                  </span>
                </div>

                {/* Authorization Rank Bar (Crimson for Consultant like Patrick Jane, Royal Blue for Special Agent like Lisbon/Cho) */}
                <div
                  className={`px-5 py-1.5 flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-white ${
                    isConsultantRank
                      ? 'bg-gradient-to-r from-red-700 via-red-600 to-red-800'
                      : 'bg-gradient-to-r from-blue-800 via-blue-700 to-blue-900'
                  }`}
                >
                  <span>{rank || 'SPECIAL AGENT'}</span>
                  <span className="font-mono-code">ID #{badgeNumber}</span>
                </div>

                {/* Main Laminated Credential Body */}
                <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center relative">
                  {/* Subtle Watermark Seal in Center Background */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.05]">
                    <span className="text-7xl font-serif-title font-extrabold text-blue-950">
                      {acronym}
                    </span>
                  </div>

                  {/* Left 4 Cols: Holder Photo Frame */}
                  <div className="sm:col-span-4 flex flex-col items-center relative z-10">
                    <div className="w-32 h-40 rounded-lg overflow-hidden border-2 border-blue-950 bg-slate-300 shadow-md">
                      <img
                        src={activePhotoUrl}
                        alt={agentName}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <span className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {uploadedPhotoDataUrl ? 'Custom Photo Verified' : 'Official File Photo'}
                    </span>
                  </div>

                  {/* Center 5 Cols: Credential Holder Details */}
                  <div className="sm:col-span-5 space-y-2.5 relative z-10 text-left">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Name of Credential Holder
                      </span>
                      <div className="text-xl sm:text-2xl font-extrabold text-slate-950 font-serif-title leading-tight break-words">
                        {agentName || 'Patrick Jane'}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Specialty &amp; Assignment
                      </span>
                      <div className="text-xs sm:text-sm font-bold text-blue-950 leading-snug break-words">
                        {specialty || 'Behavioral Profiling & Cold Reading'}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Field Office / Unit
                      </span>
                      <div className="text-xs font-semibold text-slate-800 break-words">
                        {office || 'Sacramento HQ'}
                      </div>
                    </div>

                    {/* Signature Line */}
                    <div className="pt-2 border-t border-slate-300">
                      <div className="text-sm italic font-serif-title text-blue-900">
                        {agentName || 'Patrick Jane'}
                      </div>
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">
                        Authorized Signature
                      </span>
                    </div>
                  </div>

                  {/* Right 3 Cols: Series-Accurate Metallic Gold 7-Point CBI Star or FBI Eagle Shield */}
                  <div className="sm:col-span-3 flex flex-col items-center justify-center relative z-10">
                    <SeriesMetallicShield badgeStyle={badgeStyle} acronym={acronym} />
                  </div>
                </div>

                {/* Bottom Laminated Security Bar */}
                <div className="bg-slate-900 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-200">
                  <span>
                    OFFICIAL LAW ENFORCEMENT CREDENTIAL • AUTHORIZED CRIME SCENE ACCESS
                  </span>
                  <span className="text-amber-400 font-mono-code">{badgeNumber}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
