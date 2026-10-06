import React, { useRef, useEffect } from 'react';

export default function CameraViewport({ camera, hideGuides }) {
  const canvasRef = useRef(null);
  
  // Draw the tracking data onto our futuristic canvas
  useEffect(() => {
    if (!camera?.poseData || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const { poseData } = camera;
    
    // Auto-resize canvas to match video intrinsic size exactly
    if (camera.videoElement) {
      canvasRef.current.width = camera.videoElement.videoWidth;
      canvasRef.current.height = camera.videoElement.videoHeight;
    } else {
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;
    }
    
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const { width, height } = canvasRef.current;
    
    // Draw grid
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.lineWidth = 1;
    for(let i=0; i<width; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for(let i=0; i<height; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    if (!poseData.landmarks) return;
    
    // Helper to draw realistic AI joints
    const drawPoint = (lx, ly, conf, isKey=false) => {
      const x = lx * width;
      const y = ly * height;
      ctx.beginPath();
      ctx.arc(x, y, isKey ? 6 : 3, 0, 2 * Math.PI);
      ctx.fillStyle = isKey ? '#0EA5E9' : (conf > 0.6 ? '#D1FAE5' : '#ef4444');
      ctx.fill();
      if (isKey) {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    // Draw connection lines
    const drawLine = (p1, p2, color = 'rgba(16, 185, 129, 0.6)') => {
      if(p1.visibility < 0.2 || p2.visibility < 0.2) return;
      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    const l = poseData.landmarks;
    
    // Key skeletal connections
    const connections = [
      [11,13], [13,15], [12,14], [14,16], [11,12], [23,24], [11,23], [12,24],
      [23,25], [25,27], [27,31], [24,26], [26,28], [28,32]
    ];
    
    connections.forEach(([s, e]) => drawLine(l[s], l[e]));
    
    // Highlight tracked knee (sagittal view usually prefers one side)
    drawLine(l[23], l[25], 'rgba(14, 165, 233, 0.8)');
    drawLine(l[25], l[27], 'rgba(14, 165, 233, 0.8)');
    
    // Draw all points
    l.forEach((lm, i) => drawPoint(lm.x, lm.y, lm.visibility, [23, 25, 27].includes(i)));
    
    // Draw AI readouts near the knee
    const knee = l[25];
    if (knee.visibility > 0.4 && poseData.activeAngle !== null) {
      const x = knee.x * width;
      const y = knee.y * height;
      
      // Arc
      ctx.beginPath();
      ctx.arc(knee.x * width, knee.y * height, 40, -Math.PI/2, poseData.activeAngle * Math.PI / 180 - Math.PI/2);
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
      ctx.lineWidth = 15;
      ctx.stroke();

      // Text box
      ctx.fillStyle = 'rgba(2, 44, 34, 0.8)';
      ctx.fillRect(x + 20, y - 20, 100, 45);
      ctx.strokeStyle = '#0EA5E9';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 20, y - 20, 100, 45);
      
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#D1FAE5';
      ctx.fillText('FLEXION', x + 30, y);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Inter", sans-serif';
      ctx.fillText(`${poseData.activeAngle.toFixed(1)}°`, x + 30, y + 16);
    }
  }, [camera?.poseData]);

  if (!camera) return null;

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black/90">
      <video
        ref={camera.webcamVideoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain opacity-70"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
      />
      
      {/* Sci-fi targeting reticles */}
      <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-[#0EA5E9] opacity-70 pointer-events-none" />
      <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-[#10B981] opacity-70 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-[#10B981] opacity-70 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-[#0EA5E9] opacity-70 pointer-events-none" />
      
      {!hideGuides && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 border border-emerald-500/30 backdrop-blur-md px-6 py-2 rounded-full text-emerald-300 font-mono text-[11px] tracking-widest uppercase shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          [AI_VISION_MODULE_ACTIVE]
        </div>
      )}
    </div>
  );
}
