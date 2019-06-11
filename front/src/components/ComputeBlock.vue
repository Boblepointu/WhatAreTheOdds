<template>
	<div v-if="!isLoading" id="computeBlock" class="container alert alert-primary">
		<div class="row">
			<div class="computeButton col-md-6 offset-md-3 col-sm-6 offset-sm-3 col-8 offset-2">
				<button type="button" class="btn btn-dark" disabled v-if="!isDataValid">Launch computation !</button>
				<button type="button" class="btn btn-dark" v-on:click="launchComputation()" v-if="isDataValid">Launch computation !</button>
			</div>
		</div>
	</div>
</template>

<script>
import Config from '../config.json';
import { EventBus } from '../EventBus.js';
import Axios from 'axios';

export default {
	name: 'LoadingBlock',
	components: {  },
	mounted: function(){
		EventBus.$on('loadingState', isLoading => { this.isLoading = isLoading; });
		EventBus.$on('dataState', isDataValid => { this.isDataValid = isDataValid; });
		EventBus.$on('data', data => { this.data = data; });
	},
	methods: {
		launchComputation: async function(){
			try{
				EventBus.$emit('resultData', []);
				EventBus.$emit('alertMessage', "");
				EventBus.$emit('loadingState', true);

				var forced = "";
				if(Config.DevMode) forced = Config.DevModeServerUrl;

				var res = await Axios.post(forced+'/compute', { data: this.data });
				EventBus.$emit('resultData', res.data);
				if(res.data.length == 0) EventBus.$emit('C3POTrigger', "doomed");
				else EventBus.$emit('C3POTrigger', "systemsReady");
			}catch(err){ 
				if(err.message) EventBus.$emit('alertMessage', `The central computer seems offline. (${err.message})`);
				if(err.response) EventBus.$emit('alertMessage', `The central computer won't accept our data ! (${err.response.data})`);
				EventBus.$emit('resultData', undefined);
				EventBus.$emit('C3POTrigger', "againstProgramming");
			}
			EventBus.$emit('loadingState', false);
		}
	},
	data: function(){
		return { isLoading: false, isDataValid: false, data: {}	};
	}
};
</script>

<style scoped>
	#computeBlock{}
	#computeBlock .computeButton{ text-align: center; }
</style>
