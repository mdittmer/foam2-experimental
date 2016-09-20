/*
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(typeof require !== "undefined") &&  require("../../src/core/node.js");

/**
  Serves to generate executable examples and unit test cases.
*/
foam.CLASS({
  package: 'test.helpers',
  name: 'Exemplar',

  imports: [ 'exemplarRegistry as registry' ],

  properties: [
    {
      /** this Example's unique name */
      name: 'name',
      required: true
    },
    {
      /** a one-line description of the example */
      name: 'description'
    },
    {
      /** Examplars to load and execute before this one. Output code will
        be the merged result of all dependencies. */
      class: 'StringArray',
      name: 'dependencies'
    },
    {
      /** Set to true if your code is a function that returns a promise */
      class: 'Boolean',
      name: 'isAsync',
      value: false
    },
    {
      /** The code for this example. This should be either bare code, or a
        function that returns a promise if async. */
      class: 'String',
      name: 'code',
      adapt: function(old, nu) {
        if ( foam.Function.is(nu) ) {
          var matches = nu.toString().match(/function\s*(async)?\(\s*\)\s*\{((?:.|\n)*)\}/);
          if ( matches[1] ) this.isAsync = true;
          return matches[2];
        }
        return nu.replace('\t', '  ');
      }
    },
    {
      /** Is true if any dependencies are async.
        @private */
      class: 'Boolean',
      name: 'hasAsyncDeps_',
      hidden: true,
      expression: function(dependencies) {
        var self = this;
        var ret = false;
        self.dependencies && self.dependencies.forEach(function(depName) {
          var dep = self.registry.lookup(depName);
          if ( dep.hasAsyncDeps_ || dep.isAsync ) {
            ret = true;
            return true;
          }
        });
        return ret;
      }
    },
  ],

  methods: [
    function init() {
      this.registry.register(this);
    },

    function generateExample() {
      var indent = { level: 0 };
      var ret = "";
      var self = this;
      var tabs = "";
      for ( var i = 0; i < indent.level; i++) { tabs += '  '; }

      // flatten dependencies
      var deps = this.flattenDependencies();

      deps.sync.forEach(function(dep) {
        ret += dep.outputSelf(indent);
      });


      if ( deps.async.length ) {
        indent.level += 1;
        ret += tabs + "Promise.resolve({\n";
      }
      deps.async.forEach(function(dep) {
        ret += tabs + "}).then(function() {\n";
        ret += dep.outputSelf(indent);
      });
      if ( deps.async.length ) {
        ret += tabs + "}).then(function() {\n";
      }

      ret += self.outputSelf(indent);

      // inner enclosing end
      if ( deps.async.length ) {
        ret += tabs + '})\n';
        indent.level -= 1;
      }

      return ret;
    },

    function outputSelf(indent) {

      var ret = "\n";
      var lines = this.code.split('\n');
      var tabs = "";
      for ( var i = 0; i < indent.level; i++) { tabs += '  '; }

      ret += tabs + '//=====================================================\n';
      ret += tabs + '// ' + this.name + '\n';
      ret += tabs + '// ' + this.description + '\n';
      ret += tabs + '//=====================================================\n';

      // only keep source indent relative to first line
      var firstLineIndent = -1;
      lines.forEach(function(line) {

        if ( firstLineIndent < 0 ) {
          // skip initial blank lines
          var trimmed = line.trim();
          if ( trimmed.length == 0 ) return;
          firstLineIndent = line.indexOf(trimmed);
          line = trimmed;
        } else {
          line = line.slice(firstLineIndent);
        }
        ret += tabs + line + '\n';
      });

      ret += "\n";

      return ret;
    },

    function flattenDependencies(depsLoaded) {
      var self = this;
      if ( ! self.dependencies ) {
        return {
          sync: [],
          async: []
        };
      } else {
        depsLoaded = depsLoaded || {};

        var syncDeps = [];
        var asyncDeps = [];

        self.dependencies.forEach(function(depName) {
          if ( depsLoaded[depName] ) return; // only load each dependency once

          var dep = self.registry.lookup(depName);
          var depDeps = dep.flattenDependencies(depsLoaded);

          syncDeps = syncDeps.concat(depDeps.sync);
          asyncDeps = asyncDeps.concat(depDeps.async);

          depsLoaded[dep.name] = true;

          if ( dep.hasAsyncDeps_ || dep.isAsync ) {
            asyncDeps.push(dep);
          } else {
            syncDeps.push(dep);
          }
        });
        return {
          sync: syncDeps,
          async: asyncDeps
        }
      }
    }

  ]
});

/**
  Serves to generate executable examples and unit test cases.
*/
foam.CLASS({
  package: 'test.helpers',
  name: 'ExemplarRegistry',

  exports: [ 'as exemplarRegistry' ],

  properties: [
    {
      name: 'registrants',
      factory: function() { return {}; }
    }
  ],

  methods: [
    function lookup(name) {
      var found = this.registrants[name];

      if ( ! found ) throw "Examplar " + name + " not found!";

      return found;
    },
    function register(ex) {
      /** Registers an examplar. Re-registering the same one is allowed, but
        two Examplars with the same name is not. */
      var prev = this.registrants[ex.name];
      if ( prev && prev !== ex ) throw "Exemplar " + ex.name + " already registered!";

      this.registrants[ex.name] = ex;
    }
  ]

});