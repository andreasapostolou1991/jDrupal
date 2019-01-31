/**
 * Checks if an entity has at least one item for a given field name. Optionally pass in a
 * language code and/or delta value, otherwise they default to 'und' and 0 respectively.
 * @param {Object} entity
 * @param {String} fieldName
 * @param {String} language
 * @param {Number} delta
 * @returns {Boolean}
 */
jDrupal.fieldHasItem = function(entity, fieldName, language, delta) {
  if (!language) { language = language_default(); }
  if (typeof delta === 'undefined') { delta = 0; }
  return entity[fieldName] &&
      entity[fieldName][language] &&
      entity[fieldName][language].length &&
      entity[fieldName][language][delta];
};

/**
 * Gets an item from an entity given field name. Optionally pass in a language code and/or
 * delta value, otherwise they default to 'und' and 0 respectively.
 * @param {Object} entity
 * @param {String} fieldName
 * @param {String} language
 * @param {Number} delta
 * @returns {*}
 */
jDrupal.fieldGetItem = function(entity, fieldName, language, delta) {
  if (!language) { language = language_default(); }
  if (typeof delta === 'undefined') { delta = 0; }
  return entity[fieldName][language][delta];
};

/**
 * Given an entity and field name, this will return how many items are on the field. Optionally
 * pass in a language code otherwise it defaults to 'und'.
 * @param {Object} entity
 * @param {String} fieldName
 * @param {String} language
 * @returns {Number}
 */
jDrupal.fieldGetItemCount = function(entity, fieldName, language) {
  return !language ?
      jDrupal.fieldGetItems(entity, fieldName).length :
      jDrupal.fieldGetItems(entity, fieldName, language).length;
};

/**
 * Gets items from an entity given a field name. Optionally pass in a language code otherwise
 * it defaults to 'und'.
 * @param {Object} entity
 * @param {String} fieldName
 * @param {String} language
 * @returns {*}
 */
jDrupal.fieldGetItems = function(entity, fieldName, language) {
  if (!language) { language = language_default(); }
  return entity[fieldName][language];
};

/**
 * Sets an item's property on an entity given a field and property name.
 * @param {Object} entity The entity object.
 * @param {String} fieldName The field name on the entity.
 * @param {String|null} propertyName The property name to set, usually 'value',  or null to set the entire
 *   item (advanced users, don't forget language code and delta value).
 * @param {*} value The value to set.
 * @param {String} language Optional language code, defaults to 'und'
 * @param {Number} delta Optional delta value, defaults to 0
 */
jDrupal.fieldSetItem = function(entity, fieldName, propertyName, value, language, delta) {
  if (!language) { language = language_default(); }
  if (typeof delta === 'undefined') { delta = 0; }
  if (!entity[fieldName]) { entity[fieldName] = {}; }
  if (propertyName) {
    if (!entity[fieldName][language]) { entity[fieldName][language] = []; }
    if (!entity[fieldName][language][delta]) { entity[fieldName][language][delta] = {}; }
    entity[fieldName][language][delta][propertyName] = value;
  }
  else { entity[fieldName][language][delta] = value; }
};

/**
 * Returns an array of entity type machine names configured with Services Entity in settings.js
 * @returns {Array}
 */
function services_entity_types() {
  var entityTypes = [];
  if (jDrupal.services_entity && jDrupal.services_entity.types) {
    for (var entityType in jDrupal.services_entity.types) {
      if (!jDrupal.services_entity.types.hasOwnProperty(entityType)) { continue; }
      entityTypes.push(entityType);
    }
  }
  return entityTypes;
}

/**
 * Readies the jDrupal.services_queue object with Services Entity configuration.
 */
function _services_entity_queue_init() {
  for (var entityType in jDrupal.services_entity.types) {
    if (!jDrupal.services_entity.types.hasOwnProperty(entityType)) { continue; }
    if (jDrupal.services_queue[entityType]) { continue; }
    jDrupal.services_queue[entityType] = {
      retrieve: {}
    };
  }
}

/**
 * Given an entity type and entity, this will return the bundle name as a
 * string for the given entity, or null if the bundle is N/A.
 * @param {String} entity_type The entity type.
 * @param {Object} entity The entity JSON object.
 * @return {*}
 */
function entity_get_bundle(entity_type, entity) {
  try {
    // @TODO This isn't dynamic at all.
    var bundle = null;
    switch (entity_type) {
      case 'node': bundle = entity.type; break;
      case 'taxonomy_term': bundle = entity.vid; break;
      case 'comment':
      case 'file':
      case 'user':
      case 'taxonomy_vocabulary':
        // These entity types don't have a bundle.
        break;
      default:
        if (in_array(entity_type, services_entity_types())) { return entity.type; }
        var msg = 'WARNING: entity_get_bundle - unsupported entity type (' +
          entity_type + ')';
        console.log(msg);
        break;
    }
    return bundle;
  }
  catch (error) { console.log('entity_get_bundle - ' + error); }
}

function entity_get_bundle_name(entity_type) {
  // @TODO Should be dynamic.
  var bundle = null;
  switch (entity_type) {
    case 'node': return 'type'; break;
    case 'taxonomy_term': return 'vid'; break;
    case 'comment': // @TODO comment has a node bundle, kind of
    case 'file':
    case 'user':
    case 'taxonomy_vocabulary':
    default:
      if (in_array(entity_type, services_entity_types())) { return 'type'; }
      return null;
      break;
  }
}

/**
 * Parses an entity id and returns it as an integer (not a string).
 * @param {*} entity_id
 * @return {Number}
 */
function entity_id_parse(entity_id) { return typeof entity_id === 'string' ? parseInt(entity_id) : entity_id; }

/**
 * Given an entity type and the entity id, this will return the local storage
 * key to be used when saving/loading the entity from local storage.
 * @param {String} entity_type
 * @param {Number} id
 * @return {String}
 */
function entity_local_storage_key(entity_type, id) { return entity_type + '_' + id; }

/**
 * A placeholder function used to provide a local storage key for entity index
 * queries.
 * @param {String} path
 * @return {String}
 */
function entity_index_local_storage_key(path) { return path; }

/**
 * Loads an entity.
 * @param {String} entity_type
 * @param {Number|Array} ids
 * @param {Object} options
 */
function entity_load(entity_type, ids, options) {
  //try {
    var servicesEntityType = in_array(entity_type, services_entity_types());
    if (servicesEntityType) { _services_entity_queue_init(); }

    // If an array of entity ids was passed in, use the entity index resource to load them all.
    if (is_array(ids)) {
      var query = {
        parameters: {},
        options: {
          entity_load: true
        }
      };
      query.parameters[entity_primary_key(entity_type)] = ids.join(',');
      window[entity_type + '_index'](query, options);
      return;
    }

    // A single id was passed in, convert the id to an int, if it's a string.
    var entity_id = ids;
    entity_id = entity_id_parse(entity_id);

    var caching_enabled = entity_caching_enabled(entity_type);

    // If this entity is already queued for retrieval, set the success and
    // error callbacks aside, and return. Unless entity caching is enabled and
    // we have a copy of the entity in local storage, then send it to the
    // provided success callback.
    if (_services_queue_already_queued(entity_type, 'retrieve', entity_id, 'success')) {
      if (caching_enabled) {
        entity = _entity_local_storage_load(entity_type, entity_id, options);
        if (entity) {
          if (options.success) { options.success(entity); }
          return;
        }
      }
      if (typeof options.success !== 'undefined') {
        _services_queue_callback_add(entity_type, 'retrieve', entity_id, 'success', options.success);
      }
      if (typeof options.error !== 'undefined') {
        _services_queue_callback_add(entity_type, 'retrieve', entity_id, 'error', options.error);
      }
      return;
    }

    // This entity has not been queued for retrieval, queue it and its callback.
    _services_queue_add_to_queue(entity_type, 'retrieve', entity_id);
    _services_queue_callback_add(entity_type, 'retrieve', entity_id, 'success', options.success);

    // If entity caching is enabled, try to load the entity from local storage.
    // If a copy is available in local storage, bubble it to the success callback(s).
    var entity = false;
    if (caching_enabled) {
      entity = _entity_local_storage_load(entity_type, entity_id, options);
      if (entity) {
        _entity_callback_bubble(entity_type, entity_id, entity);
        return;
      }
    }

    // Verify the entity type is supported.
    if (!in_array(entity_type, entity_types())) {
      var message = 'WARNING: entity_load - unsupported type: ' + entity_type;
      console.log(message);
      if (options.error) { options.error(null, null, message); }
      return;
    }

    // We didn't load the entity from local storage. Let's grab it from the
    // Drupal server instead. First, let's build the call options.
    var primary_key = entity_primary_key(entity_type);
    var call_options = {
      success: function(data) {
        //try {

          // Set the entity equal to the returned data.
          entity = data;

          // If entity caching is enabled, set its expiration time and save it to local storage.
          if (entity_caching_enabled(entity_type, entity_get_bundle(entity_type, entity))) {
            _entity_set_expiration_time(entity_type, entity);
            _entity_local_storage_save(entity_type, entity_id, entity);
          }

          _entity_callback_bubble(entity_type, entity_id, entity);

        //}
        //catch (error) { console.log('entity_load - success - ' + error); }
      },
      error: function(xhr, status, message) {
        try {
          // Since we had a problem loading the entity, clear out the success queue.
          _services_queue_clear(entity_type, 'retrieve', entity_id, 'success');
          // Pass along the error if anyone wants to handle it.
          if (options.error) { options.error(xhr, status, message); }
        }
        catch (error) { console.log('entity_load - error - ' + error); }
      }
    };

    // Finally, determine the entity's retrieve function and call it.

    var function_name = !servicesEntityType ? entity_type + '_retrieve' : 'entity_retrieve';
    if (function_exists(function_name)) {
      call_options[primary_key] = entity_id;
      var fn = window[function_name];
      if (servicesEntityType) {
        services_resource_defaults(call_options, entity_type, 'retrieve');
        fn(entity_type, ids, call_options);
      }
      else { fn(ids, call_options); }
    }
    else { console.log('WARNING: ' + function_name + '() does not exist!'); }
  //}
  //catch (error) { console.log('entity_load - ' + error); }
}

function _entity_callback_bubble(entity_type, entity_id, entity) {
  // Send the entity back to the queued callback(s), then clear out the callbacks.
  var _success_callbacks = jDrupal.services_queue[entity_type]['retrieve'][entity_id].success;
  for (var i = 0; i < _success_callbacks.length; i++) { _success_callbacks[i](entity); }
  _services_queue_clear(entity_type, 'retrieve', entity_id, 'success');
}

/**
 * An internal function used by entity_load() to attempt loading an entity
 * from local storage.
 * @param {String} entity_type
 * @param {Number} entity_id
 * @param {Object} options
 * @return {Object}
 */
function _entity_local_storage_load(entity_type, entity_id, options) {
  try {
    var entity = false;
    // Process options if necessary.
    if (options) {
      // If we are resetting, remove the item from localStorage.
      if (options.reset) {
        _entity_local_storage_delete(entity_type, entity_id);
      }
    }
    // Attempt to load the entity from local storage.
    var local_storage_key = entity_local_storage_key(entity_type, entity_id);
    entity = window.localStorage.getItem(local_storage_key);
    if (entity) {

      entity = JSON.parse(entity);

      // We successfully loaded the entity from local storage. If it expired
      // remove it from local storage then continue onward with the entity
      // retrieval from Drupal. Otherwise return the local storage entity copy.
      if (entity_has_expired(entity_type, entity)) {
        _entity_local_storage_delete(entity_type, entity_id);
        entity = false;
      }
      else {

        // @TODO - this code belongs to DrupalGap! Figure out how to bring the
        // idea of DrupalGap modules into jDrupal that way jDrupal can provide
        // a hook for DrupalGap to take care of this code!

        // The entity has not yet expired. If the current page options
        // indicate reloadingPage is true (and the reset option wasn't set to
        // false) then we'll grab a fresh copy of the entity from Drupal.
        // If the page is reloading and the developer didn't call for a reset,
        // then just return the cached copy.
        if (drupalgap && drupalgap.page.options &&
          drupalgap.page.options.reloadingPage) {
          // Reloading page... cached entity is still valid.
          if (typeof drupalgap.page.options.reset !== 'undefined' &&
            drupalgap.page.options.reset === false) {
            // We were told to not reset it, so we'll use the cached copy.
            return entity;
          }
          else {
            // Remove the entity from local storage and reset it.
            _entity_local_storage_delete(entity_type, entity_id);
            entity = false;
          }
        }
      }
    }
    return entity;
  }
  catch (error) { console.log('_entity_local_storage_load - ' + error); }
}

/**
 * An internal function used to save an entity to local storage.
 * @param {String} entity_type
 * @param {Number} entity_id
 * @param {Object} entity
 */
function _entity_local_storage_save(entity_type, entity_id, entity) {
  try {
    var key = entity_local_storage_key(entity_type, entity_id);
    window.localStorage.setItem(key, JSON.stringify(entity));
    if (typeof jDrupal.cache_expiration.entities === 'undefined') { jDrupal.cache_expiration.entities = {}; }
    jDrupal.cache_expiration.entities[key] = entity.expiration;
    window.localStorage.setItem('cache_expiration', JSON.stringify(jDrupal.cache_expiration));
  }
  catch (error) { console.log('_entity_local_storage_save - ' + error); }
}

/**
 * An internal function used to delete an entity from local storage.
 * @param {String} entity_type
 * @param {Number} entity_id
 */
function _entity_local_storage_delete(entity_type, entity_id) {
  try {
    var storage_key = entity_local_storage_key(
      entity_type,
      entity_id
    );
    window.localStorage.removeItem(storage_key);
  }
  catch (error) { console.log('_entity_local_storage_delete - ' + error); }
}

/**
 * Returns an entity type's primary key.
 * @param {String} entity_type
 * @return {String}
 */
function entity_primary_key(entity_type) {
  try {
    var key;
    switch (entity_type) {
      case 'comment': key = 'cid'; break;
      case 'file': key = 'fid'; break;
      case 'node': key = 'nid'; break;
      case 'taxonomy_term': key = 'tid'; break;
      case 'taxonomy_vocabulary': key = 'vid'; break;
      case 'user': key = 'uid'; break;
      default:
          if (in_array(entity_type, services_entity_types())) { return 'id'; }
        // Is anyone declaring the primary key for this entity type?
        var function_name = entity_type + '_primary_key';
        if (function_exists(function_name)) {
          var fn = window[function_name];
          key = fn(entity_type);
        }
        else {
          var msg = 'entity_primary_key - unsupported entity type (' +
            entity_type + ') - to add support, declare ' + function_name +
            '() and have it return the primary key column name as a string';
          console.log(msg);
        }
        break;
    }
    return key;
  }
  catch (error) { console.log('entity_primary_key - ' + error); }
}

/**
 * Saves an entity.
 * @param {String} entity_type
 * @param {String} bundle
 * @param {Object} entity
 * @param {Object} options
 */
function entity_save(entity_type, bundle, entity, options) {
  try {
    var function_name;
    switch (entity_type) {
      case 'comment':
        if (!entity.cid) { function_name = 'comment_create'; }
        else { function_name = 'comment_update'; }
        break;
      case 'file':
        function_name = 'file_create';
        break;
      case 'node':
        if (!entity.language) { entity.language = language_default(); }
        if (!entity.nid) { function_name = 'node_create'; }
        else { function_name = 'node_update'; }
        break;
      case 'user':
        if (!entity.uid) { function_name = 'user_create'; }
        else { function_name = 'user_update'; }
        break;
      case 'taxonomy_term':
        if (!entity.tid) { function_name = 'taxonomy_term_create'; }
        else { function_name = 'taxonomy_term_update'; }
        break;
      case 'taxonomy_vocabulary':
        if (!entity.vid) { function_name = 'taxonomy_vocabulary_create'; }
        else { function_name = 'taxonomy_vocabulary_update'; }
        break;
      default:
        if (in_array(entity_type, services_entity_types())) {
          function_name = !entity[entity_primary_key(entity_type)] ? 'entity_create' : 'entity_update';
          window[function_name](entity_type, bundle, entity, options);
          return;
        }
        break;
    }
    if (function_name && function_exists(function_name)) {
      var fn = window[function_name];
      fn(entity, options);
    }
    else { console.log('WARNING: entity_save - unsupported type: ' + entity_type); }
  }
  catch (error) { console.log('entity_save - ' + error); }
}

/**
 * Returns true or false depending on whether caching is enabled or not. You
 * may optionally pass in an entity type as the first argument, and optionally
 * pass in a bundle name as a second argument to see if that particular cache
 * is enabled.
 * @return {Boolean}
 */
function entity_caching_enabled() {
  try {

    // First make sure entity caching is at least defined, then
    // make sure it's enabled.
    if (
      typeof jDrupal.settings.cache === 'undefined' ||
      typeof jDrupal.settings.cache.entity === 'undefined' ||
      !jDrupal.settings.cache.entity.enabled
    ) { return false; }

    // Entity caching is enabled globally...

    // Did they provide an entity type? If not, caching is enabled.
    var entity_type = arguments[0];
    if (!entity_type) { return true; }

    // Are there any entity type caching configs present? If not, caching is enabled.
    if (
        !jDrupal.settings.cache.entity.entity_types ||
        !jDrupal.settings.cache.entity.entity_types[entity_type]
    ) { return true; }

    // Grab the cache config for this entity type.
    var cache = jDrupal.settings.cache.entity.entity_types[entity_type];

    // Is caching explicitly disabled for this entity type?
    var entity_type_caching_disabled = typeof cache.enabled !== 'undefined' && cache.enabled === false;
    if (entity_type_caching_disabled) { return false; }

    // Did they provide a bundle? If not, then this entity type's caching is
    // enabled.
    var bundle = arguments[1];
    if (!bundle) { return true; }

    // Is caching explicitly disabled for this bundle?
    if (typeof cache.bundles !== 'undefined' && typeof cache.bundles[bundle] !== 'undefined') {
      return typeof cache.bundles[bundle].enabled !== 'undefined' ?
          cache.bundles[bundle].enabled : cache.enabled;
    }

    // We didn't prove caching to be disabled, so it must be enabled.
    return true;
  }
  catch (error) { console.log('entity_caching_enabled - ' + error); }
}

/**
 *
 * @param entity_type
 * @param entity
 */
function entity_has_expired(entity_type, entity) {
  return typeof entity.expiration !== 'undefined' && entity.expiration != 0 && time() > entity.expiration;
}

/**
 * Looks for expired entities and remove them from local storage.
 */
function entity_clean_local_storage() {
  if (!jDrupal.cache_expiration.entities) { return; }
  for (var key in jDrupal.cache_expiration.entities) {
    if (!jDrupal.cache_expiration.entities.hasOwnProperty(key)) { continue; }
    var expiration = jDrupal.cache_expiration.entities[key];
    if (expiration > time()) { continue; }
    delete jDrupal.cache_expiration.entities[key];
    var parts = key.split('_');
    var entity_type = parts[0];
    var entity_id = parts[1];
    _entity_local_storage_delete(entity_type, entity_id);
    window.localStorage.setItem('cache_expiration', JSON.stringify(jDrupal.cache_expiration));
  }
}

/**
 * An internal function used to get the expiration time for entities.
 * @param entity_type
 * @param entity
 * @returns {null|Number}
 * @private
 */
function _entity_get_expiration_time(entity_type, entity) {
  try {
    var expiration = null;
    var bundle = entity_get_bundle(entity_type, entity);
    if (entity_caching_enabled(entity_type, bundle)) {
      var expiration = 0;
      var cache = jDrupal.settings.cache;
      if (cache.entity.expiration !== 'undefined') {
        expiration = cache.entity.expiration;
      }
      if (cache.entity.entity_types !== 'undefined') {
        if (
            cache.entity.entity_types[entity_type] &&
            typeof cache.entity.entity_types[entity_type].expiration !== 'undefined'
        ) { expiration = cache.entity.entity_types[entity_type].expiration; }
        if (
            bundle &&
            cache.entity.entity_types[entity_type] &&
            cache.entity.entity_types[entity_type].bundles &&
            cache.entity.entity_types[entity_type].bundles[bundle] &&
            typeof cache.entity.entity_types[entity_type].bundles[bundle].expiration !== 'undefined'
        ) { expiration = cache.entity.entity_types[entity_type].bundles[bundle].expiration; }
      }
    }
    if (expiration) { expiration += time(); }
    return expiration;
  }
  catch (error) { console.log('_entity_get_expiration_time - ' + error); }
}

/**
 * An internal function used to set the expiration time onto a given entity.
 * @param {String} entity_type The entity type.
 * @param {Object} entity The entity object.
 */
function _entity_set_expiration_time(entity_type, entity) {
  try {
    entity.expiration = _entity_get_expiration_time(entity_type, entity);
  }
  catch (error) { console.log('_entity_set_expiration_time - ' + error); }
}

/**
 * Returns an array of entity type names.
 * @return {Array}
 */
function entity_types() {
  // Start with core entity types.
  var entityTypes = [
    'comment',
    'file',
    'node',
    'taxonomy_term',
    'taxonomy_vocabulary',
    'user'
  ];
  // Append and Services Entity types.
  var servicesEntityTypes = services_entity_types();
  if (servicesEntityTypes.length) {
    entityTypes.push.apply(entityTypes, servicesEntityTypes);
  }
  return entityTypes;
}

/**
 * An internal function used by entity_index() to attempt loading a specific
 * query's results from local storage.
 * @param {String} entity_type
 * @param {String} path The URL path used by entity_index(), used as the cache
 *  key.
 * @param {Object} options
 * @return {Object}
 */
function _entity_index_local_storage_load(entity_type, path, options) {
  try {
    var _entity_index = false;
    // Process options if necessary.
    if (options) {
      // If we are resetting, remove the item from localStorage.
      if (options.reset) {
        _entity_index_local_storage_delete(path);
      }
    }
    // Attempt to load the entity_index from local storage.
    var local_storage_key = entity_index_local_storage_key(path);
    _entity_index = window.localStorage.getItem(local_storage_key);
    if (_entity_index) {
      _entity_index = JSON.parse(_entity_index);
      // We successfully loaded the entity_index result ids from local storage.
      // If it expired remove it from local storage then continue onward with
      // the entity_index retrieval from Drupal. Otherwise return the local
      // storage entity_index copy.
      if (typeof _entity_index.expiration !== 'undefined' &&
          _entity_index.expiration != 0 &&
          time() > _entity_index.expiration) {
        _entity_index_local_storage_delete(path);
        _entity_index = false;
      }
      else {
        // The entity_index has not yet expired, so pull each entity out of
        // local storage, add them to the result array, and return the array.
        var result = [];
        for (var i = 0; i < _entity_index.entity_ids.length; i++) {
          result.push(
            _entity_local_storage_load(
              entity_type,
              _entity_index.entity_ids[i],
              options
            )
          );
        }
        _entity_index = result;
      }
    }
    return _entity_index;
  }
  catch (error) { console.log('_entity_index_local_storage_load - ' + error); }
}

/**
 * An internal function used to save an entity_index result entity ids to
 * local storage.
 * @param {String} entity_type
 * @param {String} path
 * @param {Object} result
 */
function _entity_index_local_storage_save(entity_type, path, result) {
  try {
    var index = {
      entity_type: entity_type,
      expiration: _entity_get_expiration_time(),
      entity_ids: []
    };
    for (var i = 0; i < result.length; i++) {
      index.entity_ids.push(result[i][entity_primary_key(entity_type)]);
    }
    window.localStorage.setItem(
      entity_index_local_storage_key(path),
      JSON.stringify(index)
    );
  }
  catch (error) { console.log('_entity_index_local_storage_save - ' + error); }
}

/**
 * An internal function used to delete an entity_index from local storage.
 * @param {String} path
 */
function _entity_index_local_storage_delete(path) {
  try {
    var storage_key = entity_index_local_storage_key(path);
    window.localStorage.removeItem(storage_key);
  }
  catch (error) {
    console.log('_entity_index_local_storage_delete - ' + error);
  }
}
