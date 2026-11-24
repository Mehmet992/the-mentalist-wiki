import { analyzeEpisodeMilestone, getEpisodeAct } from '../services/api.js';

/**
 * Shuffles a copy of an array using Fisher-Yates so option ordering is uniformly random.
 *
 * @param {Array} items - Input array
 * @param {Function} [rng] - Optional deterministic RNG for testing
 * @returns {Array} New shuffled array
 */
export function shuffleArray(items, rng = Math.random) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates a guaranteed non-repeating Mentalist Observation Test question from the live
 * episode and cast arrays. Tracks every asked `(type, itemId)` key in `askedKeysSet`
 * so no episode synopsis, act classification, or actor identity question repeats until
 * every unique question across all pools has been exhausted.
 *
 * @param {Object} params
 * @param {Array} params.episodes - Episodes array from TVmaze
 * @param {Array} params.cast - Unique cast array from TVmaze
 * @param {Set<string>} params.askedKeysSet - Mutable Set tracking asked question keys
 * @param {string|null} [params.lastType] - Previously generated question category
 * @param {Function} [params.rng] - Optional RNG function (defaults to Math.random)
 * @returns {{ question: Object, questionType: string, totalAsked: number } | null}
 */
export function generateNextUniqueObservationQuestion({
  episodes = [],
  cast = [],
  askedKeysSet,
  lastType = null,
  rng = Math.random,
}) {
  if (!episodes.length || !cast.length) return null;

  const validSynopsisEps = episodes.filter((e) => e.summary && e.name);
  const validActEps = episodes.filter((e) => !(e.season === 1 && e.number === 1));
  const validCast = cast.filter((c) => c.person?.id && c.character?.name);

  const getUnaskedPools = () => ({
    SYNOPSIS_TO_TITLE: validSynopsisEps.filter((e) => !askedKeysSet.has(`SYNOPSIS:${e.id}`)),
    ACT_CLASSIFICATION: validActEps.filter((e) => !askedKeysSet.has(`ACT:${e.id}`)),
    ACTOR_TO_CHARACTER: validCast.filter((c) => !askedKeysSet.has(`CAST:${c.person.id}`)),
  });

  let unasked = getUnaskedPools();
  let availableTypes = Object.keys(unasked).filter((t) => unasked[t].length > 0);

  // Only reset once every single unique question across all categories has been exhausted
  if (availableTypes.length === 0) {
    askedKeysSet.clear();
    unasked = getUnaskedPools();
    availableTypes = Object.keys(unasked).filter((t) => unasked[t].length > 0);
    if (availableTypes.length === 0) return null;
  }

  // Alternate categories when multiple categories still have unasked questions
  const preferredTypes =
    availableTypes.length > 1
      ? availableTypes.filter((t) => t !== lastType)
      : availableTypes;

  const chosenType = preferredTypes[Math.floor(rng() * preferredTypes.length)];

  if (chosenType === 'SYNOPSIS_TO_TITLE') {
    const pool = unasked.SYNOPSIS_TO_TITLE;
    const target = pool[Math.floor(rng() * pool.length)];
    const key = `SYNOPSIS:${target.id}`;
    askedKeysSet.add(key);

    const distractors = shuffleArray(
      validSynopsisEps.filter((e) => e.id !== target.id),
      rng
    ).slice(0, 3);

    const options = shuffleArray([target, ...distractors], rng).map((ep) => ({
      label: `S${String(ep.season).padStart(2, '0')}E${String(ep.number).padStart(
        2,
        '0'
      )} — "${ep.name}"`,
      isCorrect: ep.id === target.id,
    }));

    return {
      questionType: chosenType,
      totalAsked: askedKeysSet.size,
      question: {
        key,
        typeLabel: 'Case File Synopsis Deduction',
        prompt:
          'Observe the following CBI case synopsis and episode still. Which episode does this case belong to?',
        clueText: analyzeEpisodeMilestone(target).cleanSummary,
        image: target.image?.original || target.image?.medium || null,
        options,
        explanation: `This case is Season ${target.season}, Episode ${target.number}: "${target.name}" (Aired ${target.airdate}, Rating ★ ${
          target.rating?.average || 'N/A'
        }).`,
        relatedLink: `/episodes/${target.id}`,
        relatedLinkLabel: `Inspect S${target.season}E${target.number} Case File`,
      },
    };
  }

  if (chosenType === 'ACT_CLASSIFICATION') {
    const pool = unasked.ACT_CLASSIFICATION;
    const target = pool[Math.floor(rng() * pool.length)];
    const key = `ACT:${target.id}`;
    askedKeysSet.add(key);
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

    return {
      questionType: chosenType,
      totalAsked: askedKeysSet.size,
      question: {
        key,
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
      },
    };
  }

  // ACTOR_TO_CHARACTER deduction round (each cast member is asked at most once per full cycle)
  const pool = unasked.ACTOR_TO_CHARACTER;
  const targetCast = pool[Math.floor(rng() * pool.length)];
  const key = `CAST:${targetCast.person.id}`;
  askedKeysSet.add(key);

  const distractors = shuffleArray(
    validCast.filter((c) => c.person?.id !== targetCast.person?.id),
    rng
  ).slice(0, 3);

  const options = shuffleArray([targetCast, ...distractors], rng).map((c) => ({
    label: `${c.character?.name} (Portrayed by ${c.person?.name})`,
    isCorrect: c.person?.id === targetCast.person?.id,
  }));

  return {
    questionType: chosenType,
    totalAsked: askedKeysSet.size,
    question: {
      key,
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
    },
  };
}
