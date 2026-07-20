import { useRef, useEffect, useState } from 'react';
import { createGame } from './game';

interface AppProps {
  canvasSize?: number; // width & height in px, e.g. 400
  grid?: number;
}

function App({ canvasSize = 400, grid = 16 }: AppProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  useEffect(() => {
    if (!canvasRef.current) return;
    // create the game
    const game = createGame(canvasRef.current, { grid })
    // start the game
    let frameId: number;

    function loop() {
      game.tick();
      frameId = requestAnimationFrame(loop);
      setScore((game.snake.maxCells-4));
    }
    frameId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frameId);
      game.destroy();
    }
  }, [canvasRef]);
  console.log(canvasRef)

  return (
    <>
      <canvas ref={canvasRef} width={canvasSize} height={canvasSize} />
      <h2 style={{textAlign: "center"}}>
        Score: {score}
      </h2>
    </>
  )
}

export default App
