webpackJsonp([1],{"9M+g":function(t,e){},"9gAc":function(t,e){},DEN3:function(t,e){t.exports={DevMode:!1,DevModeServerUrl:"http://127.0.0.1:3000"}},DZXw:function(t,e,a){t.exports=a.p+"static/media/allSystemsReady.5fdddc2.mp3"},H3ml:function(t,e,a){t.exports=a.p+"static/media/againsProgramming.38f7019.mp3"},HiBB:function(t,e){},Jmt5:function(t,e){},"K+DW":function(t,e){},LMSv:function(t,e){t.exports="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSIxMDI0IiB3aWR0aD0iMTAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAwNS44NTQgODAwLjI0N2wtNDM4LjI4Ni03NjdDNTU2LjE3MyAxMy4zMDYwMDAwMDAwMDAwNCA1MzQuOTY3IDEgNTEyIDFzLTQ0LjE3MyAxMi4zMDYtNTUuNTY3IDMyLjI0N2wtNDM4LjI4NiA3NjdjLTExLjMxOSAxOS44MDktMTEuMjM4IDQ0LjE0NCAwLjIxMyA2My44NzZDMjkuODExIDg4My44NTUgNTAuODk5IDg5NiA3My43MTQgODk2aDg3Ni41NzJjMjIuODE0IDAgNDMuOTAzLTEyLjE0NSA1NS4zNTQtMzEuODc3UzEwMTcuMTczIDgyMC4wNTYgMTAwNS44NTQgODAwLjI0N3pNNTc2IDc2OEg0NDhWNjQwaDEyOFY3Njh6TTU3NiA1NzZINDQ4VjMyMGgxMjhWNTc2eiIvPjwvc3ZnPg=="},NHnr:function(t,e,a){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=a("7+uW"),n=new i.a,s={render:function(){this.$createElement;this._self._c;return this._m(0)},staticRenderFns:[function(){var t=this.$createElement,e=this._self._c||t;return e("div",{staticClass:"container alert alert-secondary",attrs:{id:"header"}},[e("div",{staticClass:"row"},[e("div",{staticClass:"logoHolder col-md-6 offset-md-3 col-sm-8 offset-sm-2 col-8 offset-2"},[e("img",{staticClass:"logo",attrs:{src:a("bAOe")}})]),this._v(" "),e("div",{staticClass:"titleHolder col-md-6 offset-md-3 col-sm-8 offset-sm-2 col-8 offset-2"},[e("h1",[this._v("Onboard quantum computer")]),this._v(" "),e("h2",[this._v("C3PO interface")])])])])}]};var o=a("VU/8")({name:"Header"},s,!1,function(t){a("9gAc")},"data-v-000837b3",null).exports,r=a("RKAd"),c={name:"Header",components:{VueJsonPretty:a.n(r).a},mounted:function(){var t=this;n.$on("loadingState",function(e){t.isLoading=e}),n.$on("dataState",function(e){t.isDataValid=e}),n.$on("data",function(e){t.data=e})},methods:{rawDataChanged:function(){try{n.$emit("data",JSON.parse(this.rawData)),n.$emit("dataState",!0)}catch(t){this.alertMessage="Provided file isn't JSON valid. Please check it out !",n.$emit("dataState",!1)}},handleFileUpload:function(){var t=this;n.$emit("dataState",!1),this.alertMessage=void 0,this.rawData="";var e=this.$refs.file.files[0];if("application/json"==e.type){n.$emit("loadingState",!0);var a=new FileReader;a.readAsText(e),a.onload=function(e){t.rawData=a.result;try{n.$emit("data",JSON.parse(t.rawData)),n.$emit("dataState",!0)}catch(e){n.$emit("dataState",!1),t.alertMessage="Provided file isn't JSON valid. Please check it out !",n.$emit("C3POTrigger","againstProgramming")}n.$emit("loadingState",!1)}}else n.$emit("dataState",!1),this.alertMessage="Provided file isn't a JSON file. Please check it out !",this.rawData="",n.$emit("C3POTrigger","againstProgramming")}},data:function(){return{isDataValid:!1,isLoading:!1,alertMessage:"",rawData:"",data:{},prettifierLevel:1}}},u={render:function(){var t=this,e=t.$createElement,i=t._self._c||e;return t.isLoading?t._e():i("div",{staticClass:"container alert alert-info",attrs:{id:"intelForm"}},[t._m(0),t._v(" "),i("div",{staticClass:"row"},[i("div",{staticClass:"col-md-4 offset-md-1 col-12 col-sm-12"},[i("h4",{staticClass:"uploadSubtitle"},[t._v("Select a file or input JSON text")]),t._v(" "),i("div",{staticClass:"fileUpload"},[i("input",{ref:"file",attrs:{type:"file"},on:{change:function(e){return t.handleFileUpload()}}})]),t._v(" "),i("textarea",{directives:[{name:"model",rawName:"v-model",value:t.rawData,expression:"rawData"}],staticClass:"jsonInput",domProps:{value:t.rawData},on:{keyup:t.rawDataChanged,input:function(e){e.target.composing||(t.rawData=e.target.value)}}})]),t._v(" "),i("div",{staticClass:"col-md-4 offset-md-2 col-12 col-sm-12"},[i("h4",{staticClass:"pretiffierSubtitle"},[t._v("Prettified JSON file")]),t._v(" "),t.isDataValid?i("div",[i("vue-json-pretty",{staticClass:"jsonPrettifier",attrs:{deep:t.prettifierLevel,data:t.data}})],1):t._e(),t._v(" "),!t.isDataValid&&t.alertMessage?i("div",[i("div",{staticClass:"prettifierAlert alert alert-warning"},[i("img",{staticClass:"iconAlert",attrs:{src:a("LMSv")}}),i("br"),t._v("\n\t\t\t\t\t"+t._s(t.alertMessage)+"\n\t\t\t\t")])]):t._e(),t._v(" "),t.isDataValid||t.alertMessage?t._e():i("div",[i("div",{staticClass:"prettifierAlert alert alert-dark"},[t._v("\n\t\t\t\t\tWaiting for data input !\n\t\t\t\t")])])])])])},staticRenderFns:[function(){var t=this.$createElement,e=this._self._c||t;return e("div",{staticClass:"row"},[e("div",{staticClass:"titleHolder col-md-6 offset-md-3 col-sm-6 offset-sm-3 col-8 offset-2"},[e("h1",[this._v("Empire intel :")])])])}]};var l=a("VU/8")(c,u,!1,function(t){a("RM71")},"data-v-4e9439a6",null).exports,M={name:"RotateLoader",props:{loading:{type:Boolean,default:!0},color:{type:String,default:"#5dc596"},size:{type:String,default:"15px"},margin:{type:String,default:"2px"},radius:{type:String,default:"100%"}},data:function(){return{spinnerStyle:{backgroundColor:this.color,height:this.size,width:this.size,margin:this.margin,borderRadius:this.radius}}}},d={render:function(){var t=this.$createElement,e=this._self._c||t;return e("div",{directives:[{name:"show",rawName:"v-show",value:this.loading,expression:"loading"}],staticClass:"v-spinner"},[e("div",{staticClass:"v-rotate v-rotate1",style:this.spinnerStyle},[e("div",{staticClass:"v-rotate v-rotate2",style:this.spinnerStyle}),e("div",{staticClass:"v-rotate v-rotate3",style:this.spinnerStyle})])])},staticRenderFns:[]};var L={name:"LoadingBlock",components:{RotateLoader:a("VU/8")(M,d,!1,function(t){a("HiBB")},null,null).exports},mounted:function(){var t=this;n.$on("loadingState",function(e){t.isLoading=e})},data:function(){return{isLoading:!1}}},N={render:function(){var t=this.$createElement,e=this._self._c||t;return this.isLoading?e("div",{staticClass:"container alert alert-info",attrs:{id:"loadingHolder"}},[e("rotate-loader")],1):this._e()},staticRenderFns:[]};var g=a("VU/8")(L,N,!1,function(t){a("yc2F")},"data-v-6b3405ac",null).exports,j=a("Xxa5"),D=a.n(j),m=a("exGp"),v=a.n(m),f=a("DEN3"),y=a.n(f),T=a("mtWM"),w=a.n(T),C={name:"LoadingBlock",components:{},mounted:function(){var t=this;n.$on("loadingState",function(e){t.isLoading=e}),n.$on("dataState",function(e){t.isDataValid=e}),n.$on("data",function(e){t.data=e})},methods:{launchComputation:function(){var t=v()(D.a.mark(function t(){var e,a;return D.a.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,n.$emit("resultData",[]),n.$emit("alertMessage",""),n.$emit("loadingState",!0),e="",y.a.DevMode&&(e=y.a.DevModeServerUrl),t.next=8,w.a.post(e+"/compute",{data:this.data});case 8:a=t.sent,n.$emit("resultData",a.data),0==a.data.length?n.$emit("C3POTrigger","doomed"):n.$emit("C3POTrigger","systemsReady"),t.next=19;break;case 13:t.prev=13,t.t0=t.catch(0),t.t0.message&&n.$emit("alertMessage","The central computer seems offline. ("+t.t0.message+")"),t.t0.response&&n.$emit("alertMessage","The central computer won't accept our data ! ("+t.t0.response.data+")"),n.$emit("resultData",void 0),n.$emit("C3POTrigger","againstProgramming");case 19:n.$emit("loadingState",!1);case 20:case"end":return t.stop()}},t,this,[[0,13]])}));return function(){return t.apply(this,arguments)}}()},data:function(){return{isLoading:!1,isDataValid:!1,data:{}}}},p={render:function(){var t=this,e=t.$createElement,a=t._self._c||e;return t.isLoading?t._e():a("div",{staticClass:"container alert alert-primary",attrs:{id:"computeBlock"}},[a("div",{staticClass:"row"},[a("div",{staticClass:"computeButton col-md-6 offset-md-3 col-sm-6 offset-sm-3 col-8 offset-2"},[t.isDataValid?t._e():a("button",{staticClass:"btn btn-dark",attrs:{type:"button",disabled:""}},[t._v("Launch computation !")]),t._v(" "),t.isDataValid?a("button",{staticClass:"btn btn-dark",attrs:{type:"button"},on:{click:function(e){return t.launchComputation()}}},[t._v("Launch computation !")]):t._e()])])])},staticRenderFns:[]};var z=a("VU/8")(C,p,!1,function(t){a("sDNr")},"data-v-3dc7ea19",null).exports,h={name:"ResultsBlock",components:{},mounted:function(){var t=this;n.$on("loadingState",function(e){t.isLoading=e}),n.$on("resultData",function(e){t.resultData=e})},data:function(){return{resultData:void 0,isLoading:!1}}},I={render:function(){var t=this,e=t.$createElement,a=t._self._c||e;return!t.isLoading&&t.resultData&&t.resultData.length>0?a("div",{staticClass:"container alert alert-success",attrs:{id:"resultsBlock"}},[a("h1",{staticClass:"title"},[t._v("Selected routes :")]),t._v(" "),t._l(t.resultData,function(e,i,n){return a("div",{staticClass:"row"},[a("div",{staticClass:"alert alert-secondary col-md-12"},[a("h4",[t._v("Route #"+t._s(i+1))]),t._v(" "),a("h6",[a("b",[t._v("Odds to make it safe :")]),t._v(" "+t._s(e.score.chanceToMakeIt)+"%")]),t._v(" "),a("h6",[a("b",[t._v("Time to travel :")]),t._v(" "+t._s(e.score.travelTime)+" days")]),t._v(" "),a("h6",{staticClass:"forceWrap"},[a("b",[t._v("Route identifier :")]),t._v(" "+t._s(e.identifier))])])])})],2):t._e()},staticRenderFns:[]};var x=a("VU/8")(h,I,!1,function(t){a("w7aS")},"data-v-0e9798dc",null).exports,S={name:"PercentageBlock",components:{},mounted:function(){var t=this;n.$on("loadingState",function(e){t.isLoading=e}),n.$on("resultData",function(e){t.resultData=e})},data:function(){return{resultData:void 0,isLoading:!1}}},O={render:function(){var t=this,e=t.$createElement,a=t._self._c||e;return!t.isLoading&&t.resultData?a("div",{staticClass:"container alert alert-secondary",attrs:{id:"percentageBlock"}},[0==t.resultData.length?a("h1",[t._v("The Millenium Falcon can't make it ! - "),a("b",[t._v("0%")])]):t._e(),t._v(" "),t.resultData.length>0?a("h1",[t._v("The Millenium Falcon can make it ! - "),a("b",[t._v(t._s(t.resultData[0].score.chanceToMakeIt)+"%")])]):t._e()]):t._e()},staticRenderFns:[]};var A=a("VU/8")(S,O,!1,function(t){a("K+DW")},"data-v-0cd38b02",null).exports,E={name:"AlertBlock",components:{},mounted:function(){var t=this;n.$on("loadingState",function(e){t.isLoading=e}),n.$on("alertMessage",function(e){t.alertMessage=e})},data:function(){return{alertMessage:"",isLoading:!1}}},_={render:function(){var t=this.$createElement,e=this._self._c||t;return!this.isLoading&&this.alertMessage?e("div",{staticClass:"container alert alert-danger",attrs:{id:"alertMessage"}},[e("img",{staticClass:"iconAlert",attrs:{src:a("LMSv")}}),this._v(" "+this._s(this.alertMessage)+"\t\t\n")]):this._e()},staticRenderFns:[]};var k=a("VU/8")(E,_,!1,function(t){a("PCSf")},"data-v-2b2d9930",null).exports,P=a("esyM"),U=a.n(P),Q=a("XqmP"),Y=a.n(Q),b=a("DZXw"),$=a.n(b),R=a("H3ml"),Z=a.n(R),B={name:"C3PO",components:{},mounted:function(){var t=this;n.$on("loadingState",function(e){t.isLoading=e}),n.$on("alertMessage",function(e){t.alertMessage=e}),n.$on("C3POTrigger",function(e){if(!t.audioIsRunning)if("doomed"==e)t.audioIsRunning=!0,(a=new Audio(Y.a)).onloadedmetadata=function(){setTimeout(function(){t.audioIsRunning=!1},1e3*a.duration)},a.play();else if("systemsReady"==e){t.audioIsRunning=!0,(a=new Audio($.a)).onloadedmetadata=function(){setTimeout(function(){t.audioIsRunning=!1},1e3*a.duration)},a.play()}else if("againstProgramming"==e){var a;t.audioIsRunning=!0,(a=new Audio(Z.a)).onloadedmetadata=function(){setTimeout(function(){t.audioIsRunning=!1},1e3*a.duration)},a.play()}}),setTimeout(function(){t.audioIsRunning=!0;var e=new Audio(U.a);e.onloadedmetadata=function(){setTimeout(function(){t.audioIsRunning=!1},1e3*e.duration)},e.play()},3e3)},data:function(){return{audioIsRunning:!1}}},V={render:function(){var t=this.$createElement;return(this._self._c||t)("div")},staticRenderFns:[]};var F={name:"App",components:{Header:o,IntelForm:l,LoadingBlock:g,ComputeBlock:z,ResultsBlock:x,PercentageBlock:A,AlertBlock:k,C3PO:a("VU/8")(B,V,!1,function(t){a("c01R")},"data-v-643d2444",null).exports}},J={render:function(){var t=this.$createElement,e=this._self._c||t;return e("div",{attrs:{id:"app"}},[e("Header"),this._v(" "),e("IntelForm"),this._v(" "),e("LoadingBlock"),this._v(" "),e("ComputeBlock"),this._v(" "),e("PercentageBlock"),this._v(" "),e("ResultsBlock"),this._v(" "),e("AlertBlock"),this._v(" "),e("C3PO")],1)},staticRenderFns:[]};var H=a("VU/8")(F,J,!1,function(t){a("nTiT")},null,null).exports;a("Jmt5"),a("9M+g");i.a.config.productionTip=!1,new i.a({el:"#app",components:{App:H},template:"<App/>"})},PCSf:function(t,e){},RM71:function(t,e){},XqmP:function(t,e,a){t.exports=a.p+"static/media/wereDoomed.96b8012.mp3"},bAOe:function(t,e){t.exports="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE3LjEuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDIxMy41NjMgMjEzLjU2MyIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMjEzLjU2MyAyMTMuNTYzOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8cGF0aCBkPSJNMTU4LjMzOSw2OC4zMzJsLTM4LjAxMiwzOC4wMTNjLTEuNjU0LTMuMjIyLTMuODIyLTYuMjQ3LTYuNTE4LTguOTQyYy0yLjY2NC0yLjY2NC01LjY3OC00Ljg0OC04LjkzMy02LjUyNmwzOC4wMTEtMzguMDExDQoJYzIuODYsMi4yMzIsNS42MTUsNC42MzIsOC4yMjEsNy4yMzhDMTUzLjcwMSw2Mi42OTYsMTU2LjEwMyw2NS40NTQsMTU4LjMzOSw2OC4zMzJ6IE03My44MTYsMTM3LjM5NQ0KCWMzLjkyNSwzLjkyNSw5LjE0Myw2LjA4NiwxNC42OTMsNi4wODZjNS41NSwwLDEwLjc2OC0yLjE2MiwxNC42OTItNi4wODZjOC4xMDItOC4xMDIsOC4xMDItMjEuMjg0LDAtMjkuMzg2DQoJYy0zLjkyNC0zLjkyNC05LjE0My02LjA4Ni0xNC42OTItNi4wODZjLTUuNTUxLDAtMTAuNzcsMi4xNjItMTQuNjk0LDYuMDg2QzY1LjcxNSwxMTYuMTExLDY1LjcxNSwxMjkuMjk0LDczLjgxNiwxMzcuMzk1eg0KCSBNMjEwLjExNiwxMTQuNTYxYy0wLjAwOC0wLjAwNy0wLjA3Ny0wLjA3Ny0wLjA4NC0wLjA4NGMtMi4yMzYtMi4yMzYtNS4yMS0zLjQ2Ny04LjM3Mi0zLjQ2N2MtMy4xNjMsMC02LjEzNywxLjIzMi04LjM3MiwzLjQ2OA0KCWwtOS41MDMsOS41MDNsLTAuMTMyLTAuMDA1bDI0LjYwOC01Ny40MzRjMS4yMDgtMi44MTgsMC41NzgtNi4wODgtMS41OS04LjI1N2wtOC41MzYtOC41MzZsLTczLjg4Niw3My44ODcNCgljLTAuMjI5LDguODQ4LTMuNzAyLDE3LjYyOC0xMC40NCwyNC4zNjZjLTYuNzU5LDYuNzU4LTE1Ljc0MywxMC40OC0yNS4zLDEwLjQ4Yy05LjU1OCwwLTE4LjU0Mi0zLjcyMi0yNS4zMDEtMTAuNDgNCgljLTEzLjk0OS0xMy45NS0xMy45NDktMzYuNjQ4LDAtNTAuNTk5YzYuNTQyLTYuNTQxLDE1LjE3LTEwLjIyNywyNC4zODQtMTAuNDU3bDczLjg2OS03My44NjlsLTguNTM2LTguNTM2DQoJYy0yLjE2Ny0yLjE2Ny01LjQzNS0yLjc5Ny04LjI1Ny0xLjU5TDYyLjk5NCwzNy45NDZjLTcuNTk5LDIuMjg0LTE0Ljg4OCw1LjU4LTIxLjY2Myw5Ljg1NWMtMS45MjksMS4yMTctMy4xOTgsMy4yNDQtMy40NTIsNS41MQ0KCWMtMC4yLDEuNzk0LDAuMjU0LDMuNTgzLDEuMjUyLDUuMDVMMjQuMTY4LDczLjMyNGMtMS40NjYtMC45OTctMy4yNTctMS40NTEtNS4wNDktMS4yNTFjLTIuMjY3LDAuMjUzLTQuMjk0LDEuNTIzLTUuNTExLDMuNDUxDQoJQzMuMDY0LDkyLjIzMy0xLjU5NywxMTIuMzExLDAuNDg1LDEzMi4wNTljMi4xMTIsMjAuMDUxLDExLjE0MywzOC45NTksMjUuNDI1LDUzLjI0MmMxNi43MTIsMTYuNzExLDM4LjkzMiwyNS45MTUsNjIuNTY4LDI1LjkxNg0KCWMwLjAwMiwwLDAuMDAxLDAsMC4wMDMsMGMxNi43NjksMCwzMy4wOTQtNC43MDgsNDcuMjA3LTEzLjYxM2MxLjkyOS0xLjIxNywzLjE5OC0zLjI0NSwzLjQ1Mi01LjUxMQ0KCWMwLjItMS43OTMtMC4yNTUtMy41ODItMS4yNTItNS4wNDlsMTQuOTYyLTE0Ljk2M2MxLjQ2NywwLjk5OCwzLjI1NCwxLjQ1NSw1LjA1MSwxLjI1MmMyLjI2Ni0wLjI1Myw0LjI5My0xLjUyMyw1LjUxLTMuNDUyDQoJYzMuNjUyLTUuNzg4LDYuNTgzLTExLjk4NSw4Ljc4NC0xOC40MjlsMTMuODU0LDAuNDk3YzAuMDkxLDAuMDAzLDAuMTgzLDAuMDA1LDAuMjczLDAuMDA1YzIuMDkyLDAsMy45OTEtMC44NjgsNS4zNTctMi4yNjYNCgljMC4wNDEtMC4wMzksMC4wODUtMC4wNzMsMC4xMjUtMC4xMTNsMTguMjktMTguMjkxYzIuMjM2LTIuMjM2LDMuNDY5LTUuMjEsMy40NjktOC4zNzNTMjEyLjMzLDExNi43NzUsMjEwLjExNiwxMTQuNTYxeiIvPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPC9zdmc+DQo="},c01R:function(t,e){},esyM:function(t,e,a){t.exports=a.p+"static/media/secretMission.5027bf4.mp3"},nTiT:function(t,e){},sDNr:function(t,e){},w7aS:function(t,e){},yc2F:function(t,e){}},["NHnr"]);
//# sourceMappingURL=app.e182351d92714446bb75.js.map