var E = foam.__context__.E.bind(foam.__context__);

foam.CLASS({
  name: 'Tab',
  extends: 'foam.u2.Element',

  properties: [
    { class: 'String',  name: 'label' },
    { class: 'Boolean', name: 'selected' }
  ]
});


foam.CLASS({
  name: 'Tabs',
  extends: 'foam.u2.Element',

  axioms: [
    foam.u2.CSS.create({
      code: function() {/*
        ^ {
          background: gray;
          width: 600px;
          height: 200px;
          padding: 10px;
          display: block;
        }
        ^handles { height: 30px; }
        ^tab {
          border: 1px solid black;
          border-bottom: none;
          padding: 5px;
          background: lightgray;
        }
        ^tab.selected {
          background: white;
          position: relative;
          z-index: 1;
        }
        ^content {
          margin: 4px;
          padding: 6px;
          background: white;
          border: 1px solid black;
          position: relative;
          top: -13px;
          left: -4px;
        }
      */}
    })
  ],

  properties: [
    /* not used
    {
      name: 'tabs',
      factory: function() { return []; }
    },
    */
    {
      name: 'selected',
      postSet: function(o, n) {
        if ( o ) o.selected = false;
        n.selected = true;
      }
    },
    'handles',
    'area'
  ],

  methods: [
    function init() {
      this.
          cssClass(this.myCls()).
          start('div', null, this.handles$).
            cssClass(this.myCls('handles')).
          end().
          start('div', null, this.content$).
            cssClass(this.myCls('content')).
          end();
    },

    function add(tab) {
      if ( Tab.isInstance(tab) ) {
        if ( ! this.selected ) this.selected = tab;
        this.handles.start('span').
            cssClass(this.myCls('tab')).
            on('click', function() { this.selected = tab;}.bind(this)).
            enableCls('selected', tab.selected$).
            add(tab.label).
        end();
        tab.shown$ = tab.selected$;
      }

      this.SUPER(tab);
    }
  ]
});

var tabs = Tabs.create().
  start(Tab, {label: 'Tab 1'}).add('tab 1 contents').end().
  start(Tab, {label: 'Tab 2'}).add('tab 2 contents').end().
  start(Tab, {label: 'Tab 3'}).add('Even more contents in tab 3').end();

tabs.write();


E('br').write();



foam.CLASS({
  name: 'SampleBorder',
  extends: 'foam.u2.Element',

  axioms: [
    foam.u2.CSS.create({
      code: function() {/*
        ^ { background: gray; padding: 10px; display: inline-block; }
        ^title { padding: 6px; align-content: center; background: aliceblue; }
        ^content { padding: 6px; width: 300px; height: 200px; background: white; }
      */}
    })
  ],

  properties: [
    'title'
  ],

  methods: [
    function init() {
      this.
          cssClass(this.myCls()).
          start('div').cssClass(this.myCls('title')).add(this.title$).end().
          start('div', null, this.content$).
            cssClass(this.myCls('content')).
          end();
    }
  ]
});

var sb = SampleBorder.create({title: 'Title'});
sb.add('content');
sb.write();

E('br').write();



foam.CLASS({
  name: 'SampleSplitContainer',
  extends: 'foam.u2.Element',

  axioms: [
    foam.u2.CSS.create({
      code: function() {/*
        ^ { background: gray; padding: 10px; display: inline-flex; }
        ^content { margin: 4px; padding: 6px; width: 300px; height: 200px; background: white; }
      */}
    })
  ],

  properties: [
    'leftPanel', 'rightPanel'
  ],

  methods: [
    function init() {
      this.
          cssClass(this.myCls()).
          start('div', null, this.leftPanel$).
            cssClass(this.myCls('content')).
          end().
          start('div', null, this.rightPanel$).
            cssClass(this.myCls('content')).
          end();
    }
  ]
});

var split = SampleSplitContainer.create();
split.write();
split.leftPanel.add('leftContent');
split.rightPanel.add('rightContent');