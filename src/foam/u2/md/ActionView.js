/**
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
foam.CLASS({
  package: 'foam.u2.md',
  name: 'ActionView',
  extends: 'foam.u2.Element',

  properties: [
    'data',
    'action',
    {
      class: 'Boolean',
      name: 'raised',
      documentation: 'Controls the "raised" attribute in Polymer. Defaults ' +
          'to false; set this to true for a raised, bordered button.'
    },
    {
      name: 'label',
      expression: function(action) { return action.label; }
    }
  ],

  methods: [
    function initE() {
      this.nodeName = 'paper-button';
      this.cssClass(this.myCls())
          .attrs({ raised: this.raised$ })
          .on('click', this.click)
          .add(this.label$);

      if ( this.action.isAvailable ) {
        this.enableCls(this.myCls('unavailable'),
              this.action.createIsAvailable$(this.data$), true /* negate */);
      }

      if ( this.action.isEnabled ) {
        this.attrs({
          disabled: this.action.createIsEnabled$(this.data$).map(function(e) {
            return e ? false : 'disabled';
          })
        });
      }
    }
  ],

  axioms: [
    foam.u2.CSS.create({
      code: function CSS() {/*
        ^unavailable {
          display: none;
        }
      */}
    })
  ],

  listeners: [
    function click() {
      this.action.maybeCall(this.__subContext__, this.data);
    }
  ]
});