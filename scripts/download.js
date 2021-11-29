import * as htmlToImage from 'https://cdn.skypack.dev/html-to-image';
import {Markov} from "./libraries/markov.js";

export function downloadCanvas(landName) {
	htmlToImage.toPng(document.getElementById("canvas-border"))
		.then(function (dataUrl) {
			var imageDownloader = document.createElement('a');
			imageDownloader.download = landName+" map"
			imageDownloader.href = dataUrl;
			imageDownloader.click();
		});
}

export async function generateName() {
	var markov = new Markov();
	const nameInput = document.getElementById("landName");

	const response = await fetch("./scripts/libraries/names.json");
	const names = await response.json();

	markov.addStates(names)
	markov.train();

	var text = markov.generateRandom(18);
	text = text.charAt(0).toUpperCase()+text.slice(1);

	nameInput.value = text;
}

export function generateCityName(names) {
	var markov = new Markov();
	markov.addStates(names)
	markov.train();

	var text = markov.generateRandom(15);
	text = text.charAt(0).toUpperCase()+text.slice(1);
	return text;
}
