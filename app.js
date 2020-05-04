const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsHorizontal = 20;
const cellsVertical = 15;
const width = window.innerWidth - 10;
const height = window.innerHeight - 10;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
	element: document.body,
	engine: engine,
	options: {
		wireframes: false,
		width,
		height
	}
});
Render.run(render);
Runner.run(Runner.create(), engine);

// === Outside Walls ===
const walls = [
	Bodies.rectangle(width / 2, 0, width, 10, {
		isStatic: true,
		collisionFilter: {
			group: 1
		},
		render: {
			fillStyle: 'rgb(130, 28, 148)'
		}
	}),
	Bodies.rectangle(width / 2, height, width, 10, {
		isStatic: true,
		collisionFilter: {
			group: 1
		},
		render: {
			fillStyle: 'rgb(130, 28, 148)'
		}
	}),
	Bodies.rectangle(0, height / 2, 10, height, {
		isStatic: true,
		collisionFilter: {
			group: 1
		},
		render: {
			fillStyle: 'rgb(130, 28, 148)'
		}
	}),
	Bodies.rectangle(width, height / 2, 10, height, {
		isStatic: true,
		collisionFilter: {
			group: 1
		},
		render: {
			fillStyle: 'rgb(130, 28, 148)'
		}
	})
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

const grid = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal - 1).fill(false));
const horizontals = Array(cellsVertical - 1).fill(null).map(() => Array(cellsHorizontal).fill(false));

// Pick a random staring cell
const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

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
		if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
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
			columnIndex * unitLengthX + unitLengthX / 2,
			// === y direction ===
			rowIndex * unitLengthY + unitLengthY,
			// === wall width ===
			unitLengthX,
			// === wall height ===
			5,
			{
				label: 'wall',
				isStatic: true,
				collisionFilter: {
					group: 1
				},
				render: {
					fillStyle: 'rgb(130, 28, 148)'
				}
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
			columnIndex * unitLengthX + unitLengthX,
			// === y direction ===
			rowIndex * unitLengthY + unitLengthY / 2,
			// === wall width ===
			5,
			// === wall height ===
			unitLengthY,
			{
				label: 'wall',
				isStatic: true,
				collisionFilter: {
					group: 1
				},
				render: {
					fillStyle: 'rgb(130, 28, 148)'
				}
			}
		);
		World.add(world, wall);
	});
});

// ========== Goal =============

const goal = Bodies.rectangle(
	// === x coordinate ====
	width - unitLengthX / 2,
	// === y coordinate ===
	height - unitLengthY / 2,
	// === wall width ===
	unitLengthX * 0.7,
	// === wall height ===
	unitLengthY * 0.7,
	{
		label: 'goal',
		isStatic: true,
		render: {
			fillStyle: 'rgb(47, 196, 117)'
		}
	}
);
World.add(world, goal);

//  ============ Ball =========
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(
	// === x coordinate ====
	unitLengthX / 2,
	// === y coordinate ===
	unitLengthY / 2,
	// === circle radius ===
	ballRadius,
	//  === label ===
	{
		label: 'ball',
		render: {
			fillStyle: 'rgb(245, 200, 66)'
		}
	}
);
World.add(world, ball);

// ==== Moving the ball ====
document.addEventListener('keydown', (event) => {
	const { x, y } = ball.velocity;

	if (event.keyCode === 38) {
		// Move ball up
		Body.setVelocity(ball, { x: x, y: y - 5 });
	}
	if (event.keyCode === 39) {
		// Move ball right
		Body.setVelocity(ball, { x: x + 5, y: y });
	}
	if (event.keyCode === 40) {
		// Move ball down
		Body.setVelocity(ball, { x: x, y: y + 5 });
	}
	if (event.keyCode === 37) {
		// move ball left
		Body.setVelocity(ball, { x: x - 5, y: y });
	}
	return false;
});

// ==== Win Condition ====
Events.on(engine, 'collisionStart', (event) => {
	event.pairs.forEach((collision) => {
		const labels = [ 'ball', 'goal' ];

		if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
			document.querySelector('.winner').classList.remove('hidden');
			world.gravity.y = 1;
			world.bodies.forEach((body) => {
				if (body.label === 'wall') {
					Body.setStatic(body, false);
				}
			});
		}
	});
});
