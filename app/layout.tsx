import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Analytics } from "@vercel/analytics/react"
import Script from "next/script"

export const metadata: Metadata = {
  title: "Pine & Lime | Personalized Gifts",
  description: "Discover unique, personalized gifts that help relive happy memories with friends and family. High-quality customized photo gifts with worldwide shipping.",
  generator: 'Next.js',
  keywords: ["personalized gifts", "custom gifts", "photo gifts", "memory gifts", "gift ideas", "unique gifts"],
  authors: [{ name: "Pine & Lime" }],
  creator: "Pine & Lime",
  publisher: "Pine & Lime",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.pinenlime.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Pine & Lime | Personalized Gifts",
    description: "Discover unique, personalized gifts that help relive happy memories with friends and family.",
    url: "https://www.pinenlime.com",
    siteName: "Pine & Lime",
    images: [
      {
        url: "https://www.pinenlime.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Pine & Lime Personalized Gifts",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pine & Lime | Personalized Gifts",
    description: "Discover unique, personalized gifts that help relive happy memories with friends and family.",
    images: ["https://www.pinenlime.com/og-image.jpg"],
    creator: "@pineandlime",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' }
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#b7384e'
      }
    ]
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Organization schema for the whole site
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.pinenlime.com/#organization",
    "name": "Pine & Lime",
    "url": "https://www.pinenlime.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.pinenlime.com/logo.png",
      "width": 180,
      "height": 60
    },
    "image": "https://www.pinenlime.com/logo.png",
    "sameAs": [
      "https://www.facebook.com/pineandlime",
      "https://www.instagram.com/pineandlime",
      "https://twitter.com/pineandlime"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-1234567890",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": "English"
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN",
      "addressLocality": "New Delhi",
      "postalCode": "110001"
    }
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="font-outfit">
        {children}
        <Analytics />
      </body>
    </html>
  )
}