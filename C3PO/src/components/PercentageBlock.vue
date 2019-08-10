<template>
	<div v-if="!isLoading && resultData" id="percentageBlock" class="container alert alert-secondary">
		<h1 v-if="resultData.length == 0">The Millenium Falcon can't make it ! - <b>0%</b></h1>
		<h1 v-if="resultData.length > 0">The Millenium Falcon can make it ! - <b>{{resultData[0].score.chanceToMakeIt}}%</b></h1>
	</div>
</template>

<script>
import { EventBus } from '../EventBus.js';

export default {
	name: 'PercentageBlock',
	components: { },
	mounted: function(){
		EventBus.$on('loadingState', isLoading => { this.isLoading = isLoading; });
		EventBus.$on('resultData', resultData => { this.resultData = resultData; });
	},
	data: function(){ return { resultData: undefined, isLoading: false }; }
};
</script>

<style scoped>
	#percentageBlock{ text-align: center; }
</style>
