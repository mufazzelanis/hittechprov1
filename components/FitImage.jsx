// Shows the WHOLE image whatever its shape (wide banner, square post, tall pin), never cropped, on a
// blurred, zoomed copy of itself so the frame always looks full instead of showing empty bars.
export default function FitImage({ src, alt = "", className = "", imgClassName = "", eager = false }) {
  return (
    <div className={`relative overflow-hidden bg-panel2 ${className}`}>
      <img src={src} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-70 saturate-150" />
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} className={`relative w-full h-full object-contain ${imgClassName}`} />
    </div>
  );
}
