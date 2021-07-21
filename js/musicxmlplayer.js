(() => {

    class MusicXMLPlayer {

		constructor() {

			this.api = null;
			this.track_defaults = [];

			/* Register as default action for MusicXML files. */
			OCA.Files.fileActions.registerAction({
				name: 'Play',
				displayName: ('musicxmlplayer', 'Play'),
				mime: 'application/vnd.recordare.musicxml',
				permissions: OC.PERMISSION_READ,
				icon: OC.imagePath('core', 'actions/play'),
				actionHandler: (filename, context) => { this.load(filename, context); }
			});
			OCA.Files.fileActions.setDefault('application/vnd.recordare.musicxml', 'Play');
		}

		load(filename, context) {
			if (alphaTab == undefined) {
				console.debug('alphaTab did not load...');
				return;
			}
			Promise.resolve().then(() => {
				return this.add_wrapper();
			}).then(() => {
				return this.initialize_alphatab(filename, context);
			}).then(() => {
				return this.populate_tracklist();
			}).then(() => {
				return this.populate_controls();
			});
		}

		async add_wrapper() {
			return fetch(OC.generateUrl('/apps/musicxmlplayer/wrapper.html')).then((response) => {
				return response.text();
			}).then((html) => {
				document.body.insertAdjacentHTML('beforeEnd', html);
				const wrapper = document.querySelector('.mxl-wrapper');
				const self = this;
				function close_player(e) {
					if (e.type != 'keydown' || e.key === 'Escape' || e.key === 'Esc') {
						e.preventDefault();
						self.api.destroy();
						document.querySelector('.mxl-wrapper').remove();
						document.removeEventListener('keydown', close_player);
					}
				}
				wrapper.querySelector('.mxl-close-button').addEventListener('click', close_player);
				wrapper.addEventListener('click', (e) => {
					if (e.target.tagName.toLowerCase()!='label' &&
						e.target.tagName.toLowerCase()!='input' &&
						!e.target.classList.contains('mxl-icon') &&
						!e.target.classList.contains('mxl-icon-small'))
						wrapper.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
							checkbox.checked = false;
						});
					return true;
				});
				document.addEventListener('keydown', close_player);
				return Promise.resolve();
			});
		}

		async initialize_alphatab(filename, context) {
			const settings = {
				file: context.fileList.getDownloadUrl(filename, context.dir),
				tracks: 'all',
				player: {
					enablePlayer: true,
					scrollElement: document.querySelector('.mxl-viewport'),
					soundFont: OC.generateUrl('/apps/musicxmlplayer/sonivox.sf2'),
					bufferTimeInMillisecondsJavaScript: 1000
				},
				importer: {
					mergePartGroupsInMusicXmlJavaScript: true
				},
				display: {
					resources: {
						effectFont: '14px Arial, sans-serif'
					}
				},
				notation: {
					notationMode: 'SongBook'
				}
			}
			this.api = new alphaTab.AlphaTabApi(document.querySelector('.mxl-main'), settings);
			this.api.soundFontLoad.on((e) => {
				// Hardcode soundfont size as e.total is zero.
				const percentage = Math.floor((e.loaded / 1289890) * 100);
				document.querySelector('.mxl-progress').innerText = `Loading: ${percentage}%`;
			});
			this.api.playerReady.on(() => {
				document.querySelector('.mxl-progress').innerText = '';
			});
			return Promise.resolve();
		}

		readStorage() {
			var storage = localStorage.getItem('mxl-tracks');
			if (!storage) {
				this.writeStorage(this.track_defaults);
				return this.track_defaults;
			}
			storage = JSON.parse(storage);
			if (!storage.hasOwnProperty(this.api.settings.core.file)) {
				this.writeStorage(this.track_defaults);
				return this.track_defaults;
			}
			return storage[this.api.settings.core.file];
		}

		writeStorage(track_settings) {
			var storage = localStorage.getItem('mxl-tracks');
			if (!storage)
				storage = {};
			else
				storage = JSON.parse(storage);
			storage[this.api.settings.core.file] = track_settings;
			localStorage.setItem('mxl-tracks', JSON.stringify(storage));
		}

		getTrackSettings(trackId, setting=null) {
			var track_settings = this.readStorage();
			if (!track_settings.hasOwnProperty(trackId))
				track_settings[trackId] = this.track_defaults[trackId];
			if (setting)
				return track_settings[trackId].hasOwnProperty(setting) ? track_settings[trackId][setting] : null;
			return track_settings[trackId];
		}

		setTrackSettings(trackId, setting, value) {
			var track_settings = this.readStorage();
			track_settings[trackId] = this.getTrackSettings(trackId);
			track_settings[trackId][setting] = value;
			this.writeStorage(track_settings);
		}

		setTrackMute(trackId, mute) {
			if (mute) {
				document.querySelector(`.mxl-track-mute[track-id="${trackId}"]`).classList.add('bi-volume-mute');
				document.querySelector(`.mxl-track-mute[track-id="${trackId}"]`).classList.remove('bi-volume-up');
			} else {
				document.querySelector(`.mxl-track-mute[track-id="${trackId}"]`).classList.add('bi-volume-up');
				document.querySelector(`.mxl-track-mute[track-id="${trackId}"]`).classList.remove('bi-volume-mute');
			}
			this.api.changeTrackMute([this.api.score.tracks[trackId]], mute);
			this.setTrackSettings(trackId, 'mute', mute);
		}

		setTrackHide(trackId, hide) {
			if (hide) {
				document.querySelector(`.mxl-track-hide[track-id="${trackId}"]`).classList.add('bi-eye-slash');
				document.querySelector(`.mxl-track-hide[track-id="${trackId}"]`).classList.remove('bi-eye');
			} else {
				document.querySelector(`.mxl-track-hide[track-id="${trackId}"]`).classList.add('bi-eye');
				document.querySelector(`.mxl-track-hide[track-id="${trackId}"]`).classList.remove('bi-eye-slash');
			}
			const tracks = this.api.score.tracks.filter((track, id) => {
				return document.querySelector(`.mxl-track-hide[track-id="${id}"]`).classList.contains('bi-eye');
			});
			this.api.renderTracks(tracks);
			this.setTrackSettings(trackId, 'hide', hide);
		}

		setTrackVolume(trackId, volume) {
			if (this.track_defaults[trackId].volume>0)
				this.api.changeTrackVolume([this.api.score.tracks[trackId]], volume / this.track_defaults[trackId].volume);
			this.setTrackSettings(trackId, 'volume', volume);
		}

		async populate_tracklist() {
			const trackList = document.querySelector('.mxl-track-list');
			const template = document.querySelector('#mxl-track-template').content.cloneNode(true).firstElementChild;
			this.api.scoreLoaded.on((score) => {
				this.track_defaults = [];
				score.tracks.forEach((track, i) => {
					this.track_defaults[i] = {
						mute: track.playbackInfo.isMute,
						volume: track.playbackInfo.volume,
						hide: false
					}

					var trackElement = template.cloneNode(true);
					trackElement.querySelector('.mxl-track-name').innerText = track.name;

					trackElement.querySelector('.mxl-track-mute').title = track.name;
					trackElement.querySelector('.mxl-track-mute').setAttribute('track-id', i);
					trackElement.querySelector('.mxl-track-mute').addEventListener('click', (e) => {
						this.setTrackMute(e.target.getAttribute('track-id'), e.target.classList.contains('bi-volume-up'));
						return false;
					});

					trackElement.querySelector('.mxl-track-hide').setAttribute('track-id', i);
					trackElement.querySelector('.mxl-track-hide').addEventListener('click', (e) => {
						this.setTrackHide(e.target.getAttribute('track-id'), e.target.classList.contains('bi-eye'));
						return false;
					})

					trackElement.querySelector('.mxl-track-volume').setAttribute('track-id', i);
					trackElement.querySelector('.mxl-track-volume').addEventListener('change', (e) => {
						this.setTrackVolume(e.target.getAttribute('track-id'), e.target.valueAsNumber);
						return false;
					});

					trackList.appendChild(trackElement);
				});
				score.tracks.forEach((track, i) => {
					const settings = this.getTrackSettings(i);
					this.setTrackMute(i, settings.mute);
					this.setTrackHide(i, settings.hide)
					this.setTrackVolume(i, settings.volume);
					document.querySelector(`.mxl-track-volume[track-id="${i}"]`).value = settings.volume;
				});

				document.querySelector(`.mxl-reset`).addEventListener('click', (e) => {
					this.track_defaults.forEach((track, i) => {
						this.setTrackMute(i, track.mute);
						this.setTrackHide(i, track.hide);
						this.setTrackVolume(i, track.volume);
						document.querySelector(`.mxl-track-volume[track-id="${i}"]`).value = track.volume;
					})
				})
			});
			return Promise.resolve();
		}

		async populate_controls() {
			this.api.scoreLoaded.on((score) => {
				document.querySelector('.mxl-player-play').addEventListener('click', (e) => {
					if (!e.target.disabled)
						this.api.playPause();
				});
				document.querySelector('.mxl-songinfo').innerText =
					`${score.title} - ${score.artist}`.replace(/^ - /, '').replace(/ - $/, '');
			});
			this.api.playerReady.on(() => {
				document.querySelector('.mxl-player-play').disabled = false;
				document.querySelector('.mxl-loading').remove();
				document.querySelector('.mxl-wrapper').style.visibility = 'visible';
			});
			this.api.playerStateChanged.on((e) => {
				if (e.state === alphaTab.synth.PlayerState.Playing) {
					document.querySelector('.mxl-player-play').classList.add('bi-pause-circle');
					document.querySelector('.mxl-player-play').classList.remove('bi-play-circle');
				} else {
					document.querySelector('.mxl-player-play').classList.add('bi-play-circle');
					document.querySelector('.mxl-player-play').classList.add('bi-pause-circle');
				}
			});
			this.api.playerPositionChanged.on((e) => {
				const currentSeconds = (e.currentTime / 1000) | 0;
				document.querySelector('.mxl-player-position').innerText =
					`${this.formatDuration(e.currentTime)} / ${this.formatDuration(e.endTime)}`;
			});
			document.querySelector('.mxl-speed-range').addEventListener('change', (e) => {
				this.api.playbackSpeed = parseInt(e.target.value) / 100;
			})
			document.querySelector('.mxl-zoom-range').addEventListener('change', (e) => {
				this.api.settings.display.scale = parseInt(e.target.value) / 100;
				this.api.updateSettings();
				this.api.render();
			})
			return Promise.resolve();
		}

		formatDuration(milliseconds) {
			let seconds = milliseconds / 1000;
			const minutes = (seconds / 60) | 0;
			seconds = (seconds - minutes * 60) | 0;
			return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, "0")}`;
	  	}

	}

	document.addEventListener('DOMContentLoaded', () => {
		new MusicXMLPlayer();
	});

})();
