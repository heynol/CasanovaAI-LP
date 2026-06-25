import { useEffect, useRef, useState } from 'react';

/**
 * FeatureReel — a self-contained, looping feature showcase animation built for
 * screen-recording. Direct-access only (route /featurereel, not linked anywhere).
 */

type ZoomType = 'none' | 'center' | 'mid' | 'bottom';
type PoseType = 'enter' | 'center' | 'zoom-center' | 'zoom-mid' | 'zoom-bottom' | 'exit';

// All times in ms from the start of a feature cycle.
// nextAt = video duration; exitAt = nextAt - 950 (exit animation duration).
type Feature = {
  key: string;
  video: string;
  color: string;
  glow: string;
  line1: string;
  line2: string;
  zoom: ZoomType;
  zoomIn?: number;
  zoomOut?: number;
  exitAt: number;
  nextAt: number;
};

const COPY_IN = 1200; // same for all features

const FEATURES: Feature[] = [
  {
    key: 'analyze-profile',
    video: '/FeatureVideos/analyze-profile.mp4',
    color: '#ff719a',
    glow: 'rgba(255, 113, 154, 0.55)',
    line1: 'FIND THE PERFECT',
    line2: 'ICE BREAKER',
    zoom: 'center',
    zoomIn:  6500,
    zoomOut: 12500,
    exitAt:  13183, // 14133 - 950
    nextAt:  14133,
  },
  {
    key: 'gen-reply',
    video: '/FeatureVideos/gen-reply.mp4',
    color: '#4facfe',
    glow: 'rgba(79, 172, 254, 0.55)',
    line1: 'ALWAYS KNOW',
    line2: 'WHAT TO SAY',
    zoom: 'bottom',
    zoomIn:  2500,
    zoomOut: 8500,
    exitAt:  13083, // 14033 - 950
    nextAt:  14033,
  },
  {
    key: 'improve-profile',
    video: '/FeatureVideos/improve-profile.mp4',
    color: '#00e676',
    glow: 'rgba(0, 230, 118, 0.5)',
    line1: 'OPTIMIZE YOUR',
    line2: 'DATING PROFILE',
    zoom: 'mid',
    zoomIn:  2500,
    zoomOut: 10000,
    exitAt:  14550, // 15500 - 950
    nextAt:  15500,
  },
];

export default function FeatureReel() {
  const [index, setIndex] = useState(0);
  const [pose, setPose] = useState<PoseType>('enter');
  const [animate, setAnimate] = useState(false);
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
      const feature = FEATURES[i];
      setIndex(i);
      playActive(i);

      // Teleport (no transition) to the off-stage bottom-right start pose.
      setAnimate(false);
      setPose('enter');
      setCopyVisible(false);

      // Next frame: enable transition and glide to centre.
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (!alive) return;
          setAnimate(true);
          setPose('center');
        });
      });

      after(() => setCopyVisible(true), COPY_IN);

      if (feature.zoom !== 'none' && feature.zoomIn != null && feature.zoomOut != null) {
        const zoomPose: PoseType =
          feature.zoom === 'center' ? 'zoom-center' :
          feature.zoom === 'mid'    ? 'zoom-mid'    : 'zoom-bottom';
        after(() => setPose(zoomPose), feature.zoomIn);
        after(() => setPose('center'), feature.zoomOut);
      }

      after(() => {
        setCopyVisible(false);
        setPose('exit');
      }, feature.exitAt);

      after(() => {
        i = (i + 1) % FEATURES.length;
        runFeature();
      }, feature.nextAt);
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
        {/* Phone + colourful aura travel together */}
        <div className={`reel-phone-wrap pose-${pose} ${animate ? 'animate' : ''}`}>
          <div
            className="reel-aura"
            style={{ background: `radial-gradient(circle, ${active.glow} 0%, rgba(255,255,255,0) 68%)` }}
          />

          <div
            className="reel-phone"
            style={{ boxShadow: `0 0 40px 2px ${active.glow}, 0 18px 45px rgba(0,0,0,0.18)` }}
          >
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

        {/* Dark scrim so white copy stays legible over the phone screen */}
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

// Phone dimensions: 160 × 336px (≈86% of the original 186 × 390px).
// Zoom bottom target: phone bottom at y≈290 in the 422px stage, above the copy area.
//   At scale(2): phone bottom = 211 + 168×2 = 547. Shift up: 547 − 290 = 257px.
const reelCss = `
  .reel-root {
    position: fixed;
    inset: 0;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .reel-stage {
    position: relative;
    width: 750px;
    height: 422px;
    background: #ffffff;
    overflow: hidden;
  }

  /* Phone + aura wrapper — this is what rotates in and out */
  .reel-phone-wrap {
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -168px;   /* half of phone height (336) */
    margin-left: -80px;   /* half of phone width (160) */
    z-index: 10;
    will-change: transform;
  }
  .reel-phone-wrap.animate {
    transition: transform 0.95s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .pose-enter       { transform: translate(430px, 340px)  rotate(30deg)  scale(0.82); }
  .pose-center      { transform: translate(0, 0)           rotate(0deg)   scale(1);    }
  .pose-zoom-center { transform: scale(2); }
  .pose-zoom-mid    { transform: translateY(-80px) scale(2); }
  .pose-zoom-bottom { transform: translateY(-257px) scale(2); }
  .pose-exit        { transform: translate(-450px, 360px)  rotate(-30deg) scale(0.82); }

  /* Colourful aura behind the phone */
  .reel-aura {
    position: absolute;
    top: 50%; left: 50%;
    width: 280px; height: 400px;
    transform: translate(-50%, -50%);
    filter: blur(34px);
    opacity: 0.85;
    transition: background 0.8s ease;
    pointer-events: none;
  }

  /* Phone mockup */
  .reel-phone {
    position: relative;
    width: 160px;
    height: 336px;
    background: #000;
    border: 5px solid #1c1c1e;
    border-radius: 26px;
    overflow: hidden;
    box-sizing: border-box;
    transition: box-shadow 0.8s ease;
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

  /* Subtle dark scrim anchors the copy over the phone screen */
  .reel-scrim {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 185px;
    z-index: 20;
    pointer-events: none;
    background: linear-gradient(to top,
      rgba(6, 6, 8, 0.82) 0%,
      rgba(6, 6, 8, 0.45) 45%,
      rgba(6, 6, 8, 0) 100%);
  }

  /* Selling copy — bottom-centre, white text over dark scrim */
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
    font-size: 28px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
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
