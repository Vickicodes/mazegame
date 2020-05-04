const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cells = 6;
const width = 600;
const height = 600;

const unitLength = width / cells;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
	element: document.body,
	engine: engine,
	options: {
		wireframes: true,
		width,
		height
	}
});
Render.run(render);
Runner.run(Runner.create(), engine);

// === Outside Walls ===
const walls = [
	Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
	Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
	Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
	Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];
World.add(world, walls);

// ====== Maze Generation ======
const shuffle = (arr) => {
	let counter = arr.length;
	while (counter > 0) {
		const index = Math.floor(Math.random() * counter);

		counter--;

		const temp = arr[counter];
		arr[counter] = arr[index];
		arr[index] = temp;
	}
	return arr;
};

const grid = Array(cells).fill(null).map(() => Array(cells).fill(false));

const verticals = Array(cells).fill(null).map(() => Array(cells - 1).fill(false));
const horizontals = Array(cells - 1).fill(null).map(() => Array(cells).fill(false));

// Pick a random staring cell
const startRow = Math.floor(Math.random() * cells);
const startColumn = Math.floor(Math.random() * cells);

const walkThroughGrid = (row, column) => {
	//If i have visited the cell at [row, column] already then return.
	if (grid[row][column]) {
		return;
	}
	// Mark this cell as visited
	grid[row][column] = true;
	// Assemble randomly-ordered list of neighbors
	const neighbors = shuffle([
		[ row - 1, column, 'up' ],
		[ row, column + 1, 'right' ],
		[ row + 1, column, 'down' ],
		[ row, column - 1, 'left' ]
	]);
	// for each neighbor...
	for (let neighbor of neighbors) {
		const [ nextRow, nextColumn, direction ] = neighbor;
		// See if that neighbor is out of bounds
		if (nextRow < 0 || nextRow >= cells || nextColumn < 0 || nextColumn >= cells) {
			continue;
		}
		// If we have visited that neighbor, continue to next neighbor
		if (grid[nextRow][nextColumn]) {
			continue;
		}
		// Remove a wall from either the horizontal or vertical arrays
		if (direction === 'left') {
			verticals[row][column - 1] = true;
		} else if (direction === 'right') {
			verticals[row][column] = true;
		} else if (direction === 'up') {
			horizontals[row - 1][column] = true;
		} else if (direction === 'down') {
			horizontals[row][column] = true;
		}
		// Visit that next cell
		walkThroughGrid(nextRow, nextColumn);
	}
};
walkThroughGrid(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}

		const wall = Bodies.rectangle(
			// === x direction ====
			columnIndex * unitLength + unitLength / 2,
			// === y direction ===
			rowIndex * unitLength + unitLength,
			// === wall width ===
			unitLength,
			// === wall height ===
			5,
			{
				label: 'wall',
				isStatic: true
			}
		);
		World.add(world, wall);
	});
});

verticals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}

		const wall = Bodies.rectangle(
			// === x direction ====
			columnIndex * unitLength + unitLength,
			// === y direction ===
			rowIndex * unitLength + unitLength / 2,
			// === wall width ===
			5,
			// === wall height ===
			unitLength,
			{
				label: 'wall',
				isStatic: true
			}
		);
		World.add(world, wall);
	});
});

// ========== Goal =============

const goal = Bodies.rectangle(
	// === x coordinate ====
	width - unitLength / 2,
	// === y coordinate ===
	height - unitLength / 2,
	// === wall width ===
	unitLength * 0.7,
	// === wall height ===
	unitLength * 0.7,
	{
		label: 'goal',
		isStatic: true
	}
);
World.add(world, goal);

//  ============ Ball =========
const ball = Bodies.circle(
	// === x coordinate ====
	unitLength / 2,
	// === y coordinate ===
	unitLength / 2,
	// === circle radius ===
	unitLength / 4,
	//  === label ===
	{
		label: 'ball'
	}
);
World.add(world, ball);

// ==== Moving the ball ====
document.addEventListener('keydown', (event) => {
	const { x, y } = ball.velocity;

	if (event.keyCode === 87) {
		// Move ball up
		Body.setVelocity(ball, { x: x, y: y - 5 });
	}
	if (event.keyCode === 68) {
		// Move ball right
		Body.setVelocity(ball, { x: x + 5, y: y });
	}
	if (event.keyCode === 83) {
		// Move ball down
		Body.setVelocity(ball, { x: x, y: y + 5 });
	}
	if (event.keyCode === 65) {
		// move ball left
		Body.setVelocity(ball, { x: x - 5, y: y });
	}
});

// ==== Win Condition ====

Events.on(engine, 'collisionStart', (event) => {
	event.pairs.forEach((collision) => {
		const labels = [ 'ball', 'goal' ];

		if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
			world.gravity.y = 1;
			world.bodies.forEach((body) => {
				if (body.label === 'wall') {
					Body.setStatic(body, false);
				}
			});
		}
	});
});
