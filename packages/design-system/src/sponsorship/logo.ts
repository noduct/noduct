/** Keep the text card usable when its optional logo cannot load. */
export function bindSponsorLogoFallback(image: HTMLImageElement): () => void {
  const hide = () => {
    image.hidden = true;
  };
  image.addEventListener('error', hide);
  if (image.complete && image.naturalWidth === 0) hide();
  return () => image.removeEventListener('error', hide);
}
