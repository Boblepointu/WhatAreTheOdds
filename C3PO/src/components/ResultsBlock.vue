<template>
	<div v-if="!isLoading && resultData && resultData.length > 0" id="resultsBlock" class="container alert alert-success">
		<h1 class="title">Selected routes :</h1>
		<div class="row" v-for="(route, key, index) in resultData">
			<div class="alert alert-secondary col-md-12">
				<h4>Route #{{key+1}}</h4>
				<h6><b>Odds to make it safe :</b> {{route.score.chanceToMakeIt}}%</h6>
				<h6><b>Time to travel :</b> {{route.score.travelTime}} days</h6>
				<h6 class="forceWrap"><b>Route identifier :</b> {{ route.identifier }}</h6>
			</div>
		</div>
	</div>
</template>

<script>
import { EventBus } from '../EventBus.js';

export default {
	name: 'ResultsBlock',
	components: { },
	mounted: function(){
		EventBus.$on('loadingState', isLoading => { this.isLoading = isLoading; });
		EventBus.$on('resultData', resultData => { this.resultData = resultData; });
	},
	data: function(){ return { resultData: undefined, isLoading: false }; }
};
</script>

<style scoped>
	#resultsBlock{ text-align: center; }
	#resultsBlock .title{ color: black;	}
	.forceWrap{ overflow-wrap: anywhere; }
</style>
