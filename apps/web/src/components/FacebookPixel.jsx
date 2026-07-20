
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const PIXEL_ID = '883950822339089';

export const useFacebookPixel = () => {
  const trackEvent = (eventName, data = {}) => {
    if (window.fbq) {
      window.fbq('track', eventName, data);
    } else {
      console.warn('Facebook Pixel not initialized yet.');
    }
  };

  const trackCustom = (eventName, data = {}) => {
    if (window.fbq) {
      window.fbq('trackCustom', eventName, data);
    } else {
      console.warn('Facebook Pixel not initialized yet.');
    }
  };

  return { trackEvent, trackCustom };
};

const FacebookPixel = () => {
  const location = useLocation();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.fbq) {
      /* eslint-disable */
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
      
      window.fbq('init', PIXEL_ID);
    }
    
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (initialized && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname, location.search, initialized]);

  return null;
};

export default FacebookPixel;
