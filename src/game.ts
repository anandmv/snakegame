// the canvas width & height, snake x & y, and the apple x & y, all need to be
// multiples of the grid size in order for collision detection to work
// (e.g. 16 * 25 = 400)

interface Cell {
  x: number;
  y: number;
}

interface Snake {
  x: number;
  y: number;
  // snake velocity. moves one grid length every frame in either the x or y direction
  dx: number;
  dy: number;
  // keep track of all grids the snake body occupies
  cells: Cell[];
  // length of the snake. grows when eating an apple
  maxCells: number;
}

interface Apple {
  x: number;
  y: number;
}

// get random whole numbers in a specific range
// @see https://stackoverflow.com/a/1527820/2124254
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

export interface GameOptions {
  // size of each grid cell in px. defaults to 16
  grid?: number;
}

/**
 * Creates a snake game bound to a given canvas. The canvas's own
 * width/height (set via its attributes) determine the play area, so
 * resizing the canvas resizes the game — no hardcoded 400x400 assumption.
 */
export function createGame(canvas: HTMLCanvasElement, options: GameOptions = {}) {
  const grid = options.grid ?? 16;

  if (canvas.width % grid !== 0 || canvas.height % grid !== 0) {
    console.warn(
      `Canvas size (${canvas.width}x${canvas.height}) is not a multiple of grid size (${grid}). Collision detection may misbehave.`
    );
  }

  const cols = Math.floor(canvas.width / grid);
  const rows = Math.floor(canvas.height / grid);

  const context = canvas.getContext('2d') as CanvasRenderingContext2D;

  let count = 0;

  const snake: Snake = {
    // start roughly in the middle of the board, snapped to the grid
    x: Math.floor(cols / 2) * grid,
    y: Math.floor(rows / 2) * grid,
    dx: grid,
    dy: 0,
    cells: [],
    maxCells: 4
  };

  const apple: Apple = {
    x: getRandomInt(0, cols) * grid,
    y: getRandomInt(0, rows) * grid
  };

  function resetSnake() {
    snake.x = Math.floor(cols / 2) * grid;
    snake.y = Math.floor(rows / 2) * grid;
    snake.cells = [];
    snake.maxCells = 4;
    snake.dx = grid;
    snake.dy = 0;
  }

  function placeApple() {
    apple.x = getRandomInt(0, cols) * grid;
    apple.y = getRandomInt(0, rows) * grid;
  }

  // one frame of the game loop. caller is responsible for scheduling
  // (e.g. via requestAnimationFrame) and for tearing that down on unmount
  function tick() {
    // slow game loop to 15 fps instead of 60 (60/15 = 4)
    if (++count < 4) {
      return;
    }
    count = 0;

    context.clearRect(0, 0, canvas.width, canvas.height);

    // move snake by its velocity
    snake.x += snake.dx;
    snake.y += snake.dy;

    // wrap snake position horizontally on edge of screen
    if (snake.x < 0) {
      snake.x = canvas.width - grid;
    } else if (snake.x >= canvas.width) {
      snake.x = 0;
    }

    // wrap snake position vertically on edge of screen
    if (snake.y < 0) {
      snake.y = canvas.height - grid;
    } else if (snake.y >= canvas.height) {
      snake.y = 0;
    }

    // keep track of where snake has been. front of the array is always the head
    snake.cells.unshift({ x: snake.x, y: snake.y });

    // remove cells as we move away from them
    if (snake.cells.length > snake.maxCells) {
      snake.cells.pop();
    }

    // draw apple
    context.fillStyle = 'red';
    context.fillRect(apple.x, apple.y, grid - 1, grid - 1);

    // draw snake one cell at a time
    context.fillStyle = 'green';
    snake.cells.forEach(function (cell: Cell, index: number) {
      // drawing 1 px smaller than the grid creates a grid effect in the
      // snake body so you can see how long it is
      context.fillRect(cell.x, cell.y, grid - 1, grid - 1);

      // snake ate apple
      if (cell.x === apple.x && cell.y === apple.y) {
        snake.maxCells++;
        placeApple();
      }

      // check collision with all cells after this one (modified bubble sort)
      for (let i = index + 1; i < snake.cells.length; i++) {
        // snake occupies same space as a body part. reset game
        if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
          resetSnake();
          placeApple();
        }
      }
    });
  }

  function handleKeydown(e: KeyboardEvent) {
    // prevent snake from backtracking on itself by checking that it's
    // not already moving on the same axis
    if (e.which === 37 && snake.dx === 0) {
      snake.dx = -grid;
      snake.dy = 0;
    } else if (e.which === 38 && snake.dy === 0) {
      snake.dy = -grid;
      snake.dx = 0;
    } else if (e.which === 39 && snake.dx === 0) {
      snake.dx = grid;
      snake.dy = 0;
    } else if (e.which === 40 && snake.dy === 0) {
      snake.dy = grid;
      snake.dx = 0;
    }
  }

  document.addEventListener('keydown', handleKeydown);

  // caller should invoke this on unmount to avoid leaking the listener
  function destroy() {
    document.removeEventListener('keydown', handleKeydown);
  }

  return { tick, destroy, snake };
}