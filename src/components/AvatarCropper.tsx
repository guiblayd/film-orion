import React, { useEffect, useRef, useState } from 'react';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  file: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

const CROP_RADIUS = 140;

function clampOffset(
  x: number, y: number, s: number,
  img: HTMLImageElement, container: HTMLDivElement
): { x: number; y: number } {
  const cw = container.clientWidth;
  const ch = container.clientHeight;
  const halfW = (img.naturalWidth * s) / 2;
  const halfH = (img.naturalHeight * s) / 2;

  let cx = x;
  let cy = y;

  // Image edges must cover the crop circle
  if (cw / 2 + cx - halfW > cw / 2 - CROP_RADIUS) cx -= (cw / 2 + cx - halfW) - (cw / 2 - CROP_RADIUS);
  if (cw / 2 + cx + halfW < cw / 2 + CROP_RADIUS) cx += (cw / 2 + CROP_RADIUS) - (cw / 2 + cx + halfW);
  if (ch / 2 + cy - halfH > ch / 2 - CROP_RADIUS) cy -= (ch / 2 + cy - halfH) - (ch / 2 - CROP_RADIUS);
  if (ch / 2 + cy + halfH < ch / 2 + CROP_RADIUS) cy += (ch / 2 + CROP_RADIUS) - (ch / 2 + cy + halfH);

  return { x: cx, y: cy };
}

export function AvatarCropper({ file, onConfirm, onCancel }: Props) {
  const [imgSrc, setImgSrc] = useState('');
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef(0);
  const scaleRef = useRef(scale);
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleImgLoad = () => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;
    const cropD = CROP_RADIUS * 2;
    const min = Math.max(cropD / img.naturalWidth, cropD / img.naturalHeight);
    setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    setMinScale(min);
    setScale(min);
    setOffset({ x: 0, y: 0 });
  };

  const doClamp = (x: number, y: number, s: number) => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return { x, y };
    return clampOffset(x, y, s, img, container);
  };

  // Mouse
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset(prev => doClamp(prev.x + dx, prev.y + dy, scaleRef.current));
  };
  const onMouseUp = () => { isDragging.current = false; };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(prev => {
      const next = Math.max(minScale, Math.min(prev * (1 - e.deltaY * 0.001), minScale * 4));
      setOffset(o => doClamp(o.x, o.y, next));
      return next;
    });
  };

  // Touch
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastPos.current.x;
      const dy = e.touches[0].clientY - lastPos.current.y;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setOffset(prev => doClamp(prev.x + dx, prev.y + dy, scaleRef.current));
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / (lastPinchDist.current || dist);
      lastPinchDist.current = dist;
      setScale(prev => {
        const next = Math.max(minScale, Math.min(prev * ratio, minScale * 4));
        setOffset(o => doClamp(o.x, o.y, next));
        return next;
      });
    }
  };
  const onTouchEnd = () => { isDragging.current = false; };

  const handleConfirm = () => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const OUTPUT = 512;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d')!;

    const cw = container.clientWidth;
    const ch = container.clientHeight;

    // Source crop region in natural image coordinates
    const srcX = (-CROP_RADIUS - offset.x) / scale + img.naturalWidth / 2;
    const srcY = (-CROP_RADIUS - offset.y) / scale + img.naturalHeight / 2;
    const srcSize = (CROP_RADIUS * 2) / scale;

    // Clip to circle
    ctx.beginPath();
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);

    canvas.toBlob(blob => { if (blob) onConfirm(blob); }, 'image/jpeg', 0.92);
  };

  const sliderValue = minScale > 0 ? ((scale - minScale) / (minScale * 3)) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col select-none" style={{ touchAction: 'none' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button
          onClick={onCancel}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white"
        >
          <X size={18} />
        </button>
        <span className="text-white text-sm font-semibold">Ajustar foto</span>
        <button
          onClick={handleConfirm}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-black"
        >
          <Check size={18} />
        </button>
      </div>

      {/* Image area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {imgSrc && (
          <img
            ref={imgRef}
            src={imgSrc}
            alt=""
            draggable={false}
            onLoad={handleImgLoad}
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              width: imgSize?.w ?? 0,
              height: imgSize?.h ?? 0,
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
              transformOrigin: 'center center',
              opacity: imgSize ? 1 : 0,
            }}
          />
        )}

        {/* Dark overlay with circular hole */}
        <div className="absolute inset-0 pointer-events-none">
          <svg width="100%" height="100%" style={{ display: 'block' }}>
            <defs>
              <mask id="avatarCropMask">
                <rect width="100%" height="100%" fill="white" />
                <circle cx="50%" cy="50%" r={CROP_RADIUS} fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#avatarCropMask)" />
            <circle
              cx="50%" cy="50%" r={CROP_RADIUS}
              fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>

      {/* Zoom slider */}
      <div className="px-6 py-5 flex items-center gap-3 shrink-0">
        <ZoomOut size={16} className="text-zinc-400 shrink-0" />
        <input
          type="range"
          min={0}
          max={100}
          value={sliderValue}
          onChange={e => {
            const pct = Number(e.target.value) / 100;
            const next = minScale + pct * minScale * 3;
            setScale(next);
            setOffset(o => doClamp(o.x, o.y, next));
          }}
          className="flex-1 accent-white h-1"
        />
        <ZoomIn size={16} className="text-zinc-400 shrink-0" />
      </div>
    </div>
  );
}
