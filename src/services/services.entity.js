/**
 *
 */
function entity_hal_links(entity_type, bundle, entity, options) {
  try {
    // D8 currently supports only hal json for POST calls, so let's build the
    // _links object if someone hasn't already.
    if (typeof entity.entity['_links'] === 'undefined') {
      entity.entity['_links'] = {
        type: {
          href: Drupal.settings.site_path +
            '/rest/type/' + entity_type + '/' + bundle
        }
      };
    }
  }
  catch (error) { console.log('entity_hal_links - ' + error); }
}

/**
 * Creates an entity.
 * @param {String} entity_type
 * @param {String} bundle
 * @param {Object} entity
 * @param {Object} options
 */
function entity_create(entity_type, bundle, entity, options) {
  try {

    // @TODO this function's name collides with D8.
    // @see https://api.drupal.org/api/drupal/core!includes!entity.inc/function/entity_create/8

    entity_hal_links(entity_type, bundle, entity, options);
    Drupal.services.call({
        method: 'POST',
        contentType: 'application/hal+json',
        async: options.async,
        path: 'entity/' + entity_type,
        service: options.service,
        resource: options.resource,
        entity_type: entity_type,
        bundle: bundle,
        data: JSON.stringify(entity.entity),
        success: function(data) {
          try {
            if (options.success) { options.success(data); }
          }
          catch (error) { console.log('entity_create - success - ' + error); }
        },
        error: function(xhr, status, message) {
          try {
            if (options.error) { options.error(xhr, status, message); }
          }
          catch (error) { console.log('entity_create - error - ' + error); }
        }
    });
  }
  catch (error) { console.log('entity_create - ' + error); }
}

/**
 * Retrieves an entity.
 * @param {String} entity_type
 * @param {Number} ids
 * @param {Object} options
 */
function entity_retrieve(entity_type, ids, options) {
  try {
    Drupal.services.call({
        method: 'GET',
        path: entity_type + '/' + ids,
        service: options.service,
        resource: options.resource,
        entity_type: entity_type,
        entity_id: ids,
        success: function(data) {
          try {
            if (options.success) {
              var class_name = ucfirst(entity_type);
              if (typeof Drupal.Entity[class_name] !== 'undefined') {
                data = new Drupal.Entity[class_name](data);
              }
              else {
                console.log('entity_retrieve - missing prototype - (' +
                  entity_type + ')'
                );
              }
              options.success(data);
            }
          }
          catch (error) { console.log('entity_retrieve - success - ' + error); }
        },
        error: function(xhr, status, message) {
          try {
            if (options.error) { options.error(xhr, status, message); }
          }
          catch (error) { console.log('entity_retrieve - error - ' + error); }
        }
    });
  }
  catch (error) { console.log('entity_retrieve - ' + error); }
}

/**
 * Updates an entity.
 * @param {String} entity_type
 * @param {String} bundle
 * @param {Object} entity
 * @param {Object} options
 */
function entity_update(entity_type, bundle, entity, options) {
  try {
    entity_hal_links(entity_type, bundle, entity, options);
    Drupal.services.call({
        method: 'PATCH',
        contentType: 'application/hal+json',
        path: entity_type + '/' + entity.id(),
        service: options.service,
        resource: options.resource,
        entity_type: entity_type,
        entity_id: entity.id(),
        bundle: bundle,
        data: JSON.stringify(entity.entity),
        success: function() {
          try {
            // Since we get a 204 response (No Content), there is nothing to
            // send the success callback.
            _entity_local_storage_delete(entity_type, entity.id());
            if (options.success) { options.success(); }
          }
          catch (error) { console.log('entity_update - success - ' + error); }
        },
        error: function(xhr, status, message) {
          try {
            if (options.error) { options.error(xhr, status, message); }
          }
          catch (error) { console.log('entity_update - error - ' + error); }
        }
    });
  }
  catch (error) { console.log('entity_update - ' + error); }
}

/**
 * Deletes an entity.
 * @param {String} entity_type
 * @param {Number} entity_id
 * @param {Object} options
 */
function entity_delete(entity_type, entity_id, options) {
  try {
    Drupal.services.call({
        method: 'DELETE',
        path: entity_type + '/' + entity_id,
        service: options.service,
        resource: options.resource,
        entity_type: entity_type,
        entity_id: entity_id,
        success: function(data) {
          try {
            _entity_local_storage_delete(entity_type, entity_id);
            if (options.success) { options.success(); }
          }
          catch (error) { console.log('entity_delete - success - ' + error); }
        },
        error: function(xhr, status, message) {
          try {
            if (options.error) { options.error(xhr, status, message); }
          }
          catch (error) { console.log('entity_delete - error - ' + error); }
        }
    });
  }
  catch (error) { console.log('entity_delete - ' + error); }
}

/**
 * Performs an entity index.
 * @param {String} entity_type
 * @param {String} query
 * @param {Object} options
 */
function entity_index(entity_type, query, options) {
  try {
    var query_string;
    if (typeof query === 'object') {
      query_string = entity_index_build_query_string(query);
    }
    else if (typeof query === 'string') {
      query_string = query;
    }
    if (query_string) { query_string = '&' + query_string; }
    else { query_string = ''; }
    Drupal.services.call({
        method: 'GET',
        path: entity_type + '.json' + query_string,
        service: options.service,
        resource: options.resource,
        entity_type: entity_type,
        success: function(result) {
          try {
            if (options.success) { options.success(result); }
          }
          catch (error) { console.log('entity_index - success - ' + error); }
        },
        error: function(xhr, status, message) {
          try {
            if (options.error) { options.error(xhr, status, message); }
          }
          catch (error) { console.log('entity_index - error - ' + error); }
        }
    });
  }
  catch (error) { console.log('entity_index - ' + error); }
}
/**
 * Builds a query string from a query object for an entity index resource.
 * @param {Object} query
 * @return {String}
 */
function entity_index_build_query_string(query) {
  try {
    var result = '';
    if (!query) { return result; }
    if (query.fields) { // array
      var fields = '';
      for (var i = 0; i < query.fields.length; i++) {
        fields += encodeURIComponent(query.fields[i]) + ',';
      }
      if (fields != '') {
        fields = 'fields=' + fields.substring(0, fields.length - 1);
        result += fields + '&';
      }
    }
    if (query.parameters) { // object
      var parameters = '';
      for (var parameter in query.parameters) {
          if (query.parameters.hasOwnProperty(parameter)) {
            var key = encodeURIComponent(parameter);
            var value = encodeURIComponent(query.parameters[parameter]);
            parameters += 'parameters[' + key + ']=' + value + '&';
          }
      }
      if (parameters != '') {
        parameters = parameters.substring(0, parameters.length - 1);
        result += parameters + '&';
      }
    }
    if (typeof query.page !== 'undefined') { // int
      result += 'page=' + encodeURIComponent(query.page) + '&';
    }
    if (typeof query.page_size !== 'undefined') { // int
      result += 'page_size=' + encodeURIComponent(query.page_size) + '&';
    }
    return result.substring(0, result.length - 1);
  }
  catch (error) { console.log('entity_index_build_query_string - ' + error); }
}

/**
 * Wraps an entity in a JSON object, keyed by its type.
 * @param {String} entity_type
 * @param {Object} entity
 * @return {String}
 */
function _entity_wrap(entity_type, entity) {
  try {
    // We don't wrap taxonomy, users or commerce entities.
    var entity_wrapper = {};
    if (entity_type == 'taxonomy_term' ||
      entity_type == 'taxonomy_vocabulary' ||
      entity_type == 'user' || entity_type.indexOf('commerce') != -1) {
      entity_wrapper = entity;
    }
    else { entity_wrapper[entity_type] = entity; }
    return entity_wrapper;
  }
  catch (error) { console.log('_entity_wrap - ' + error); }
}

