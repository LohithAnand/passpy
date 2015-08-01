document.addEventListener("DOMContentLoaded", function() {

  function BackgroundConnector() {

    this.sendData = function(data, callback) {
      if(typeof callback === 'undefined') {
        callback = function() {};
      }
      chrome.runtime.sendMessage(data, callback);
    };

    this.sql = function(data, callback) {
      if(typeof callback === 'undefined') {
        callback = function() {};
      }
      data.action = 'DB';
      this.sendData(data, callback);
    };

  };

  function viewer() {

    this.extractDomain = function(url) {
      var a = document.createElement('a');
      a.href = url;
      return a.hostname || url.slice(0,25);
    };

    this.generateRow = function(details,counter) {
      var row = ''+
      '<tr>'+
        '<th>'+counter+'</th>'+
        '<td><a href="'+details.url+'">'+this.extractDomain(details.url)+'</td>'+
        '<td>'+JSON.stringify(details.formData, null, 4).replace(/[{}]/g, "")+'</td>'+
      '</tr>';
      return row;
    };

    this.showLogs = function() {
      var self = this;
      var bgConnector = new BackgroundConnector();
      bgConnector.sql({'operation' : 'retrieve'}, function(response) {
        if(response.hasOwnProperty('logs')) {
          var counter = 1;
          Array.prototype.forEach.call(response.logs, function(details) {
            var tbody = document.getElementById('list-container');
            if(details) {
              tbody.insertAdjacentHTML('beforeend', self.generateRow(details,counter++));
            }
          });
        }
      });
    };

  }

  var view = new viewer();
  view.showLogs();

});
