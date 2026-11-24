import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Brain,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  HelpCircle,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import {
  analyzeEpisodeMilestone,
  fetchRedJohnSuspectsBoard,
  fetchShowCast,
  fetchShowEpisodes,
  getCachedQuizScore,
  getCachedSuspectStatuses,
  getEpisodeAct,
  setCachedQuizScore,
  setCachedSuspectStatuses,
} from '../services/api';
import LoadingState from '../components/common/LoadingState';
import ApiErrorState from '../components/common/ApiErrorState';

/**
 * Interactive Red John Investigation Board & Mentalist Observation Lab (/investigation).
 * Contains two high-interactivity API-driven features:
 * 1. Patrick Jane's Final 7 Red John Suspect Board (live Fandom MediaWiki + TVmaze actor data)
 * 2. The Mentalist Observation Test (dynamically generated deduction rounds from live API data)
 */
export default function InvestigationPage() {
  const [activeTab, setActiveTab] = useState('SUSPECT_BOARD'); // 'SUSPECT_BOARD' or 'OBSERVATION_TEST'

  const [suspects, setSuspects] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Suspect Board interactive states (stored in in-memory session cache instead of permanent localStorage)
  const [suspectStatuses, setSuspectStatuses] = useState(() => getCachedSuspectStatuses());
  const [revealSpoilerVerdict, setRevealSpoilerVerdict] = useState(false);
  const [accusedSuspectId, setAccusedSuspectId] = useState(null);

  // Mentalist Observation Test states (stored in in-memory session cache)
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [scoreStats, setScoreStats] = useState(() => getCachedQuizScore());

  /**
   * Loads the 7 Red John suspects from Fandom/TVmaze APIs along with all episodes and cast.
   */
  const loadInvestigationData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [suspectsList, episodesList, castList] = await Promise.all([
        fetchRedJohnSuspectsBoard(),
        fetchShowEpisodes(),
        fetchShowCast(),
      ]);

      const seen = new Set();
      const uniqueCast = castList.filter((c) => {
        const pid = c.person?.id;
        if (!pid || seen.has(pid)) return false;
        seen.add(pid);
        return true;
      });

      setSuspects(suspectsList);
      setEpisodes(episodesList);
      setCast(uniqueCast);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvestigationData();
  }, [loadInvestigationData]);

  // Lock background scroll and allow Escape dismissal when the Red John Verdict modal is open
  useEffect(() => {
    if (!accusedSuspectId) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') setAccusedSuspectId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [accusedSuspectId]);

  /**
   * Updates a suspect's investigation status ('CLEARED', 'PRIME', or null) in the session cache.
   */
  const handleToggleSuspectState = (suspectId, nextState) => {
    setSuspectStatuses((prev) => {
      const current = prev[suspectId];
      const updated = {
        ...prev,
        [suspectId]: current === nextState ? null : nextState,
      };
      setCachedSuspectStatuses(updated);
      return updated;
    });
  };

  /**
   * Dynamically generates a fresh Mentalist Observation Test question directly from
   * the live TVmaze episodes and cast arrays (zero hardcoded trivia questions).
   */
  const generateLiveApiQuestion = useCallback(
    (epPool = episodes, castPool = cast) => {
      if (!epPool.length || !castPool.length) return;

      const questionTypes = ['SYNOPSIS_TO_TITLE', 'ACT_CLASSIFICATION', 'ACTOR_TO_CHARACTER'];
      const chosenType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

      setSelectedOptionIndex(null);

      if (chosenType === 'SYNOPSIS_TO_TITLE') {
        const validEps = epPool.filter((e) => e.summary && e.name);
        const target = validEps[Math.floor(Math.random() * validEps.length)];
        const distractors = validEps
          .filter((e) => e.id !== target.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);

        const options = [target, ...distractors]
          .sort(() => 0.5 - Math.random())
          .map((ep) => ({
            label: `S${String(ep.season).padStart(2, '0')}E${String(ep.number).padStart(
              2,
              '0'
            )} — "${ep.name}"`,
            isCorrect: ep.id === target.id,
          }));

        setCurrentQuestion({
          typeLabel: 'Case File Synopsis Deduction',
          prompt:
            'Observe the following live case synopsis and still from the API. Which episode does this case belong to?',
          clueText: analyzeEpisodeMilestone(target).cleanSummary,
          image: target.image?.original || target.image?.medium || null,
          options,
          explanation: `This case is Season ${target.season}, Episode ${target.number}: "${target.name}" (Aired ${target.airdate}, Rating ★ ${
            target.rating?.average || 'N/A'
          }).`,
          relatedLink: `/episodes/${target.id}`,
          relatedLinkLabel: `Inspect S${target.season}E${target.number} Case File`,
        });
        return;
      }

      if (chosenType === 'ACT_CLASSIFICATION') {
        // Pick an episode excluding the Pilot so the title color clue is fair
        const pool = epPool.filter((e) => !(e.season === 1 && e.number === 1));
        const target = pool[Math.floor(Math.random() * pool.length)];
        const trueAct = getEpisodeAct(target);

        const options = [
          {
            label: 'Act I: The Red John Pursuit (S01E01 – S06E08 • CBI Era)',
            isCorrect: trueAct === 'RED_JOHN_ACT',
          },
          {
            label: 'Act II: The FBI & New Dawn Era (S06E09 – S07E13 • Post-Red John)',
            isCorrect: trueAct === 'FBI_ACT',
          },
        ];

        setCurrentQuestion({
          typeLabel: 'Episode Color Motif & Act Deduction',
          prompt: `Examine the episode title "${target.name}" (Aired ${target.airdate}). Using Patrick Jane's title-color rule, which narrative Act does this episode belong to?`,
          clueText: `Episode Title: "${target.name}" • Runtime: ${target.runtime || 60} mins • Rating: ★ ${
            target.rating?.average || 'N/A'
          }`,
          image: target.image?.original || target.image?.medium || null,
          options,
          explanation: `"${target.name}" is Season ${target.season}, Episode ${target.number}, which aired during ${
            trueAct === 'RED_JOHN_ACT'
              ? 'Act I (The CBI Red John Hunt, where titles reference shades of red/crimson).'
              : 'Act II (The FBI Era after S06E08, where titles shift to Blue, Green, White, Silver, and Gold).'
          }`,
          relatedLink: `/episodes/${target.id}`,
          relatedLinkLabel: `Open "${target.name}" Dossier`,
        });
        return;
      }

      // ACTOR_TO_CHARACTER deduction round
      const targetCast = castPool[Math.floor(Math.random() * castPool.length)];
      const distractors = castPool
        .filter((c) => c.person?.id !== targetCast.person?.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const options = [targetCast, ...distractors]
        .sort(() => 0.5 - Math.random())
        .map((c) => ({
          label: `${c.character?.name} (Portrayed by ${c.person?.name})`,
          isCorrect: c.person?.id === targetCast.person?.id,
        }));

      setCurrentQuestion({
        typeLabel: 'Dual-Identity Cast Observation',
        prompt: `This actor was born on ${
          targetCast.person?.birthday || 'record'
        } (${
          targetCast.person?.country?.name || 'International'
        }). Which character do they portray in The Mentalist?`,
        clueText: `Real Actor Identity: ${targetCast.person?.name}`,
        image:
          targetCast.person?.image?.original ||
          targetCast.person?.image?.medium ||
          targetCast.character?.image?.medium ||
          null,
        options,
        explanation: `${targetCast.person?.name} portrays ${targetCast.character?.name} in The Mentalist.`,
        relatedLink: `/characters/${targetCast.person?.id}`,
        relatedLinkLabel: `Open ${targetCast.character?.name} Profile`,
      });
    },
    [episodes, cast]
  );

  // Generate the initial observation question once API data finishes loading
  useEffect(() => {
    if (episodes.length > 0 && cast.length > 0 && !currentQuestion) {
      generateLiveApiQuestion(episodes, cast);
    }
  }, [episodes, cast, currentQuestion, generateLiveApiQuestion]);

  /**
   * Handles user selection of an answer option in the Mentalist Observation Test
   * and stores the updated score and streak in the in-memory session cache.
   */
  const handleSelectQuizOption = (index) => {
    if (selectedOptionIndex !== null || !currentQuestion) return;
    setSelectedOptionIndex(index);

    const isRight = currentQuestion.options[index]?.isCorrect;
    setScoreStats((prev) => {
      const updated = {
        correct: prev.correct + (isRight ? 1 : 0),
        total: prev.total + 1,
        streak: isRight ? prev.streak + 1 : 0,
      };
      setCachedQuizScore(updated);
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingState
          message="Loading Patrick Jane's Final 7 Red John Suspects & Deduction Lab from APIs..."
          endpointHint="thementalist.fandom.com/api.php & api.tvmaze.com"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ApiErrorState error={error} onRetry={loadInvestigationData} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header & Tab Switcher */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-mono-code uppercase mb-2">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>CBI Special Investigation Room</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-serif-title">
              Red John Suspect Board &amp; Observation Test
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-prose">
              Investigate Patrick Jane&apos;s final 7 Red John suspects or test your mentalist
              observation skills with interactive case deduction challenges.
            </p>
          </div>

          {/* Feature Switcher Buttons */}
          <div className="inline-flex rounded-2xl bg-black/80 p-1.5 border border-white/10 self-start">
            <button
              type="button"
              onClick={() => setActiveTab('SUSPECT_BOARD')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'SUSPECT_BOARD'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Flame className="h-4 w-4" />
              <span>7 Red John Suspects Board</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('OBSERVATION_TEST')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'OBSERVATION_TEST'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Brain className="h-4 w-4" />
              <span>Mentalist Observation Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE RED JOHN SUSPECT LINEUP BOARD */}
      {activeTab === 'SUSPECT_BOARD' && (
        <section className="space-y-6">
          {/* Board Controls Bar */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-zinc-300">
              <strong className="text-white">How to Investigate:</strong> Mark suspects as{' '}
              <span className="text-zinc-400 underline">Cleared</span> or{' '}
              <span className="text-red-400 font-semibold">Prime Suspect</span>, or click{' '}
              <strong className="text-red-400">Accuse Suspect</strong> to test if you found Red
              John.
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setRevealSpoilerVerdict((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-xs font-mono-code text-red-300 transition cursor-pointer"
              >
                {revealSpoilerVerdict ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Hide Red John Spoiler Verdict</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Reveal True Red John Verdict (Spoiler)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSuspectStatuses({});
                  setCachedSuspectStatuses({});
                  setAccusedSuspectId(null);
                  setRevealSpoilerVerdict(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono-code text-zinc-300 transition cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 text-red-400" />
                <span>Reset Board</span>
              </button>
            </div>
          </div>

          {/* 7 Final Suspects Corkboard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {suspects.map((suspect, index) => {
              const boardState = suspectStatuses[suspect.id]; // 'CLEARED' | 'PRIME' | null
              const isRevealedRedJohn =
                (revealSpoilerVerdict || accusedSuspectId === suspect.id) &&
                suspect.isTrueRedJohn;

              return (
                <article
                  key={suspect.id}
                  className={`glass-card-interactive rounded-2xl overflow-hidden flex flex-col justify-between relative ${
                    isRevealedRedJohn
                      ? 'border-2 border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.5)]'
                      : boardState === 'PRIME'
                      ? 'border-2 border-amber-500/80'
                      : boardState === 'CLEARED'
                      ? 'opacity-50 grayscale'
                      : ''
                  }`}
                >
                  <div>
                    {/* Suspect Image Header (Uses reliable TVmaze photo + no-referrer fallback) */}
                    <div className="relative h-56 w-full bg-[#101017] overflow-hidden flex items-center justify-center">
                      {suspect.characterImage ? (
                        <>
                          <img
                            src={suspect.characterImage}
                            alt=""
                            aria-hidden="true"
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110 pointer-events-none"
                          />
                          <img
                            src={suspect.characterImage}
                            alt={suspect.name}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              if (
                                suspect.fallbackImage &&
                                e.currentTarget.src !== suspect.fallbackImage
                              ) {
                                e.currentTarget.src = suspect.fallbackImage;
                              }
                            }}
                            className="relative z-10 h-full w-auto max-w-full object-contain pt-2"
                          />
                        </>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-zinc-500">
                          No Photo Available
                        </div>
                      )}
                      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0b0b10] via-black/25 to-transparent pointer-events-none" />

                      <span className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-xs font-mono-code font-bold text-red-400">
                        SUSPECT #{index + 1}
                      </span>

                      {isRevealedRedJohn && (
                        <span className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-lg bg-red-600 text-xs font-mono-code font-bold text-white shadow-lg">
                          TRUE RED JOHN
                        </span>
                      )}

                      {boardState === 'CLEARED' && !isRevealedRedJohn && (
                        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
                          <span className="px-4 py-1.5 rounded-lg border-2 border-zinc-400 text-zinc-200 font-mono-code text-xs font-bold uppercase -rotate-12">
                            CLEARED BY USER
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-3 left-3 right-3 z-20 text-left">
                        <div className="inline-flex items-center gap-1 text-[11px] font-mono-code text-red-300">
                          <UserCheck className="h-3 w-3" />
                          <span>Actor: {suspect.actorName}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white font-serif-title leading-tight">
                          {suspect.name}
                        </h3>
                      </div>
                    </div>

                    {/* Suspect Dossier Content (No Debut/First Seen field) */}
                    <div className="p-4 space-y-2.5 text-left">
                      <div className="text-xs font-semibold text-red-400 truncate">
                        {suspect.job}
                      </div>

                      <p className="text-sm text-zinc-200 leading-[1.5] line-clamp-2">
                        {suspect.overview}
                      </p>
                    </div>
                  </div>

                  {/* Interactive Suspect Controls */}
                  <div className="p-4 pt-3 border-t border-white/10 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSuspectState(suspect.id, 'CLEARED')}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono-code border transition cursor-pointer ${
                          boardState === 'CLEARED'
                            ? 'bg-zinc-800 border-white/30 text-white'
                            : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {boardState === 'CLEARED' ? '✓ Cleared' : 'Mark Cleared'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleSuspectState(suspect.id, 'PRIME')}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono-code border transition cursor-pointer ${
                          boardState === 'PRIME'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-amber-300'
                        }`}
                      >
                        {boardState === 'PRIME' ? '★ Prime' : 'Flag Prime'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setAccusedSuspectId(suspect.id)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                      >
                        Accuse as Red John
                      </button>

                      {suspect.actorPersonId && (
                        <Link
                          to={`/characters/${suspect.actorPersonId}`}
                          title="Inspect Actor Dossier"
                          className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: THE MENTALIST OBSERVATION TEST (LIVE API DEDUCTION CHALLENGE) */}
      {activeTab === 'OBSERVATION_TEST' && currentQuestion && (
        <section className="max-w-4xl mx-auto">
          {/* Top Scoreboard Bar */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-mono-code uppercase text-red-400">
                  Interactive Case Deduction Challenge
                </span>
                <h2 className="text-lg font-bold text-white font-serif-title">
                  Patrick Jane Observation Scoreboard
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-black/70 border border-white/10 text-center">
                <span className="text-[10px] font-mono-code text-zinc-400 uppercase block">
                  Correct
                </span>
                <span className="text-base font-bold text-emerald-400">
                  {scoreStats.correct} / {scoreStats.total}
                </span>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-black/70 border border-white/10 text-center">
                <span className="text-[10px] font-mono-code text-zinc-400 uppercase block">
                  Streak
                </span>
                <span className="text-base font-bold text-amber-400">
                  🔥 {scoreStats.streak}
                </span>
              </div>

              <button
                type="button"
                onClick={() => generateLiveApiQuestion(episodes, cast)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>New Case Challenge</span>
              </button>
            </div>
          </div>

          {/* Main Question Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 animate-fade-slide">
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-xs font-mono-code text-red-300 font-semibold">
                <HelpCircle className="h-3.5 w-3.5" />
                <span>{currentQuestion.typeLabel}</span>
              </span>
              <span className="text-xs font-mono-code text-zinc-400">
                Mentalist Observation Round
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white font-serif-title">
              {currentQuestion.prompt}
            </h3>

            {/* Evidence Box (Image + Live Clue Text) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center rounded-2xl bg-black/70 border border-white/10 p-4">
              {currentQuestion.image && (
                <div className="md:col-span-4">
                  <img
                    src={currentQuestion.image}
                    alt="Case Evidence"
                    className="w-full h-44 object-cover object-top rounded-xl border border-white/15"
                  />
                </div>
              )}
              <div
                className={
                  currentQuestion.image ? 'md:col-span-8 space-y-2' : 'md:col-span-12 space-y-2'
                }
              >
                <span className="text-[11px] font-mono-code uppercase text-red-400 block">
                  Case Evidence Clue:
                </span>
                <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
                  &ldquo;{currentQuestion.clueText}&rdquo;
                </p>
              </div>
            </div>

            {/* Multiple Choice Deduction Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {currentQuestion.options.map((opt, idx) => {
                const hasAnswered = selectedOptionIndex !== null;
                const isSelected = selectedOptionIndex === idx;

                let btnStyle =
                  'bg-zinc-900/80 hover:bg-zinc-900 border-white/10 hover:border-red-500/60 text-zinc-200';
                if (hasAnswered) {
                  if (opt.isCorrect) {
                    btnStyle =
                      'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.25)]';
                  } else if (isSelected && !opt.isCorrect) {
                    btnStyle = 'bg-red-950/60 border-red-500 text-red-200';
                  } else {
                    btnStyle = 'bg-zinc-950/50 border-white/5 text-zinc-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={opt.label}
                    type="button"
                    disabled={hasAnswered}
                    onClick={() => handleSelectQuizOption(idx)}
                    className={`p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition flex items-center justify-between gap-3 cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt.label}</span>
                    {hasAnswered && opt.isCorrect && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    )}
                    {hasAnswered && isSelected && !opt.isCorrect && (
                      <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Post-Answer Explanation & Next Challenge Action */}
            {selectedOptionIndex !== null && (
              <div className="rounded-2xl bg-black/80 border border-white/15 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-slide">
                <div className="space-y-1">
                  <span
                    className={`text-xs font-mono-code uppercase font-bold ${
                      currentQuestion.options[selectedOptionIndex]?.isCorrect
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {currentQuestion.options[selectedOptionIndex]?.isCorrect
                      ? '✓ Sharp Mentalist Observation!'
                      : '✕ Not Quite — Case Note:'}
                  </span>
                  <p className="text-xs sm:text-sm text-zinc-200">
                    {currentQuestion.explanation}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {currentQuestion.relatedLink && (
                    <Link
                      to={currentQuestion.relatedLink}
                      className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-200 transition"
                    >
                      {currentQuestion.relatedLinkLabel}
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => generateLiveApiQuestion(episodes, cast)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow transition cursor-pointer"
                  >
                    <span>Next Deduction</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Centered Pop-Up Verdict Modal when the user accuses a suspect (No scrolling required!) */}
      {accusedSuspectId &&
        (() => {
          const target = suspects.find((s) => s.id === accusedSuspectId);
          if (!target) return null;
          const isCorrect = target.isTrueRedJohn;

          return (
            <div
              role="dialog"
              aria-modal="true"
              onClick={() => setAccusedSuspectId(null)}
              className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-slide"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className={`relative max-w-lg w-full rounded-3xl border-2 p-7 sm:p-8 text-center shadow-[0_0_80px_rgba(0,0,0,0.95)] ${
                  isCorrect
                    ? 'border-emerald-500 bg-gradient-to-b from-zinc-950 via-[#0b1410] to-emerald-950/50 shadow-[0_0_80px_rgba(16,185,129,0.35)]'
                    : 'border-red-600 bg-gradient-to-b from-zinc-950 via-[#140b0d] to-red-950/50 shadow-[0_0_80px_rgba(220,38,38,0.4)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setAccusedSuspectId(null)}
                  aria-label="Close verdict modal"
                  className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex justify-center mb-4">
                  <div
                    className={`h-14 w-14 rounded-2xl border flex items-center justify-center ${
                      isCorrect
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                        : 'bg-red-600/20 border-red-500 text-red-400'
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="h-8 w-8" />
                    ) : (
                      <XCircle className="h-8 w-8" />
                    )}
                  </div>
                </div>

                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 ${
                    isCorrect
                      ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300'
                      : 'bg-red-600/20 border border-red-500/50 text-red-300'
                  }`}
                >
                  {isCorrect
                    ? 'VERDICT CONFIRMED • TRUE RED JOHN'
                    : 'WRONG SUSPECT • NOT RED JOHN'}
                </span>

                {/* Suspect Portrait inside Verdict Modal */}
                {target.characterImage && (
                  <div className="mx-auto my-3 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/20 bg-black shadow-xl">
                    <img
                      src={target.characterImage}
                      alt={target.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                )}

                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#f5f5f5] font-serif-title mt-2">
                  {isCorrect
                    ? `${target.name} IS Red John!`
                    : `${target.name} is NOT Red John`}
                </h2>
                <p className="text-xs font-semibold text-zinc-400 mt-1">
                  Portrayed by {target.actorName}
                </p>

                <p className="text-base text-zinc-200 leading-[1.55] mt-4">
                  {isCorrect
                    ? 'Sharp mentalist deduction! In Season 6, Episode 8 ("Red John"), Patrick Jane exposes Napa County Sheriff Thomas McAllister as the mastermind behind the Blake Association and the real Red John.'
                    : `Incorrect accusation. Although ${target.name} made Patrick Jane's final 7 suspects list, he was eliminated from the hunt during Season 6. Keep investigating the remaining suspects!`}
                </p>

                <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAccusedSuspectId(null)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition cursor-pointer ${
                      isCorrect
                        ? 'bg-emerald-600 hover:bg-emerald-500'
                        : 'bg-red-600 hover:bg-red-500'
                    }`}
                  >
                    {isCorrect ? 'Close Case Verdict (ESC)' : 'Try Another Suspect (ESC)'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
