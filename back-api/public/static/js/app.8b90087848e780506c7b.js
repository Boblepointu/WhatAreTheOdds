webpackJsonp([1],{"7zNr":function(t,e){},"9M+g":function(t,e){},HiBB:function(t,e){},Jmt5:function(t,e){},LMSv:function(t,e){t.exports="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSIxMDI0IiB3aWR0aD0iMTAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAwNS44NTQgODAwLjI0N2wtNDM4LjI4Ni03NjdDNTU2LjE3MyAxMy4zMDYwMDAwMDAwMDAwNCA1MzQuOTY3IDEgNTEyIDFzLTQ0LjE3MyAxMi4zMDYtNTUuNTY3IDMyLjI0N2wtNDM4LjI4NiA3NjdjLTExLjMxOSAxOS44MDktMTEuMjM4IDQ0LjE0NCAwLjIxMyA2My44NzZDMjkuODExIDg4My44NTUgNTAuODk5IDg5NiA3My43MTQgODk2aDg3Ni41NzJjMjIuODE0IDAgNDMuOTAzLTEyLjE0NSA1NS4zNTQtMzEuODc3UzEwMTcuMTczIDgyMC4wNTYgMTAwNS44NTQgODAwLjI0N3pNNTc2IDc2OEg0NDhWNjQwaDEyOFY3Njh6TTU3NiA1NzZINDQ4VjMyMGgxMjhWNTc2eiIvPjwvc3ZnPg=="},NHnr:function(t,e,s){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var a=s("7+uW"),i=s("Xxa5"),M=s.n(i),r=s("exGp"),n=s.n(r),o=s("RKAd"),l=s.n(o),c={name:"RotateLoader",props:{loading:{type:Boolean,default:!0},color:{type:String,default:"#5dc596"},size:{type:String,default:"15px"},margin:{type:String,default:"2px"},radius:{type:String,default:"100%"}},data:function(){return{spinnerStyle:{backgroundColor:this.color,height:this.size,width:this.size,margin:this.margin,borderRadius:this.radius}}}},L={render:function(){var t=this.$createElement,e=this._self._c||t;return e("div",{directives:[{name:"show",rawName:"v-show",value:this.loading,expression:"loading"}],staticClass:"v-spinner"},[e("div",{staticClass:"v-rotate v-rotate1",style:this.spinnerStyle},[e("div",{staticClass:"v-rotate v-rotate2",style:this.spinnerStyle}),e("div",{staticClass:"v-rotate v-rotate3",style:this.spinnerStyle})])])},staticRenderFns:[]};var j=s("VU/8")(c,L,!1,function(t){s("HiBB")},null,null).exports,u=s("mtWM"),d={name:"App",components:{VueJsonPretty:l.a,RotateLoader:j},methods:{rawEmpireDataChanged:function(){try{this.empireDataJson=JSON.parse(this.rawEmpireData),this.jsonValid=!0}catch(t){this.jsonAlertMessage="Provided file isn't JSON valid. Please check it out !",this.jsonValid=!1}},handleFileUpload:function(t){var e=this;if(this.jsonValid=!1,this.jsonAlertMessage=!1,"application/json"==(t=this.$refs.file.files[0]).type){this.isLoading=!0;var s=new FileReader;s.readAsText(t),s.onload=function(t){e.rawEmpireData=s.result;try{e.empireDataJson=JSON.parse(e.rawEmpireData),e.jsonValid=!0}catch(t){e.jsonValid=!1,e.jsonAlertMessage="Provided file isn't JSON valid. Please check it out !"}e.isLoading=!1}}else this.jsonValid=!1,this.jsonAlertMessage="Provided file isn't a JSON file. Please check it out !",this.rawEmpireData=""},launchComputation:function(){var t=n()(M.a.mark(function t(){var e,s;return M.a.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,this.results=[],this.globalAlertMessage="",this.isLoading=!0,e="http://127.0.0.1:3000",t.next=7,u.post(e+"/compute",{data:this.empireDataJson});case 7:s=t.sent,this.results=s.data,console.log("res.data.length",s.data.length),this.resultsFetched=!0,t.next=17;break;case 13:t.prev=13,t.t0=t.catch(0),t.t0.message&&(this.resultsFetched=!1,this.globalAlertMessage="The central computer seems offline. ("+t.t0.message+")"),t.t0.response&&(this.resultsFetched=!1,this.globalAlertMessage="The central computer won't accept our data ! ("+t.t0.response.data+")");case 17:this.isLoading=!1;case 18:case"end":return t.stop()}},t,this,[[0,13]])}));return function(){return t.apply(this,arguments)}}()},data:function(){return{isLoading:!1,globalAlertMessage:"",jsonAlertMessage:"",jsonValid:!1,rawEmpireData:"",empireDataJson:{},resultsFetched:!1,results:[]}}},N={render:function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",{attrs:{id:"app"}},[t._m(0),t._v(" "),t.isLoading?a("div",{staticClass:"container alert alert-info",attrs:{id:"loadingHolder"}},[a("rotate-loader")],1):t._e(),t._v(" "),t.isLoading?t._e():a("div",{staticClass:"container alert alert-info",attrs:{id:"empireData"}},[t._m(1),t._v(" "),a("div",{staticClass:"row"},[a("div",{staticClass:"col-md-4 offset-md-1 col-12 col-sm-12"},[a("h4",{staticClass:"empireDataSubtitle"},[t._v("Select a file or input JSON text")]),t._v(" "),a("div",{attrs:{id:"empireDataFileUpload"}},[a("input",{ref:"file",attrs:{type:"file",id:"file"},on:{change:function(e){return t.handleFileUpload()}}})]),t._v(" "),a("textarea",{directives:[{name:"model",rawName:"v-model",value:t.rawEmpireData,expression:"rawEmpireData"}],attrs:{id:"empireDataTextarea"},domProps:{value:t.rawEmpireData},on:{change:t.rawEmpireDataChanged,input:function(e){e.target.composing||(t.rawEmpireData=e.target.value)}}})]),t._v(" "),a("div",{staticClass:"col-md-4 offset-md-2 col-12 col-sm-12"},[a("h4",{staticClass:"empireDataSubtitle"},[t._v("Prettified JSON file")]),t._v(" "),t.jsonValid?a("div",[a("vue-json-pretty",{attrs:{deep:"1",id:"empireJsonPrettifier",data:t.empireDataJson}})],1):t._e(),t._v(" "),!t.jsonValid&&t.jsonAlertMessage?a("div",[a("div",{staticClass:"alert alert-warning",attrs:{id:"empireJsonPrettifierAlert",role:"alert"}},[a("img",{staticClass:"iconAlert",attrs:{src:s("LMSv")}}),a("br"),t._v("\n\t\t\t\t\t\t"+t._s(t.jsonAlertMessage)+"\n\t\t\t\t\t")])]):t._e(),t._v(" "),t.jsonValid||t.jsonAlertMessage?t._e():a("div",[a("div",{staticClass:"alert alert-dark",attrs:{id:"empireJsonPrettifierAlert",role:"alert"}},[t._v("\n\t\t\t\t\t\tWaiting for data input !\n\t\t\t\t\t")])])])])]),t._v(" "),t.isLoading?t._e():a("div",{staticClass:"container alert alert-primary",attrs:{id:"computeBlock"}},[a("div",{staticClass:"row"},[a("div",{staticClass:"col-md-6 offset-md-3 col-sm-6 offset-sm-3 col-8 offset-2",attrs:{id:"computeButton"}},[!t.jsonValid||t.isLoading?a("button",{staticClass:"btn btn-dark",attrs:{type:"button",disabled:""}},[t._v("Launch computation !")]):t._e(),t._v(" "),t.jsonValid&&!t.isLoading?a("button",{staticClass:"btn btn-dark",attrs:{type:"button"},on:{click:function(e){return t.launchComputation()}}},[t._v("Launch computation !")]):t._e()])])]),t._v(" "),t.globalAlertMessage?a("div",{staticClass:"container alert alert-danger",attrs:{id:"globalAlertMessage"}},[a("img",{staticClass:"iconAlert",attrs:{src:s("LMSv")}}),t._v(" "+t._s(t.globalAlertMessage)+"\t\t\n\t")]):t._e(),t._v(" "),t.resultsFetched&&!t.isLoading?a("div",{staticClass:"container alert alert-secondary",attrs:{id:"percentageBlock"}},[0==t.results.length?a("h1",[t._v("The Millenium Falcon can't make it ! - "),a("b",[t._v("0%")])]):t._e(),t._v(" "),t.results.length>0?a("h1",[t._v("The Millenium Falcon can make it ! - "),a("b",[t._v(t._s(t.results[0].score.chanceToMakeIt)+"%")])]):t._e()]):t._e(),t._v(" "),t.results.length>0?a("div",{staticClass:"container alert alert-success",attrs:{id:"resultsBlock"}},[a("h1",{attrs:{id:"resultsBlockTitle"}},[t._v("Selected routes :")]),t._v(" "),t._l(t.results,function(e,s,i){return a("div",{staticClass:"row"},[a("div",{staticClass:"alert alert-secondary col-md-12"},[a("h4",[t._v("Route #"+t._s(s+1))]),t._v(" "),a("h6",[a("b",[t._v("Odds to make it safe :")]),t._v(" "+t._s(e.score.chanceToMakeIt)+"%")]),t._v(" "),a("h6",[a("b",[t._v("Time to travel :")]),t._v(" "+t._s(e.travelTime)+" days")]),t._v(" "),a("h6",[a("b",[t._v("Route identifier :")]),t._v(" "+t._s(e.identifier))]),t._v(" "),a("h6",[a("b",[t._v("WaitMap :")]),t._v(" "+t._s(e.waitMap))])])])})],2):t._e()])},staticRenderFns:[function(){var t=this.$createElement,e=this._self._c||t;return e("div",{staticClass:"container alert alert-secondary",attrs:{id:"header"}},[e("div",{staticClass:"row"},[e("div",{staticClass:"col-md-6 offset-md-3 col-sm-8 offset-sm-2 col-8 offset-2",attrs:{id:"logoHolder"}},[e("img",{attrs:{id:"logo",src:s("bAOe")}})]),this._v(" "),e("div",{staticClass:"col-md-6 offset-md-3 col-sm-8 offset-sm-2 col-8 offset-2",attrs:{id:"titleHolder"}},[e("h1",[this._v("Onboard quantum computer")]),this._v(" "),e("h2",[this._v("C3PO interface")])])])])},function(){var t=this.$createElement,e=this._self._c||t;return e("div",{staticClass:"row"},[e("div",{staticClass:"col-md-6 offset-md-3 col-sm-6 offset-sm-3 col-8 offset-2",attrs:{id:"empireDataTitleHolder"}},[e("h1",[this._v("Empire intel :")])])])}]};var g=s("VU/8")(d,N,!1,function(t){s("7zNr")},null,null).exports;s("Jmt5"),s("9M+g");a.a.config.productionTip=!1,new a.a({el:"#app",components:{App:g},template:"<App/>"})},bAOe:function(t,e){t.exports="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTcuMS4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIKCSB2aWV3Qm94PSIwIDAgMjEzLjU2MyAyMTMuNTYzIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAyMTMuNTYzIDIxMy41NjM7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHBhdGggZD0iTTE1OC4zMzksNjguMzMybC0zOC4wMTIsMzguMDEzYy0xLjY1NC0zLjIyMi0zLjgyMi02LjI0Ny02LjUxOC04Ljk0MmMtMi42NjQtMi42NjQtNS42NzgtNC44NDgtOC45MzMtNi41MjZsMzguMDExLTM4LjAxMQoJYzIuODYsMi4yMzIsNS42MTUsNC42MzIsOC4yMjEsNy4yMzhDMTUzLjcwMSw2Mi42OTYsMTU2LjEwMyw2NS40NTQsMTU4LjMzOSw2OC4zMzJ6IE03My44MTYsMTM3LjM5NQoJYzMuOTI1LDMuOTI1LDkuMTQzLDYuMDg2LDE0LjY5Myw2LjA4NmM1LjU1LDAsMTAuNzY4LTIuMTYyLDE0LjY5Mi02LjA4NmM4LjEwMi04LjEwMiw4LjEwMi0yMS4yODQsMC0yOS4zODYKCWMtMy45MjQtMy45MjQtOS4xNDMtNi4wODYtMTQuNjkyLTYuMDg2Yy01LjU1MSwwLTEwLjc3LDIuMTYyLTE0LjY5NCw2LjA4NkM2NS43MTUsMTE2LjExMSw2NS43MTUsMTI5LjI5NCw3My44MTYsMTM3LjM5NXoKCSBNMjEwLjExNiwxMTQuNTYxYy0wLjAwOC0wLjAwNy0wLjA3Ny0wLjA3Ny0wLjA4NC0wLjA4NGMtMi4yMzYtMi4yMzYtNS4yMS0zLjQ2Ny04LjM3Mi0zLjQ2N2MtMy4xNjMsMC02LjEzNywxLjIzMi04LjM3MiwzLjQ2OAoJbC05LjUwMyw5LjUwM2wtMC4xMzItMC4wMDVsMjQuNjA4LTU3LjQzNGMxLjIwOC0yLjgxOCwwLjU3OC02LjA4OC0xLjU5LTguMjU3bC04LjUzNi04LjUzNmwtNzMuODg2LDczLjg4NwoJYy0wLjIyOSw4Ljg0OC0zLjcwMiwxNy42MjgtMTAuNDQsMjQuMzY2Yy02Ljc1OSw2Ljc1OC0xNS43NDMsMTAuNDgtMjUuMywxMC40OGMtOS41NTgsMC0xOC41NDItMy43MjItMjUuMzAxLTEwLjQ4CgljLTEzLjk0OS0xMy45NS0xMy45NDktMzYuNjQ4LDAtNTAuNTk5YzYuNTQyLTYuNTQxLDE1LjE3LTEwLjIyNywyNC4zODQtMTAuNDU3bDczLjg2OS03My44NjlsLTguNTM2LTguNTM2CgljLTIuMTY3LTIuMTY3LTUuNDM1LTIuNzk3LTguMjU3LTEuNTlMNjIuOTk0LDM3Ljk0NmMtNy41OTksMi4yODQtMTQuODg4LDUuNTgtMjEuNjYzLDkuODU1Yy0xLjkyOSwxLjIxNy0zLjE5OCwzLjI0NC0zLjQ1Miw1LjUxCgljLTAuMiwxLjc5NCwwLjI1NCwzLjU4MywxLjI1Miw1LjA1TDI0LjE2OCw3My4zMjRjLTEuNDY2LTAuOTk3LTMuMjU3LTEuNDUxLTUuMDQ5LTEuMjUxYy0yLjI2NywwLjI1My00LjI5NCwxLjUyMy01LjUxMSwzLjQ1MQoJQzMuMDY0LDkyLjIzMy0xLjU5NywxMTIuMzExLDAuNDg1LDEzMi4wNTljMi4xMTIsMjAuMDUxLDExLjE0MywzOC45NTksMjUuNDI1LDUzLjI0MmMxNi43MTIsMTYuNzExLDM4LjkzMiwyNS45MTUsNjIuNTY4LDI1LjkxNgoJYzAuMDAyLDAsMC4wMDEsMCwwLjAwMywwYzE2Ljc2OSwwLDMzLjA5NC00LjcwOCw0Ny4yMDctMTMuNjEzYzEuOTI5LTEuMjE3LDMuMTk4LTMuMjQ1LDMuNDUyLTUuNTExCgljMC4yLTEuNzkzLTAuMjU1LTMuNTgyLTEuMjUyLTUuMDQ5bDE0Ljk2Mi0xNC45NjNjMS40NjcsMC45OTgsMy4yNTQsMS40NTUsNS4wNTEsMS4yNTJjMi4yNjYtMC4yNTMsNC4yOTMtMS41MjMsNS41MS0zLjQ1MgoJYzMuNjUyLTUuNzg4LDYuNTgzLTExLjk4NSw4Ljc4NC0xOC40MjlsMTMuODU0LDAuNDk3YzAuMDkxLDAuMDAzLDAuMTgzLDAuMDA1LDAuMjczLDAuMDA1YzIuMDkyLDAsMy45OTEtMC44NjgsNS4zNTctMi4yNjYKCWMwLjA0MS0wLjAzOSwwLjA4NS0wLjA3MywwLjEyNS0wLjExM2wxOC4yOS0xOC4yOTFjMi4yMzYtMi4yMzYsMy40NjktNS4yMSwzLjQ2OS04LjM3M1MyMTIuMzMsMTE2Ljc3NSwyMTAuMTE2LDExNC41NjF6Ii8+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo="}},["NHnr"]);
//# sourceMappingURL=app.8b90087848e780506c7b.js.map