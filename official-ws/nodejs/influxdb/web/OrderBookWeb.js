
function OrderBookWeb(options) {
  this._options = {
    ...options
  }
  this.CLIENT = {
    _data: {},
    _keys: {}
  }
  this._data = []
}

OrderBookWeb.prototype.update = function(json) {
  var newData = DeltaParser.onAction(json.action, json.table, 'XBTUSD', this.CLIENT, json);
  this._data = newData
}

OrderBookWeb.prototype.getData = function() {
  return this._data
}
