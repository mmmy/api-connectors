
$(function() {
  // var bookChart = new Book('book-lines-chart')
  // var initData = randomLinesData()
  // bookChart.setData(initData)
  // randomAppendData(data => {
  //   bookChart.appendData(data)
  // })
  // window._bookChart = bookChart
  var ws = new WebSocket("ws://127.0.0.1:8091")

  ws.onopen = function(evt) { 
    console.log("Connection open ..."); 
    ws.send("Hello go.html!");
  };

  ws.onmessage = function(evt) {
    //{midPrice, asks:[], bids:[]}
    var json = JSON.parse(evt.data)
    // that._update(json)
    console.log( "Received Message: " + evt.data);
    // ws.close();
  };

  ws.onclose = function(evt) {
    console.log("Connection closed.");
  };

})
