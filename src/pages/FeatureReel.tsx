import { useEffect, useRef, useState } from 'react';

/**
 * FeatureReel — a self-contained, looping feature showcase animation built for
 * screen-recording. Direct-access only (route /featurereel, not linked anywhere).
 *
 * Per feature (mirroring the reference video flow):
 *   1) the phone rotates in from the bottom-right and stops dead-center,
 *   2) the matching feature video plays inside the mockup (fill, top-aligned),
 *   3) two-line selling copy fades in (line 1 white, line 2 in the feature color),
 *   4) the phone rotates out to the bottom-left and the copy disappears.
 *
 * The phone mockup shape is reused from the Rizz onboarding desktop simulator
 * (black body, #1c1c1e bezel, rounded corners, dynamic island), scaled down to
 * fit the 750 x 422 stage.
 */

type Feature = {
  key: string;
  video: string;
  color: string;     // accent / highlight colour (matches the landing-page theme)
  glow: string;      // rgba used for the colourful phone shadow
  line1: string;     // white setup line
  line2: string;     // coloured payoff line
};

// Feature order + copy distilled from the matching landing-page sections.
const FEATURES: Feature[] = [
  {
    key: 'analyze-profile',
    video: '/FeatureVideos/analyze-profile.mp4',
    color: '#ff719a',                 // Pink — "Analyze Her Profile"
    glow: 'rgba(255, 113, 154, 0.55)',
    line1: 'FIND THE PERFECT',
    line2: 'ICE BREAKER',
  },
  {
    key: 'gen-reply',
    video: '/FeatureVideos/gen-reply.mp4',
    color: '#4facfe',                 // Blue — "Chat Assistant / Gen Reply"
    glow: 'rgba(79, 172, 254, 0.55)',
    line1: 'REPLIES THAT',
    line2: 'CLOSE THE DATE',
  },
  {
    key: 'improve-profile',
    video: '/FeatureVideos/improve-profile.mp4',
    color: '#00e676',                 // Green — "Improve My Profile" (distinct from Gen Reply)
    glow: 'rgba(0, 230, 118, 0.5)',
    line1: 'OPTIMIZE YOUR PROFILE',
    line2: 'FOR MORE MATCHES',
  },
  {
    key: 'rizz-arena',
    video: '/FeatureVideos/rizz-arena.mp4',
    color: '#f8b500',                 // Yellow — "Rizz Arena"
    glow: 'rgba(248, 181, 0, 0.5)',
    line1: 'TRAIN YOUR RIZZ',
    line2: 'LIKE A PRO',
  },
];

// ───────────────────────────────────────────────────────────────────────────
// Timeline (ms) for a single feature cycle. Tweak these to retime the reel.
//
//   0.00s ─ phone starts rotating in from the bottom-right
//   ~0.95s ─ phone settled, dead-centre and still
//   COPY_IN ─ copy reveals (line 2 staggers ~0.14s after line 1)
//   EXIT_AT ─ copy fades out + phone starts rotating away to the bottom-left
//   NEXT_AT ─ exit finished, advance to next feature
//
// => Each feature is on screen for NEXT_AT ms total (currently 9.0s), of which
//    ~7.0s is the phone fully centred & still. Source video clips should be
//    AT LEAST NEXT_AT long (10s files give a safe margin). Full loop = 4 x NEXT_AT.
// ───────────────────────────────────────────────────────────────────────────
const COPY_IN = 700;         // copy reveals after the phone has settled
const EXIT_AT = 8000;        // copy fades out + phone starts rotating away
const NEXT_AT = 9000;        // exit finished -> advance to the next feature

export default function FeatureReel() {
  const [index, setIndex] = useState(0);
  const [pose, setPose] = useState<'enter' | 'center' | 'exit'>('enter');
  const [animate, setAnimate] = useState(false); // toggles the transform transition on/off
  const [copyVisible, setCopyVisible] = useState(false);

  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  useEffect(() => {
    let alive = true;
    const timers: number[] = [];
    let raf1 = 0;
    let raf2 = 0;
    let i = 0;

    const after = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(() => alive && fn(), ms));
    };

    const playActive = (active: number) => {
      videoRefs.current.forEach((v, n) => {
        if (!v) return;
        if (n === active) {
          try {
            v.currentTime = 0;
            void v.play();
          } catch { /* ignore autoplay race */ }
        } else {
          v.pause();
        }
      });
    };

    const runFeature = () => {
      if (!alive) return;
      setIndex(i);
      playActive(i);

      // Teleport (no transition) to the off-stage bottom-right start pose.
      setAnimate(false);
      setPose('enter');
      setCopyVisible(false);

      // Next frame: enable the transition and glide to centre.
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (!alive) return;
          setAnimate(true);
          setPose('center');
        });
      });

      after(() => setCopyVisible(true), COPY_IN);
      after(() => {
        setCopyVisible(false);
        setPose('exit');           // animate (transition still on) out to bottom-left
      }, EXIT_AT);
      after(() => {
        i = (i + 1) % FEATURES.length;
        runFeature();
      }, NEXT_AT);
    };

    runFeature();

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  const active = FEATURES[index];

  return (
    <div className="reel-root">
      <style>{reelCss}</style>

      <div className="reel-stage">
        {/* Ambient dark-mode background glow, tinted to the active feature */}
        <div className="reel-bg-blob reel-bg-blob-a" style={{ background: active.glow }} />
        <div className="reel-bg-blob reel-bg-blob-b" />

        {/* Phone + colourful aura travel together */}
        <div
          className={`reel-phone-wrap pose-${pose} ${animate ? 'animate' : ''}`}
        >
          <div className="reel-aura" style={{ background: `radial-gradient(circle, ${active.glow} 0%, rgba(0,0,0,0) 68%)` }} />

          <div
            className="reel-phone"
            style={{ boxShadow: `0 0 46px 2px ${active.glow}, 0 22px 55px rgba(0,0,0,0.55)` }}
          >
            <div className="reel-island" />
            <div className="reel-screen">
              {FEATURES.map((f, n) => (
                <video
                  key={f.key}
                  ref={(el) => { videoRefs.current[n] = el; }}
                  className="reel-video"
                  style={{ opacity: n === index ? 1 : 0 }}
                  src={f.video}
                  muted
                  playsInline
                  preload="auto"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Subtle neutral scrim to anchor the copy & keep it legible */}
        <div className="reel-scrim" />

        {/* Two-line selling copy */}
        <div className={`reel-copy ${copyVisible ? 'show' : ''}`}>
          <div className="reel-line reel-copy-1">{active.line1}</div>
          <div className="reel-line reel-copy-2" style={{ color: active.color }}>{active.line2}</div>
        </div>
      </div>
    </div>
  );
}

const reelCss = `
  .reel-root {
    position: fixed;
    inset: 0;
    background: #060608;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  /* The exact capture frame to screen-record */
  .reel-stage {
    position: relative;
    width: 750px;
    height: 422px;
    background: radial-gradient(circle at 50% 120%, #0e0e16 0%, #060608 60%);
    overflow: hidden;
  }

  .reel-bg-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.35;
    pointer-events: none;
    transition: background 0.8s ease;
  }
  .reel-bg-blob-a {
    width: 360px; height: 360px;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.45;
  }
  .reel-bg-blob-b {
    width: 420px; height: 420px;
    bottom: -180px; right: -160px;
    background: rgba(53, 121, 246, 0.10);
  }

  /* Phone + aura wrapper — this is what rotates in and out */
  .reel-phone-wrap {
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -195px;   /* half of phone height (~390) */
    margin-left: -93px;   /* half of phone width (~186) */
    z-index: 10;
    will-change: transform;
  }
  .reel-phone-wrap.animate {
    transition: transform 0.95s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .pose-enter  { transform: translate(430px, 340px) rotate(30deg)  scale(0.82); }
  .pose-center { transform: translate(0, 0)         rotate(0deg)   scale(1);    }
  .pose-exit   { transform: translate(-450px, 360px) rotate(-30deg) scale(0.82); }

  /* Colourful aura behind the phone */
  .reel-aura {
    position: absolute;
    top: 50%; left: 50%;
    width: 320px; height: 460px;
    transform: translate(-50%, -50%);
    filter: blur(34px);
    opacity: 0.9;
    transition: background 0.8s ease;
    pointer-events: none;
  }

  /* Phone mockup — reused shape from the Rizz onboarding desktop simulator,
     scaled (~0.47x) to fit the stage. */
  .reel-phone {
    position: relative;
    width: 186px;
    height: 390px;
    background: #000;
    border: 5px solid #1c1c1e;
    border-radius: 30px;
    overflow: hidden;
    box-sizing: border-box;
    transition: box-shadow 0.8s ease;
  }

  .reel-island {
    position: absolute;
    top: 7px;
    left: 50%;
    transform: translateX(-50%);
    width: 52px;
    height: 14px;
    background: #000;
    border-radius: 100px;
    z-index: 10;
    box-shadow: inset 0 0 3px rgba(255,255,255,0.12);
  }

  .reel-screen {
    position: absolute;
    inset: 0;
    background: #060608;
    overflow: hidden;
  }

  /* Feature video: fill the screen, top-aligned */
  .reel-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    transition: opacity 0.35s ease;
  }

  /* Neutral dark scrim behind the copy (keeps text readable over the bright
     lower part of the phone without a distracting coloured wash) */
  .reel-scrim {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 185px;
    z-index: 20;
    pointer-events: none;
    background: linear-gradient(to top,
      rgba(6, 6, 8, 0.88) 0%,
      rgba(6, 6, 8, 0.55) 45%,
      rgba(6, 6, 8, 0) 100%);
  }

  /* Selling copy — bottom-centre, overlapping the lower phone, like the reference.
     Headline font matches the landing page (Lato). */
  .reel-copy {
    position: absolute;
    bottom: 34px;
    left: 0;
    width: 100%;
    text-align: center;
    z-index: 30;
    font-family: 'Lato', sans-serif;
    line-height: 1.02;
    pointer-events: none;
  }
  .reel-line {
    font-weight: 900;
    font-size: 33px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    /* Hidden state — a soft blur-up reveal like the reference */
    opacity: 0;
    transform: translateY(26px) scale(0.93);
    filter: blur(9px);
    transition:
      opacity 0.55s ease,
      transform 0.7s cubic-bezier(0.16, 1, 0.3, 1),
      filter 0.55s ease;
    will-change: opacity, transform, filter;
  }
  .reel-copy.show .reel-line {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
  /* Stagger the coloured payoff line slightly after the white setup line */
  .reel-copy.show .reel-copy-2 {
    transition-delay: 0.14s;
  }
  .reel-copy-1 {
    color: #ffffff;
    text-shadow: 0 2px 4px rgba(0,0,0,0.55), 0 4px 22px rgba(0,0,0,0.9);
  }
  .reel-copy-2 {
    margin-top: 2px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.7);
  }
`;
