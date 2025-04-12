export function processImageUrl(imageUrl: string, isMobile: boolean = false): string {
  if (!imageUrl) return "";

  // Handle Wix image URLs
  if (imageUrl.startsWith("wix:image://")) {
    let mediaId, filename;
    try {
      const withoutPrefix = imageUrl.replace("wix:image://", "");
      const parts = withoutPrefix.split("/");
      mediaId = parts.find(part => part.includes("~mv2")) || parts[0];
      filename = parts[parts.length - 1].split("#")[0];
    } catch (e) {
      console.error("Error parsing Wix image URL:", e);
      return imageUrl;
    }
    const width = isMobile ? 900 : 500;
    const height = isMobile ? 900 : 500;
    return `https://static.wixstatic.com/media/${mediaId}/v1/fill/w_${width},h_${height},al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/${encodeURIComponent(filename)}`;
  }

  // Handle URLs with width parameters
  if (imageUrl.includes("?width")) {
    try {
      const url = new URL(imageUrl);
      return isMobile 
        ? `${url.origin}${url.pathname}?width=900&format=webp`
        : `${url.origin}${url.pathname}?width=500&format=webp`;
    } catch (e) {
      return imageUrl;
    }
  }

  // Return the original URL if no processing is needed
  return imageUrl;
}