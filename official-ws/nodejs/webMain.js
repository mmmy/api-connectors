
window.onload = function() {

  var ws = new WebSocket("ws://127.0.0.1:8099");

  ws.onopen = function(evt) { 
    console.log("Connection open ..."); 
    ws.send("Hello WebSockets!");
  };

  ws.onmessage = function(evt) {
    var json = JSON.parse(evt.data)
    handleData(json)
    // console.log( "Received Message: " + evt.data);
    // ws.close();
  };

  ws.onclose = function(evt) {
    console.log("Connection closed.");
  };

}

var CLIENT = {
  _data: {},
  _keys: {}
}

function handleData(json) {
  // console.log(json)
  var newData = DeltaParser.onAction(json.action, json.table, 'XBTUSD', CLIENT, json);
  console.log(newData)
}