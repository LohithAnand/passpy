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

  function Viewer() {

    this.extractDomain = function(url) {
      var a = document.createElement('a');
      a.href = url;
      return a.hostname || url.slice(0,25);
    };

    this.generateRow = function(details,counter) {
      var row = ''+
      '<tr class="entry">'+
        '<th>'+counter+'</th>'+
        '<td><a href="'+details.value.url+'">'+this.extractDomain(details.value.url)+'</td>'+
        '<td>'+JSON.stringify(details.value.formData, null, 4).replace(/[{}]/g, "")+'</td>'+
        '<td>'+
          details.value.timeStamp+
          '<span class="pull-right deleteEntry cursor-pointer" data-id="'+details.key+'">'+
            '<i class="glyphicon glyphicon-trash">'+
          '</span>'+
        '</td>'+
      '</tr>';
      return row;
    };

    this.showLogs = function() {
      var self = this;
      var bgConnector = new BackgroundConnector();
      bgConnector.sql({'operation' : 'retrieve'}, function(response) {
        if(response.hasOwnProperty('logs')) {
          var counter = 1;
          response.logs.reverse();
          Array.prototype.forEach.call(response.logs, function(details) {
            var tbody = document.getElementById('list-container');
            if(details) {
              tbody.insertAdjacentHTML('beforeend', self.generateRow(details,counter++));
            }
          });
        }
      });
    };

    this.clearLogs = function() {
      document.getElementById('list-container').innerHTML = '';
    }

  }

  function ActionController() {

    this.registerChangePassEvent = function() {
      jQuery('#change-pass-modal').on('shown.bs.modal', function(e) {
        var modalContainer = jQuery(e.currentTarget);
        var newPasscodeElement = modalContainer.find('#new-passcode');
        newPasscodeElement.val('').focus();
        modalContainer.find('#save-passcode').on('click', function() {
          var newPasscode = newPasscodeElement.val();
          if(newPasscode === '') {
            jQuery('#passcode-validation-msg').removeClass('hide');
          } else {
            jQuery('#passcode-validation-msg').addClass('hide');
            var bgConnector = new BackgroundConnector();
            bgConnector.sendData({'action' : 'PIN', 'operation' : 'set', 'pin' : newPasscode});
            jQuery('#change-pass-modal').modal('hide');
          }
        });
      });
    };

    this.registerClearLogsEvent = function() {
      jQuery('#clear-logs').on('click', function() {
        bootbox.confirm("Are you sure?", function(result) {
          if(result) {
            var bgConnector = new BackgroundConnector();
            bgConnector.sql({'operation' : 'delete'}, function(response) {
              if(response.success) {
                var view = new Viewer();
                view.clearLogs();
              }
            });
          }
        });
      });
    };

    this.registerDeleteEntryEvent = function() {
      jQuery('#list-container').on('click', '.deleteEntry', function() {
        var target = jQuery(this);
        var entryId = target.data('id');
        bootbox.confirm("Are you sure?", function(result) {
          if(result) {
            var bgConnector = new BackgroundConnector();
            bgConnector.sql({'operation' : 'delete', 'id' : entryId}, function(response) {
              if(response.success) {
                target.closest('.entry').remove();
              }
            });
          }
        });
      });
    };

    this.registerEvents = function() {
      this.registerClearLogsEvent();
      this.registerChangePassEvent();
      this.registerDeleteEntryEvent();
    };

  }

  var view = new Viewer();
  view.showLogs();

  var actionController = new ActionController();
  actionController.registerEvents();

});
