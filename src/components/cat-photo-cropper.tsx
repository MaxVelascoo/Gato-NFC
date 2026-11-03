"use client";

import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import type { PhotoCrop } from "@/lib/photo-crop";

type Props = {
  currentPhotoUrl: string | null;
  previewUrl: string | null;
  selectedFileName: string | null;
  crop: PhotoCrop;
  onSelectPhoto: (file: File | null) => void;
  onCropChange: (crop: PhotoCrop) => void;
};

type NaturalSize = { width: number; height: number };
type DragStart = { pointerId: number; x: number; y: number; clientX: number; clientY: number };

export default function CatPhotoCropper({ currentPhotoUrl, previewUrl, selectedFileName, crop, onSelectPhoto, onCropChange }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragStart | null>(null);
  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(null);
  const [frameSize, setFrameSize] = useState({ width: 320, height: 180 });
  const [dragging, setDragging] = useState(false);
  const previewSource = previewUrl || currentPhotoUrl;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      setFrameSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    onSelectPhoto(event.currentTarget.files?.[0] ?? null);
    event.currentTarget.value = "";
  };

  const publishCrop = (next: PhotoCrop) => {
    const frame = frameRef.current;
    const aspectRatio = frame && frame.clientHeight > 0 ? frame.clientWidth / frame.clientHeight : next.aspectRatio;
    onCropChange({ ...next, aspectRatio });
  };

  const getClampedCrop = (zoom: number, x: number, y: number) => {
    const frame = frameRef.current;
    if (!frame || !naturalSize) return { ...crop, zoom, x, y };
    const width = frame.clientWidth;
    const height = frame.clientHeight;
    const fitScale = Math.max(width / naturalSize.width, height / naturalSize.height);
    const renderedWidth = naturalSize.width * fitScale * zoom;
    const renderedHeight = naturalSize.height * fitScale * zoom;
    const maxX = Math.max(0, (renderedWidth - width) / (2 * width));
    const maxY = Math.max(0, (renderedHeight - height) / (2 * height));
    return {
      zoom,
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
      aspectRatio: width / height,
    };
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!previewUrl || !naturalSize) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: crop.x, y: crop.y, clientX: event.clientX, clientY: event.clientY };
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const frame = frameRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !frame) return;
    const next = getClampedCrop(
      crop.zoom,
      drag.x + (event.clientX - drag.clientX) / frame.clientWidth,
      drag.y + (event.clientY - drag.clientY) / frame.clientHeight,
    );
    publishCrop(next);
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  };

  const renderedSize = (() => {
    if (!previewUrl || !naturalSize) return null;
    const scale = Math.max(frameSize.width / naturalSize.width, frameSize.height / naturalSize.height) * crop.zoom;
    return { width: naturalSize.width * scale, height: naturalSize.height * scale };
  })();

  return <section className="photo-editor" aria-label="Foto del gato">
    <div className="photo-file-picker">
      <span>Foto del gato</span>
      <div className="photo-file-selection">
        <label className="photo-upload-button">{previewUrl || currentPhotoUrl ? "Cambiar foto" : "Elegir foto"}<input aria-label="Seleccionar foto del gato" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={selectFile} /></label>
        <span className="photo-file-name">{selectedFileName || (currentPhotoUrl ? "Se conservará la foto actual" : "Sin foto seleccionada")}</span>
      </div>
    </div>
    <div className={`photo-crop-frame ${previewUrl ? "is-editable" : ""} ${dragging ? "is-dragging" : ""}`} ref={frameRef}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}>
      {previewSource ? <img
        className={`photo-crop-image ${previewUrl ? "photo-crop-image-adjustable" : ""}`}
        src={previewSource}
        alt={previewUrl ? "Previsualización del recorte de la foto" : "Foto actual del gato"}
        draggable={false}
        onLoad={(event) => {
          const image = event.currentTarget;
          setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
          if (previewUrl) publishCrop(crop);
        }}
        style={previewUrl && renderedSize ? {
          width: renderedSize.width,
          height: renderedSize.height,
          left: `calc(50% + ${crop.x * frameSize.width}px)`,
          top: `calc(50% + ${crop.y * frameSize.height}px)`,
        } : undefined}
      /> : <div className="photo-crop-placeholder">La foto aparecerá aquí antes de guardarla.</div>}
      {previewUrl && <span className="photo-crop-hint">Arrastra la foto para moverla</span>}
    </div>
    {previewUrl ? <>
      <label className="photo-zoom-control"><span>Zoom <strong>{Math.round(crop.zoom * 100)}%</strong></span><input aria-label="Zoom de la foto" type="range" min="1" max="3" step="0.01" value={crop.zoom} onChange={(event) => publishCrop(getClampedCrop(Number(event.currentTarget.value), crop.x, crop.y))} /></label>
      <div className="photo-crop-actions"><button type="button" className="photo-reset-button" onClick={() => publishCrop({ zoom: 1, x: 0, y: 0, aspectRatio: crop.aspectRatio })}>Restablecer encuadre</button><button type="button" className="photo-remove-button" onClick={() => { setNaturalSize(null); onSelectPhoto(null); }}>Quitar selección</button></div>
    </> : <small className="photo-current-note">{currentPhotoUrl ? "Selecciona otra foto para previsualizar y ajustar el recorte." : "Admite JPG, PNG, WebP y AVIF."}</small>}
  </section>;
}
