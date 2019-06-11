<template>
		<div v-if="!isLoading" id="intelForm" class="container alert alert-info">
			<div class="row">
				<div class="titleHolder col-md-6 offset-md-3 col-sm-6 offset-sm-3 col-8 offset-2">
					<h1>Empire intel :</h1>
				</div>
			</div>
			<div class="row">
				<div class="col-md-4 offset-md-1 col-12 col-sm-12">
					<h4 class="uploadSubtitle">Select a file or input JSON text</h4>
					<div class="fileUpload">
						<input type="file"
								ref="file"
								v-on:change="handleFileUpload()"/>
					</div>
					<textarea class="jsonInput" 
								v-on:keyup="rawDataChanged"
								v-model="rawData" />
				</div>
				<div class="col-md-4 offset-md-2 col-12 col-sm-12">
					<h4 class="pretiffierSubtitle">Prettified JSON file</h4>
					<div v-if="isDataValid">
						<vue-json-pretty class="jsonPrettifier"
							:deep=prettifierLevel
							:data=data />
					</div>
					<div v-if="!isDataValid && alertMessage">
						<div class="prettifierAlert alert alert-warning">
							<img class="iconAlert" src="../assets/iconAlert.svg"><br />
							{{ alertMessage }}
						</div>	
					</div>
					<div v-if="!isDataValid && !alertMessage">
						<div class="prettifierAlert alert alert-dark">
							Waiting for data input !
						</div>
					</div>
				</div>
			</div>
		</div>
</template>

<script>
	import { EventBus } from '../EventBus.js';
	import VueJsonPretty from 'vue-json-pretty';

	export default { 
		name: 'Header',
		components: { VueJsonPretty },
		mounted: function(){
			EventBus.$on('loadingState', isLoading => { this.isLoading = isLoading; });
			EventBus.$on('dataState', isDataValid => { this.isDataValid = isDataValid; });
			EventBus.$on('data', data => { this.data = data; });
		},
		methods: {
			rawDataChanged: function(){
				try{
					EventBus.$emit('data', JSON.parse(this.rawData));
					EventBus.$emit('dataState', true);
				}catch(err){
					this.alertMessage = "Provided file isn't JSON valid. Please check it out !";
					EventBus.$emit('dataState', false);
				}
			},
			handleFileUpload: function(){
				EventBus.$emit('dataState', false);
				this.alertMessage = undefined;
				this.rawData = "";

				var file = this.$refs.file.files[0];
				if(file.type == "application/json"){
					EventBus.$emit('loadingState', true);
					var fileReader = new FileReader();
					fileReader.readAsText(file);
					fileReader.onload = event => {
						this.rawData = fileReader.result;
						try{
							EventBus.$emit('data', JSON.parse(this.rawData));
							EventBus.$emit('dataState', true);
						}catch(err){
							EventBus.$emit('dataState', false);
							this.alertMessage = "Provided file isn't JSON valid. Please check it out !";
							EventBus.$emit('C3POTrigger', "againstProgramming");
						}
						EventBus.$emit('loadingState', false);
					}
				}else{
					EventBus.$emit('dataState', false);
					this.alertMessage = "Provided file isn't a JSON file. Please check it out !";
					this.rawData = "";
					EventBus.$emit('C3POTrigger', "againstProgramming");
				}
			}
		},
		data: function(){
			return {
				isDataValid: false
				, isLoading: false				
				, alertMessage: ""
				, rawData: ""
				, data: {}
				, prettifierLevel: 1
			};
		}
	};
</script>

<style scoped>
	#intelForm{
		min-height: 25em;
	}
	#intelForm .titleHolder{
		text-align: center;
		color: black;
	}
	#intelForm .jsonInput{
		width: 100%;
		min-height: 10em;
		height: calc(100% - 5.5em);
		resize: none;
		padding: 0.5em;
	}
	#intelForm .jsonPrettifier{
		margin-top: 4em;
		width: 100%;
		resize: none;
		background-color: white;
		padding: 1em;
	}
	#intelForm .prettifierAlert{
		margin-top: 4em;
		text-align: center;
	}
	#intelForm .empireDataSubtitle{ text-align: center;	}
	#intelForm .fileUpload{
		text-align: center;
		margin: 1em 0;
	}

	#intelForm .prettifierAlert .iconAlert{
		height: 100%;
		width: 1em;
	}	
</style>
