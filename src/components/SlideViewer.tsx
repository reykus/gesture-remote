type Props = {
  slides: string[];
  index: number;
  blackout: boolean;
};

export function SlideViewer({ slides, index, blackout }: Props) {
  const src = slides[index];

  return (
    <div className="slide-viewer">
      {!blackout && src && <img key={index} src={src} alt={`Slide ${index + 1}`} className="slide-image" />}
      {!blackout && !src && <p className="slide-empty">No slides loaded yet.</p>}
    </div>
  );
}
