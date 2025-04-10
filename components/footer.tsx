import Link from 'next/link'
import Image from 'next/image'

const Footer = () => {
  return (
    <footer className="bg-[#563635] text-white mt-16 py-12">
      <div className="container mx-auto px-4">
        {/* Branding Section */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="Pine & Lime"
            width={48}
            height={60}
            className="h-16 w-auto mb-4 invert"
          />
          <h2 className="text-2xl font-bold">Pine & Lime</h2>
          <p className="text-white/80 text-center max-w-xl mt-2">
            Bringing cherished memories to life through unique, personalized gifts that spread joy and deepen connections.
          </p>
        </div>

        {/* Main Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 border-t border-white/20 pt-8">
          {/* Contact & Locations */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {/* Location icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#b7384e]"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Contact Us
            </h3>
            <ul className="space-y-2 text-white/80">
              <li className="flex items-start gap-2">
                {/* Delhi location icon (reuse location icon) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-1 shrink-0"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>
                  Delhi:&nbsp;Street Number 1, Jaitpur, New Delhi, Delhi 110044 IN
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-1 shrink-0"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>
                  New York:&nbsp;228 Park Ave S, PMB 92217, New York, NY 10003-1502 US
                </span>
              </li>
              <li className="flex items-start gap-2">
                {/* Mail icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-1 shrink-0"
                >
                  <path d="M4 4h16v16H4z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <a
                  href="mailto:support@pinenlime.com"
                  className="hover:text-white transition-colors"
                >
                  support@pinenlime.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                {/* Instagram icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-1 shrink-0"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.5" y2="6.5"></line>
                </svg>
                <a
                  href="https://www.instagram.com/pineandlime/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-white transition-colors"
                >
                  Instagram
                </a>
              </li>
              <li className='flex items-start gap-2'>
                {/* TrustPilot icon */}
                <svg width="16" height="16" viewBox="0 0 272 258" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M271.3 98.6H167.7L135.7 0L103.6 98.6L0 98.5L83.9 159.5L51.8 258L135.7 197.1L219.5 258L187.5 159.5L271.3 98.6Z" fill="#00B67A"/>
                <path d="M194.699 181.8L187.499 159.5L135.699 197.1L194.699 181.8Z" fill="#005128"/>
                </svg>

                <a
                  href="https://www.trustpilot.com/review/pinenlime.com"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-white transition-colors"
                >
                  TrustPilot
                </a>
              </li>
            </ul>
          </div>

          {/* Policies Section */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {/* Document icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#b7384e]"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              Policies
            </h3>
            <ul className="space-y-2 text-white/80">
              <li>
                <Link href="/terms">
                  <div className="hover:underline hover:text-white">Terms &amp; Conditions</div>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy">
                  <div className="hover:underline hover:text-white">Privacy Policy</div>
                </Link>
              </li>
              <li>
                <Link href="/return-refund-policy">
                  <div className="hover:underline hover:text-white">Return &amp; Refund Policy</div>
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy">
                  <div className="hover:underline hover:text-white">Shipping Policy</div>
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Section */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {/* Navigation icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#b7384e]"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              Navigation
            </h3>
            <ul className="space-y-2 text-white/80">
              <li>
                <Link href="/collections/hampers">
                  <div className="hover:underline hover:text-white">Hampers</div>
                </Link>
              </li>
              <li>
                <Link href="/collections/art-forms">
                  <div className="hover:underline hover:text-white">Art Forms</div>
                </Link>
              </li>
              <li>
                <Link href="/collections/anniversary-gifts">
                  <div className="hover:underline hover:text-white">Anniversary Gifts</div>
                </Link>
              </li>
              <li>
                <Link href="/collections/christmas-gifts">
                  <div className="hover:underline hover:text-white">Christmas Gifts</div>
                </Link>
              </li>
              <li>
                <Link href="/collections/gifts">
                  <div className="hover:underline hover:text-white">All Gifts</div>
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Highlights Section */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {/* Star icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#b7384e]"
              >
                <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"></polygon>
              </svg>
              Customer Highlights
            </h3>
            <div className="space-y-2 text-white/80">
              <p>Over 70,000 memories shared worldwide</p>
              <p>Average rating of 4.7 to 4.9 out of 5</p>
              <p>Recognized for speed, quality, and satisfaction</p>
              <p>Worldwide shipping within 7 days</p>
            </div>
          </div>
        </div>

        {/* Bottom Section: Social Links and Payment Icons */}
        <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60">
          <div className="flex justify-center gap-6 mb-4">
            <a
              href="https://www.facebook.com/PineNLime/"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-white transition-colors"
            >
              {/* Facebook icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            <a
              href="https://www.instagram.com/pineandlime/"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-white transition-colors"
            >
              {/* Instagram icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.5" y2="6.5"></line>
              </svg>
            </a>
          </div>
          <p>© {new Date().getFullYear()} Pine &amp; Lime. All rights reserved.</p>
          <div className="mt-4">
            {/* Replace '/payment-icons.png' with your actual payment modes image */}
            <Image
              src="/payment-icons.png"
              alt="Multiple payment modes supported"
              width={300}
              height={15}
              className="mx-auto"
            />
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
