/**
 * The Drupal services JSON object.
 */
Drupal.services = {};

/**
 * Drupal Services XMLHttpRequest Object.
 * @param {Object} options
 */
Drupal.services.call = function(options) {
  try {

    options.debug = false;

    // Make sure the settings have been provided for Services.
    if (!services_ready()) {
      var error = 'Set the site_path and endpoint on Drupal.settings!';
      options.error(null, null, error);
      return;
    }

    // Build the Request, URL and extract the HTTP method.
    var request = new XMLHttpRequest();
    var url = Drupal.settings.site_path +
              Drupal.settings.base_path + '?q=' +
              Drupal.settings.endpoint + '/' + options.path;
    var method = options.method.toUpperCase();
    console.log(method + ': ' + url);

    // Request Success Handler
    request.onload = function(e) {
      if (request.readyState == 4) {

        // Build a human readable response title.
        var title = request.status + ' - ' +
          http_status_code_title(request.status);

        // 200 OK
        if (request.status == 200) {
          options.success(JSON.parse(request.responseText));
        }
        else {
          // Not OK...
          dpm(request);
          console.log(method + ': ' + url + ' - ' + title);
          if (request.responseText) { console.log(request.responseText); }
          else { dpm(request); }
          if (typeof options.error !== 'undefined') {
            var message = request.responseText;
            if (!message) { message = title; }
            options.error(request, request.status, message);
          }
        }
      }
      else {
        console.log('request.readyState = ' + request.readyState);
      }
    };
    
    // Get the CSRF Token and Make the Request.
    services_get_csrf_token({
        debug: options.debug,
        success:function(token) {
          try {
            // Open the request.
            request.open(method, url, true);
  
            // Set any headers.
            if (method == 'POST') {
              request.setRequestHeader(
                'Content-type',
                'application/x-www-form-urlencoded'
              );
            }
            else if (method == 'PUT') {
              request.setRequestHeader(
                'Content-type',
                'application/json'
              );
            }
  
            // Add the token to the header if we have one.
            if (token) {
              request.setRequestHeader('X-CSRF-Token', token);
            }
            if (typeof options.data !== 'undefined') {
              if (options.path != 'user/login.json') {
                if (typeof options.data === 'object') {
                  console.log(JSON.stringify(options.data));
                }
                else {
                  console.log(options.data);
                }
              }
              request.send(options.data);
            }
            else { request.send(null); }
          }
          catch (error) {
            console.log(
              'Drupal.services.call - services_get_csrf_token - success - ' +
              message
            );
          }
        },
        error:function(xhr, status, message){
          try {
            console.log(
              'Drupal.services.call - services_get_csrf_token - ' + message
            );
            if (options.error) { options.error(xhr, status, message); }
          }
          catch (error) {
            console.log(
              'Drupal.services.call - services_get_csrf_token - error - ' +
              message
            );
          }
        }
    });
    
  }
  catch (error) {
    console.log('Drupal.services.call - error - ' + error);
  }
};

/**
 * Gets the CSRF token from Services.
 * @param {Object} options
 */
function services_get_csrf_token(options) {
  try {
    
    var token;
    
    // Are we resetting the token?
    if (options.reset) {
      Drupal.sessid = null;
    }
    
    // Do we already have a token? If we do, return it the success callback.
    if (Drupal.sessid) {
      token = Drupal.sessid;
      if (options.debug) { dpm('Loaded token from Drupal JSON object!'); }
    }
    if (token) {
      if (options.success) { options.success(token); }
      return;
    }
    
    // We don't have a token, let's get it from Drupal...
    
    // Build the Request and URL.
    var token_request = new XMLHttpRequest();
    var token_url = Drupal.settings.site_path +
              Drupal.settings.base_path +
              '?q=services/session/token';
    
    // Token Request Success Handler
    token_request.onload = function(e) {
      try {
        if (token_request.readyState == 4) {
          var title = token_request.status + ' - ' +
            http_status_code_title(token_request.status);
          if (token_request.status != 200) { // Not OK
            console.log(token_url + ' - ' + title);
            console.log(token_request.responseText);
          }
          else { // OK
            // Save the token to local storage as sessid, set Drupal.sessid
            // with the token, then return the token to the success function.
            if (options.debug) { dpm('Grabbed token from Drupal site!'); }
            token = token_request.responseText;
            //window.localStorage.setItem('sessid', token);
            Drupal.sessid = token;
            options.success(token);
          }
        }
        else {
          console.log(
            'services_get_csrf_token - readyState - ' + token_request.readyState
          );
        }
      }
      catch (error) {
        console.log(
          'services_get_csrf_token - token_request. onload - ' + error
        );
      }
    };

    // Open the token request.
    token_request.open('GET', token_url, true);

    // Send the token request.
    token_request.send(null);
  }
  catch (error) { console.log('services_get_csrf_token - ' + error); }
}

/**
 * Checks if we're ready to make a Services call.
 * @return {Boolean}
 */
function services_ready() {
  var result = true;
  if (Drupal.settings.site_path == '') {
    result = false;
    console.log('jDrupal\'s Drupal.settings.site_path is not set!');
  }
  if (Drupal.settings.endpoint == '') {
    result = false;
    console.log('jDrupal\'s Drupal.settings.endpoint is not set!');
  }
  return result;
}

