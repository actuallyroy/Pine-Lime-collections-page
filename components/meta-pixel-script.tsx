'use client';

import Script from "next/script";
import { useEffect } from "react";

interface MetaPixelScriptProps {
  fbPixelId: string;
  pageData?: {
    collectionTitle?: string;
    productIds?: string[];
    utmParams?: {};
  };
}

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export default function MetaPixelScript({ fbPixelId, pageData }: MetaPixelScriptProps) {
  // Initialize pixel when component mounts
  useEffect(() => {
    // Check if pixel is already initialized
    if (!window.fbq) {
      window.fbq = function() {
        // @ts-ignore
        window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments);
      };
      
      if (!window._fbq) window._fbq = window.fbq;
      window.fbq.push = window.fbq;
      window.fbq.loaded = true;
      window.fbq.version = '2.0';
      window.fbq.queue = [];
    }
    
    // Track page view
    window.fbq('init', fbPixelId);
    window.fbq('track', 'PageView');
    
    // Track ViewContent for collection
    if (pageData?.collectionTitle && pageData?.productIds) {
      window.fbq('track', 'ViewContent', {
        content_type: 'product_group',
        content_name: pageData.collectionTitle,
        content_category: 'Collection',
        content_ids: pageData.productIds,
      });
    }
    
    // Add listener for filter clicks
    const addFilterTracking = () => {
      const filterElements = document.querySelectorAll('[data-filter]');
      filterElements.forEach(element => {
        element.addEventListener('click', function(this: HTMLElement) {
          window.fbq('track', 'Search', {
            search_string: 'filter:' + this.getAttribute('data-filter')
          });
        });
      });
      
      // Track search form submissions
      const searchForm = document.querySelector('form[role="search"]');
      if (searchForm) {
        searchForm.addEventListener('submit', function(this: HTMLFormElement) {
          const searchInput = this.querySelector('input');
          if (searchInput) {
            window.fbq('track', 'Search', {
              search_string: searchInput.value
            });
          }
        });
      }
    };
    
    // Add event listeners after a short delay to ensure DOM is ready
    setTimeout(addFilterTracking, 1000);
    
    // Cleanup
    return () => {
      // Clean up event listeners if needed
    };
  }, [fbPixelId, pageData]);
  
  return (
    <>
      <Script
        src="https://connect.facebook.net/en_US/fbevents.js"
        strategy="afterInteractive"
      />
      <noscript>
        <img 
          height="1" 
          width="1" 
          style={{ display: 'none' }} 
          src={`https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1`}
          alt="Meta Pixel" 
        />
      </noscript>
    </>
  );
}
