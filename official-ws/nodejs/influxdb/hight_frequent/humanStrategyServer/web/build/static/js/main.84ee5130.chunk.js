(window.webpackJsonp=window.webpackJsonp||[]).push([[0],{18:function(e,t,a){e.exports=a(49)},24:function(e,t,a){},26:function(e,t,a){},47:function(e,t,a){},49:function(e,t,a){"use strict";a.r(t);var n=a(0),r=a.n(n),l=a(17),o=a.n(l),s=(a(24),a(4)),i=a(5),c=a(7),u=a(6),d=a(8),h=(a(26),a(3)),m=a(1),p=a.n(m),g=a(9),v=["XBTUSD","ETHUSD"],f=["stopMarket1h","stopMarket5m","market"],y={Buy:"green",Sell:"red"},E={long:"green",short:"red"},b={rsiOverTrade5m:{operators:["long","short"]},rsiDivergence5m:{operators:["long","short"]},rsiOverTrade_3070_1h:{operators:["long","short"]},rsiOverTrade_2575_1h:{operators:["long","short"]},rsiOverTrade1h:{operators:["long","short"]},rsiDivergence_3070_1h:{operators:["long","short"]},rsiDivergence_2575_1h:{operators:["long","short"]},rsiDivergence1h:{operators:["long","short"]},break1h:{operators:["high1","low1"],values:[{key:"times",defaultValue:1}]},break5m:{operators:["high1","low1"],values:[{key:"times",defaultValue:1}]}},_=Object.keys(b),k=function(e){function t(e){var a;return Object(s.a)(this,t),(a=Object(c.a)(this,Object(u.a)(t).call(this,e))).state={symbol:"XBTUSD",side:"Buy",amount:1e3,order_method:"stopMarket1h",signal_name:"rsiDivergence_3070_1h",signal_operator:"long",signal_value:"",remain_times:1,loading:!1,list:[]},a}return Object(d.a)(t,e),Object(i.a)(t,[{key:"componentDidMount",value:function(){this.fetchList()}},{key:"render",value:function(){var e=this,t=this.state,a=t.symbol,n=t.side,l=t.amount,o=t.signal_name,s=t.signal_operator,i=t.order_method,c=(t.remain_times,t.loading),u=b[o].operators,d=b[o].values;return r.a.createElement("div",null,r.a.createElement("div",{style:{marginBottom:"5px"}},r.a.createElement("select",{value:a,onChange:this.handleChangeForm.bind(this,"symbol")},v.map(function(e){return r.a.createElement("option",{value:e},e)})),r.a.createElement("select",{value:n,onChange:this.handleChangeForm.bind(this,"side")},r.a.createElement("option",{value:"Buy"},"Buy"),r.a.createElement("option",{value:"Sell"},"Sell")),r.a.createElement("input",{type:"number",value:l,style:{width:"80px"},onChange:this.handleChangeForm.bind(this,"amount")}),r.a.createElement("select",{value:i,onChange:this.handleChangeForm.bind(this,"order_method")},f.map(function(e){return r.a.createElement("option",{value:e},e)})),r.a.createElement("select",{value:o,onChange:this.handleChangeForm.bind(this,"signal_name")},_.map(function(e,t){return r.a.createElement("option",{value:e},"[",t+1,"]",e)})),r.a.createElement("select",{value:s,onChange:this.handleChangeForm.bind(this,"signal_operator")},u.map(function(e){return r.a.createElement("option",{value:e},e)})),d&&d.map(function(t){var a=t.key,n=t.defaultValue,l=e.state[a];return l=void 0===l?n:l,r.a.createElement("span",null,r.a.createElement("label",null,a),r.a.createElement("input",{type:"number",style:{width:"50px"},value:l,onChange:e.handleChangeForm.bind(e,a)}))}),r.a.createElement("button",{disabled:c,onClick:this.onAdd.bind(this)},"\u6dfb\u52a0")),this.renderList())}},{key:"renderList",value:function(){var e=this,t=this.state.list;return r.a.createElement("table",{style:{fontSize:"12px"}},r.a.createElement("thead",null,r.a.createElement("tr",null,r.a.createElement("th",null,"symbol"),r.a.createElement("th",null,"side"),r.a.createElement("th",null,"amount"),r.a.createElement("th",null,"order_method"),r.a.createElement("th",null,"signal_name"),r.a.createElement("th",null,"signal_operator"),r.a.createElement("th",null,"signal_values"),r.a.createElement("th",null,"\u72b6\u6001"),r.a.createElement("th",null,"\u95f4\u9694(h)"),r.a.createElement("th",null,"\u64cd\u4f5c"))),r.a.createElement("tbody",null,t.map(function(t,a){var n="";return t.on&&(n="Buy"===t.side?"green":"red"),r.a.createElement("tr",{key:a},r.a.createElement("td",null,t.symbol),r.a.createElement("td",{className:y[t.side]},t.side),r.a.createElement("td",{style:{cursor:"pointer",color:n},onClick:e.handleChangeAmount.bind(e,a)},t.amount),r.a.createElement("td",null,t.order_method),r.a.createElement("td",null,r.a.createElement("select",{value:t.signal_name,onChange:e.handleChangeKeyValue.bind(e,a,"signal_name")},_.map(function(e,t){return r.a.createElement("option",{value:e},"[",t+1,"]",e)}))),r.a.createElement("td",{className:E[t.signal_operator]},t.signal_operator),r.a.createElement("td",null,Object.getOwnPropertyNames(t.values||{}).map(function(n,l){var o="values-span-".concat(a,"-").concat(n);return r.a.createElement("span",{style:{cursor:"pointer"},key:o,onClick:e.handleChangeOperatorValue.bind(e,a,n)},r.a.createElement("label",{for:o},n),"\xa0",r.a.createElement("strong",{id:o},t.values[n]))})),r.a.createElement("td",null,r.a.createElement("span",{onClick:e.handleChangeRemainTimes.bind(e,a)},r.a.createElement("label",{for:"remian-span-".concat(a)},"remain_times"),"\xa0",r.a.createElement("strong",{id:"remian-span-".concat(a),className:t.remain_times>0?"flash":""},t.remain_times))),r.a.createElement("td",{style:{cursor:"pointer"},onClick:e.handleChangeMinInterval.bind(e,a)},t.min_interval),r.a.createElement("td",null,r.a.createElement("button",{onClick:e.handleDeleteItem.bind(e,a)},"x")))})))}},{key:"handleChangeForm",value:function(e,t){var a=this;this.setState(Object(h.a)({},e,t.target.value),function(){a.updateStateBySignalName()})}},{key:"updateStateBySignalName",value:function(){var e=this.state,t=e.signal_name,a=e.signal_operator,n=b[t].operators;-1===n.indexOf(a)&&this.setState({signal_operator:n[0]})}},{key:"onAdd",value:function(){var e=this,t=this.props.user,a=this.state,n=a.symbol,r=a.side,l=a.amount,o=a.order_method,s=a.signal_name,i=a.remain_times,c=a.signal_operator,u=a.signal_value,d=b[s].values,h={symbol:n,side:r,amount:l,order_method:o,signal_name:s,signal_operator:c,signal_value:u,remain_times:i,min_interval:0,values:{}};d&&d.forEach(function(t){var a=t.key,n=t.defaultValue,r=e.state[a];void 0===r&&(r=n),h.values[a]=r}),this.setState({loading:!0}),p.a.post("api/coin/add_auto_order_signal",{user:t,auto_order:h}).then(function(t){var a=t.status,n=t.data;e.setState({loading:!1}),200===a?e.fetchList():e.props.onPushLog(n)}).catch(function(t){e.setState({loading:!1}),e.props.onPushLog(t)})}},{key:"fetchList",value:function(){var e=this;this.setState({loading:!0}),p.a.get("api/coin/auto_order_signal_list?user=".concat(this.props.user)).then(function(t){var a=t.status,n=t.data;e.setState({loading:!1}),200===a?e.setState({list:n.data}):e.props.onPushLog(n)}).catch(function(t){e.props.onPushLog(t)})}},{key:"handleDeleteItem",value:function(e){var t=this,a=this.props.user;window.confirm("delete ?")&&p.a.post("api/coin/delete_auto_order_signal",{user:a,index:e}).then(function(e){var a=e.status,n=e.data;200===a?t.fetchList():t.props.onPushLog(n)}).catch(function(e){return t.props.onPushLog(e)})}},{key:"handleSetOn",value:function(e,t){var a=this.state.list[e],n=Object(g.a)({},a,{on:t});this.updateAutoOrder(e,n)}},{key:"handleSetRepeat",value:function(e,t){var a=this.state.list[e],n=Object(g.a)({},a,{repeat:t});this.updateAutoOrder(e,n)}},{key:"updateAutoOrder",value:function(e,t){var a=this,n=this.props.user;p.a.post("api/coin/update_auto_order_signal",{user:n,index:e,auto_order:t}).then(function(e){var t=e.status,n=e.data;200===t?a.fetchList():a.props.onPushLog(n)}).catch(function(e){return a.props.onPushLog(e)})}},{key:"handleChangeAmount",value:function(e){var t=this.state.list[e],a=window.prompt("amount",t.amount);if(a){var n={amount:+a};this.updateAutoOrder(e,n)}}},{key:"handleChangeRemainTimes",value:function(e){var t=this.state.list[e],a=window.prompt("remain_times",t.remain_times);if(null!==a){var n={remain_times:+a};this.updateAutoOrder(e,n)}}},{key:"handleChangeOperatorValue",value:function(e,t){var a=this.state.list[e],n=window.prompt(t,a.values[t]);if(null!==n){var r={values:Object(g.a)({},a.values,Object(h.a)({},t,+n))};this.updateAutoOrder(e,r)}}},{key:"handleChangeMinInterval",value:function(e){var t=this.state.list[e],a=window.prompt("min_interval",t.min_interval);if(null!==a){var n={min_interval:+a};this.updateAutoOrder(e,n)}}},{key:"handleChangeKeyValue",value:function(e,t,a){var n=Object(h.a)({},t,a.target.value);this.updateAutoOrder(e,n)}}]),t}(r.a.Component);a(47);var C={leverage:"\u500d",currentQty:"Qty",avgCostPrice:"Price",realisedGrossPnl:"rG Pnl",realisedPnl:"r Pnl",unrealisedPnl:"ur Pnl",unrealisedPnlPcnt:"ur Pnl%"},S={XBTUSD:8,ETHUSD:1,ADAH19:1e-7,XRPH19:2e-7,ETHH19:1e-4,EOSH19:2e-6,LTCH19:1e-4,TRXH19:8e-8,BCHH19:.001},O=["XBTUSD","ETHUSD","ADAH19","XRPH19","ETHH19","EOSH19","LTCH19","TRXH19","BCHH19"],L=function(e){function t(e){var a;return Object(s.a)(this,t),(a=Object(c.a)(this,Object(u.a)(t).call(this,e))).state={logs:[],users:[],list_pending:!1,all_quotes:[],all_instruments:[]},a}return Object(d.a)(t,e),Object(i.a)(t,[{key:"componentDidMount",value:function(){this.fetchUserList(),this.fetchOrderbookDepth(),this.fetchAllInstruments()}},{key:"render",value:function(){var e=this,t=this.state,a=t.logs,n=t.users,l=t.all_quotes,o=this.findInstrumentBySymbol("XBTUSD"),s=o?o.bidPrice:0;return r.a.createElement("div",{className:"trade-container"},r.a.createElement("div",null,n.map(function(t,a){var n=t.options,o=t.positions,i=t.margin,c=t.orders,u=t.form,d=t.pending,h=i||{},m=h.walletBalance,p=h.availableMargin,g=o.reduce(function(e,t){return e+t.unrealisedPnl},0),v=e.checkStop(a),f=["symbol","leverage","currentQty","avgCostPrice","unrealisedPnl","unrealisedPnlPcnt","realisedGrossPnl","realisedPnl"],y=m/1e8,E=s?(y*s).toFixed(0):null,b=s?((y+g)*s).toFixed(0):null;return r.a.createElement("div",{className:"user-row"},r.a.createElement("div",null,"user: ",n.user," (",(p/1e8).toFixed(3),"/",y.toFixed(3),")(",E,")\xa0close:",b),r.a.createElement("div",{className:"account clearfix"},r.a.createElement("table",{style:{fontSize:"12px"}},r.a.createElement("thead",null,r.a.createElement("tr",null,[r.a.createElement("th",null)].concat(f.map(function(e){return r.a.createElement("th",null,C[e]||e)})))),r.a.createElement("tbody",null,o.map(function(t){return r.a.createElement("tr",null,[r.a.createElement("td",null,r.a.createElement("button",{style:{margin:"5px 2px"},onClick:e.handleClosePosition.bind(e,a,t)},"Close"))].concat(f.map(function(n){var l=t[n],o=function(e,t,a){switch(t){case"realisedPnl":case"unrealisedPnl":case"realisedGrossPnl":return(e/1e8).toFixed(4);case"unrealisedPnlPcnt":return(e*a.leverage*100).toFixed(3)+"%";default:return e}}(l,n,t);["unrealisedPnl"].indexOf(n)>-1&&s&&(o="".concat(o," (").concat((o*s).toFixed(0),")"));var i="";return["currentQty","realisedGrossPnl","realisedPnl","unrealisedPnl","unrealisedPnlPcnt"].indexOf(n)>-1&&(l>0?i="green":l<0&&(i="red")),r.a.createElement("td",{className:i,onClick:e.handlePositionCellClick.bind(e,a,t,n)},o)})))})))),r.a.createElement("hr",null),r.a.createElement("div",{className:"title"},"Orders"),r.a.createElement("div",{className:"orders-container"},r.a.createElement("table",null,r.a.createElement("thead",null,r.a.createElement("tr",null,r.a.createElement("th",null),r.a.createElement("th",null,"symbol"),r.a.createElement("th",null,"qty"),r.a.createElement("th",null,"price"),r.a.createElement("th",null,"\u7c7b\u578b"),r.a.createElement("th",null,"\u72b6\u6001"),r.a.createElement("th",null,"\u5269\u4f59"),r.a.createElement("th",null,"\u65f6\u95f4"))),r.a.createElement("tbody",null,c.filter(function(e){return"Stop"!==e.ordType}).map(function(t,n){var l="Buy"===t.side;return r.a.createElement("tr",null,r.a.createElement("td",null,r.a.createElement("button",{onClick:e.handleDelOrder.bind(e,a,t)},"Del")),r.a.createElement("td",null,t.symbol),r.a.createElement("td",{style:{cursor:"pointer"},title:"\u70b9\u51fb\u4fee\u6539",className:l?"green":"red",onClick:e.handleUpdateOrder.bind(e,a,t,"orderQty")},t.orderQty*(l?1:-1)),r.a.createElement("td",{style:{cursor:"pointer"},title:"\u70b9\u51fb\u4fee\u6539",onClick:e.handleUpdateOrder.bind(e,a,t,"price")},t.price),r.a.createElement("td",null,t.ordType,t.execInst.indexOf("ReduceOnly")>-1?"\u53ea\u51cf\u4ed3":""),r.a.createElement("td",null,t.ordStatus),r.a.createElement("td",{className:l?"green":"red"},t.leavesQty*(l?1:-1)),r.a.createElement("td",null,new Date(t.timestamp).toLocaleString()))})))),r.a.createElement("div",null,l.map(function(t){var a=e.findInstrumentBySymbol(t.symbol);return r.a.createElement("div",{style:{whiteSpace:"nowrap"}},t.symbol,":\xa0 (",t.bidSize/1e3+"k",")",r.a.createElement("span",{className:"green"},t.bidPrice)," :\xa0",r.a.createElement("sapn",{className:"red"},t.askPrice),"(",t.askSize/1e3+"k",")",a&&"[".concat(100*a.fundingRate,"% ").concat(new Date(a.fundingTimestamp).toLocaleString(),"]"))})),r.a.createElement("div",{style:{marginBottom:"10px"}},r.a.createElement("select",{value:u.order_symbol,onChange:e.handleSelectChangeFormData.bind(e,a,"order_symbol")},O.map(function(e){return r.a.createElement("option",{value:e},e)})),r.a.createElement("select",{value:u.order_side,onChange:e.handleSelectChangeFormData.bind(e,a,"order_side")},r.a.createElement("option",{value:"Buy"},"Buy"),r.a.createElement("option",{value:"Sell"},"Sell")),r.a.createElement("input",{className:"Buy"===u.order_side?"green":"red",onChange:e.handleInputChangeFormData.bind(e,a,"order_qty"),style:{width:"80px"},type:"number",value:u.order_qty})),r.a.createElement("div",{style:{marginBottom:"10px"}},r.a.createElement("label",{for:"auto_price_checkbox"},"auto price"),r.a.createElement("input",{checked:u.auto_price,type:"checkbox",id:"auto_price_checkbox",onChange:e.handleChangeCheckbox.bind(e,a,"auto_price")}),!u.auto_price&&r.a.createElement("span",null,r.a.createElement("label",null,"P:"),r.a.createElement("input",{value:u.order_price,style:{width:"100px"},type:"number",onChange:e.handleInputChangeFormData.bind(e,a,"order_price")})),r.a.createElement("button",{onClick:e.handleOrderLimit.bind(e,a),disabled:d||!u.auto_price&&!u.order_price},"Order Limit"),r.a.createElement("input",{type:"checkbox",id:"reduce-only-checkbox",checked:u.reduce_only,style:{marginLeft:"10px"},onChange:e.handleChangeCheckbox.bind(e,a,"reduce_only")}),r.a.createElement("label",{for:"reduce-only-checkbox"},"reduce only")),r.a.createElement("div",null,r.a.createElement("button",{disabled:d,onClick:e.handleOrderMarket.bind(e,a),title:"\u5e02\u4ef7"},"Order Market"),r.a.createElement("button",{disabled:d,onClick:e.handleOrderScalping.bind(e,a,!1),title:"\u9650\u4ef7\u5355\uff0c\u5e76\u81ea\u52a8\u6302\u4e00\u4e2a\u6b62\u635f\u5355"},"Order Scalping"),r.a.createElement("button",{disabled:d,onClick:e.handleOrderScalping.bind(e,a,!0),title:"\u5e02\u4ef7\u5355\uff0c\u5e76\u81ea\u52a8\u6302\u4e00\u4e2a\u6b62\u635f\u5355"},"Order Scalping Market")),r.a.createElement("hr",null),r.a.createElement("div",{className:"title"},"Stop Orders",r.a.createElement("input",{type:"checkbox",checked:n.autoUpdateStopOpenMarketOrder,onChange:e.handleChangeZZSD.bind(e,a)})," 5m\u81ea\u52a8\u8ffd\u6da8\u6740\u8dcc",r.a.createElement("input",{type:"checkbox",checked:n.autoUpdateStopOpenMarketOrder1h,onChange:e.handleChangeZZSD1h.bind(e,a)})," 1h\u81ea\u52a8\u8ffd\u6da8\u6740\u8dcc",r.a.createElement("span",{className:"red"},v)),r.a.createElement("div",null,r.a.createElement("table",null,r.a.createElement("thead",null,r.a.createElement("tr",null,r.a.createElement("th",null),r.a.createElement("th",null,"symbol"),r.a.createElement("th",null,"\u6570\u91cf"),r.a.createElement("th",null,"\u89e6\u53d1P"),r.a.createElement("th",null,"\u6b62\u635fP"),r.a.createElement("th",null,"\u72b6\u6001"),r.a.createElement("th",null,"\u5269\u4f59"),r.a.createElement("th",null,"\u65f6\u95f4"),r.a.createElement("th",null,"execInst"),r.a.createElement("th",null,"ordType"))),r.a.createElement("tbody",null,c.filter(function(e){return"Stop"===e.ordType||"MarketIfTouched"===e.ordType}).map(function(t){var n="Buy"===t.side;return r.a.createElement("tr",null,r.a.createElement("td",null,r.a.createElement("button",{onClick:e.handleDelOrder.bind(e,a,t)},"Del")),r.a.createElement("td",null,t.symbol),r.a.createElement("td",{style:{cursor:"pointer"},title:"\u70b9\u51fb\u4fee\u6539",className:"Buy"==t.side?"green":"red",onClick:e.handleUpdateOrder.bind(e,a,t,"orderQty")},t.orderQty*(n?1:-1)),r.a.createElement("td",{style:{cursor:"pointer"},title:"\u70b9\u51fb\u4fee\u6539",onClick:e.handleUpdateOrder.bind(e,a,t,"stopPx")},t.stopPx),r.a.createElement("td",null,t.price||"\u5e02\u4ef7"),r.a.createElement("td",null,t.ordStatus),r.a.createElement("td",{className:n?"green":"red"},t.leavesQty*(n?1:-1)),r.a.createElement("td",null,new Date(t.timestamp).toLocaleString()),r.a.createElement("td",{title:"\u5982\u679c\u5305\u542b\u4e86Close, \u90a3\u4e48\u53ea\u662f\u5e73\u4ed3\u7528\uff0c\u5426\u5219\u53ef\u4ee5\u5f00\u4ed3"},t.execInst),r.a.createElement("td",null,t.ordType))})))),r.a.createElement("div",null,r.a.createElement("div",{style:{marginBottom:"10px"}},r.a.createElement("select",{value:u.stop_symbol,onChange:e.handleSelectChangeFormData.bind(e,a,"stop_symbol")},O.map(function(e){return r.a.createElement("option",{value:e},e)})),r.a.createElement("select",{value:u.stop_side,onChange:e.handleSelectChangeFormData.bind(e,a,"stop_side")},r.a.createElement("option",{value:"Buy"},"Buy"),r.a.createElement("option",{value:"Sell"},"Sell")),r.a.createElement("input",{className:"Buy"===u.stop_side?"green":"red",onChange:e.handleInputChangeFormData.bind(e,a,"stop_qty"),style:{width:"80px"},type:"number",value:u.stop_qty})),r.a.createElement("div",{style:{marginBottom:"10px"}},r.a.createElement("button",{onClick:e.handleOrderStopByPreK.bind(e,a,"5m")},"\u524d5m\u6781\u70b9"),r.a.createElement("button",{onClick:e.handleOrderStopByPreK.bind(e,a,"1h")},"\u524d1h\u6781\u70b9")),r.a.createElement("div",{style:{marginBottom:"10px"}},r.a.createElement("label",null,"stopPx:"),r.a.createElement("input",{value:u.stop_price,style:{width:"100px"},type:"number",onChange:e.handleInputChangeFormData.bind(e,a,"stop_price")}),r.a.createElement("button",{onClick:e.handleOrderStop.bind(e,a,0),disabled:d||!u.stop_price},"Order Stop Market"),r.a.createElement("label",{for:"checkbox-stop-close"},"Close"),r.a.createElement("input",{checked:u.stop_close,type:"checkbox",id:"checkbox-stop-close",onChange:e.handleChangeCheckbox.bind(e,a,"stop_close")}),r.a.createElement("button",{onClick:e.handleOrderStop.bind(e,a,1),disabled:d||!u.stop_price},"Take Profit Market"))),r.a.createElement(k,{user:n.user,onPushLog:e.pushLog.bind(e)}),r.a.createElement("hr",null),r.a.createElement("div",{className:"actions"},r.a.createElement("div",null),r.a.createElement("div",null,r.a.createElement("button",{onClick:e.handleDeleteAll.bind(e,a),disabled:d},"Delete All Orders")),r.a.createElement("div",null)),r.a.createElement("div",null,r.a.createElement("h5",null,"Config"),r.a.createElement("table",null,r.a.createElement("thead",null,r.a.createElement("tr",null,r.a.createElement("th",null,"\u5e8f\u53f7"),r.a.createElement("td",null,"\u81ea\u52a8\u5e73\u4ed3"),r.a.createElement("td",null,"\u4fe1\u53f7"))),r.a.createElement("tbody",null,["autoCloseRsiOverTrade5m","autoCloseRsiDivergence5m","autoCloseRsiOverTrade_3070_1h","autoCloseRsiOverTrade_2575_1h","autoCloseRsiOverTrade1h","autoCloseRsiDivergence_3070_1h","autoCloseRsiDivergence_2575_1h","autoCloseRsiDivergence1h"].map(function(t,l){return r.a.createElement("tr",null,r.a.createElement("td",null,l+1),r.a.createElement("td",null,r.a.createElement("input",{id:"config-".concat(l),type:"checkbox",onChange:e.handleCheckboxOption.bind(e,a,t),checked:n[t]})),r.a.createElement("td",null,r.a.createElement("label",{for:"config-".concat(l)},t)))})))),d&&r.a.createElement("div",{className:"pending-container"},"fetching..."))})),r.a.createElement("div",{className:"logs"},r.a.createElement("h5",null,"\u65e5\u5fd7"),r.a.createElement("ul",null,a.map(function(e){return r.a.createElement("li",null,JSON.stringify(e))}))))}},{key:"fetchOrderbookDepth",value:function(){var e=this;p.a.get("/api/coin/all_quotes?t=".concat(+new Date)).then(function(t){var a=t.status,n=t.data;if(200===a&&n.result){var r=n.data||[];e.setState({all_quotes:r})}else e.pushLog(n.info)})}},{key:"fetchAllInstruments",value:function(){var e=this;p.a.get("/api/coin/all_instruments?t=".concat(+new Date)).then(function(t){var a=t.status,n=t.data;if(200===a&&n.result){var r=n.data||[];e.setState({all_instruments:r})}else e.pushLog(n.info)})}},{key:"findInstrumentBySymbol",value:function(e){for(var t=this.state.all_instruments,a=0;a<t.length;a++){var n=t[a];if(n.symbol===e)return n}}},{key:"fetchUserList",value:function(){var e=this;this.setState({list_pending:!0}),p.a.get("/api/coin").then(function(t){var a=t.data;200===t.status&&a.result?e.setState({users:a.items.map(function(e){return e.form={order_side:"Buy",order_qty:100,pending:!1,order_price:null,stop_side:"Sell",stop_qty:1e3,stop_price:null,reduce_only:!1,order_symbol:"XBTUSD",stop_symbol:"XBTUSD",auto_price:!1,stop_close:!0},e}),list_pending:!1}):(alert("\u670d\u52a1\u5668\u9519\u8bef"),e.state.logs.push(a),e.setState({list_pending:!1}))}).catch(function(t){alert("\u7a0b\u5e8f\u9519\u8bef"),e.state.logs.push(t),e.setState({list_pending:!1})})}},{key:"handleSelectChangeFormData",value:function(e,t,a){this.state.users[e].form[t]=a.target.value,this.setState({})}},{key:"handleInputChangeFormData",value:function(e,t,a){this.state.users[e].form[t]=a.target.value,this.setState({})}},{key:"handleChangeCheckbox",value:function(e,t,a){this.state.users[e].form[t]=a.target.checked,this.setState({})}},{key:"handleOrderLimit",value:function(e){var t=this,a=this.state.users[e],n=a.options.user,r=a.form,l=r.order_side,o=r.order_qty,s=r.order_price,i=r.reduce_only,c=r.order_symbol,u=r.auto_price,d="".concat(n,"\n ").concat(c," ").concat(l," ").concat(o," at ").concat(u?"\u81ea\u52a8\u4ef7\u683c":s," ").concat(i?"\u53ea\u51cf\u4ed3":"");if(window.confirm(d)){a.pending=!0,this.setState({});var h="/api/coin/order_limit";i&&(h="/api/coin/order_reduce_only_limit"),p.a.post(h,{user:n,symbol:c,qty:o,side:l,price:s,auto_price:u}).then(function(e){var n=e.status,r=e.data;if(a.pending=!1,200===n&&r.result){var l=!1;r.data&&"Canceled"===r.data.ordStatus&&(t.pushLog(r.data.text),l=!0),alert("success! ".concat(l?"but Canceled \u8be6\u7ec6\u8bf7\u770b\u65e5\u5fd7":"")),t.fetchUserList()}else t.pushLog(r.info)}).catch(function(e){a.pending=!1,t.pushLog(e)})}}},{key:"handleOrderMarket",value:function(e){var t=this,a=this.state.users[e],n=a.options.user,r=a.form,l=r.order_side,o=r.order_qty,s=r.order_symbol,i="".concat(n,"\n ").concat(s," ").concat(l," ").concat(o," Market?");window.confirm(i)&&(a.pending=!0,this.setState({}),p.a.post("/api/coin/order_market",{user:n,symbol:s,qty:o,side:l}).then(function(e){var n=e.status,r=e.data;a.pending=!1,200===n&&r.result?(alert("success!"),t.fetchUserList()):t.pushLog(r.info)}).catch(function(e){a.pending=!1,t.pushLog(e)}))}},{key:"handleOrderScalping",value:function(e,t){var a=this,n=this.state.users[e],r=n.options.user,l=n.form,o=l.order_side,s=l.order_qty,i=l.order_symbol,c="".concat(r,"\n ").concat(i," ").concat(o," ").concat(s," Scalping ").concat(t?"Market":"Limit","?"),u=S[i];window.confirm(c)&&(n.pending=!0,Promise.all([p.a.post(t?"/api/coin/order_market":"/api/coin/order_limit",{user:r,symbol:i,qty:s,side:o,auto_price:!0}),p.a.post("api/coin/order_stop",{user:r,symbol:i,qty:s,side:"Buy"===o?"Sell":"Buy",offset:u})]).then(function(){n.pending=!1,alert("success!"),a.fetchUserList()}).catch(function(e){n.pending=!1,a.pushLog(e)}))}},{key:"handleOrderStop",value:function(e,t){var a=this,n=this.state.users[e],r=n.options.user,l=n.form,o=l.stop_side,s=l.stop_qty,i=l.stop_price,c=l.stop_symbol,u=l.stop_close,d="".concat(r," ").concat(1===t?"order MarketIfTouched":"order stop market","?\n ").concat(c," ").concat(o," ").concat(s," at ").concat(i,"?");if(window.confirm(d)){n.pending=!0,this.setState({});var h=1===t?"api/coin/order_market_if_touched":"api/coin/order_stop";p.a.post(h,{user:r,symbol:c,qty:s,side:o,stopPx:i,stop_close:u}).then(function(e){var t=e.status,r=e.data;n.pending=!1,200===t&&r.result?(alert("order stop success"),a.fetchUserList()):a.pushLog(r.info)}).catch(function(e){n.pending=!1,a.pushLog(e)})}}},{key:"handleOrderStopByPreK",value:function(e,t){var a=this,n=this.state.users[e],r=n.options.user,l=n.form,o=l.stop_symbol,s=l.stop_side,i=l.stop_qty;n.pending=!0,this.setState({});var c="".concat(r," order stop open: ").concat(s," ").concat(o," ").concat(i," \u524d\u4e00K\u7ebf\uff08").concat(t,"\uff09?");window.confirm(c)&&p.a.post("api/coin/order_stop_open_by_lastcandle",{user:r,period:t,symbol:o,qty:i,side:s}).then(function(e){var t=e.status,r=e.data;n.pending=!1,200===t&&r.result?(alert("order stop success"),a.fetchUserList()):a.pushLog(r.info)}).catch(function(e){n.pending=!1,a.pushLog(e)})}},{key:"handleDelOrder",value:function(e,t){var a=this,n=this.state.users[e],r=n.options.user,l="user: ".concat(r,", Delete order:\n side: ").concat(t.side," qty: ").concat(t.orderQty," type: ").concat(t.ordType);window.confirm(l)&&(n.pending=!0,this.setState({}),p.a.post("api/coin/delete_order",{user:r,order_id:t.orderID}).then(function(e){var t=e.status,r=e.data;n.pending=!1,200===t&&r.result?(alert("success!"),a.fetchUserList()):a.pushLog(r.info)}).catch(function(e){n.pending=!1,a.pushLog(e)}))}},{key:"handleDeleteAll",value:function(e){var t=this,a=this.state.users[e],n=a.options.user,r="user: ".concat(n,", Delete All Orders ?");window.confirm(r)&&(a.pending=!0,this.setState({}),p.a.post("api/coin/delete_order_all",{user:n}).then(function(e){var n=e.status,r=e.data;a.pending=!1,200===n&&r.result?(alert("delete all success"),t.fetchUserList()):t.pushLog(r.info)}).catch(function(e){a.pending=!0,t.pushLog(e)}))}},{key:"handleClosePosition",value:function(e,t){var a=this,n=this.state.users[e],r=n.options.user,l=t.symbol,o="user: ".concat(r,", close position ").concat(l," market?");window.confirm(o)&&(n.pending=!0,this.setState({}),p.a.post("api/coin/close_position",{user:r,symbol:l}).then(function(e){var t=e.status,r=e.data;n.pending=!1,200===t&&r.result?(alert("close postion success"),a.fetchUserList()):a.pushLog(r.info)}).catch(function(e){a.pushLog(e)}))}},{key:"handlePositionCellClick",value:function(e,t,a){var n=this,r=this.state.users[e],l=t[a],o=r.options.user,s=t.symbol;if("leverage"===a){var i=window.prompt("leverage",l);r.pending=!0,this.setState({}),p.a.post("api/coin/change_leverage",{user:o,symbol:s,leverage:i}).then(function(e){var t=e.status,a=e.data;r.pending=!1,200===t&&a.result?(alert("change leverage success!"),n.fetchUserList()):n.pushLog(a.info)}).catch(function(e){n.pushLog(e)})}}},{key:"handleUpdateOrder",value:function(e,t,a){var n=this,r=this.state.users[e],l=r.options.user,o=t[a],s=window.prompt("".concat(l," update order: ").concat(a),o);if(s){var i=Object(h.a)({orderID:t.orderID},a,s);r.pending=!0,this.setState({}),p.a.post("api/coin/update_order",{user:l,params:i}).then(function(e){var t=e.status,a=e.data;r.pending=!1,200===t&&a.result?(alert("\u4fee\u6539\u6210\u529f"),n.fetchUserList()):n.pushLog(a.info)}).catch(function(e){r.pending=!1,n.pushLog(e)})}}},{key:"pushLog",value:function(e){this.state.logs.push(e),this.setState({})}},{key:"checkStop",value:function(e){var t=this.state.users[e],a=t.positions,n="";return a.forEach(function(e){var a=e.currentQty>0,r=0;t.orders.filter(function(t){return t.symbol===e.symbol}).forEach(function(e){var t=a?"Sell":"Buy";"Stop"===e.ordType&&e.side===t&&(r+=e.orderQty)}),r<Math.abs(e.currentQty)&&(n+="".concat(e.symbol,"\u6b62\u635f\u8bbe\u7f6e\u6709\u8bef\uff01"))}),n}},{key:"handleCheckboxOption",value:function(e,t,a){this.fetchChangeUserOption(e,t,a.target.checked)}},{key:"handleChangeZZSD",value:function(e,t){this.fetchChangeUserOption(e,"autoUpdateStopOpenMarketOrder",t.target.checked)}},{key:"handleChangeZZSD1h",value:function(e,t){this.fetchChangeUserOption(e,"autoUpdateStopOpenMarketOrder1h",t.target.checked)}},{key:"fetchChangeUserOption",value:function(e,t,a){var n=this,r=this.state.users[e],l=r.options.user;r.pending=!0,this.setState({});var o=Object(h.a)({},t,a);p.a.post("api/coin/change_options",{user:l,options:o}).then(function(e){var t=e.status,a=e.data;r.pending=!1,200===t&&a.result?(alert("\u4fee\u6539\u6210\u529f"),n.fetchUserList()):n.pushLog(a.info)}).catch(function(e){r.pending=!1,n.pushLog(e)})}}]),t}(r.a.Component),w=function(e){function t(){return Object(s.a)(this,t),Object(c.a)(this,Object(u.a)(t).apply(this,arguments))}return Object(d.a)(t,e),Object(i.a)(t,[{key:"render",value:function(){return r.a.createElement("div",{className:"App"},r.a.createElement(L,null))}}]),t}(n.Component);Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));o.a.render(r.a.createElement(w,null),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then(function(e){e.unregister()})}},[[18,2,1]]]);
//# sourceMappingURL=main.84ee5130.chunk.js.map