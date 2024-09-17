import React, { useEffect, useRef } from 'react';

const Canvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      window.canvas_api = {
        createIframe: (url, x, y, width, height) => {
          const iframe = document.createElement('iframe');
          iframe.src = url;
          iframe.style.position = 'absolute';
          iframe.style.left = `${x}px`;
          iframe.style.top = `${y}px`;
          iframe.style.width = `${width}px`;
          iframe.style.height = `${height}px`;
          canvasRef.current.appendChild(iframe);
        },
        stage: null // This will be set if we integrate Konva in the future
      };
    }
  }, []);

  return (
    <div id="canvas" ref={canvasRef} className="w-full h-full relative bg-gray-100 border border-gray-300">
      {/* Canvas content will be added here dynamically */}
    </div>
  );
};

export default Canvas;
