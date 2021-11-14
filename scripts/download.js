import * as htmlToImage from 'https://cdn.skypack.dev/html-to-image';

export function downloadCanvas(landName) {
	htmlToImage.toPng(document.getElementById("canvas-border"))
		.then(function (dataUrl) {
			var imageDownloader = document.createElement('a');
			imageDownloader.download = landName+"_map"
			imageDownloader.href = dataUrl;
			imageDownloader.click();
		});
}
