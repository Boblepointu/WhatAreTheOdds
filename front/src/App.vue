<template>
	<div id="app">
		<div id="header" class="container alert alert-secondary">
			<div class="row">
				<div id="logoHolder" class="col-md-6 offset-md-3 col-sm-8 offset-sm-2 col-8 offset-2">
					<img id="logo" src="./assets/logoMFalcon.svg">
				</div>
				<div id="titleHolder" class="col-md-6 offset-md-3 col-sm-8 offset-sm-2 col-8 offset-2">
					<h1>Onboard quantum computer</h1>
					<h2>C3PO interface</h2>
				</div>				
			</div>
		</div>

		<div id="loadingHolder" class="container alert alert-info" v-if="isLoading">
			<rotate-loader></rotate-loader>
		</div>

		<div id="empireData" class="container alert alert-info" v-if="!isLoading">
			<div class="row">
				<div id="empireDataTitleHolder" class="col-md-6 offset-md-3 col-sm-6 offset-sm-3 col-8 offset-2">
					<h1>Empire intel</h1>
				</div>
			</div>
			<div class="row">
				<div class="col-md-4 offset-md-1 col-12 col-sm-12">
					<h4 class="empireDataSubtitle">Select a file or input JSON text</h4>

					<div id="empireDataFileUpload">
						<input type="file" id="file" ref="file" v-on:change="handleFileUpload()"/>
					</div>

					<textarea id="empireDataTextarea" v-on:keyup="rawEmpireDataChanged" v-model="rawEmpireData">
					</textarea>
				</div>
				<div class="col-md-4 offset-md-2 col-12 col-sm-12">
					<h4 class="empireDataSubtitle">Prettified JSON file</h4>

					<div v-if="jsonValid">
						<vue-json-pretty
							id="empireJsonPrettifier"
							:data=empireDataJson>
						</vue-json-pretty>	
					</div>
					<div v-if="!jsonValid && jsonAlertMessage">
						<div id="empireJsonPrettifierAlert" class="alert alert-warning" role="alert">
							<img class="iconAlert" src="./assets/iconAlert.svg"><br />
							{{ jsonAlertMessage }}
						</div>	
					</div>
					<div v-if="!jsonValid && !jsonAlertMessage">
						<div id="empireJsonPrettifierAlert" class="alert alert-dark" role="alert">
							Waiting for data input !
						</div>	
					</div>									
				</div>
			</div>		
		</div>

		<div id="computeBlock" class="container alert alert-primary" v-if="!isLoading">
			<div class="row">
				<div id="computeButton" class="col-md-6 offset-md-3 col-sm-6 offset-sm-3 col-8 offset-2">
					<button type="button" class="btn btn-dark" disabled v-if="!jsonValid || isLoading">Launch computation !</button>
					<button type="button" class="btn btn-dark" v-on:click="launchComputation()" v-if="jsonValid && !isLoading">Launch computation !</button>
				</div>
			</div>
		</div>

		<div id="globalAlertMessage" class="container alert alert-danger" v-if="globalAlertMessage">
			<img class="iconAlert" src="./assets/iconAlert.svg"> {{ globalAlertMessage }}		
		</div>

		<div id="percentageBlock" class="container alert alert-secondary" v-if="resultsFetched && !isLoading">
			<h1 v-if="results.length == 0">The Millenium Falcon can't make it ! - <b>0%</b></h1>
			<h1 v-if="results.length > 0">The Millenium Falcon can make it ! - <b>{{results[0].score.chanceToMakeIt}}%</b></h1>
		</div>

		<div id="resultsBlock" class="container alert alert-success" v-if="results.length > 0">
			<h1 id="resultsBlockTitle">Selected routes :</h1>
			<div class="row" v-for="(route, key, index) in results">
				<div class="alert alert-secondary col-md-12">
					<h4>Route #{{key+1}}</h4>
					<h6><b>Odds to make it safe :</b> {{route.score.chanceToMakeIt}}%</h6>
					<h6><b>Time to travel :</b> {{route.travelTime}} days</h6>
					<h6><b>Route identifier :</b> {{ route.identifier }}</h6>
					<h6><b>WaitMap :</b> {{ route.waitMap }}</h6>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	import VueJsonPretty from 'vue-json-pretty'
	import RotateLoader from 'vue-spinner/src/RotateLoader.vue'
	const axios = require('axios');

	export default {
		name: 'App',
		components: { VueJsonPretty, RotateLoader },
		methods: {
			rawEmpireDataChanged: function(){
				try{
					this.empireDataJson = JSON.parse(this.rawEmpireData);
					this.jsonValid = true;
				}catch(err){
					this.jsonAlertMessage = "Provided file isn't JSON valid. Please check it out !";
					this.jsonValid = false;
				}
			},
			handleFileUpload: function(file){
				this.jsonValid = false;
				this.jsonAlertMessage = false;

				var file = this.$refs.file.files[0];
				if(file.type == "application/json"){
					this.isLoading = true;
					var fileReader = new FileReader();
					fileReader.readAsText(file);
					fileReader.onload = event => {
						this.rawEmpireData = fileReader.result;
						try{
							this.empireDataJson = JSON.parse(this.rawEmpireData);
							this.jsonValid = true;
						}catch(err){
							this.jsonValid = false;
							this.jsonAlertMessage = "Provided file isn't JSON valid. Please check it out !";
						}
						this.isLoading = false;
					}
				}else{
					this.jsonValid = false;
					this.jsonAlertMessage = "Provided file isn't a JSON file. Please check it out !";
					this.rawEmpireData = "";
				}
			},
			launchComputation: async function(){
				try{
					this.results = [];
					this.globalAlertMessage = "";
					this.isLoading = true;
					var forced = "http://127.0.0.1:3000"
					var res = await axios.post(forced+'/compute', { data: this.empireDataJson });
					this.results = res.data;
					this.resultsFetched = true;
				}catch(err){ 
					if(err.message){
						this.globalAlertMessage = `The central computer seems offline. (${err.message})`;
					}
					if(err.response){
						this.globalAlertMessage = `The central computer won't accept our data ! (${err.response.data})`;
					}
				}
				this.isLoading = false;
			}
		},
		data: function(){
			return {
				isLoading: false
				, globalAlertMessage: ""
				, jsonAlertMessage: ""
				, jsonValid: false
				, rawEmpireData: ""
				, empireDataJson: {}
				, resultsFetched: false
				, results : []
			}
		}
	}
</script>

<style>
	#app{
		margin: 3vh 3vw;
	}
	#header{}
		#logo{
			max-height: 25vh;
		}
		#logoHolder{
			text-align: center;
		}
		#titleHolder{
			text-align: center;
			color: black;
		}

	#loadingHolder{
		text-align: center;
		margin-top: 1em;
		margin-bottom: 1em;
		padding: 4em 0;
	}

	#resultsBlock{
		text-align: center;
	}
		#resultsBlockTitle{
			color: black;
		}

	#empireData{
		min-height: 25em;
	}
		#empireDataTitleHolder{
			text-align: center;
			color: black;
		}
		#empireDataTextarea{
			width: 100%;
			min-height: 10em;
			height: calc(100% - 8em);
			resize: none;
			padding: 0.5em;
		}
		#empireJsonPrettifier{
			margin-top: 4em;
			width: 100%;
			resize: none;
			background-color: white;
			padding: 1em;
		}
		#empireJsonPrettifierAlert{
			margin-top: 4em;
			text-align: center;
		}
		.empireDataSubtitle{
			text-align: center;
		}
		#empireDataFileUpload{
			text-align: center;
			margin: 1em 0;
		}
	#percentageBlock{ text-align: center; }
	#computeBlock{}
		#computeButton{
			text-align: center;
		}
	#globalAlertMessage{
		text-align: center;
	}
	.iconAlert{
		height: 100%;
		width: 1em;
	}
</style>
