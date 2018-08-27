const TorrentSearchApi = require('torrent-search-api');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const serverPort = "8080";

const torrentSearch = new TorrentSearchApi();
torrentSearch.enableProvider('Torrent9');

const apiLocation = 'https://api.themoviedb.org/3';
const apiKey = 'e51447e837048930952e694908564da1';

let endURL = "?api_key=" + apiKey;

async function searchTorrents(showId, seasonNumber, episodeNumber) {
	let episodeURI = `/tv/${showId}/season/${seasonNumber}/episode/${episodeNumber}`;
	let episodeURL = apiLocation + episodeURI + endURL;
	let episode = await getEpisodeDetail(episodeURL);
	let series = await getSeriesDetail(episode, showId);
	let data = await searchTorrentForEpisode(series.name, episode.season_number, episode.episode_number);

	return data;
}

async function getEpisodeDetail(uri) {
	return await get(uri, getSeriesDetail);
}

async function getSeriesDetail(episode, showId) {
	return await get(apiLocation + '/tv/' + showId + endURL);
}

async function get(url) {
	return await request(url);
}

function request(url) {
	return new Promise((resolve, reject) => {
		https.get(url, (resp) => {
			let data = '';

			resp.on('data', (chunk) => {
				data += chunk;
			});

			resp.on('end', () => {
				resolve(JSON.parse(data));
			});
		}
		).on('error', (err) => {
			reject(err);
		})
	})
}

async function searchTorrentForEpisode(series, season, episode) {
		let data = [];
		let query = `${series} S0${season} E0${episode}`;
		console.log("searching for", query, "...");
		try {
			const torrents = await torrentSearch.search(query, 'TV', 100);
			console.log({torrents});
			for (var i = 0; i < torrents.length; i++) {
				if (torrents[i] === undefined) {
					continue;
				}
				const magnet = await torrentSearch.getMagnet(torrents[i]);
				torrents[i].magnet = magnet;
			}
			torrents.sort((a, b)=> {
				a.seeds - b.seeds;
			});
			data = torrents;
			return data;
		} catch(err) {
		   console.log(err);
		}
}

async function main() {
	app.use(bodyParser.json());
	app.post('/search', async (req, res) => {
		let {showId, seasonNumber, episodeNumber} = req.body;
		try {
			const torrents = await searchTorrents(showId, seasonNumber, episodeNumber);
			console.log(torrents);
			res.send(torrents);
		} catch(err) {
			console.log('Error while searching torrents', err);
		}
	});

	console.log("server listening on port " + serverPort);
	app.listen(serverPort);
}

main();


// function search()

// const TorrentSearchApi = require('torrent-search-api');

// const torrentSearch = new TorrentSearchApi();

// torrentSearch.enableProvider('Torrent9');

// // Search '1080' in 'Movies' category and limit to 20 results
// torrentSearch.search('game of thrones', 'TV', 100)
// .then(torrents => {
// 	console.log(JSON.stringify(torrents));
// 	torrentSearch.getMagnet(torrents[0]).then(magnet => {
// 		console.log(magnet)
// 	})
// 	.catch(err => {
// 		console.error(err);
// 	});
// })
// .catch(err => {
// 	console.error(err);
// });
