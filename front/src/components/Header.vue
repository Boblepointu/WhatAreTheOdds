<template>
	<div id="header" class="container alert alert-secondary">
		<div class="row">
			<div class="logoHolder col-md-6 offset-md-3 col-sm-8 offset-sm-2 col-8 offset-2">
				<img class="logo" src="../assets/logoMFalcon.svg">
			</div>
			<div class="titleHolder col-md-6 offset-md-3 col-sm-8 offset-sm-2 col-8 offset-2">
				<h1>Onboard quantum computer</h1>
				<h2>C3PO interface</h2>
			</div>
		</div>
	</div>
</template>

<script>
export default {
  name: 'Header'
}
</script>

<style scoped>
	#header{}
	#header .logo{ max-height: 25vh; }
	#header .logoHolder{ text-align: center; }
	#header .titleHolder{
		text-align: center;
		color: black;
	}
</style>
