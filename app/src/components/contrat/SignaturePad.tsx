'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './SignaturePad.module.css';

interface Props {
  label: string;
  /** Renvoie le PNG en data URL, ou null si la zone est vidée. */
  onChange: (dataUrl: string | null) => void;
}

/**
 * Zone de signature manuscrite.
 *
 * Les évènements « pointer » couvrent doigt, stylet et souris d'un seul jeu de
 * gestionnaires — inutile de doubler avec les évènements tactiles.
 */
export default function SignaturePad({ label, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dessine = useRef(false);
  const aTrace = useRef(false);
  const [remplie, setRemplie] = useState(false);

  // Le canvas doit être dimensionné en pixels réels : sans cela le tracé est
  // flou sur les écrans à forte densité, et décalé par rapport au doigt.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ajuster = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#111827';
    };

    ajuster();
    window.addEventListener('resize', ajuster);
    return () => window.removeEventListener('resize', ajuster);
  }, []);

  const positionner = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const commencer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    // Capture du pointeur : le tracé continue même si le doigt sort du cadre.
    e.currentTarget.setPointerCapture(e.pointerId);
    dessine.current = true;
    const { x, y } = positionner(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const tracer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dessine.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = positionner(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    aTrace.current = true;
  };

  const terminer = () => {
    if (!dessine.current) return;
    dessine.current = false;
    if (!aTrace.current) return;
    setRemplie(true);
    onChange(canvasRef.current?.toDataURL('image/png') ?? null);
  };

  const effacer = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    aTrace.current = false;
    setRemplie(false);
    onChange(null);
  };

  return (
    <div className={styles.bloc}>
      <div className={styles.entete}>
        <span className={styles.label}>
          {label} {remplie && <span className={styles.ok}>✓ signé</span>}
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={effacer}>
          Effacer
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onPointerDown={commencer}
        onPointerMove={tracer}
        onPointerUp={terminer}
        onPointerCancel={terminer}
      />
      <p className={styles.aide}>Signez avec le doigt dans le cadre ci-dessus.</p>
    </div>
  );
}
