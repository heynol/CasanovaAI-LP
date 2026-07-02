import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || '';

export const initMixpanel = () => {
  if (MIXPANEL_TOKEN) {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: import.meta.env.DEV,
      track_pageview: true,
      persistence: 'localstorage',
      api_host: 'https://api-eu.mixpanel.com',
    });
  } else {
    console.warn('Mixpanel Token (VITE_MIXPANEL_TOKEN) is missing. Tracking events will be logged to the console instead.');
  }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track(eventName, properties);
  } else {
    console.log(`[Mixpanel Track] ${eventName}`, properties);
  }
};
