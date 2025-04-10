import Image from "next/image"
import Link from "next/link"

export default function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 mt-3">
      <div className="flex items-center gap-2">
        <Link 
          href="https://www.trustpilot.com/review/pinenlime.com"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
        >
          <span className="text-sm">
            <strong>Excellent</strong> 4.7 out of 5
          </span>
          <Image 
            src="https://static.wixstatic.com/media/9fba21_5085bc8ac2274d06938a71fdd756daaf~mv2.png/v1/fill/w_97,h_23,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/9fba21_5085bc8ac2274d06938a71fdd756daaf~mv2.png"
            alt="TrustPilot"
            width={97}
            height={23}
          />
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link 
          href="https://customerreviews.google.com/v/merchant?q=pinenlime.com&c=IN&v=19"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
        >
          <Image 
            src="https://static.wixstatic.com/media/9fba21_717e5aad3406404d995f11fb33870f1e~mv2.png/v1/fill/w_23,h_23,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/google_g_icon_download%5B1%5D.png"
            alt="Google"
            width={23}
            height={23}
          />
          <span className="text-sm">
            <strong>Top Quality Store</strong> 4.9 out of 5
          </span>
        </Link>
      </div>
    </div>
  )
}
