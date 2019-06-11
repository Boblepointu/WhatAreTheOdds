<template>
	<div v-if="isLoading" id="loadingHolder" class="container alert alert-info">
		<rotate-loader></rotate-loader>
	</div>
</template>

<script>
import { EventBus } from '../EventBus.js';
import RotateLoader from 'vue-spinner/src/RotateLoader.vue';

export default {
	name: 'LoadingBlock',
	components: { RotateLoader },
	mounted: function(){
		EventBus.$on('loadingState', isLoading => { this.isLoading = isLoading; });
	},
	data: function(){ return { isLoading: false }; }
};
</script>

<style scoped>
	#loadingHolder{
		text-align: center;
		margin-top: 1em;
		margin-bottom: 1em;
		padding: 4em 0;
	}
</style>
