import React, { useState } from 'react';
import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Download,
  Fingerprint,
  Shield,
  Sparkles,
} from 'lucide-react';

const DIVISIONS = [
  {
    id: 'CBI_CONSULTANT',
    agency: 'CALIFORNIA BUREAU OF INVESTIGATION',
    rank: 'Independent Consultant • Serious Crimes Unit',
    clearance: 'LEVEL 4 // SPECIAL CONSULTANT',
    hq: 'Sacramento, California',
    badgeCode: 'CBI-049-PJ',
  },
  {
    id: 'CBI_AGENT',
    agency: 'CALIFORNIA BUREAU OF INVESTIGATION',
    rank: 'Senior Special Agent • Homicide Task Force',
    clearance: 'LEVEL 5 // FULL FIELD AUTHORITY',
    hq: 'Sacramento, California',
    badgeCode: 'CBI-108-TL',
  },
  {
    id: 'FBI_AGENT',
    agency: 'FEDERAL BUREAU OF INVESTIGATION',
    rank: 'Special Agent • Major Crimes Division',
    clearance: 'TOP SECRET // FEDERAL CLEARANCE',
    hq: 'Austin, Texas',
    badgeCode: 'FBI-774-TX',
  },
];

const SPECIALTIES = [
  'Cold Reading & Micro-Expressions',
  'Memory Palace & Hypnotic Suggestion',
  'Deadpan Interrogation (The Cho Method)',
  'Crime Scene Reconstruction & Traps',
  'Digital Forensics & Intelligence',
];

/**
 * Interactive CBI / FBI Agent & Consultant ID Badge Generator embedded inside
 * the Actors & Characters page (/characters). Uses Progressive Disclosure (starts
 * collapsed as a sleek banner, opens into a 2-column credential studio on click)
 * and supports downloading the generated badge as a PNG image.
 *
 * @param {Object} props
 * @param {Array} props.castList - Main cast array providing selectable avatar portraits
 */
export default function AgentBadgeGenerator({ castList = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [agentName, setAgentName] = useState('Patrick Jane');
  const [divisionId, setDivisionId] = useState('CBI_CONSULTANT');
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [selectedPortraitIndex, setSelectedPortraitIndex] = useState(0);

  const selectedDivision =
    DIVISIONS.find((d) => d.id === divisionId) || DIVISIONS[0];
  const selectedCast = castList[selectedPortraitIndex] || castList[0];
  const portraitUrl =
    selectedCast?.character?.image?.medium ||
    selectedCast?.person?.image?.medium ||
    '/favicon.svg';

  /**
   * Draws the custom CBI/FBI credential badge onto an HTML5 Canvas and triggers a PNG download.
   */
  const handleDownloadBadgePng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 720, 420);
    bgGrad.addColorStop(0, '#0d0d14');
    bgGrad.addColorStop(0.7, '#16131c');
    bgGrad.addColorStop(1, '#3b0a11');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 720, 420);

    // Top Crimson Header Strip
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, 720, 58);

    // Outer Border
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 716, 416);

    // Agency Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText(selectedDivision.agency, 28, 36);

    // Badge Serial Code
    ctx.fillStyle = '#fecaca';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`ID: ${selectedDivision.badgeCode}`, 565, 36);

    // Agent Name & Details
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('AUTHORIZED PERSONNEL // CREDENTIAL DOSSIER', 36, 105);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Georgia, serif';
    ctx.fillText((agentName || 'Special Consultant').slice(0, 26), 36, 148);

    ctx.fillStyle = '#e4e4e7';
    ctx.font = '600 16px sans-serif';
    ctx.fillText(selectedDivision.rank, 36, 182);

    // Specialty & Headquarters Boxes
    ctx.fillStyle = '#181822';
    ctx.fillRect(36, 210, 420, 54);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(36, 210, 420, 54);

    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('SIGNATURE SPECIALTY', 50, 230);
    ctx.fillStyle = '#ffffff';
    ctx.font = '15px sans-serif';
    ctx.fillText(specialty, 50, 251);

    ctx.fillStyle = '#181822';
    ctx.fillRect(36, 278, 420, 54);
    ctx.strokeRect(36, 278, 420, 54);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('SECURITY CLEARANCE & FIELD OFFICE', 50, 298);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`${selectedDivision.clearance} • ${selectedDivision.hq}`, 50, 319);

    // Right Official Seal Box
    ctx.fillStyle = '#14141d';
    ctx.fillRect(490, 95, 190, 237);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(490, 95, 190, 237);

    ctx.beginPath();
    ctx.arc(585, 185, 52, 0, Math.PI * 2);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      selectedDivision.id === 'FBI_AGENT' ? 'FBI' : 'CBI',
      585,
      182
    );
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('VERIFIED SEAL', 585, 202);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '12px sans-serif';
    ctx.fillText('ACTIVE CREDENTIAL', 585, 285);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(selectedDivision.badgeCode, 585, 307);

    // Bottom Barcode Strip
    ctx.textAlign = 'left';
    ctx.fillStyle = '#71717a';
    ctx.font = '12px monospace';
    ctx.fillText(
      '||| | |||| || | ||| |||| | ||| || |||| | ||| |||| || | |||',
      36,
      385
    );

    const link = document.createElement('a');
    link.download = `${(agentName || 'mentalist-agent')
      .toLowerCase()
      .replace(/\s+/g, '-')}-id-badge.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="mb-8 glass-panel rounded-3xl p-5 sm:p-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <BadgeCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400 block">
              Interactive Fan Studio • CBI &amp; FBI Credentials
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#f5f5f5] font-serif-title">
              Create Your Own CBI Consultant or FBI Agent ID Badge
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/50 transition cursor-pointer shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isOpen ? 'Close ID Badge Studio' : 'Open ID Badge Generator'}</span>
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center animate-fade-slide">
          {/* Left 5 Cols: Customization Form with Sticking Labels */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label
                htmlFor="badge-agent-name"
                className="block text-xs font-semibold text-zinc-300 mb-1.5"
              >
                Your Agent or Consultant Name
              </label>
              <input
                id="badge-agent-name"
                type="text"
                maxLength={28}
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Type your name..."
                className="w-full h-10 rounded-xl bg-[#0d0d13] border border-white/15 px-3.5 text-sm text-[#f5f5f5]"
              />
            </div>

            <div>
              <label
                htmlFor="badge-division-select"
                className="block text-xs font-semibold text-zinc-300 mb-1.5"
              >
                Agency &amp; Division
              </label>
              <select
                id="badge-division-select"
                value={divisionId}
                onChange={(e) => setDivisionId(e.target.value)}
                className="w-full h-10 rounded-xl bg-[#0d0d13] border border-white/15 px-3 text-sm text-zinc-200"
              >
                {DIVISIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.agency} — {d.rank.split('•')[0].trim()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="badge-specialty-select"
                className="block text-xs font-semibold text-zinc-300 mb-1.5"
              >
                Investigative Specialty
              </label>
              <select
                id="badge-specialty-select"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full h-10 rounded-xl bg-[#0d0d13] border border-white/15 px-3 text-sm text-zinc-200"
              >
                {SPECIALTIES.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="badge-avatar-select"
                className="block text-xs font-semibold text-zinc-300 mb-1.5"
              >
                Badge Portrait Avatar
              </label>
              <select
                id="badge-avatar-select"
                value={selectedPortraitIndex}
                onChange={(e) => setSelectedPortraitIndex(Number(e.target.value))}
                className="w-full h-10 rounded-xl bg-[#0d0d13] border border-white/15 px-3 text-sm text-zinc-200"
              >
                {castList.map((c, idx) => (
                  <option key={c.person?.id || idx} value={idx}>
                    {c.character?.name} ({c.person?.name})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleDownloadBadgePng}
              className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/60 transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download Official ID Card (PNG)</span>
            </button>
          </div>

          {/* Right 7 Cols: Live Preview of the CBI / FBI Security Clearance ID Card */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border-2 border-red-500/70 bg-gradient-to-br from-[#0e0e15] via-[#15131c] to-[#2e0910] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
              {/* Top Agency Ribbon */}
              <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-800 px-5 py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-white shrink-0" />
                  <span className="font-serif-title text-xs sm:text-sm font-bold tracking-wider text-white">
                    {selectedDivision.agency}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-black/40 text-[11px] font-mono-code font-bold text-red-100">
                  {selectedDivision.badgeCode}
                </span>
              </div>

              {/* Main Credential Body */}
              <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                {/* Portrait Box */}
                <div className="sm:col-span-4 flex flex-col items-center">
                  <div className="w-28 h-36 rounded-xl overflow-hidden border-2 border-red-500/60 bg-black shadow-lg">
                    <img
                      src={portraitUrl}
                      alt="Agent Portrait"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <span className="mt-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] font-bold text-amber-300 uppercase">
                    Verified Credential
                  </span>
                </div>

                {/* Agent Info Fields */}
                <div className="sm:col-span-8 space-y-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-red-400 block">
                      Authorized Personnel
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-serif-title truncate">
                      {agentName.trim() || 'Patrick Jane'}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-200 font-medium">
                      {selectedDivision.rank}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-xl bg-black/60 border border-white/10 p-2.5">
                      <span className="text-[10px] uppercase text-red-400 font-semibold block">
                        Signature Specialty
                      </span>
                      <span className="text-zinc-100 font-medium block truncate mt-0.5">
                        {specialty}
                      </span>
                    </div>

                    <div className="rounded-xl bg-black/60 border border-white/10 p-2.5">
                      <span className="text-[10px] uppercase text-amber-400 font-semibold block">
                        Clearance &amp; HQ
                      </span>
                      <span className="text-zinc-100 font-medium block truncate mt-0.5">
                        {selectedDivision.hq}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="inline-flex items-center gap-1 text-red-300 font-semibold">
                      <Fingerprint className="h-3.5 w-3.5" />
                      <span>{selectedDivision.clearance}</span>
                    </span>
                    <span className="font-mono-code tracking-widest text-zinc-500">
                      ||| |||| || ||| ||||
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
