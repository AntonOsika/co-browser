import React, { useEffect, useRef } from 'react';
import { Stage, Layer, Rect } from 'react-konva';

const Canvas = () => {
  const stageRef = useRef(null);

  useEffect(() => {
    if (stageRef.current) {
      window.canvas_api = {
        ...window.canvas_api,
        stage: stageRef.current,
        layer: stageRef.current.findOne('Layer')
      };
    }
  }, []);

  return (
    <div id="canvas" className="w-full h-full relative">
      <Stage ref={stageRef} width={window.innerWidth / 2} height={window.innerHeight}>
        <Layer>
          <Rect
            x={20}
            y={20}
            width={50}
            height={50}
            fill="red"
            shadowBlur={5}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;
