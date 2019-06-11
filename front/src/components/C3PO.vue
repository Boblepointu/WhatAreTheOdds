<template>
	<div>
				
	</div>
</template>

<script>
import { EventBus } from '../EventBus.js';
import Config from '../config.json';
import SecretMissionAudio from '../assets/secretMission.mp3';
import WereDoomedAudio from '../assets/wereDoomed.mp3';
import AllSystemsReadyAudio from '../assets/allSystemsReady.mp3';
import AgainsProgrammingAudio from '../assets/againsProgramming.mp3';


export default {
	name: 'C3PO',
	components: { },
	mounted: function(){
		EventBus.$on('loadingState', isLoading => { this.isLoading = isLoading; });
		EventBus.$on('alertMessage', alertMessage => { this.alertMessage = alertMessage; });
		EventBus.$on('C3POTrigger', action => { 
			if(this.audioIsRunning) return;
			if(action == "doomed"){
				this.audioIsRunning = true;
				var audio = new Audio(WereDoomedAudio);
				audio.onloadedmetadata = () => { setTimeout(() => { this.audioIsRunning = false; }, audio.duration*1000); };
				audio.play();
			}
			else if(action == "systemsReady"){
				this.audioIsRunning = true;
				var audio = new Audio(AllSystemsReadyAudio);
				audio.onloadedmetadata = () => { setTimeout(() => { this.audioIsRunning = false; }, audio.duration*1000); };
				audio.play();
			}
			else if(action == "againstProgramming"){
				this.audioIsRunning = true;
				var audio = new Audio(AgainsProgrammingAudio);
				audio.onloadedmetadata = () => { setTimeout(() => { this.audioIsRunning = false; }, audio.duration*1000); };
				audio.play();
			}
		});

		setTimeout(() => {
			this.audioIsRunning = true;
			var audio = new Audio(SecretMissionAudio);
			audio.onloadedmetadata = () => { setTimeout(() => { this.audioIsRunning = false; }, audio.duration*1000); };
			audio.play();
		}, 3000);
	},
	data: function(){ return { audioIsRunning: false } }
};
</script>

<style scoped>
	#alertMessage{ text-align: center; }
	#alertMessage .iconAlert{
		height: 100%;
		width: 1em;
	}
</style>
