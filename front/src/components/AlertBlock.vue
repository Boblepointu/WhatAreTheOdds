<template>
	<div v-if="!isLoading && alertMessage" id="alertMessage" class="container alert alert-danger">
		<img class="iconAlert" src="../assets/iconAlert.svg"> {{ alertMessage }}		
	</div>
</template>

<script>
import { EventBus } from '../EventBus.js';

export default {
	name: 'AlertBlock',
	components: { },
	mounted: function(){
		EventBus.$on('loadingState', isLoading => { this.isLoading = isLoading; });
		EventBus.$on('alertMessage', alertMessage => { this.alertMessage = alertMessage; });
	},
	data: function(){ 
		return { alertMessage: "", isLoading: false }; 
	}
};
</script>

<style scoped>
	#alertMessage{ text-align: center; }
	#alertMessage .iconAlert{
		height: 100%;
		width: 1em;
	}
</style>
