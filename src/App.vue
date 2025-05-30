<script setup>
import { onMounted, nextTick, ref,  useTemplateRef } from 'vue'
import imageToSvg from './imageToSvg.json';

const index = ref(0);
let randomNumber = Math.floor(Math.random() * (13 - 1 + 1)) + 1;
const visible = ref(true);

let obj = imageToSvg[randomNumber];

const nextSvgRef = useTemplateRef('nextSvg');
const nextTextRef = useTemplateRef('nextText');
const nextImgRef = useTemplateRef('nextImg');

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

const currentView = ref({
	'image': `./images/${randomNumber}.png`,
	text: lines[index.value],
	'svg': obj,
});

const positions = ref({
	'text': { left: '0px', top: '0px' },
	'svg': { left: '0px', top: '0px' },
	'image': { left: '0px', top: '0px' }
});

const nextView = ref({
	'image': ``,
	text: '',
	'svg': {
		d: '',
		viewbox: '0 0 1000 1000'
	}
});

const randPos = (el, containerWidth, containerHeight) => {
	const rect = el.getBoundingClientRect();
	const maxX = containerWidth - rect.width;
	const maxY = containerHeight - rect.height;

	return {
		left: `${Math.floor(Math.random() * maxX)}px`,
		top: `${Math.floor(Math.random() * maxY)}px`,
		width: rect.width,
		height: rect.height
	};
};

function getAvailableArea(area, el, containerWidth, containerHeight) {
	const padding = 10; // add a little padding to avoid touching
	const areas = [];

	// Top area
	if (area.top > 0) {
		areas.push({
			left: 0,
			top: 0,
			width: containerWidth,
			height: area.top - padding
		});
	}
	// Bottom area
	if (area.bottom < containerHeight) {
		areas.push({
			left: 0,
			top: area.bottom + padding,
			width: containerWidth,
			height: containerHeight - area.bottom - padding
		});
	}
	// Left area
	if (area.left > 0) {
		areas.push({
			left: 0,
			top: area.top,
			width: area.left - padding,
			height: area.height
		});
	}
	// Right area
	if (area.right < containerWidth) {
		areas.push({
			left: area.right + padding,
			top: 0,
			width: containerWidth - area.right - padding,
			height: area.height
		});
	}
	console.log(areas, 'available areas before filter');
	return areas.filter(a => a.width > el.width && a.height > el.height);
}

function placeBoxes(lineContainer, textBox, imageBox, container) {
	console.log('Placing boxes');
	if (!container) {
		container = document.getElementById('container');
	}
	const containerWidth = container.clientWidth;
	const containerHeight = container.clientHeight;

	positions.value.svg = randPos(lineContainer, containerWidth, containerHeight);

	// Place first element (image) randomly
	const imagePos = randPos(imageBox);
	positions.value.image = imagePos;

	// Place text box not overlapping with the image box 
	const textRect = textBox.getBoundingClientRect();

	const imageBoxArea = {
		left: imagePos.left,
		top: imagePos.top,
		right: imagePos.left + imagePos.width,
		bottom: imagePos.top + imagePos.height,
		width: imagePos.width,
		height: imagePos.height
	};

	const availableAreas = getAvailableArea(imageBoxArea, textRect, containerWidth, containerHeight);
	console.log(availableAreas, 'available areas after filter');
	let area = availableAreas.length > 0 ? availableAreas[Math.floor(Math.random() * availableAreas.length)] : { left: 0, top: 0, width: containerWidth, height: containerHeight };

	const textRandomX = area.left + Math.floor(Math.random() * (area.width - textRect.width));
	const textRandomY = area.top + Math.floor(Math.random() * (area.height - textRect.height));

	positions.value.text = {
		left: `${textRandomX}px`,
		top: `${textRandomY}px`
	};
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

		this.path = svgElement;

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
			this.progress += (this.targetProgress - this.progress) * 0.4; // Smoothing factor
			this.path.style.strokeDashoffset = this.pathLength - this.progress;
		}
		// Update the start indicator position

		// Check if the path is finished
		if (!this.finished && this.progress >= this.pathLength - 20) {
			this.finished = true;
			this.started = false;
			this.progress = 0;
			this.targetProgress = 0;
			this.animationFrame = null;
			this.path.style.strokeDasharray = this.pathLength;
			this.path.style.strokeDashoffset = this.pathLength;
			visible.value = false;

			reset();
		}
		this.animationFrame = requestAnimationFrame(() => this._animate());
	}
}

function reset() {
	index.value = (index.value + 1) % lines.length;
	randomNumber = Math.floor(Math.random() * (13 - 1 + 1)) + 1;
	obj = imageToSvg[randomNumber];
	nextView.value = {
		'image': `./images/${randomNumber}.png`,
		text: lines[index.value],
		'svg': obj,
	};
}

async function placeNext() {
	const offscreenContainer = document.querySelector('.offscreen');
	placeBoxes(nextSvgRef.value, nextTextRef.value, nextImgRef.value, offscreenContainer);


	// Destroy existing TracePathFollower instance if it exists
	if (window._tracePathFollowerInstance && typeof window._tracePathFollowerInstance._animate === 'function') {
		cancelAnimationFrame(window._tracePathFollowerInstance.animationFrame);
		window._tracePathFollowerInstance = null;
	}

	currentView.value = nextView.value;
	visible.value = true;

	await nextTick();
	const line = document.getElementById("tracePath");
	if (line) {
		window._tracePathFollowerInstance = new TracePathFollower(line, { threshold: 25 });
	}
}

onMounted(async () => {
	await nextTick();

	const lineContainer = document.querySelector('.path');
	const imageBox = document.querySelector('.plant');
	const textBox = document.querySelector('.text');

	placeBoxes(lineContainer, textBox, imageBox);
	const line = document.getElementById("tracePath");
	if (!line) return;
	new TracePathFollower(line, { threshold: 25 });
});

function convertPathToRelative(d) {
  const commands = d.match(/[a-df-zA-DF-Z][^a-df-zA-DF-Z]*/g);
  if (!commands) return d;

  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  const result = [];

  for (let cmd of commands) {
    const type = cmd[0];
    const nums = cmd.slice(1).trim().split(/[\s,]+/).map(Number);

    switch (type) {
      case 'M':
        {
          const [x, y] = nums;
          result.push(`m ${x - currentX} ${y - currentY}`);
          currentX = x;
          currentY = y;
          startX = x;
          startY = y;
        }
        break;

      case 'L':
        {
          const [x, y] = nums;
          result.push(`l ${x - currentX} ${y - currentY}`);
          currentX = x;
          currentY = y;
        }
        break;

      case 'H':
        {
          const [x] = nums;
          result.push(`h ${x - currentX}`);
          currentX = x;
        }
        break;

      case 'V':
        {
          const [y] = nums;
          result.push(`v ${y - currentY}`);
          currentY = y;
        }
        break;

      case 'Z':
      case 'z':
        result.push('z');
        currentX = startX;
        currentY = startY;
        break;

      default:
        // Add more command types (like C, Q, A) if needed
        console.warn(`Unsupported command: ${type}`);
        result.push(cmd);
    }
  }

  return result.join(' ');
}

function getAspectRatio() {
	const currentSvg = currentView.value.svg;
	const viewbox = currentSvg.viewbox;
	const [x, y, width, height] = viewbox.split(' ').map(Number);
	return `${width + 40} / ${height + 40}`;
}

function getViewBox(svg) {
	const [x, y, width, height] = svg.viewbox.split(' ').map(Number);
	return `${x} ${y} ${width + 40} ${height + 40}`;
}

</script>

<template>
	<Transition name="fade" @after-leave="placeNext" @after-enter="onEnter">
		<main v-if="visible" class="container" id="container">
			<section ref="text" class="text box" :style="{ left: positions.text.left, top: positions.text.top }">
				<p>
				{{ currentView.text }}
				</p>
			</section>
			<section ref="svg" class="path" :style="{ left: positions.svg.left, top: positions.svg.top, aspectRatio: getAspectRatio() }">
				<svg :viewBox="getViewBox(currentView.svg)" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
					<g>
						<!-- Dashed path always visible -->
						<path id="dashedPath" :d="convertPathToRelative(currentView.svg.d)" fill="none" stroke="black" stroke-width="4"
							stroke-dasharray="10 10" />

						<!-- Solid overlay path (revealed as user traces) -->
						<path id="tracePath" :d="convertPathToRelative(currentView.svg.d)" fill="none" stroke="black" stroke-width="4" />
					</g>
					<circle id="startIndicator" r="10" fill="rgba(243, 236, 120, 0.4)" style="filter: url(#glow)">
						<animate attributeName="r" values="10;20;10" dur="5s" repeatCount="indefinite" />
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
			<section ref="img" class="plant box" :style="{ left: positions.image.left, top: positions.image.top }">
				<img :src="currentView.image" alt="Plant Image" />
			</section>
		</main>
	</Transition>
	 <div class="offscreen" ref="stage">
		<section ref="nextImg" class="plant box">
			<img
				:src="nextView.image"
				alt=""
			/>
		</section>
		<section ref="nextText" class="text box">
			<p>{{ nextView.text }}</p>
		</section>
		<div ref="nextSvg" class="path" :style="{ aspectRatio: getAspectRatio() }">
			<svg :viewBox="getViewBox(nextView.svg)" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
				<g>
					<!-- Dashed path always visible -->
					<path :d="convertPathToRelative(nextView.svg.d)" fill="none" stroke="black" stroke-width="4"
						stroke-dasharray="10 10" />

					<!-- Solid overlay path (revealed as user traces) -->
					<path :d="convertPathToRelative(nextView.svg.d)" fill="none" stroke="black" stroke-width="4" />
				</g>
			</svg>
		</div>
	 </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.offscreen {
  visibility: hidden;
  position: absolute;
  top: -10000px;
  left: -10000px;
}

.floating {
  transition: all 0.5s ease;
}

.container, .offscreen {
	width: 100%;
	height: 100%;
	max-width: 80vw;
	max-height: 100vh;
	overflow: hidden;
	margin: auto;
}

.container {
	position: relative;
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
	height: 40rem;
	width: 40rem;
}

.plant img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

svg {
	overflow: visible;
    width: 100%;
    height: 100%;
    display: block;
}

.path {
	max-height: 70%;                /* Allow container to scale */
	min-width: 40%;
    width: 100%; 
	z-index: 10001;
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
