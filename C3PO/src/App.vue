<template>
	<div id="app">
		<Header />
		<IntelForm />
		<LoadingBlock />
		<ComputeBlock />
		<PercentageBlock />
		<ResultsBlock />
		<AlertBlock />
		<C3PO />
	</div>
</template>

<script>
	import { EventBus } from './EventBus.js';
	import Header from './components/Header.vue';
	import IntelForm from './components/IntelForm.vue';
	import LoadingBlock from './components/LoadingBlock.vue';
	import ComputeBlock from './components/ComputeBlock.vue';
	import ResultsBlock from './components/ResultsBlock.vue';
	import PercentageBlock from './components/PercentageBlock.vue';
	import AlertBlock from './components/AlertBlock.vue';
	import C3PO from './components/C3PO.vue';

	export default {
		name: 'App',
		components: { 
			Header
			, IntelForm
			, LoadingBlock
			, ComputeBlock
			, ResultsBlock
			, PercentageBlock
			, AlertBlock
			, C3PO
		}
	}
</script>

<style>
	#app{ margin: 3vh 3vw; }	
</style>
