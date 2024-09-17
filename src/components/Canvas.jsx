import React, { useEffect, useRef } from 'react';
import { Stage, Layer } from 'react-konva';

const Canvas = () => {
  const stageRef = useRef(null);

  useEffect(() => {
    if (stageRef.current) {
      window.canvas_api = {
        ...window.canvas_api,
        stage: stageRef.current
      };
    }
  }, []);

  return (
    <div id="canvas" className="w-full h-full relative">
      <Stage ref={stageRef} width={window.innerWidth / 2} height={window.innerHeight}>
        <Layer>
          {/* Konva shapes can be added here */}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;