import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import { trackEvent } from '../mixpanel';
import { 
  Sparkles, 
  Send, 
  ArrowRight, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  VolumeX, 
  Lock, 
  X,
  RefreshCw,
  SkipForward
} from 'lucide-react';
import secondRoundDataRaw from '../../RizzOnboarding/SecondRound.json';

const LottieComp = (Lottie as any).default || Lottie;

// Define Types for Chloe Pre-written nodes
interface UserOption {
  text: string;
  score: number;
  next_node: string;
}

interface ChloeNode {
  chloe_message: string;
  chloe_delay_ms: number;
  is_end_state: boolean;
  keyboard_analysis?: string;
  user_options?: UserOption[];
}

interface SecondRoundData {
  persona: string;
  start_node: string;
  nodes: Record<string, ChloeNode>;
}

const secondRoundData = secondRoundDataRaw as unknown as SecondRoundData;

interface Message {
  id: string;
  type: 'Sent' | 'Received';
  text: string;
  score?: number;
}

export default function RizzOnboardingV2() {
  const navigate = useNavigate();

  useEffect(() => {
    trackEvent('Onboarding Start');
  }, []);


  const getScoreColorClass = (score: number) => {
    if (score === 5.0) return 'score-grey';
    if (score < 5.0) return 'score-red';
    return 'score-green';
  };

  // State Machine:
  // 'intro-logo' -> 'intro-rizz' -> 'intro-match' -> 'chat-init' -> 'chat-jade' -> 'rewinding' -> 'chat-chloe' -> 'success'
  const [flowState, setFlowState] = useState<
    'intro-logo' | 'intro-rizz' | 'intro-match' | 'chat-init' | 'chat-jade' | 'rewinding' | 'chat-chloe' | 'success'
  >('intro-match');

  const flowStateRef = useRef(flowState);
  useEffect(() => {
    flowStateRef.current = flowState;
  }, [flowState]);

  // Additional states for Tinder Swipe and Match sequences
  const [typedSubline, setTypedSubline] = useState('');
  const [isTypingSubline, setIsTypingSubline] = useState(false);
  const [matchStep, setMatchStep] = useState<number>(0);

  // Lock down html/body to prevent any mobile scroll rubber-banding or bounce
  useEffect(() => {
    document.documentElement.classList.add('onboarding-html');
    document.body.classList.add('onboarding-body');
    return () => {
      document.documentElement.classList.remove('onboarding-html');
      document.body.classList.remove('onboarding-body');
    };
  }, []);

  // Jade Live API states
  const [jadeMessages, setJadeMessages] = useState<Message[]>([]);
  const [currentScore, setCurrentScore] = useState<number>(5.0);
  const [inputText, setInputText] = useState<string>('');
  const [isKeyboardExpanded, setIsKeyboardExpanded] = useState<boolean>(false);
  const [isAwaitingAPI, setIsAwaitingAPI] = useState<boolean>(false);
  const [apiInteractionCount, setApiInteractionCount] = useState<number>(0);
  const [apiToken, setApiToken] = useState<string>('');
  
  // Chloe Pre-written states
  const [chloeMessages, setChloeMessages] = useState<Message[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string>('1_Initial');
  const [isCustomKeyboardState, setIsCustomKeyboardState] = useState<'initial' | 'generating' | 'carousel'>('initial');
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [chloeScore, setChloeScore] = useState<number>(5.0);

  const hasTrackedFailRef = useRef(false);
  const hasTrackedSuccessRef = useRef(false);

  // Message dissolve IDs during rewind
  const [dissolvingIds, setDissolvingIds] = useState<Set<string>>(new Set());

  // Autoplay Showcase mode states and refs
  const [isAutoplay, setIsAutoplay] = useState<boolean>(false);
  const [fingerAction, setFingerAction] = useState<{ active: boolean, type: 'tap' | 'swipe', x: string, y: string }>({
    active: false,
    type: 'tap',
    x: '50%',
    y: '50%'
  });
  const autoplayTimersRef = useRef<any[]>([]);
  const typingIntervalRef = useRef<any>(null);

  // Tap-and-hold pause state
  const isPausedRef = useRef<boolean>(false);
  const [isPausedUI, setIsPausedUI] = useState<boolean>(false);

  const pausableSetTimeout = (callback: () => void, ms: number) => {
    let elapsed = 0;
    const interval = setInterval(() => {
      if (!isPausedRef.current) {
        elapsed += 50;
        if (elapsed >= ms) {
          clearInterval(interval);
          callback();
        }
      }
    }, 50);
    return interval;
  };

  const clearAutoplayTimers = () => {
    autoplayTimersRef.current.forEach((t) => clearInterval(t)); // Using clearInterval since pausableSetTimeout uses setInterval
    autoplayTimersRef.current = [];
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  // Cleanup autoplay timers on unmount
  useEffect(() => {
    return () => clearAutoplayTimers();
  }, []);

  // Autoplay Showcase Mode state machine engine
  useEffect(() => {
    if (!isAutoplay) {
      clearAutoplayTimers();
      return;
    }

    // --- STAGE 1: JADE MANUAL CHAT ---
    if (flowState === 'chat-jade') {
      if (apiInteractionCount === 0 && !isAwaitingAPI && jadeMessages.length === 1 && inputText === '') {
        const timer = pausableSetTimeout(() => {
          simulateTypeMessage("Haha I'm hilarious. Trust me, I'm the funny guy in my friend group.", () => {
            setFingerAction({ active: true, type: 'tap', x: '90%', y: '95%' });
            const timerSend = pausableSetTimeout(() => {
              setFingerAction({ active: false, type: 'tap', x: '90%', y: '95%' });
              handleSendJadeMessage();
            }, 1000);
            autoplayTimersRef.current.push(timerSend);
          });
        }, 1500);
        autoplayTimersRef.current.push(timer);
      }
      
      else if (apiInteractionCount === 1 && !isAwaitingAPI && inputText === '') {
        const timer = pausableSetTimeout(() => {
          simulateTypeMessage("Alright fine, here's a joke: why did the chicken cross the road?", () => {
            setFingerAction({ active: true, type: 'tap', x: '90%', y: '95%' });
            const timerSend = pausableSetTimeout(() => {
              setFingerAction({ active: false, type: 'tap', x: '90%', y: '95%' });
              handleSendJadeMessage();
            }, 1000);
            autoplayTimersRef.current.push(timerSend);
          });
        }, 1500);
        autoplayTimersRef.current.push(timer);
      }

      else if (apiInteractionCount === 2 && !isAwaitingAPI && inputText === '') {
        const timer = pausableSetTimeout(() => {
          simulateTypeMessage("Okay damn, you're tough. Let me try a different approach...", () => {
            setFingerAction({ active: true, type: 'tap', x: '90%', y: '95%' });
            const timerSend = pausableSetTimeout(() => {
              setFingerAction({ active: false, type: 'tap', x: '90%', y: '95%' });
              handleSendJadeMessage();
            }, 1000);
            autoplayTimersRef.current.push(timerSend);
          });
        }, 1500);
        autoplayTimersRef.current.push(timer);
      }

      else if (apiInteractionCount === 3 && !isAwaitingAPI) {
        const timer = pausableSetTimeout(() => {
          handleVcrRewind();
        }, 2000);
        autoplayTimersRef.current.push(timer);
      }
    }

    // --- STAGE 2: CHLOE AI CHAT ---
    if (flowState === 'chat-chloe' && !isAwaitingAPI) {
      const currentNode = secondRoundData.nodes[currentNodeId];
      if (currentNode && !currentNode.is_end_state) {
        if (isCustomKeyboardState === 'initial') {
          const timer = pausableSetTimeout(() => {
            setFingerAction({ active: true, type: 'tap', x: '50%', y: '87%' });
            const timerGen = pausableSetTimeout(() => {
              setFingerAction({ active: false, type: 'tap', x: '50%', y: '87%' });
              handleGenerateCustomReplies();
            }, 1000);
            autoplayTimersRef.current.push(timerGen);
          }, 1500);
          autoplayTimersRef.current.push(timer);
        } else if (isCustomKeyboardState === 'carousel') {
          const timer = pausableSetTimeout(() => {
            const options = currentNode.user_options || [];
            if (options.length > 0) {
              let bestOption = options[0];
              options.forEach((opt) => {
                if (opt.score > bestOption.score) {
                  bestOption = opt;
                }
              });
              const bestIndex = options.indexOf(bestOption);
              
              if (bestIndex === 0) {
                // No need to swipe, just tap the first option directly
                const timerPreSend = pausableSetTimeout(() => {
                  setFingerAction({ active: true, type: 'tap', x: '50%', y: '78%' });
                  const timerSend = pausableSetTimeout(() => {
                    setFingerAction({ active: false, type: 'tap', x: '50%', y: '78%' });
                    handleSendCarouselReply(bestOption);
                  }, 1000);
                  autoplayTimersRef.current.push(timerSend);
                }, 500);
                autoplayTimersRef.current.push(timerPreSend);
              } else {
                setFingerAction({ active: true, type: 'swipe', x: '50%', y: '78%' });
                const timerSwipe = pausableSetTimeout(() => {
                  setCarouselIndex(bestIndex);
                  setFingerAction({ active: false, type: 'swipe', x: '50%', y: '78%' });

                  const timerPreSend = pausableSetTimeout(() => {
                    setFingerAction({ active: true, type: 'tap', x: '50%', y: '78%' });
                    const timerSend = pausableSetTimeout(() => {
                      setFingerAction({ active: false, type: 'tap', x: '50%', y: '78%' });
                      handleSendCarouselReply(bestOption);
                    }, 1000);
                    autoplayTimersRef.current.push(timerSend);
                  }, 500);
                  autoplayTimersRef.current.push(timerPreSend);
                }, 1500);
                autoplayTimersRef.current.push(timerSwipe);
              }
            }
          }, 1000);
          autoplayTimersRef.current.push(timer);
        }
      }
    }

    if (flowState === 'success') {
      setIsAutoplay(false);
    }
  }, [isAutoplay, flowState, isAwaitingAPI, apiInteractionCount, isCustomKeyboardState, currentNodeId, jadeMessages.length]);

  const isKeyboardVisible = flowState === 'chat-chloe' && !isAwaitingAPI;

  // References
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const chatStreamRef = useRef<HTMLDivElement>(null);
  const profileHeaderRef = useRef<HTMLDivElement>(null);

  // Swipe gesture refs for simulated keyboard carousel
  const touchStartXRef = useRef<number | null>(null);
  const mouseStartXRef = useRef<number | null>(null);

  // Swipe/Touch refs and handlers for main onboarding intro screens
  const introTouchStartY = useRef<number | null>(null);
  const introMouseStartY = useRef<number | null>(null);
  const lastTransitionTimeRef = useRef<number>(0);
  const introTimerRef = useRef<any>(null);

  // Track Fail Screen Shown
  useEffect(() => {
    if (flowState === 'chat-jade' && apiInteractionCount >= 3 && !isAwaitingAPI) {
      if (!hasTrackedFailRef.current) {
        trackEvent('Onboarding Fail Screen Shown', {
          score: currentScore
        });
        hasTrackedFailRef.current = true;
      }
    } else if (flowState !== 'chat-jade' || apiInteractionCount < 3) {
      hasTrackedFailRef.current = false;
    }
  }, [flowState, apiInteractionCount, isAwaitingAPI, currentScore]);

  const handleNextState = () => {
    const now = Date.now();
    if (now - lastTransitionTimeRef.current < 450) return; // Cooldown to prevent double-skips
    lastTransitionTimeRef.current = now;

    if (flowState === 'intro-logo') {
      setFlowState('intro-rizz');
    } else if (flowState === 'intro-rizz') {
      setFlowState('intro-match');
    } else if (flowState === 'intro-match') {
      if (matchStep < 4) {
        setMatchStep(4);
      }
    }
  };

  // Don't hijack taps that land on interactive controls (buttons/links/inputs) — otherwise the
  // intro tap-to-advance handler's preventDefault swallows the control's click (notably on mobile).
  const isInteractiveTarget = (target: EventTarget | null) =>
    !!(target as HTMLElement)?.closest?.('button, a, input, textarea, [role="button"], .real-input');

  const handleIntroTouchStart = (e: React.TouchEvent) => {
    if (!['intro-logo', 'intro-rizz', 'intro-match'].includes(flowState)) return;
    if (isInteractiveTarget(e.target)) return;
    introTouchStartY.current = e.touches[0].clientY;
  };

  const handleIntroTouchEnd = (e: React.TouchEvent) => {
    if (!['intro-logo', 'intro-rizz', 'intro-match'].includes(flowState)) return;
    if (isInteractiveTarget(e.target)) return;
    if (introTouchStartY.current === null) return;
    // Prevent the browser from generating synthetic mouse/click events after touch
    e.preventDefault();
    introTouchStartY.current = null;
    handleNextState();
  };

  const handleIntroMouseDown = (e: React.MouseEvent) => {
    if (!['intro-logo', 'intro-rizz', 'intro-match'].includes(flowState)) return;
    if (isInteractiveTarget(e.target)) return;
    introMouseStartY.current = e.clientY;
  };

  // Consolidate into mouseUp only (no separate onClick) to prevent double-firing.
  // Fires for both taps (diffY ≈ 0) and swipes (diffY > threshold).
  const handleIntroMouseUp = (e: React.MouseEvent) => {
    if (!['intro-logo', 'intro-rizz', 'intro-match'].includes(flowState)) return;
    if (isInteractiveTarget(e.target)) return;
    if (introMouseStartY.current === null) return;
    introMouseStartY.current = null;
    handleNextState();
  };

  // Touch Swiping Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.touches[0].clientX;
    const diffX = touchStartXRef.current - touchEndX;

    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        setCarouselIndex((prev) => (prev < 2 ? prev + 1 : prev));
      } else {
        setCarouselIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
      touchStartXRef.current = null;
    }
  };

  // Mouse Drag Swiping Handlers (for Desktop testing)
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseStartXRef.current === null) return;
    const mouseEndX = e.clientX;
    const diffX = mouseStartXRef.current - mouseEndX;

    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        setCarouselIndex((prev) => (prev < 2 ? prev + 1 : prev));
      } else {
        setCarouselIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
      mouseStartXRef.current = null;
    }
  };

  const handleMouseUp = () => {
    mouseStartXRef.current = null;
  };

  // Load Lottie JSONs dynamically from public dir to prevent compiling errors
  const [analyzingAnim, setAnalyzingAnim] = useState<any>(null);
  const [colorGlowAnim, setColorGlowAnim] = useState<any>(null);
  const kbdGlowRef = useRef<any>(null);

  useEffect(() => {
    // Fetch animations from static public paths to guarantee they load
    fetch('/RizzOnboarding/Lottie/AnalyzingContent.json')
      .then((res) => res.json())
      .then((data) => setAnalyzingAnim(data))
      .catch((err) => console.error('Failed to load analyzing animation', err));

    fetch('/RizzOnboarding/Lottie/ColorGlow OnScreen.json')
      .then((res) => res.json())
      .then((data) => setColorGlowAnim(data))
      .catch((err) => console.error('Failed to load color glow animation', err));
  }, []);

  // Pre-fetch Auth Token for Jade Live API during the Intro scroll sequence
  useEffect(() => {
    const fetchToken = async () => {
      const devSecret = import.meta.env.VITE_DEV_AUTH_SECRET || 'NAOUfmUyQY9J0/xJUbN9vOQQ9VsGG7Vvy0XoYs57Ah8=';
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      try {
        let response = null;

        // 1. Try local dev-token proxy first if running locally
        if (isLocal) {
          try {
            response = await fetch('/api/get-dev-token');
            if (response.ok) {
              const contentType = response.headers.get('content-type') || '';
              if (!contentType.includes('application/json')) {
                response = null; // Returned HTML fallback from vercel rewrite
              }
            }
          } catch (e) {
            response = null;
          }
        }

        // 2. Try Vercel Serverless proxy in production (bypasses browser CORS completely!)
        if (!response || !response.ok) {
          try {
            response = await fetch('/api-rizz/miscAuth/auth/dev/id-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Dev-Auth-Secret': devSecret,
              },
              body: JSON.stringify({ uid: 'dev-peter' }),
            });
            if (response.ok) {
              const contentType = response.headers.get('content-type') || '';
              if (!contentType.includes('application/json')) {
                response = null; // Returned HTML fallback
              }
            }
          } catch (e) {
            response = null;
          }
        }

        // 3. Absolute URL fallback if proxy routes are not configured or fail
        if (!response || !response.ok) {
          response = await fetch('https://us-central1-casanova-ai-dev.cloudfunctions.net/miscAuth/auth/dev/id-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Dev-Auth-Secret': devSecret,
            },
            body: JSON.stringify({ uid: 'dev-peter' }),
          });
        }

        if (response && response.ok) {
          const data = await response.json();
          if (data && data.idToken) {
            setApiToken(data.idToken);
            console.log('Successfully pre-fetched dev idToken');
            return;
          }
        }
        console.warn('Failed to pre-fetch token from server');
      } catch (err) {
        console.error('Error pre-fetching token', err);
      }
    };
    fetchToken();
  }, []);

  // Auto-scroll chat to bottom
  const scrollToBottom = (instant = false) => {
    if (['intro-logo', 'intro-rizz', 'intro-match', 'rewinding'].includes(flowStateRef.current)) return;
    setTimeout(() => {
      if (['intro-logo', 'intro-rizz', 'intro-match', 'rewinding'].includes(flowStateRef.current)) return;
      if (chatStreamRef.current) {
        chatStreamRef.current.scrollTo({
          top: chatStreamRef.current.scrollHeight,
          behavior: instant ? 'instant' as ScrollBehavior : 'smooth'
        });
      }
    }, 100);
  };

  // Scroll to bottom whenever the visual viewport shrinks (OS keyboard opens)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handleVVResize = () => {
      if (['intro-logo', 'intro-rizz', 'intro-match', 'rewinding'].includes(flowStateRef.current)) return;
      // Small delay to let the layout reflow settle after keyboard animation
      setTimeout(() => {
        if (chatStreamRef.current) {
          chatStreamRef.current.scrollTo({
            top: chatStreamRef.current.scrollHeight,
            behavior: 'instant' as ScrollBehavior
          });
        }
      }, 80);
    };
    vv.addEventListener('resize', handleVVResize);
    return () => vv.removeEventListener('resize', handleVVResize);
  }, []);

  // Lock scroll to top during all intro states to prevent visual jumps
  useEffect(() => {
    if (['intro-logo', 'intro-rizz', 'intro-match'].includes(flowState)) {
      if (chatStreamRef.current) {
        chatStreamRef.current.scrollTop = 0;
      }
    }
  }, [flowState]);

  // Automated Scroll Sequence Timers
  useEffect(() => {
    if (introTimerRef.current) clearTimeout(introTimerRef.current);

    if (flowState === 'intro-logo') {
      introTimerRef.current = setTimeout(() => setFlowState('intro-rizz'), 1800);
    } else if (flowState === 'intro-rizz') {
      introTimerRef.current = setTimeout(() => setFlowState('intro-match'), 4000);
    } else if (flowState === 'chat-init') {
      // 1. Initially show typing indicator (set Jade messages empty and typing to true)
      setIsAwaitingAPI(true);
      setJadeMessages([]);

      // 2. Show Jade's first message after 1800ms typing delay
      const msgTimer = setTimeout(() => {
        setIsAwaitingAPI(false);
        setJadeMessages([
          {
            id: 'jade-init',
            type: 'Received',
            text: 'So... are you actually funny, or is your profile just good marketing? 👀',
          },
        ]);
        scrollToBottom();
        trackEvent('Onboarding Chat Start');
      }, 1800);

      // 3. Bring up the keyboard and transition to chat-jade 1200ms after the message appears (total 3000ms)
      const kbdTimer = setTimeout(() => {
        setIsKeyboardExpanded(true);
        inputRef.current?.focus();
        setFlowState('chat-jade');
      }, 3000);

      return () => {
        clearTimeout(msgTimer);
        clearTimeout(kbdTimer);
      };
    }

    return () => {
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
    };
  }, [flowState]);

  // Typewriter Effect for Round 2 mission banner ("close the deal WITH AI")
  const [typedMission, setTypedMission] = useState('');
  const chloeMissionText = 'Your mission: Close the deal with AI, in 3 messages!';
  useEffect(() => {
    if (flowState === 'chat-chloe') {
      setTypedMission('');
      let index = 0;
      const delay = setTimeout(() => {
        const interval = setInterval(() => {
          setTypedMission(chloeMissionText.substring(0, index + 1));
          index++;
          if (index >= chloeMissionText.length) clearInterval(interval);
        }, 45);
        // store on ref-free closure; cleared by outer cleanup via clearInterval below
        (delay as any)._iv = interval;
      }, 400);
      return () => {
        clearTimeout(delay);
        if ((delay as any)._iv) clearInterval((delay as any)._iv);
      };
    } else if (flowState === 'success') {
      // Keep the round-2 mission fully shown after the round ends
      setTypedMission(chloeMissionText);
    } else {
      setTypedMission('');
    }
  }, [flowState]);

  // Renders a "type it out" string but keeps the full text laid out (as transparent
  // "ghost" text) so the box never resizes / shifts while typing. `boldLen` chars from
  // the start are rendered bold (used for the "Your mission:" prefix).
  const renderTyped = (full: string, typedLen: number, boldLen = 0) => {
    const boldVisibleEnd = Math.min(typedLen, boldLen);
    const showCursor = typedLen < full.length;
    return (
      <span className="typed-wrap">
        <b>{full.substring(0, boldVisibleEnd)}</b>
        {typedLen > boldLen && <span>{full.substring(boldLen, typedLen)}</span>}
        {showCursor && <span className="typing-cursor">|</span>}
        {boldLen > boldVisibleEnd && (
          <b className="mission-ghost">{full.substring(boldVisibleEnd, boldLen)}</b>
        )}
        <span className="mission-ghost">{full.substring(Math.max(typedLen, boldLen))}</span>
      </span>
    );
  };

  // Typewriter Effect for Round 1 mission capsule — types out when the box appears
  const [typedRound1Mission, setTypedRound1Mission] = useState('');
  const round1MissionText = "Casanova AI does all the heavy lifting to get you the dates you deserve. Click the button below to see it in action!";
  const round1MissionBoldLen = 11; // "Casanova AI"
  useEffect(() => {
    if (flowState === 'intro-match') {
      if (matchStep >= 4) {
        setTypedRound1Mission('');
        let index = 0;
        const interval = setInterval(() => {
          setTypedRound1Mission(round1MissionText.substring(0, index + 1));
          index++;
          if (index >= round1MissionText.length) clearInterval(interval);
        }, 40);
        return () => clearInterval(interval);
      } else {
        setTypedRound1Mission('');
      }
    } else {
      // Once past the match screen, keep the mission fully shown (no re-animation)
      setTypedRound1Mission(round1MissionText);
    }
  }, [flowState, matchStep]);

  // Typewriter Effect for "Test your Rizz" subline
  const fullSublineText = 'Can you close the deal in 3 messages?';
  useEffect(() => {
    if (flowState === 'intro-rizz') {
      setTypedSubline('');
      setIsTypingSubline(false);
      
      let interval: any = null;
      const delayTimer = setTimeout(() => {
        setIsTypingSubline(true);
        let index = 0;
        interval = setInterval(() => {
          setTypedSubline(fullSublineText.substring(0, index + 1));
          index++;
          if (index >= fullSublineText.length) {
            clearInterval(interval);
            setIsTypingSubline(false);
          }
        }, 55); // 55ms per letter
      }, 900); // 900ms delay to let the title settle in center first
      
      return () => {
        clearTimeout(delayTimer);
        if (interval) clearInterval(interval);
      };
    } else if (['intro-logo'].includes(flowState)) {
      setTypedSubline('');
      setIsTypingSubline(false);
    } else {
      setTypedSubline(fullSublineText);
      setIsTypingSubline(false);
    }
  }, [flowState]);

  // Tinder Match Screen delayed one-by-one entries
  useEffect(() => {
    if (flowState === 'intro-match') {
      setMatchStep(0);
      trackEvent('Onboarding Match Shown');
      
      // Step 1: Slide up profile photo (matchStep = 1) at 100ms
      const timer1 = setTimeout(() => {
        setMatchStep(1);
      }, 100);

      // Step 4: Mission capsule (matchStep = 4) — pill & bio removed, so reveal promptly
      const timer4 = setTimeout(() => {
        setMatchStep(4);
        setTimeout(() => {
          if (chatStreamRef.current) {
            chatStreamRef.current.scrollTo({
              top: chatStreamRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 150);
      }, 1400);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer4);
      };
    } else {
      setMatchStep(0);
    }
  }, [flowState]);

  // Control Lottie ColorGlow playback in simulated keyboard
  useEffect(() => {
    if (kbdGlowRef.current) {
      if (isCustomKeyboardState === 'generating') {
        kbdGlowRef.current.play();
      } else {
        kbdGlowRef.current.goToAndStop(0, true);
      }
    }
  }, [isCustomKeyboardState, colorGlowAnim]);

  // Keep scroll at bottom when keyboard shows/hides
  useEffect(() => {
    if (['intro-logo', 'intro-rizz', 'intro-match', 'rewinding'].includes(flowState)) return;
    scrollToBottom();
    const timer = setTimeout(() => {
      if (['intro-logo', 'intro-rizz', 'intro-match', 'rewinding'].includes(flowState)) return;
      scrollToBottom();
    }, 400);
    return () => clearTimeout(timer);
  }, [flowState, isAwaitingAPI, isCustomKeyboardState]);

  const handleTransitionToChatInit = () => {
    setJadeMessages([]);
    setIsAwaitingAPI(true);
    setFlowState('chat-init');
    scrollToBottom();
  };

  // Boot the second (AI-assisted) round, optionally fully automated.
  const startSecondRound = (autoplay: boolean) => {
    clearAutoplayTimers();
    setInputText('');
    if (inputRef.current) inputRef.current.textContent = '';
    setIsAutoplay(autoplay);
    setJadeMessages([]);
    setChloeMessages([
      {
        id: 'chloe-init',
        type: 'Received',
        text: secondRoundData.nodes['1_Initial'].chloe_message,
      },
    ]);
    setCurrentNodeId('1_Initial');
    setChloeScore(5.0);
    setIsCustomKeyboardState('initial');
    setFlowState('chat-chloe');

    setTimeout(() => {
      setIsKeyboardExpanded(true);
      inputRef.current?.focus();
      scrollToBottom();
    }, 500);
  };

  const handleStartChat = (autoplay: boolean) => {
    if (autoplay) {
      startSecondRound(true);
      trackEvent('Onboarding Start Autoplay');
    } else {
      setIsAutoplay(false);
      handleTransitionToChatInit();
      trackEvent('Onboarding Start Interactive');
    }
  };

  // --- Floating flow controls (Skip / Automate) ---
  // "Skip": Round 1 → jump to the second round but still MANUAL; Round 2 → skip straight to
  // the success button's destination (the paywall/onboarding page), not the win card itself.
  const handleSkip = () => {
    if (flowState === 'chat-chloe') {
      clearAutoplayTimers();
      trackEvent('Onboarding Skip Clicked', { from: flowState, to: 'success-destination' });
      handleSuccessCtaClick();
      return;
    }
    startSecondRound(false);
    trackEvent('Onboarding Skip Clicked', { from: flowState, to: 'second-round-manual' });
  };

  // "Automate": Round 1 → play the rewind animation, then start the second round FULLY automated;
  // Round 2 → pick up here and continue the AI automation.
  const handleAutomate = () => {
    if (flowState === 'chat-chloe') {
      if (isAutoplay) return;
      setInputText('');
      if (inputRef.current) inputRef.current.textContent = '';
      setIsAutoplay(true);
      trackEvent('Onboarding Automate Clicked', { from: flowState, to: 'continue-automation' });
      return;
    }
    // Round 1: rewind first, then hand off to the automated second round.
    clearAutoplayTimers();
    setInputText('');
    if (inputRef.current) inputRef.current.textContent = '';
    setIsAutoplay(true);
    handleVcrRewind();
    trackEvent('Onboarding Automate Clicked', { from: flowState, to: 'rewind-then-auto' });
  };

  const simulateTypeMessage = (text: string, onComplete: () => void) => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    
    let index = 0;
    typingIntervalRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      const typed = text.substring(0, index + 1);
      setInputText(typed);
      if (inputRef.current) {
        inputRef.current.textContent = typed;
      }
      index++;
      if (index >= text.length) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        onComplete();
      }
    }, 60);
  };

  // --- iOS Keyboard Key Taps ---
  const handleKeyTap = (char: string) => {
    setInputText((prev) => prev + char);
    inputRef.current?.focus();
  };

  const handleBackspace = () => {
    setInputText((prev) => prev.slice(0, -1));
    inputRef.current?.focus();
  };

  const handleSpace = () => {
    setInputText((prev) => prev + ' ');
    inputRef.current?.focus();
  };

  // --- Jade Live API Call & Fallback ---
  const handleSendJadeMessage = async () => {
    // Read text from contenteditable div if inputText state is stale
    const rawText = inputRef.current?.textContent?.trim() || inputText.trim();
    if (!rawText || isAwaitingAPI) return;
    const text = rawText;
    setInputText('');
    if (inputRef.current) inputRef.current.textContent = '';
    setIsKeyboardExpanded(false); // Close keyboard, hide input

    const newUserMsg: Message = {
      id: `user-${Date.now()}`,
      type: 'Sent',
      text: text,
    };

    const updatedHistory = [...jadeMessages, newUserMsg];
    setJadeMessages(updatedHistory);
    setIsAwaitingAPI(true);
    scrollToBottom();
    trackEvent('Onboarding Message Sent', {
      step: apiInteractionCount + 1,
      text: text
    });

    // Setup complete chat history in the format required by backend:
    // [{"type": "Sent", "text": "..."}, {"type": "Received", "text": "..."}]
    const apiMessagesPayload = updatedHistory.map((m) => ({
      type: m.type,
      text: m.text,
    }));

    try {
      if (apiToken) {
        let response = null;
        const payload = JSON.stringify({
          personaId: 'jade',
          currentGlobalScore: currentScore,
          messages: apiMessagesPayload,
          languageCode: 'en',
        });

        // 1. Try Vercel Serverless proxy first (bypasses browser CORS completely!)
        try {
          const apiUrl = '/api-rizz/rizzArena/onboarding/message';
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiToken}`,
            },
            body: payload,
          });
          if (response.ok) {
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
              response = null; // Returned HTML fallback (e.g. static hosting 404 falling back to index.html)
            }
          }
        } catch (e) {
          response = null;
        }

        // 2. Direct absolute fallback if proxy is missing/fails or doesn't support rewrites
        if (!response || !response.ok) {
          response = await fetch('https://us-central1-casanova-ai-dev.cloudfunctions.net/rizzArena/onboarding/message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiToken}`,
            },
            body: payload,
          });
        }

        if (response.ok) {
          const data = await response.json();
          // Extract reply and score
          const replyText = data.girl_reply ?? data.reply ?? data.text ?? "Mmh, interesting...";
          const nextScore = data.new_global_score ?? data.score ?? data.currentGlobalScore ?? 3.4;

          const nextInteraction = apiInteractionCount + 1;
          const isFinal = nextInteraction >= 3;

          const newJadeMsg: Message = {
            id: `jade-reply-${Date.now()}`,
            type: 'Received',
            text: replyText,
            score: nextScore,
          };

          setJadeMessages((prev) => [...prev, newJadeMsg]);
          setCurrentScore(nextScore);
          setApiInteractionCount(nextInteraction);
          setIsAwaitingAPI(false);
          trackEvent('Onboarding Response Received', {
            step: nextInteraction,
            score: nextScore,
            global_score: nextScore,
            local_score: nextScore
          });

          if (!isFinal) {
            // Swiftly bring back keyboard and input
            setTimeout(() => {
              setIsKeyboardExpanded(true);
              inputRef.current?.focus();
            }, 800);
          }
          scrollToBottom();
          return;
        }
      }
    } catch (e) {
      console.error('Error connecting to live API. Falling back to high-fidelity mock responses.', e);
    }

    // --- High Fidelity Graceful Fallback ---
    setTimeout(() => {
      const nextInteraction = apiInteractionCount + 1;
      let replyText = '';
      let nextScore = 5.0;

      if (nextInteraction === 1) {
        replyText = "Ah yes, 'trust me bro'. The universal proof of comedy. Try again. 🥱";
        nextScore = 4.2;
      } else if (nextInteraction === 2) {
        replyText = "A chicken joke? Seriously? Are you 12? Next. 🙄";
        nextScore = 3.1;
      } else {
        replyText = "Yeah, I think we're done here. This is getting painful to watch. ✌️";
        nextScore = 3.4;
      }

      const newJadeMsg: Message = {
        id: `jade-reply-mock-${Date.now()}`,
        type: 'Received',
        text: replyText,
        score: nextScore,
      };

      setJadeMessages((prev) => [...prev, newJadeMsg]);
      setCurrentScore(nextScore);
      setApiInteractionCount(nextInteraction);
      setIsAwaitingAPI(false);
      trackEvent('Onboarding Response Received', {
        step: nextInteraction,
        score: nextScore,
        global_score: nextScore,
        local_score: nextScore
      });

      if (nextInteraction < 3) {
        setTimeout(() => {
          setIsKeyboardExpanded(true);
          inputRef.current?.focus();
        }, 800);
      }
      scrollToBottom();
    }, isAutoplay ? 3000 : 1500); // Simulated delay
  };

  // --- Glitch VHS Rewind Animation ---
  const handleVcrRewind = () => {
    setFlowState('rewinding');
    trackEvent('Onboarding Rewind Clicked');

    const REWIND_DURATION = 3500; // ms — slow, cinematic rewind

    // --- Scroll: animate back to top (scrollTop = 0) ---
    // Messages stay in DOM (dissolving in-place), so the layout height is preserved
    // and the scroll has real distance to travel — giving a visible, smooth animation.
    if (chatStreamRef.current && chatStreamRef.current.scrollTop > 0) {
      const container = chatStreamRef.current;
      const startScrollTop = container.scrollTop;
      const scrollStartTime = performance.now();

      const animateScroll = (now: number) => {
        const elapsed = now - scrollStartTime;
        const progress = Math.min(elapsed / REWIND_DURATION, 1);

        // easeInOutCubic — slow start, steady middle, soft landing
        const t = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        container.scrollTop = startScrollTop * (1 - t);

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);
    }

    // --- Message dissolve: visually fade messages out in-place, newest first ---
    // Keeps them in the DOM (no layout shift = smooth scroll) and dissolves them visibly.
    // Only keep the very first message (Jade's opening line) visible throughout.
    const messagesToDissolve = [...jadeMessages].slice(1).reverse(); // newest → oldest, skip first
    const numToDissolve = messagesToDissolve.length;
    if (numToDissolve > 0) {
      const startDelay = REWIND_DURATION * 0.08;
      const endDelay   = REWIND_DURATION * 0.82;
      const step = numToDissolve > 1 ? (endDelay - startDelay) / (numToDissolve - 1) : 0;
      messagesToDissolve.forEach((msg, i) => {
        setTimeout(() => {
          setDissolvingIds(prev => new Set([...prev, msg.id]));
        }, startDelay + i * step);
      });
    }

    // End rewind — clean up and boot Round 2 (Chloe)
    setTimeout(() => {
      setDissolvingIds(new Set());
      setJadeMessages([]);
      setChloeMessages([
        {
          id: 'chloe-init',
          type: 'Received',
          text: secondRoundData.nodes['1_Initial'].chloe_message,
        },
      ]);
      setCurrentNodeId('1_Initial');
      setChloeScore(5.0);
      setIsCustomKeyboardState('initial');
      setFlowState('chat-chloe');
      trackEvent('Onboarding AI Chat Started');

      // Scroll to bottom for Chloe's first message
      setTimeout(() => {
        if (chatStreamRef.current) {
          chatStreamRef.current.scrollTo({
            top: chatStreamRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }, REWIND_DURATION + 200);
  };

  // --- Chloe Pre-written Interaction ---
  const handleGenerateCustomReplies = () => {
    setIsCustomKeyboardState('generating');
    trackEvent('Onboarding AI Generate Clicked');
    
    setTimeout(() => {
      setIsCustomKeyboardState('carousel');
      setCarouselIndex(0);
      scrollToBottom();
    }, 2000);
  };

  const handleSendCarouselReply = (option: UserOption) => {
    const selectedText = option.text;
    const nextNodeId = option.next_node;
    const newScore = option.score;

    const currentStep = chloeMessages.filter((m) => m.type === 'Sent').length + 1;

    trackEvent('Onboarding AI Option Selected', {
      step: currentStep,
      node_id: currentNodeId,
      selected_option_text: selectedText,
      next_node_id: nextNodeId,
      score: newScore
    });

    // Add user selection to chat stream
    const userMsg: Message = {
      id: `user-chloe-${Date.now()}`,
      type: 'Sent',
      text: selectedText,
    };

    const updatedMsgs = [...chloeMessages, userMsg];
    setChloeMessages(updatedMsgs);
    setIsCustomKeyboardState('initial'); // Hide simulated keyboard
    setIsAwaitingAPI(true); // Show Chloe typing indicator
    scrollToBottom();

    const nextNode = secondRoundData.nodes[nextNodeId];

    setTimeout(() => {
      setIsAwaitingAPI(false);
      
      const chloeMsg: Message = {
        id: `chloe-reply-${Date.now()}`,
        type: 'Received',
        text: nextNode.chloe_message,
        score: newScore,
      };

      setChloeMessages((prev) => [...prev, chloeMsg]);
      setChloeScore(newScore);
      setCurrentNodeId(nextNodeId);
      scrollToBottom();

      trackEvent('Onboarding AI Response Received', {
        step: currentStep,
        score: newScore
      });

      if (nextNode.is_end_state) {
        // Transition to golden success card
        setFlowState('success');
        trackEvent('Onboarding Success Shown', {
          final_score: newScore
        });
      }
    }, Math.max(nextNode.chloe_delay_ms || 1500, 3200));
  };

  const restartFlow = () => {
    setJadeMessages([]);
    setChloeMessages([]);
    setCurrentScore(5.0);
    setChloeScore(5.0);
    setApiInteractionCount(0);
    setFlowState('intro-logo');
  };

  const handleSuccessCtaClick = () => {
    trackEvent('Onboarding Success CTA Clicked');
    const destination = "https://onboarding.getcasanova.ai/pz4-mr0l-g44";
    try {
      const currentParams = new URLSearchParams(window.location.search);
      const url = new URL(destination);
      currentParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
      window.location.href = url.toString();
    } catch (e) {
      window.location.href = destination;
    }
  };

  const isIntroActive = ['intro-logo', 'intro-rizz'].includes(flowState) || (flowState === 'intro-match' && matchStep < 4);

  return (
    <div className="rizz-page-wrapper">
      {/* Dynamic Inject Style for Custom Animations & Layouts */}
      <style>{`
        html.onboarding-html,
        body.onboarding-body,
        body.onboarding-body #root,
        body.onboarding-body .app-container {
          overflow: hidden !important;
          height: 100% !important;
          height: 100dvh !important;
          width: 100% !important;
          position: fixed !important;
        }

        .rizz-page-wrapper {
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          background: #030304;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          box-sizing: border-box;
          font-family: 'Lato', sans-serif;
          color: #ffffff;
          overflow: hidden;
          position: relative;
        }

        .rizz-page-wrapper,
        .rizz-page-wrapper :not(input):not(textarea):not(.real-input) {
          -webkit-tap-highlight-color: transparent !important;
          -webkit-user-select: none !important;
          user-select: none !important;
          outline: none !important;
        }

        /* Ambient Glow Blobs in Background */
        .bg-glow-1 {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(53, 121, 246, 0.12) 0%, rgba(3, 3, 4, 0) 70%);
          top: -100px;
          left: -100px;
          z-index: 1;
        }
        
        .bg-glow-2 {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(66, 239, 188, 0.08) 0%, rgba(3, 3, 4, 0) 75%);
          bottom: -150px;
          right: -150px;
          z-index: 1;
        }



        /* Center Phone Simulator Mockup */
        .phone-mockup {
          height: 80vh;
          height: 80dvh;
          aspect-ratio: 390 / 820;
          max-height: 820px;
          max-width: 390px;
          background: #000000;
          border: 10px solid #1c1c1e;
          border-radius: 48px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(66, 239, 188, 0.1);
          overflow: hidden;
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease;
        }

        /* Dynamic Island */
        .phone-island {
          position: absolute;
          top: 14px;
          left: 50%;
          transform: translateX(-50%);
          width: 105px;
          height: 28px;
          background: #000000;
          border-radius: 100px;
          z-index: 100;
          box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.1);
        }

        /* Phone Screen Content Container */
        .phone-screen {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
          background: #060608;
          /* Beautiful high-end ambient background glow matching the mockup exactly */
          background-image: radial-gradient(circle at 90% 80%, rgba(91, 97, 244, 0.15) 0%, rgba(6, 6, 8, 0) 60%),
                            radial-gradient(circle at 80% 20%, rgba(91, 97, 244, 0.1) 0%, rgba(6, 6, 8, 0) 50%);
          box-sizing: border-box;
          padding-top: 48px; /* Safe area for island */
          padding-bottom: 0; /* Let input sit flush at bottom */
          overflow: hidden; /* Lock scroll boundaries */
          
          /* Prevent touch highlights, focus outlines, and selection flashes */
          -webkit-tap-highlight-color: transparent !important;
          -webkit-user-select: none !important;
          user-select: none !important;
          outline: none !important;
        }

        /* Intro screen fading overlay system */
        .intro-overlay-screen {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #060608;
          z-index: 20;
          opacity: 0;
          pointer-events: none;
          transition: opacity 2.0s cubic-bezier(0.16, 1, 0.3, 1), transform 2.0s cubic-bezier(0.16, 1, 0.3, 1);
          transform: scale3d(0.98, 0.98, 1);
          box-sizing: border-box;
          padding: 2rem;
          text-align: center;
          will-change: opacity, transform;
        }

        .intro-overlay-screen.active {
          opacity: 1;
          pointer-events: auto;
          transform: scale3d(1, 1, 1);
        }

        .intro-overlay-screen.logo-screen {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: transparent; /* transparent to let the background glow remain visible */
          z-index: 150;
          transition: transform 2.0s cubic-bezier(0.16, 1, 0.3, 1), opacity 2.0s cubic-bezier(0.16, 1, 0.3, 1);
          opacity: 1;
          transform: translate3d(0, 0, 0);
          pointer-events: auto;
          will-change: transform, opacity;
        }

        .intro-overlay-screen.logo-screen.exit-up-peek {
          transform: translate3d(0, -520px, 0);
          opacity: 0.25; /* Faded but visible at the top, matching the mockup exactly */
          pointer-events: none;
        }

        .intro-overlay-screen.logo-screen.exit-up-hidden {
          transform: translate3d(0, -850px, 0);
          opacity: 0; /* Fully hidden in Screen 3+ */
          pointer-events: none;
        }

        /* Logo tag screen specific - Static Glow Base */
        .intro-logo-glow-static {
          position: absolute;
          width: 780px; /* 2 times screen width, allowing distinct circular edge */
          height: 780px;
          background-image: url('/RizzOnboarding/Assets/Glow Green.webp');
          background-size: cover;
          background-repeat: no-repeat;
          background-position: center center;
          mix-blend-mode: screen;
          z-index: 1;
          left: 50%; /* Centered to the screen horizontally to bulge symmetrically */
          top: 50%; /* Centered to the screen vertically */
          transform: translate3d(-50%, -50%, 0) scale(1);
          pointer-events: none;
          border-radius: 50%;
          opacity: 0;
          transition: transform 2.0s cubic-bezier(0.16, 1, 0.3, 1), 
                      opacity 2.0s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity;
        }

        .intro-logo-glow-static.at-logo {
          opacity: 1;
          transform: translate3d(-50%, -50%, 0) scale(1);
        }

        .intro-logo-glow-static.at-rizz {
          opacity: 0.85;
          transform: translate3d(-50%, -95%, 0) scale(0.95);
        }

        .intro-logo-glow-static.hidden {
          opacity: 0;
          transform: translate3d(-50%, -110%, 0) scale(0.8);
          transition: transform 2.0s cubic-bezier(0.16, 1, 0.3, 1), 
                      opacity 2.0s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .intro-logo-content {
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .intro-logo-img {
          height: 140px;
          margin-bottom: 0.5rem;
          z-index: 2;
        }

        /* High-fidelity Rizz Title and Subtitle */
        .intro-rizz-title {
          font-family: 'Lato', sans-serif;
          font-weight: 900;
          font-size: 2.65rem; /* Massive, almost fills the screen width */
          background: linear-gradient(90deg, #5B61F4 0%, #48CEC8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.6rem;
          letter-spacing: -0.02em;
          line-height: 1.15;
          text-align: center;
          white-space: nowrap; /* Spans fully across the screen on a single line */
        }

        .intro-rizz-sub {
          font-family: 'Lato', sans-serif;
          font-weight: 500;
          font-size: 1.3rem; /* Slightly larger and more premium weight */
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: -0.01em;
          margin: 0;
          text-align: center;
        }

        .intro-rizz-header-group {
          transition: opacity 2.0s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity;
          width: 100%;
          text-align: center;
          margin-bottom: 5.6rem; /* Static margin prevents layout recalculations during opacity transition */
        }

        .intro-rizz-header-group.at-bottom {
          opacity: 0;
        }

        .intro-rizz-header-group.centered {
          opacity: 1;
        }

        .intro-rizz-header-group.top-faded {
          opacity: 0.5;
        }

        /* Tinder Match Card Wrapper Styles */
        .tinder-match-card-wrapper {
          width: 100%;
          background: transparent;
          border: none;
          padding: 0.5rem 0;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: opacity 2.0s cubic-bezier(0.16, 1, 0.3, 1), transform 2.0s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }

        .tinder-match-card-wrapper.pushed-down {
          opacity: 0;
          transform: translate3d(0, 140px, 0); /* Beautiful sliding offset to add distance during entry */
          pointer-events: none;
        }

        .tinder-match-card-wrapper.in-view {
          opacity: 1;
          transform: translate3d(0, 0, 0);
          pointer-events: auto;
        }

        .avatar-glow-container {
          width: 190px;
          height: 190px;
          border-radius: 50%;
          position: relative;
          margin-top: 1rem;
          margin-bottom: 1.25rem;
          box-shadow: 0 0 35px rgba(255, 8, 68, 0.35), 0 0 70px rgba(255, 8, 68, 0.15);
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: none;
        }

        .profile-name {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.2rem;
          color: #ffffff;
        }

        .profile-bio {
          font-size: 13px;
          color: #ffffff;
          line-height: 1.45;
          margin: 18px 0;
          text-align: center;
          padding: 0 1rem;
        }

        .profile-prompt-capsule {
          background: #242426;
          border-radius: 100px;
          padding: 0.6rem 1rem;
          font-size: 12px;
          color: #e4e4e7;
          line-height: 1.45;
          text-align: center;
          font-style: italic;
          margin: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .chat-profile-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 2.5rem 1rem 1rem 1rem;
          box-sizing: border-box;
          width: 100%;
          transition: transform 2.0s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
        }

        .chat-profile-header.at-logo {
          transform: translate3d(0, 850px, 0);
        }

        .chat-profile-header.at-rizz {
          transform: translate3d(0, 330px, 0);
        }

        .chat-profile-header.at-persona,
        .chat-profile-header.at-chat {
          transform: translate3d(0, 0, 0);
        }

        .phone-screen.is-intro {
          cursor: pointer;
          /* Prevent native browser scroll/bounce from interfering with our transitions */
          touch-action: manipulation;
        }

        /* --- Chat Interface Layout --- */
        .chat-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          height: 100%;
          z-index: 10;
          background: transparent;
        }

        .chat-container.is-intro {
          pointer-events: none;
        }

        /* Hide introductory header group once chat starts */
        .intro-rizz-header-group.at-chat {
          display: none;
        }

        /* Chat Messages Stream */
        .chat-messages-stream {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          box-sizing: border-box;
          scrollbar-width: none;
          overflow-anchor: none !important; /* Prevent browser scroll-anchoring layout shifts during shifts */
        }

        .chat-messages-stream::-webkit-scrollbar {
          display: none;
        }

        /* Message Bubbles styling */
        .msg-row {
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
          max-width: 85%;
          animation: slideInMsg 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: opacity 0.7s ease, transform 0.7s ease, filter 0.7s ease;
          will-change: opacity, transform, filter;
        }

        /* Suppress entry animation during rewind so dissolve transition takes over */
        .chat-messages-stream.rewinding .msg-row {
          animation: none;
        }

        .msg-row.dissolving {
          opacity: 0;
          transform: translateY(-10px) scale(0.93);
          filter: blur(5px);
        }

        @keyframes slideInMsg {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .msg-row.sent {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .msg-row.received {
          align-self: flex-start;
        }

        .msg-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .msg-content-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .msg-bubble {
          padding: 0.75rem 1rem;
          border-radius: 20px;
          font-size: 0.95rem;
          line-height: 1.45;
          position: relative;
        }

        .msg-row.sent .msg-bubble {
          background: #27272a;
          color: #ffffff;
          border-bottom-right-radius: 4px;
        }

        .msg-row.received .msg-bubble {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.04);
          color: #f4f4f5;
          border-bottom-left-radius: 4px;
        }

        /* Score Pills */
        .score-pill {
          align-self: flex-end;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 100px;
          margin-top: 2px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }

        .score-pill.excellent {
          background: rgba(66, 239, 188, 0.15);
          color: var(--accent-cyan);
          border: 1px solid rgba(66, 239, 188, 0.3);
          box-shadow: 0 0 10px rgba(66, 239, 188, 0.15);
        }

        .score-pill.good {
          background: rgba(53, 121, 246, 0.15);
          color: var(--accent-blue);
          border: 1px solid rgba(53, 121, 246, 0.3);
        }

        .score-pill.poor {
          background: rgba(255, 8, 68, 0.15);
          color: var(--accent-red);
          border: 1px solid rgba(255, 8, 68, 0.3);
          box-shadow: 0 0 10px rgba(255, 8, 68, 0.1);
        }

        /* typing indicator bouncing dots */
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 0;
          background: transparent;
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          background: #a1a1aa;
          border-radius: 50%;
          animation: typingBounce 1.4s infinite ease-in-out both;
        }

        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes typingBounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        /* Attached Yellow/Gold bottom peeking glow */
        .bottom-peeking-glow {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 300%;
          height: 300%;
          background-image: url('/RizzOnboarding/Assets/Glow Yellow.webp');
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center center;
          mix-blend-mode: screen;
          z-index: 0;
          pointer-events: none;
          opacity: 0;
          transform: translate(-50%, 50%) scale(0.6);
          transition: opacity 2.2s cubic-bezier(0.45, 0, 0.55, 1), transform 2.2s cubic-bezier(0.45, 0, 0.55, 1);
        }

        .bottom-peeking-glow.active {
          opacity: 1;
          transform: translate(-50%, 50%) scale(1);
        }

        /* --- Text Input Bar --- */
        .chat-input-bar {
          padding: 1rem 1.25rem 1.5rem 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px 24px 0 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #18181b;
          z-index: 10;
          position: relative;
        }

        .real-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 1rem;
          outline: none;
          padding: 0.75rem 0.25rem;
          font-family: inherit;
          min-height: 1.5rem;
          max-height: 5rem;
          overflow-y: auto;
          white-space: pre-wrap;
          word-break: break-word;
          cursor: text;
          /* Show placeholder via data attribute */
        }

        .real-input:empty::before {
          content: attr(data-placeholder);
          color: rgba(255, 255, 255, 0.4);
          pointer-events: none;
        }

        .input-send-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #27272a;
          color: rgba(255, 255, 255, 0.45);
          flex-shrink: 0;
        }

        .input-send-btn.active {
          background: #ffffff;
          color: #09090b;
        }

        /* --- Vibe Killed Fail State Card --- */
        .fail-card {
          background: linear-gradient(180deg, rgba(255, 8, 68, 0.15) 0%, rgba(20, 20, 25, 0.9) 100%);
          border: 1px solid rgba(255, 8, 68, 0.4);
          border-radius: 24px;
          padding: 1.5rem;
          margin: 1rem;
          text-align: center;
          animation: slideUpFail 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 8, 68, 0.15);
        }

        @keyframes slideUpFail {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fail-score-badge {
          background: #ff0844;
          color: #ffffff;
          font-weight: 800;
          font-size: 1.15rem;
          padding: 4px 12px;
          border-radius: 100px;
          display: inline-block;
          margin-bottom: 0.75rem;
          box-shadow: 0 0 15px rgba(255, 8, 68, 0.4);
        }

        .fail-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #ff3b6c;
          margin-bottom: 0.5rem;
        }

        .fail-desc {
          font-size: 0.9rem;
          color: #d1d1d6;
          line-height: 1.4;
          margin-bottom: 1.25rem;
        }

        .fail-btn {
          width: 100%;
          background: #ffffff;
          color: #000000;
          border: none;
          font-weight: 800;
          font-size: 1.1rem;
          font-family: inherit;
          padding: 0.95rem;
          border-radius: 100px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
        }

        .fail-btn:hover {
          transform: scale(1.03);
          box-shadow: 0 5px 15px rgba(255, 255, 255, 0.2);
        }

        /* --- VCR Glitch Rewind Overlay --- */
        .vcr-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(9, 9, 12, 0.55);
          backdrop-filter: blur(3.5px);
          -webkit-backdrop-filter: blur(3.5px);
          z-index: 200;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem 2rem;
          box-sizing: border-box;
          pointer-events: auto; /* Block clicking while rewinding */
          animation: vcrFlash 0.15s infinite alternate;
        }

        .chat-messages-stream.rewinding {
          pointer-events: none !important;
          overflow: hidden !important;
        }

        /* Hide intro text during rewind so it doesn't show when scroll reaches the top */
        .chat-messages-stream.rewinding .intro-rizz-header-group {
          display: none;
        }

        .chat-messages-stream.is-intro {
          pointer-events: none !important;
          overflow: hidden !important;
        }

        /* Static noise overlay */
        .vcr-static {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E");
          opacity: 0.9;
          z-index: 201;
        }

        /* VHS Tracking Bar moving up/down */
        .vcr-tracking-bar {
          position: absolute;
          width: 100%;
          height: 15px;
          background: rgba(255, 255, 255, 0.15);
          filter: blur(4px);
          z-index: 202;
          animation: trackingShift 1.5s infinite linear;
        }

        @keyframes trackingShift {
          0% { top: -20px; }
          100% { top: 100%; }
        }

        @keyframes vcrFlash {
          0% { opacity: 0.75; filter: contrast(1.1) brightness(0.85); }
          100% { opacity: 0.9; filter: contrast(0.95) brightness(1.05); }
        }

        .vcr-label {
          font-family: 'Courier New', monospace;
          color: #00ff00;
          font-size: 1.8rem;
          font-weight: 700;
          text-shadow: 0 0 8px #00ff00;
          z-index: 203;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          white-space: nowrap;
        }

        .vcr-label.blink {
          animation: labelBlink 0.8s steps(2, start) infinite;
        }

        @keyframes labelBlink {
          to { visibility: hidden; }
        }

        .vcr-time {
          font-family: 'Courier New', monospace;
          color: #00ff00;
          font-size: 1.25rem;
          text-shadow: 0 0 8px #00ff00;
          align-self: flex-end;
          z-index: 203;
        }

        /* --- Simulated Custom Keyboard (Round 2) --- */
        /* --- Simulated Custom Keyboard (Round 2) --- */
        .custom-keyboard {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background: #060608;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          height: 275px;
          opacity: 0;
          transform: translateY(100%);
          padding: 1.25rem 0 1.75rem 0;
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          z-index: 15;
          pointer-events: none;
          transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .custom-keyboard.visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .chat-container.chloe-active .chat-messages-stream {
          /* 275px keyboard + ~34px floating controls + breathing room, so her latest
             messages never sit behind the Skip/Automate buttons */
          padding-bottom: 344px;
        }

        /* Round 1: leave room above the input bar for the floating Skip/Automate controls */
        .chat-container.jade-active .chat-messages-stream {
          padding-bottom: 72px;
        }

        .kbd-glow-lottie-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          transform: scale(1.5);
          transform-origin: center;
        }

        .kbd-glow-lottie-container.zoomed {
          transform: scale(2.0) translateY(-10px);
        }

        /* STATE A: Initial */
        .kbd-initial-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
          padding: 0.5rem 1.25rem;
          z-index: 2;
          box-sizing: border-box;
          gap: 1.25rem;
        }

        .custom-keyboard-logo {
          height: 49px; /* 1.3x larger (38px * 1.3 = 49.4px) */
          opacity: 1;
          z-index: 2;
        }

        .custom-kbd-btn {
          width: calc(100% - 2.5rem);
          max-width: 320px;
          background: #ffffff;
          border: none;
          padding: 0.9rem;
          border-radius: 100px;
          color: #2563eb;
          font-weight: 800;
          font-size: 1.05rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
          z-index: 2;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .custom-kbd-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
        }

        .custom-kbd-btn svg {
          color: #2563eb;
          fill: none;
        }

        /* STATE B: Loading / Generating */
        .checking-material-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
          z-index: 2;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }

        .analyzing-group-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          gap: 0; /* Reduced gap to keep logo and text close */
          transform: translateY(95px); /* Shifted further down to perfectly center within the keyboard */
        }

        .analyzing-logo-mark {
          height: 36px; /* Increased logo size from 24px */
          z-index: 2;
          flex-shrink: 0;
          margin-bottom: -12px; /* Negate top empty space of Lottie to bring logo closer to the text line */
        }

        .analyzing-lottie-container {
          width: 260px; /* Increased to 260px (approx 1.2x of 215px) for prominent text and glow */
          height: 260px;
          z-index: 1;
          flex-shrink: 0;
        }

        /* STATE C: Carousel / Reply */
        .kbd-carousel-content {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          width: 100%;
          padding: 0;
          z-index: 2;
          box-sizing: border-box;
        }

        .strategy-text-direct {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.9);
          text-align: center;
          line-height: 1.4;
          margin: 0;
          padding: 0 1.5rem;
          z-index: 2;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-weight: 500;
          min-height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Swipable Carousel Reply Cards */
        .carousel-track-container {
          width: 100%;
          overflow: hidden;
          position: relative;
          z-index: 2;
          cursor: grab;
          --slide-w: 310px;
        }

        .carousel-track-container:active {
          cursor: grabbing;
        }

        .carousel-track {
          display: flex;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          gap: 6px;
          padding: 16px calc((100% - var(--slide-w)) / 2);
        }

        .carousel-slide {
          flex: 0 0 var(--slide-w);
          width: var(--slide-w);
          min-width: var(--slide-w);
          max-width: var(--slide-w);
          box-sizing: border-box;
          transform: scale(0.92);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          opacity: 1.0;
        }

        .carousel-slide.active {
          transform: scale(1);
        }

        .carousel-card {
          width: calc(100% - 22px);
          min-width: calc(100% - 22px);
          max-width: calc(100% - 22px);
          margin-right: 22px; /* Leaves 22px of space for the hanging button */
          background: #ffffff;
          border: 4px solid #ffffff;
          border-radius: 24px;
          border-bottom-right-radius: 0;
          padding: 8px 24px 8px 12px; /* Reduced internal padding and font size for clean look */
          box-sizing: border-box;
          position: relative;
          min-height: 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .carousel-slide.active .carousel-card {
          background-image: linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #42efbc, #2563eb);
          background-origin: border-box;
          background-clip: padding-box, border-box;
          border-color: transparent;
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.2);
        }

        .carousel-card-text {
          font-size: 0.9rem;
          line-height: 1.45;
          color: #0c0c0e;
          font-weight: 500;
          margin: 0;
          text-align: left;
          width: 100%;
        }

        .send-btn-bubble {
          position: absolute;
          right: -22px; /* Hangs off exactly by half its size (22px) to align with slide's right edge */
          top: 0; /* Aligned flush with the top edge of the bubble */
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #42efbc);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
          cursor: pointer;
          border: none;
          z-index: 10;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 0; /* Resets browser default padding to guarantee absolute centering of SVG */
          box-sizing: border-box;
        }

        .send-btn-bubble:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.55);
        }

        .send-btn-bubble svg {
          display: block;
          overflow: visible !important;
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }

        .carousel-dots {
          display: flex;
          gap: 8px;
          z-index: 2;
          justify-content: center;
          width: 100%;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .dot.active {
          background: #ffffff;
          transform: scale(1.3);
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
        }

        /* --- Success Gold Box Fail State --- */
        .success-gold-box {
          background: linear-gradient(180deg, rgba(248, 181, 0, 0.15) 0%, rgba(20, 20, 25, 0.9) 100%);
          border: 1px solid rgba(248, 181, 0, 0.5);
          border-radius: 24px;
          padding: 1.5rem;
          margin: 1.25rem;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(248, 181, 0, 0.15);
          animation: slideUpSuccess 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideUpSuccess {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .success-score-badge {
          background: #f8b500;
          color: #000000;
          font-weight: 800;
          font-size: 1.15rem;
          padding: 4px 12px;
          border-radius: 100px;
          display: inline-block;
          margin-bottom: 0.75rem;
          box-shadow: 0 0 15px rgba(248, 181, 0, 0.4);
        }

        .success-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #f8b500;
          margin-bottom: 0.5rem;
        }

        .success-desc {
          font-size: 0.9rem;
          color: #e4e4e7;
          line-height: 1.45;
          margin-bottom: 1.25rem;
        }

        .success-cta {
          width: 100%;
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue));
          color: #000000;
          border: none;
          font-weight: 800;
          font-size: 1.1rem;
          font-family: inherit;
          padding: 0.95rem;
          border-radius: 100px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
          box-shadow: 0 0 15px rgba(66, 239, 188, 0.3);
        }

        .success-cta:hover {
          transform: scale(1.03);
          box-shadow: 0 0 20px rgba(66, 239, 188, 0.5);
        }

        /* General layout responsiveness on any phone screen (also larger) */
        @media (max-width: 768px) {
          .rizz-page-wrapper {
            padding: 0;
          }
          .phone-mockup {
            width: 100vw;
            height: 100vh;
            height: 100dvh;
            max-width: none;
            max-height: none;
            aspect-ratio: auto;
            border: none;
            border-radius: 0;
            box-shadow: none;
          }
          .phone-island {
            display: none;
          }
          /* On real mobile, apply safe-area top padding directly to the screen */
          .phone-screen {
            padding-top: env(safe-area-inset-top, 0px);
          }
          /* Adjust safe-area paddings for inputs/keyboards at the bottom of notched screens */
          .chat-input-bar {
            padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
          }
          .custom-keyboard {
            /* Extend height to include bottom safe area so there's no black gap below */
            height: calc(275px + env(safe-area-inset-bottom, 0px));
            padding-bottom: calc(1.75rem + env(safe-area-inset-bottom, 0px));
          }
          .chat-container.chloe-active .chat-messages-stream {
            padding-bottom: calc(290px + env(safe-area-inset-bottom, 0px));
          }
          /* Lift fail/success cards above the home indicator */
          .fail-card,
          .success-gold-box {
            margin-bottom: calc(1rem + env(safe-area-inset-bottom, 16px));
          }
        }

        /* New received layout with no bubble and score badge on right */
        .msg-row.received-no-bubble {
          display: flex;
          flex-direction: column;
          align-self: flex-start;
          width: 100%;
          max-width: 100%;
          gap: 8px;
          margin-bottom: 0.5rem;
          animation: slideInMsg 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .msg-received-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .msg-text-no-bubble {
          font-size: 0.95rem;
          line-height: 1.5;
          color: #ffffff;
          padding-left: 0;
          text-align: left;
          width: 100%;
        }

        /* Dynamic Score badges styling matching the mockup exactly */
        .header-score-container, .msg-score-container {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .rizz-label {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }

        .score-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #ffffff;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
        }

        .score-grey {
          background: #3f3f46;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .score-red {
          background: #ff0844;
          box-shadow: 0 0 10px rgba(255, 8, 68, 0.2);
        }

        .score-green {
          background: #42efbc;
          color: #060608;
          box-shadow: 0 0 10px rgba(66, 239, 188, 0.25);
        }

        /* Typewriter Cursor */
        .typing-cursor {
          animation: blink 0.8s step-end infinite;
          color: #48CEC8;
          font-weight: 300;
          margin-left: 2px;
        }

        @keyframes blink {
          50% { opacity: 0; }
        }

        /* Tinder Match Screen */
        .tinder-match-screen {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          padding: 2.25rem 1.5rem;
          z-index: 25;
          background: #060608;
          overflow: hidden;
        }

        .match-stars-glow {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at center, rgba(212, 163, 89, 0.15) 0%, rgba(6, 6, 8, 0) 70%);
          z-index: 1;
          pointer-events: none;
          animation: floatGlow 3s infinite alternate;
        }

        @keyframes floatGlow {
          0% { opacity: 0.7; transform: scale(0.95); }
          100% { opacity: 1.0; transform: scale(1.05); }
        }

        .match-title-overlay {
          font-family: 'Outfit', 'Inter', sans-serif;
          font-weight: 900;
          font-size: 2.3rem;
          background: linear-gradient(135deg, #FFE0A3 0%, #D4A359 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
          text-align: center;
          letter-spacing: -0.02em;
          z-index: 2;
          opacity: 0;
          transform: scale(0.85);
          transition: opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          filter: drop-shadow(0 0 10px rgba(212, 163, 89, 0.25));
        }

        .match-title-overlay.in {
          opacity: 1;
          transform: scale(1);
        }

        .match-avatar-wrapper {
          opacity: 0;
          transform: translate3d(0, 80px, 0) scale(0.9);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          margin-bottom: 1.5rem;
          z-index: 2;
          will-change: opacity, transform;
        }

        .match-avatar-wrapper.in {
          opacity: 1;
          transform: translate3d(0, 0, 0) scale(1);
        }

        .match-avatar-glow {
          box-shadow: 0 0 40px rgba(212, 163, 89, 0.45), 0 0 80px rgba(212, 163, 89, 0.25) !important;
          border: 3px solid rgba(255, 255, 255, 0.1);
        }

        .matched-sticker {
          position: absolute;
          top: 86%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-12deg) scale(0);
          background: linear-gradient(135deg, #FFE0A3 0%, #D4A359 100%);
          color: #060608;
          font-size: 1.05rem;
          font-weight: 900;
          padding: 6px 18px;
          border-radius: 100px;
          border: 2.5px solid #ffffff;
          box-shadow: 0 8px 20px rgba(212, 163, 89, 0.4), 0 0 15px rgba(212, 163, 89, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          z-index: 10;
          white-space: nowrap;
          animation: popInSticker 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          animation-delay: 0.6s;
          will-change: transform;
        }

        @keyframes popInSticker {
          to {
            transform: translate(-50%, -50%) rotate(-12deg) scale(1);
          }
        }

        .match-pill {
          opacity: 0;
          transform: translate3d(0, 15px, 0);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          background: rgba(66, 239, 188, 0.12);
          border: 1px solid rgba(66, 239, 188, 0.25);
          border-radius: 100px;
          padding: 6px 16px;
          font-size: 0.82rem;
          font-weight: 700;
          color: #42efbc;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 1.5rem;
          box-shadow: 0 0 15px rgba(66, 239, 188, 0.1);
          z-index: 2;
          will-change: opacity, transform;
        }

        .match-pill.in {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }

        .match-pill-icon {
          animation: matchPulse 1.2s infinite alternate;
        }

        @keyframes matchPulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.1); opacity: 1; }
        }

        .match-bio-box {
          opacity: 0;
          transform: translate3d(0, 15px, 0);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          width: 100%;
          text-align: center;
          margin-bottom: 1.5rem;
          z-index: 2;
          will-change: opacity, transform;
        }

        .match-bio-box.in {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }

        .match-bio-header {
          font-size: 0.72rem;
          font-weight: 800;
          color: #D4A359;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 0.4rem;
        }

        .match-bio-text {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.95);
          line-height: 1.45;
          margin: 0;
          padding: 0 1rem;
        }

        .match-prompt-capsule {
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translate3d(0, 15px, 0);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 12px 18px;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.4;
          text-align: left;
          /* Fixed to the same width as the choice buttons below, so the box never
             resizes or shifts while the text types out */
          width: 100%;
          max-width: 300px;
          box-sizing: border-box;
          z-index: 2;
          will-change: opacity, transform;
        }

        .match-prompt-capsule.in {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }

        .disabled-interaction {
          pointer-events: none !important;
        }
        
        .disabled-interaction input,
        .disabled-interaction textarea,
        .disabled-interaction .real-input,
        .disabled-interaction button,
        .disabled-interaction .custom-kbd-btn,
        .disabled-interaction .send-btn-bubble {
          pointer-events: none !important;
        }

        .autoplay-badge-overlay {
          position: absolute;
          top: 1rem;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 2rem);
          max-width: 400px;
          justify-content: space-between;
          background: rgba(20, 20, 25, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(66, 239, 188, 0.6);
          border-radius: 100px;
          padding: 10px 18px; /* increased padding for height */
          display: flex;
          align-items: center;
          z-index: 500;
          /* Border + glow cycle through the same colors as the ambient screen glow */
          animation: slideDownBadge 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards,
                     showcaseBorderGlow 4s ease-in-out infinite;
          pointer-events: auto; /* allow clicking the exit button inside it */
        }

        /* Matches the green→blue→violet cycle of .ai-glow-frame (aiGlowOutline) */
        @keyframes showcaseBorderGlow {
          0% {
            border-color: rgba(66, 239, 188, 0.7);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 16px rgba(66, 239, 188, 0.45);
          }
          33% {
            border-color: rgba(37, 99, 235, 0.75);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 16px rgba(37, 99, 235, 0.5);
          }
          66% {
            border-color: rgba(167, 139, 250, 0.8);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 16px rgba(167, 139, 250, 0.5);
          }
          100% {
            border-color: rgba(66, 239, 188, 0.7);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 16px rgba(66, 239, 188, 0.45);
          }
        }

        @keyframes slideDownBadge {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        .autoplay-badge-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .autoplay-pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #42efbc;
          box-shadow: 0 0 8px #42efbc;
          animation: pulseDot 1.5s infinite alternate;
          flex-shrink: 0;
        }

        @keyframes pulseDot {
          from { transform: scale(1); opacity: 0.7; }
          to { transform: scale(1.3); opacity: 1; }
        }

        .autoplay-text {
          font-size: 0.85rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: 0.02em;
          text-align: left;
          line-height: 1.2;
        }

        .autoplay-exit-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-left: 4px;
        }

        .autoplay-exit-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        /* Floating controls: Skip / Automate */
        .flow-controls-overlay {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 500;
          animation: floatUpControls 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          pointer-events: auto;
        }

        /* Round 1: float just above the text input bar */
        .flow-controls-overlay.round1 { bottom: 100px; }
        /* Round 2: float just above the AI keyboard (275px tall) */
        .flow-controls-overlay.round2 { bottom: 292px; }

        @keyframes floatUpControls {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        .flow-control-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(20, 20, 25, 0.85);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.85);
          padding: 7px 13px;
          border-radius: 100px;
          font-size: 0.78rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
        }

        .flow-control-btn:hover {
          background: rgba(40, 40, 48, 0.9);
          color: #ffffff;
          transform: translateY(-1px);
        }

        .flow-control-btn.automate {
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(66, 239, 188, 0.25));
          border: 1px solid rgba(66, 239, 188, 0.4);
          color: #42efbc;
        }

        .flow-control-btn.automate:hover {
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.4), rgba(66, 239, 188, 0.4));
          color: #ffffff;
          box-shadow: 0 4px 15px rgba(66, 239, 188, 0.25);
        }

        /* Shine sweep across the mission box when it appears */
        .match-prompt-capsule::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 60%;
          height: 100%;
          background: linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, 0.35) 50%, transparent 100%);
          transform: translateX(-180%) skewX(-18deg);
          pointer-events: none;
          z-index: 3;
        }

        .match-prompt-capsule.in::after {
          animation: missionShine 1.2s ease-out 0.15s 1;
        }

        /* Round 2: reuse the same box, switch to purple, re-pop + re-shine + type-out */
        .match-prompt-capsule.round2 {
          background: rgba(20, 16, 30, 0.92);
          border-color: rgba(167, 139, 250, 0.5);
          color: #c4b5fd;
          text-shadow: 0 0 12px rgba(167, 139, 250, 0.45);
          animation: missionPop 0.55s cubic-bezier(0.16, 1, 0.3, 1),
                     missionPulse 2s ease-in-out 0.7s infinite;
        }

        .match-prompt-capsule.round2 b {
          color: #ffffff;
        }

        .match-prompt-capsule.round2::after {
          animation: missionShine 1.2s ease-out 0.45s 1;
        }

        @keyframes missionPop {
          0% { transform: scale(0.85); opacity: 0; }
          55% { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes missionShine {
          0% { transform: translateX(-180%) skewX(-18deg); }
          100% { transform: translateX(320%) skewX(-18deg); }
        }

        /* Typed-out helper: transparent "ghost" text reserves the final size */
        .typed-wrap { white-space: inherit; }
        .mission-ghost { color: transparent; }

        /* Her name on the match screen (kept — replaces the old green pill) */
        .match-name {
          opacity: 0;
          transform: translate3d(0, 12px, 0);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          font-size: 1.5rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.01em;
          margin-bottom: 1.5rem;
          z-index: 2;
        }

        .match-name.in {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }

        @keyframes missionPulse {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 18px rgba(167, 139, 250, 0.35);
            border-color: rgba(167, 139, 250, 0.5);
          }
          50% {
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 30px rgba(167, 139, 250, 0.7);
            border-color: rgba(196, 181, 253, 0.85);
          }
        }

        .match-choice-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 300px;
          margin-top: 1.5rem;
          opacity: 0;
          animation: slideUpChoices 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.2s;
        }

        @keyframes slideUpChoices {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .match-choice-btn {
          width: 100%;
          padding: 14px 20px;
          border-radius: 100px;
          font-size: 1.05rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
        }

        .manual-btn {
          background: #ffffff;
          color: #000000;
          border: none;
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
        }

        .manual-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.3);
        }

        .autoplay-btn {
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(66, 239, 188, 0.2));
          color: #42efbc;
          border: 1px solid rgba(66, 239, 188, 0.4);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .autoplay-btn:hover {
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.3), rgba(66, 239, 188, 0.3));
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(66, 239, 188, 0.2);
        }

        /* AI-controlled ambient glow outline around the whole screen (Siri / Claude) */
        .ai-glow-frame {
          position: absolute;
          inset: 0;
          border-radius: 38px;
          pointer-events: none;
          z-index: 400;
          animation: aiGlowOutline 4s ease-in-out infinite;
        }

        @keyframes aiGlowOutline {
          0% {
            box-shadow: inset 0 0 22px 2px rgba(66, 239, 188, 0.55),
                        inset 0 0 60px 6px rgba(66, 239, 188, 0.12);
          }
          33% {
            box-shadow: inset 0 0 28px 3px rgba(37, 99, 235, 0.6),
                        inset 0 0 70px 8px rgba(37, 99, 235, 0.14);
          }
          66% {
            box-shadow: inset 0 0 28px 3px rgba(167, 139, 250, 0.6),
                        inset 0 0 70px 8px rgba(167, 139, 250, 0.14);
          }
          100% {
            box-shadow: inset 0 0 22px 2px rgba(66, 239, 188, 0.55),
                        inset 0 0 60px 6px rgba(66, 239, 188, 0.12);
          }
        }
      `}</style>

      {/* Ambient background decoration */}
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>

      {/* Back to Home landing Page Button removed */}

      {/* Phone Simulator Frame */}
      <div className="phone-mockup">
        <div className="phone-island"></div>

        <div 
          className={`phone-screen ${isIntroActive ? 'is-intro' : ''}`}
          onTouchStart={handleIntroTouchStart}
          onTouchEnd={handleIntroTouchEnd}
          onMouseDown={handleIntroMouseDown}
          onMouseUp={handleIntroMouseUp}
          onPointerDown={() => { isPausedRef.current = true; setIsPausedUI(true); }}
          onPointerUp={() => { isPausedRef.current = false; setIsPausedUI(false); }}
          onPointerCancel={() => { isPausedRef.current = false; setIsPausedUI(false); }}
        >
          {/* --- AI-controlled ambient glow outline (Siri/Claude style) --- */}
          {isAutoplay && <div className="ai-glow-frame"></div>}

          {/* --- Autoplay Showcase Mode Overlay --- */}
          {isPausedUI && (
            <div className="paused-indicator">
              Paused
            </div>
          )}
          {isAutoplay && (
            <div className="autoplay-badge-overlay" style={{flexDirection: 'column', padding: '10px 18px'}}>
              <div className="autoplay-badge-left" style={{ width: '100%', marginBottom: '10px' }}>
                <span className="autoplay-pulse-dot"></span>
                <span className="autoplay-text">Showcase Mode: <span style={{fontWeight: 'normal'}}>Watch AI get dates for you</span></span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${Math.min((chloeMessages.filter(m => m.type === 'Sent').length / 3) * 100, 100)}%` }}></div>
              </div>
            </div>
          )}

          {/* --- Floating flow controls removed for V2 --- */}

          {/* --- VCR Rewind Overlay --- */}
          {flowState === 'rewinding' && (
            <div className="vcr-overlay">
              <div className="vcr-static"></div>
              <div className="vcr-tracking-bar"></div>
              <div className="vcr-label blink">
                <RotateCcw size={22} className="animate-spin" /> REW ◀◀
              </div>
              <div className="vcr-time">
                00:02:{Math.floor(Math.random() * 50 + 10)}
              </div>
            </div>
          )}

          {/* --- STEP 0: Intro Logo Overlay Screen --- */}
          <div 
            className={`intro-overlay-screen logo-screen ${
              flowState === 'intro-logo' ? 'active' : 
              flowState === 'intro-rizz' ? 'exit-up-peek' : 'exit-up-hidden'
            }`}
          >
            <div className="intro-logo-content">
              <img src="/RizzOnboarding/Assets/Logo Tagline.svg" alt="Casanova Logo" className="intro-logo-img" />
            </div>
          </div>

          {/* Static Ambient Glow in the background (centered at logo stage, shifts up at rizz stage, fades out at chat stage) */}
          <div className={`intro-logo-glow-static ${
            flowState === 'intro-logo' ? 'at-logo' : 
            flowState === 'intro-rizz' ? 'at-rizz' : 'hidden'
          }`}></div>

          {/* Peeking bottom yellow/gold glow effect (Moved to background of phone-screen) */}
          <div className={`bottom-peeking-glow ${['chat-init', 'chat-jade'].includes(flowState) ? 'active' : ''}`}></div>

          {/* Radial match stars glow visible during match step */}
          {flowState === 'intro-match' && <div className="match-stars-glow"></div>}

          {/* --- STEPS 1-3: Chat streams (Jade Live API / Fallback OR Chloe Pre-written) --- */}
          <div className={`chat-container ${
            isIntroActive ? 'is-intro' : ''
          } ${
            flowState === 'chat-chloe' ? 'chloe-active' : ''
          } ${
            ['chat-init', 'chat-jade'].includes(flowState) ? 'jade-active' : ''
          } ${
            isAutoplay ? 'disabled-interaction' : ''
          }`}>
              {/* Message Stream — no onScroll needed since sticky header is removed */}
              <div 
                className={`chat-messages-stream ${flowState === 'rewinding' ? 'rewinding' : ''} ${isIntroActive ? 'is-intro' : ''}`} 
                ref={chatStreamRef} 
              >
                {/* Profile Header (visible at the top of the chat scroll stream) */}
                <div 
                  ref={profileHeaderRef}
                  className={`chat-profile-header ${
                  flowState === 'intro-logo' ? 'at-logo' :
                  flowState === 'intro-rizz' ? 'at-rizz' :
                  flowState === 'intro-match' ? 'at-persona' : 'at-chat'
                }`}>
                  
                  {/* Screen 2: Test your Rizz group */}
                  <div className={`intro-rizz-header-group ${
                    flowState === 'intro-logo' ? 'at-bottom' : 
                    flowState === 'intro-rizz' ? 'centered' : 'at-chat'
                  }`}>
                    <h2 className="intro-rizz-title">Test your Rizz</h2>
                    <p className="intro-rizz-sub">
                      {typedSubline}
                      {isTypingSubline && <span className="typing-cursor">|</span>}
                    </p>
                  </div>
                  
                  {/* Tinder-style Match Header & Card merged directly inside the chat flow */}
                  <div className={`tinder-match-card-wrapper ${['intro-logo', 'intro-rizz'].includes(flowState) ? 'pushed-down' : 'in-view'}`}>
                    
                    {/* Glowing Match Title */}
                    <div className={`match-title-overlay ${matchStep >= 1 || ['chat-init', 'chat-jade', 'rewinding', 'chat-chloe', 'success'].includes(flowState) ? 'in' : ''}`}>
                      It's a Match!
                    </div>

                    {/* Step 1: Avatar slides up with Matched! sticker */}
                    <div className={`match-avatar-wrapper ${matchStep >= 1 || ['chat-init', 'chat-jade', 'rewinding', 'chat-chloe', 'success'].includes(flowState) ? 'in' : ''}`}>
                      <div className="avatar-glow-container match-avatar-glow">
                        <img src="/RizzOnboarding/Assets/AvatarJade.png" alt="Jade Avatar" className="avatar-img" />
                        <div className="matched-sticker">Matched!</div>
                      </div>
                    </div>

                    {/* Her name + age (kept — no green pill, no bio) */}
                    <div className={`match-name ${matchStep >= 1 || ['chat-init', 'chat-jade', 'rewinding', 'chat-chloe', 'success'].includes(flowState) ? 'in' : ''}`}>
                      Jade, 24
                    </div>

                    {/* Step 4: Mission capsule — reused for Round 2 (purple, re-pops + types out) */}
                    {(() => {
                      const isR2 = ['chat-chloe', 'success'].includes(flowState);
                      return (
                        <div className={`match-prompt-capsule ${isR2 ? 'round2' : ''} ${matchStep >= 4 || ['chat-init', 'chat-jade', 'rewinding', 'chat-chloe', 'success'].includes(flowState) ? 'in' : ''}`}>
                          {isR2
                            ? renderTyped(chloeMissionText, typedMission.length, 'Your Mission:'.length)
                            : renderTyped(round1MissionText, typedRound1Mission.length, round1MissionBoldLen)}
                        </div>
                      );
                    })()}

                    {/* Step 5: Options for Manual vs Autoplay Showcase */}
                    {flowState === 'intro-match' && matchStep >= 4 && (
                      <div className="match-choice-buttons">
                        <button className="match-choice-btn autoplay-btn" style={{width: '100%'}} onClick={() => handleStartChat(true)}>
                          <Sparkles size={14} style={{ marginRight: '6px' }} />
                          Watch AI get dates for you
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* List Jade Messages */}
                {flowState === 'chat-jade' || flowState === 'chat-init' || flowState === 'rewinding' ? (
                  jadeMessages.map((m) => (
                    m.type === 'Sent' ? (
                      <div key={m.id} className={`msg-row sent${dissolvingIds.has(m.id) ? ' dissolving' : ''}`}>
                        <div className="msg-content-wrapper">
                          <div className="msg-bubble">{m.text}</div>
                        </div>
                      </div>
                    ) : (
                      <div key={m.id} className={`msg-row received-no-bubble${dissolvingIds.has(m.id) ? ' dissolving' : ''}`}>
                        <div className="msg-received-header">
                          <img src="/RizzOnboarding/Assets/AvatarJade.png" alt="Jade" className="msg-avatar" />
                          {m.score !== undefined && (
                            <div className="msg-score-container">
                              <span className="rizz-label">Rizz:</span>
                              <span 
                                className={`score-badge ${getScoreColorClass(m.score)}`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => trackEvent('Onboarding Score Clicked', { score: m.score, person: 'Jade' })}
                              >
                                {m.score >= 8.0 && '🔥 '}{m.score.toFixed(1)}/10
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="msg-text-no-bubble">{m.text}</div>
                      </div>
                    )
                  ))
                ) : (
                  /* List Chloe Messages */
                  chloeMessages.map((m) => (
                    m.type === 'Sent' ? (
                      <div key={m.id} className="msg-row sent">
                        <div className="msg-content-wrapper">
                          <div className="msg-bubble">{m.text}</div>
                        </div>
                      </div>
                    ) : (
                      <div key={m.id} className="msg-row received-no-bubble">
                        <div className="msg-received-header">
                          <img src="/RizzOnboarding/Assets/AvatarJade.png" alt="Jade" className="msg-avatar" />
                          {m.score !== undefined && (
                            <div className="msg-score-container">
                              <span className="rizz-label">Rizz:</span>
                              <span 
                                className={`score-badge ${getScoreColorClass(m.score)}`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => trackEvent('Onboarding Score Clicked', { score: m.score, person: 'Chloe' })}
                              >
                                {m.score >= 8.0 && '🔥 '}{m.score.toFixed(1)}/10
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="msg-text-no-bubble">{m.text}</div>
                      </div>
                    )
                  ))
                )}

                {/* Typing Indicator */}
                {isAwaitingAPI && (
                  <div className="msg-row received-no-bubble">
                    <div className="msg-received-header">
                      <img src="/RizzOnboarding/Assets/AvatarJade.png" alt="Avatar" className="msg-avatar" />
                    </div>
                    <div className="msg-text-no-bubble">
                      <div className="typing-indicator" style={{ display: 'inline-flex', width: 'fit-content' }}>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Anchor for scroll */}
                <div ref={chatEndRef} />
              </div>



              {/* Red Fail Card (Round 1 End) */}
              {flowState === 'chat-jade' && apiInteractionCount >= 3 && !isAwaitingAPI && (
                <div className="fail-card">
                  <div 
                    className="fail-score-badge"
                    style={{ cursor: 'pointer' }}
                    onClick={() => trackEvent('Onboarding Score Clicked', { score: currentScore, type: 'fail_card' })}
                  >
                    {currentScore.toFixed(1)} / 10
                  </div>
                  <h4 className="fail-title">Vibe Killed!</h4>
                  <p className="fail-desc">
                    Your manual replies didn't hit the mark. Jade got bored and matches are slipping away...
                  </p>
                  <button className="fail-btn" onClick={handleVcrRewind}>
                    <RotateCcw size={16} /> Try again with AI
                  </button>
                </div>
              )}

              {/* Golden Success Card (Round 2 End) */}
              {flowState === 'success' && (
                <div className="success-gold-box">
                  <div 
                    className="success-score-badge"
                    style={{ cursor: 'pointer' }}
                    onClick={() => trackEvent('Onboarding Score Clicked', { score: chloeScore, type: 'success_card' })}
                  >
                    {chloeScore >= 8.0 && '🔥 '}{chloeScore.toFixed(1)} / 10
                  </div>
                  <h4 className="success-title">Your AI Wingman</h4>
                  <p className="success-desc">
                    Outstanding match performance. AI-generated options bypassed obstacles and secured the date.
                  </p>
                  <button className="success-cta" onClick={handleSuccessCtaClick}>
                    <Sparkles size={16} /> Unlock your AI secret superpower
                  </button>
                </div>
              )}

              {/* --- INPUT BAR & KEYBOARDS --- */}
              
              {/* Input bar for Jade Live API */}
              {(flowState === 'chat-jade' || flowState === 'chat-init') && apiInteractionCount < 3 && (
                <div 
                  className="chat-input-bar" 
                  onClick={() => inputRef.current?.focus()} 
                  style={{ cursor: 'text' }}
                >
                  {/* contenteditable div instead of <input> to suppress Chrome's autofill toolbar */}
                  <div
                    ref={inputRef}
                    className="real-input"
                    contentEditable
                    suppressContentEditableWarning
                    autoComplete="off"
                    autoCorrect="on"
                    autoCapitalize="sentences"
                    spellCheck={true}
                    enterKeyHint="send"
                    data-placeholder="Your turn. Don't mess it up..."
                    onInput={(e) => {
                      const text = (e.currentTarget as HTMLDivElement).textContent || '';
                      setInputText(text);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent newline
                        if (inputText.trim()) handleSendJadeMessage();
                      }
                    }}
                    onPaste={(e) => {
                      // Paste as plain text only
                      e.preventDefault();
                      const text = e.clipboardData.getData('text/plain');
                      document.execCommand('insertText', false, text);
                    }}
                  />
                  <button 
                    className={`input-send-btn ${inputText.trim() ? 'active' : ''}`}
                    disabled={!inputText.trim()}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent blurring the editable div
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendJadeMessage();
                    }}
                  >
                    <Send size={20} />
                  </button>
                </div>
              )}

              {/* Simulated Custom Keyboard for Chloe pre-written (Round 2) */}
              <div className={`custom-keyboard ${isKeyboardVisible ? 'visible' : ''} ${isCustomKeyboardState === 'carousel' ? 'carousel-active' : ''}`}>
                  
                  {/* Lottie Color Glow in the Background of the Keyboard */}
                  <div className={`kbd-glow-lottie-container ${isCustomKeyboardState === 'carousel' ? 'zoomed' : ''}`}>
                    {colorGlowAnim && (
                      <LottieComp 
                        lottieRef={kbdGlowRef} 
                        animationData={colorGlowAnim} 
                        loop={true} 
                        autoplay={false}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>

                  {/* STATE A: Initial Custom keyboard state */}
                  {isCustomKeyboardState === 'initial' && (
                    <div className="kbd-initial-content">
                      <img 
                        src="/RizzOnboarding/Assets/LogoKeyboard.svg" 
                        alt="Casanova AI" 
                        className="custom-keyboard-logo" 
                      />
                      <button className="custom-kbd-btn" onClick={handleGenerateCustomReplies}>
                        <Sparkles size={18} /> Generate Reply
                      </button>
                    </div>
                  )}

                  {/* STATE B: Lottie animation state */}
                  {isCustomKeyboardState === 'generating' && (
                    <div className="checking-material-box">
                      <div className="analyzing-group-container">
                        <img 
                          src="/RizzOnboarding/Assets/LogoMark.svg" 
                          alt="Casanova AI" 
                          className="analyzing-logo-mark" 
                        />
                        <div className="analyzing-lottie-container">
                          {analyzingAnim ? (
                            <LottieComp animationData={analyzingAnim} loop={true} />
                          ) : (
                            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%' }}></div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STATE C: Strategic carousel state */}
                  {isCustomKeyboardState === 'carousel' && secondRoundData.nodes[currentNodeId]?.user_options && (
                    <div className="kbd-carousel-content">
                      {/* Strategy statement written directly on background */}
                      <p className="strategy-text-direct">
                        {secondRoundData.nodes[currentNodeId].keyboard_analysis}
                      </p>

                      {/* Swipable Carousel Replies */}
                      <div 
                        className="carousel-track-container"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                      >
                        <div 
                          className="carousel-track"
                          style={{
                            transform: `translateX(calc(-${carouselIndex} * (var(--slide-w) + 6px)))`
                          }}
                        >
                          {secondRoundData.nodes[currentNodeId].user_options!.map((option, idx) => (
                            <div 
                              key={idx} 
                              className={`carousel-slide ${idx === carouselIndex ? 'active' : ''}`}
                              onClick={() => setCarouselIndex(idx)}
                            >
                              <div className="carousel-card">
                                <p className="carousel-card-text">{option.text}</p>
                                {idx === carouselIndex && (
                                  <button 
                                    className="send-btn-bubble"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSendCarouselReply(option);
                                    }}
                                  >
                                    <svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor" style={{ overflow: 'visible' }}>
                                      <path d="M205.66,85.66a8,8,0,0,1-11.32,0L160,51.31V128A104.11,104.11,0,0,1,56,232a8,8,0,0,1,0-16,88.1,88.1,0,0,0,88-88V51.31L109.66,85.66A8,8,0,0,1,98.34,74.34l48-48a8,8,0,0,1,11.32,0l48,48A8,8,0,0,1,205.66,85.66Z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Carousel Pagination Dots */}
                      <div className="carousel-dots">
                        {[0, 1, 2].map((idx) => (
                          <div 
                            key={idx}
                            className={`dot ${idx === carouselIndex ? 'active' : ''}`}
                            onClick={() => setCarouselIndex(idx)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
          {/* Virtual Finger for Autoplay */}
          {fingerAction.active && (
            <div 
              className={`virtual-finger ${fingerAction.type}`} 
              style={{ left: fingerAction.x, top: fingerAction.y }}
            ></div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
