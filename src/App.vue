<script setup>
import { onMounted, nextTick, ref } from 'vue'
import imageToSvg from './imageToSvg.json';

const index = ref(0);
const randomNumber = ref(Math.floor(Math.random() * (13 - 1 + 1)) + 1);

let obj = imageToSvg[randomNumber.value];
const svgToShow = ref(obj);

const lines = [
	'At every point in the trail people are walking ahead of me deeper inside and walking in the opposite direction.',
	'Towards the city, towards the exit, towards the familiar.',
	`I cannot always see them all at once,\n
	The people ahead of me\n
	And the people who are leaving
	`,
	`Some take other routes out.\n
	See things I do not see\n
	Decide now is a good time as ever to start the journey home\n
	Maybe they know something I don't.`,
	`When I see the people in front of me trudging forward 
	I think:
	Yes I am going the right way..
	Yes I am on track..
	Yes there is something worth seeing ahead..
	Yes this view is worthy of the climb..`,
	`When I see people speed past in the opposite direction I think: 
	Oh it's getting late',
	They're turning back and I'm not even halfway there',
	There's nothing really to see',
	At the end`,
	`I stopped a man on his way back
	Asked him:
	Should I keep going? Is it worth it? Or is it more of the same?
	He couldn’t tell me`,
	`I kept going when I could
	And turned back when I couldn't
	Tried to be okay missing whatever people were still walking towards`,
	`I saw the sunset over the city
	It was beautiful
	And It was enough`,
	`Today I look at the plants on my walk
	Plants that know exactly what to do
	Which way to lean to catch the sunlight
	Know what the sunlight will do for them`,
	`How do they know which way to bend?`
		
]

function placeBoxes() {

	const container = document.getElementById('container');
	const containerWidth = container.clientWidth;
	const containerHeight = container.clientHeight;

	const lineContainer = document.querySelector('.path');
	const lineRect = lineContainer.getBoundingClientRect();
	const maxLineX = Math.max(0, containerWidth - lineRect.width);
	const maxLineY = Math.max(0, containerHeight - lineRect.height);

	const lineRandomX = Math.floor(Math.random() * maxLineX);
	const lineRandomY = Math.floor(Math.random() * maxLineY);

	lineContainer.style.left = `${lineRandomX}px`;
	lineContainer.style.top = `${lineRandomY}px`;

	// Place first element (image) randomly
	const imageBox = document.querySelector('.plant');

	const imageRect = imageBox.getBoundingClientRect();
	const maxImageX = Math.max(0, containerWidth - imageRect.width);
	const maxImageY = Math.max(0, containerHeight - imageRect.height);

	const imageRandomX = Math.floor(Math.random() * maxImageX);
	const imageRandomY = Math.floor(Math.random() * maxImageY);
	imageBox.style.left = `${imageRandomX}px`;
	imageBox.style.top = `${imageRandomY}px`;

	// Place text box randomly 
	const textBox = document.querySelector('.text');
	const textRect = textBox.getBoundingClientRect();

	const imageBoxArea = {
		left: imageRandomX,
		top: imageRandomY,
		right: imageRandomX + imageRect.width,
		bottom: imageRandomY + imageRect.height,
		width: imageRect.width,
		height: imageRect.height
	};

	console.log(imageBoxArea, 'image box area');
	// Define the available area for the text box, excluding the image box area
	function getAvailableArea() {
		const padding = 10; // add a little padding to avoid touching
		const areas = [];

		// Top area
		if (imageBoxArea.top > 0) {
			areas.push({
				left: 0,
				top: 0,
				width: containerWidth,
				height: imageBoxArea.top - padding
			});
		}
		// Bottom area
		if (imageBoxArea.bottom < containerHeight) {
			areas.push({
				left: 0,
				top: imageBoxArea.bottom + padding,
				width: containerWidth,
				height: containerHeight - imageBoxArea.bottom - padding
			});
		}
		// Left area
		if (imageBoxArea.left > 0) {
			areas.push({
				left: 0,
				top: imageBoxArea.top,
				width: imageBoxArea.left - padding,
				height: imageBoxArea.height
			});
		}
		// Right area
		if (imageBoxArea.right < containerWidth) {
			areas.push({
				left: imageBoxArea.right + padding,
				top: 0,
				width: containerWidth - imageBoxArea.right - padding,
				height: imageBoxArea.height
			});
		}
		console.log(areas, 'available areas before filter');
		return areas.filter(a => a.width > textRect.width && a.height > textRect.height);
	}

	const availableAreas = getAvailableArea();
	console.log(availableAreas, 'available areas after filter');
	let area = availableAreas.length > 0 ? availableAreas[Math.floor(Math.random() * availableAreas.length)] : { left: 0, top: 0, width: containerWidth, height: containerHeight };

	const textRandomX = area.left + Math.floor(Math.random() * (area.width - textRect.width));
	const textRandomY = area.top + Math.floor(Math.random() * (area.height - textRect.height));

	textBox.style.left = `${textRandomX}px`;
	textBox.style.top = `${textRandomY}px`;
	
}

class TracePathFollower {
	constructor(svgElement, options = {}) {
		this.originalElement = svgElement;
		this.threshold = options.threshold || 25;
		this.started = false;
		this.progress = 0;
		this.targetProgress = 0;
		this.animationFrame = null;
		this.finished = false;

		// Convert line to path if needed
		if (svgElement.tagName.toLowerCase() === 'line') {
			this.path = this._convertLineToPath(svgElement);
		} else {
			this.path = svgElement;
		}

		this.svg = this.path.ownerSVGElement;
		this.svgPoint = this.svg.createSVGPoint();

		requestAnimationFrame(() => {
			this.pathLength = Math.floor(this.path.getTotalLength());
			this._placeStartIndicator();

			this.path.style.strokeDasharray = this.pathLength;
			this.path.style.strokeDashoffset = this.pathLength;

			this._bindEvents();
			this._animate(); // Start animation loop
		});
	}

	_placeStartIndicator() {
		const startIndicator = document.getElementById("startIndicator");
		if (!startIndicator) return;

		const start = this.path.getPointAtLength(0);
		startIndicator.setAttribute("cx", start.x);
		startIndicator.setAttribute("cy", start.y);
		this.startIndicator = startIndicator;
	}

	_convertLineToPath(line) {
		const x1 = line.getAttribute("x1");
		const y1 = line.getAttribute("y1");
		const x2 = line.getAttribute("x2");
		const y2 = line.getAttribute("y2");

		const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
		const d = `M${x1},${y1} L${x2},${y2}`;
		newPath.setAttribute("d", d);
		newPath.setAttribute("stroke", line.getAttribute("stroke") || "black");
		newPath.setAttribute("stroke-width", line.getAttribute("stroke-width") || "1");
		newPath.setAttribute("fill", "none");
		newPath.setAttribute("id", line.getAttribute("id") || "tracePath");

		line.parentNode.replaceChild(newPath, line);
		return newPath;
	}

	_bindEvents() {
		document.addEventListener("mousemove", (e) => this._handleMouseMove(e));
	}

	_handleMouseMove(e) {
		this.svgPoint.x = e.clientX;
		this.svgPoint.y = e.clientY;

		const cursor = this.svgPoint.matrixTransform(this.svg.getScreenCTM().inverse());

		let best = 0;
		let bestDist = Infinity;

		for (let i = 0; i <= this.pathLength; i += 2) {
			const pt = this.path.getPointAtLength(i);
			const dx = pt.x - cursor.x;
			const dy = pt.y - cursor.y;
			const dist = dx * dx + dy * dy;

			if (dist < bestDist) {
				bestDist = dist;
				best = i;
			}
		}

		// Only start filling if the user begins at the start
		if (!this.started) {
			const startPoint = this.path.getPointAtLength(0);
			const dx = startPoint.x - cursor.x;
			const dy = startPoint.y - cursor.y;

			const distToStart = Math.sqrt(dx * dx + dy * dy);
			if (distToStart < this.threshold) {
				this.started = true;
				if (this.startIndicator) {
					setTimeout(() => {
						this.startIndicator.style.display = "none";
					}, 1000);
				}
			}
		}

		if (bestDist < this.threshold && best > this.targetProgress) {
			this.targetProgress = best;
		}
	}

	_animate() {
		if (this.progress < this.targetProgress) {
			this.progress += (this.targetProgress - this.progress) * 0.2; // Smoothing factor
			this.path.style.strokeDashoffset = this.pathLength - this.progress;
		}
		// Update the start indicator position

		// Check if the path is finished
		if (!this.finished && this.progress >= this.pathLength - 5) {
			this.finished = true;
			this.started = false;
			this.progress = 0;
			this.targetProgress = 0;
			this.animationFrame = null;
			this.path.style.strokeDasharray = this.pathLength;
			this.path.style.strokeDashoffset = this.pathLength;
			this.startIndicator.style.display = "block";
			this._placeStartIndicator();
			reset();

			setTimeout(() => {
				this.finished = false;
			}, 500);
		}
		this.animationFrame = requestAnimationFrame(() => this._animate());
	}
}

function reset() {
	index.value = (index.value + 1) % lines.length;
	randomNumber.value = Math.floor(Math.random() * (5 - 1 + 1)) + 1;
	svgToShow.value = imageToSvg[randomNumber.value];
	// Reset the progress and target progress
	const line = document.getElementById("traceLine") || document.getElementById("tracePath");
	if (!line) return;

	placeBoxes();
}

onMounted(async () => {
	const imageBox = document.querySelector('.plant');
	imageBox.style.setProperty('--plant-img', `url('./images/${randomNumber.value}.png')`);
	
	const path = document.querySelector("path");
	const bbox = path.getBBox();
	const svg = document.querySelector("svg");
	svg.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

	await nextTick();
	placeBoxes();
	const line = document.getElementById("traceLine") || document.getElementById("tracePath");
	if (!line) return;
	new TracePathFollower(line, { threshold: 10 });
});

</script>

<template>
	<main class="container" id="container">
		<section class="text box">
			<p :key="index">
			{{ lines[index] }}
			</p>
		</section>
		<section class="plant box"></section>
		<section class="path">
			<svg :viewBox="svgToShow.viewbox" xmlns="http://www.w3.org/2000/svg">
				<g>
					<!-- Dashed path always visible -->
					<path id="dashedPath" :d="svgToShow.d" fill="none" stroke="black" stroke-width="4"
						stroke-dasharray="10 10" />

					<!-- Solid overlay path (revealed as user traces) -->
					<path id="tracePath" :d="svgToShow.d" fill="none" stroke="black" stroke-width="4" />
				</g>
				<circle id="startIndicator" r="6" fill="rgba(243, 236, 120, 0.3)" style="filter: url(#glow)">
					<animate attributeName="r" values="10;20;10" dur="3s" repeatCount="indefinite" />
				</circle>
				<defs>
					<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
						<feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
						<feMerge>
							<feMergeNode in="blur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>
			</svg>
		</section>
	</main>
</template>

<style scoped>
.container {
	position: relative;
	width: 100%;
	height: 100%;
	max-width: 80vw;
	max-height: 100vh;
	overflow: hidden;
	margin: auto;
}

section {
	position: absolute;
	padding: 1.2rem;
}

p {
	font-family: "EB Garamond", Georgia, 'Times New Roman', Times, serif;
	font-size: 2rem;
	padding: 12px;
}

.text {
	max-width: 30%;
	max-height: 40%;
	z-index: 999;
	background-color: white;
	padding: 1.2rem;
}

.plant {
	/* Use a CSS variable for the image, set from JS */
	--plant-img: url('./images/1.png');
	background-image: var(--plant-img);
	background-size: contain;
	background-repeat: no-repeat;
	background-position: center;
	min-height: 40rem;
	min-width: 40rem;
}

svg {
	overflow: visible;
	min-height: 80vh;
}

.path {
	z-index: 1001;
}

.path #dashedPath {
  stroke-dasharray: 10;
  animation: dash 60s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: 1000;
  }
}

</style>
