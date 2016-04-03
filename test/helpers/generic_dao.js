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

// This is a Node.js module that exports a function.
// That function expects to be called from inside a describe(), and for its
// first argument to be some DAO class.
//
// This will run a suite of generic DAO tests against it, that should work
// against any DAO.


global.genericDAOTestBattery = function(daoFactory) {
  describe('generic DAO tests', function() {
    foam.CLASS({
      package: 'test.dao.generic',
      name: 'Person',
      properties: [
        {
          class: 'Int',
          name: 'id',
        },
        {
          class: 'String',
          name: 'firstName',
        },
        {
          class: 'String',
          name: 'lastName',
        },
        // TODO(braden): Put these tags fields back when the serialization
        // supports them properly.
        /*
        {
          class: 'Array',
          of: 'String',
          name: 'tags',
        },
        */
        {
          class: 'Boolean',
          name: 'deceased',
        },
        // TODO(braden): Test serializing more values: Dates, nested FObjects,
        // arrays of nested FObjects.
      ]
    });

    var mkPerson1 = function() {
      return test.dao.generic.Person.create({
        id: 1,
        firstName: 'Angus',
        lastName: 'Young',
        deceased: false,
        //tags: ['guitar','70s', '80s'],
      });
    };

    var mkPerson2 = function() {
      return test.dao.generic.Person.create({
        id: 2,
        firstName: 'Jon',
        lastName: 'Bonham',
        deceased: true,
        //tags: ['drums','70s'],
      });
    };

    describe('put()', function() {
      it('should insert new objects', function(done) {
        var dao = daoFactory(test.dao.generic.Person);
        var p = mkPerson1();
        dao.put(p).then(function(p2) {
          expect(p2).toBeDefined();
          expect(p2.id).toEqual(p.id);
          done();
        });
      });

      it('should update objects with the same id', function(done) {
        var dao = daoFactory(test.dao.generic.Person);
        var p = mkPerson1();
        dao.put(p).then(function(p2) {
          var clone = p.clone();
          clone.firstName = 'Neil';
          expect(p.firstName).toBe('Angus');
          return dao.put(clone);
        }).then(function(p3) {
          expect(p3.firstName).toBe('Neil');
          return dao.find(p.id);
        }).then(function(p4) {
          expect(p4.id).toBe(p.id);
          expect(p4.firstName).toBe('Neil');
          return dao.select(foam.mlang.sink.Count.create());
        }).then(function(c) {
          expect(c.value).toBe(1);
        }).catch(function(e) {
          fail(e);
        }).then(done);
      });

      it('should return a Promise for the sink, if a sink is provided', function(done) {
        var dao = daoFactory(test.dao.generic.Person);
        var p = mkPerson1();
        var sinkCalled = false;
        var sink = {
          put: function(p2) {
            sinkCalled = true;
            expect(p2).toBeDefined();
            expect(p2.id).toBe(p.id);
          }
        };

        dao.put(p, sink).then(function(s) {
          expect(s).toBe(sink);
          expect(sinkCalled).toBe(true);
          done();
        });
      });

      it('should pub on.put with the object', function(done) {
        var dao = daoFactory(test.dao.generic.Person);
        var p = mkPerson1();
        var listenerCalled = false;
        dao.on.put.sub(function(sub, on, put, obj) {
          expect(sub).toBeDefined();
          expect(on).toBe('on');
          expect(put).toBe('put');

          expect(obj).toBeDefined();
          expect(obj.id).toBe(p.id);

          listenerCalled = true;
        });

        dao.put(p).then(function() {
          expect(listenerCalled).toBe(true);
          done();
        });
      });
    });

    describe('find()', function() {
      it('should get existing objects', function(done) {
        var dao = daoFactory(test.dao.generic.Person);
        var p = mkPerson1();
        dao.put(p).then(function() {
          return dao.find(p.id);
        }).then(function(p2) {
          expect(p.id).toBe(p2.id);
          done();
        });
      });

      it('should return a rejected Promise when the object cannot be found', function(done) {
        var dao = daoFactory(test.dao.generic.Person);
        var p = mkPerson1();
        dao.find(p.id).then(function() {
          fail('find() should fail when the ID is not found');
        }).catch(function() {
          expect(1).toBe(1);
        }).then(function() {
          return dao.put(p);
        }).then(function() {
          return dao.find(p.id);
        }).then(function(p2) {
          expect(p2.id).toBe(p.id);
          return dao.find(74);
        }).then(function() {
          fail('find() should fail when the ID is not found');
        }).catch(function() {
          expect(1).toBe(1);
        }).then(done);
      });
    });

    describe('remove()', function() {
      it('should return a Promise for the removed object', function(done) {
        var dao = daoFactory(test.dao.generic.Person);
        var p = mkPerson1();
        dao.put(p).then(function(p2) {
          return dao.find(p.id);
        }).then(function(p3) {
          expect(p3).toBeDefined();
          expect(p3.id).toBe(p.id);
          return dao.remove(p);
        }).then(function(p4) {
          expect(p4).toBeDefined();
          expect(p4.id).toBe(p.id);
          done();
        });
      });

      it('should actually remove the object', function(done) {
        var dao = daoFactory(test.dao.generic.Person);
        var p = mkPerson1();
        dao.put(p).then(function(p2) {
          return dao.find(p.id);
        }).then(function(p3) {
          expect(p3).toBeDefined();
          expect(p3.id).toBe(p.id);
          return dao.remove(p.id);
        }).then(function(p4) {
          return dao.find(p4.id);
        }).then(function() {
          fail('find() should fail after remove()');
        }, function(e) {
          expect(e).toBeDefined();
        }).then(done);
      });

      it('should pub on.remove with the object', function(done) {
        var dao = daoFactory(test.dao.generic.Person);
        var p = mkPerson1();
        var listenerCalled = false;
        dao.on.remove.sub(function(sub, on, remove, obj) {
          expect(sub).toBeDefined();
          expect(on).toBe('on');
          expect(remove).toBe('remove');

          expect(obj).toBeDefined();
          expect(obj.id).toBe(p.id);

          listenerCalled = true;
        });

        dao.put(p).then(function() {
          return dao.remove(p);
        }).then(function() {
          expect(listenerCalled).toBe(true);
          done();
        });
      });
    });

    describe('select()', function() {
      it('should just call eof() when the DAO is empty', function(done) {
        var dao = daoFactory(test.dao.generic.Person);
        var puts = 0;
        var eofCalled = false;
        var sink = {
          put: function() { puts++; },
          eof: function() { eofCalled = true; }
        };

        dao.select(sink).then(function(s) {
          expect(s).toBe(sink);
          expect(puts).toBe(0);
          expect(eofCalled).toBe(true);
          done();
        });
      });

      it('should make an ArraySink if sink is not provided', function(done) {
        var dao = daoFactory(test.dao.generic.Person);

        dao.select().then(function(s) {
          expect(s).toBeDefined();
          expect(foam.dao.ArraySink.isInstance(s)).toBe(true);
          done();
        });
      });

      it('should call sink.put for each item', function(done) {
        var dao = daoFactory(test.dao.generic.Person);
        var p1 = mkPerson1();
        var p2 = mkPerson2();

        var puts = 0;
        var eofCalled = false;
        var seen = {};
        var sink = {
          put: function(o) {
            expect(o).toBeDefined();
            expect(seen[o.id]).toBeUndefined();
            seen[o.id] = true;
            puts++;
          },
          eof: function() { eofCalled = true; }
        };

        dao.put(p1).then(function() {
          return dao.put(p2);
        }).then(function() {
          return dao.select(sink);
        }).then(function(s) {
          expect(s).toBe(sink);
          expect(puts).toBe(2);
          expect(Object.keys(seen).length).toBe(2);
          expect(eofCalled).toBe(true);
          done();
        });
      });

      describe('filtering', function() {
        var dao;
        var exprs = foam.mlang.Expressions.create();
        beforeEach(function(done) {
          dao = daoFactory(test.dao.generic.Person);
          dao.put(mkPerson1()).then(function() {
            return dao.put(mkPerson2());
          }).then(done);
        });

        afterEach(function() {
          dao = null;
        });

        it('should support where()', function() {
          var filtered = dao.where(exprs.NEQ(test.dao.generic.Person.DECEASED, false));
          expect(filtered).toBeDefined();
          expect(filtered.select).toBeDefined();
        });

        it('should honour where()', function(done) {
          dao.where(exprs.NEQ(test.dao.generic.Person.DECEASED, false)).select().then(function(a) {
            expect(a).toBeDefined();
            expect(a.a).toBeDefined();
            expect(a.a.length).toBe(1);
          }).catch(function(e) {
            fail(e);
          }).then(done);
        });

        it('should honour limit()', function(done) {
          dao.limit(1).select().then(function(a) {
            expect(a).toBeDefined();
            expect(a.a).toBeDefined();
            expect(a.a.length).toBe(1);
          }).catch(function(e) {
            fail(e);
          }).then(done);
        });

        it('should honour skip()', function(done) {
          var first = foam.dao.ArraySink.create();
          var second = foam.dao.ArraySink.create();
          Promise.all([
            dao.limit(1).select(first),
            dao.skip(1).limit(1).select(second)
          ]).then(function() {
            expect(first.a).toBeDefined();
            expect(first.a.length).toBe(1);
            expect(second.a).toBeDefined();
            expect(second.a.length).toBe(1);

            expect(first.a[0].id).not.toEqual(second.a[0].id);
          }).catch(function(e) {
            fail(e);
          }).then(done);
        });

        it('should honour orderBy()', function(done) {
          dao.orderBy(test.dao.generic.Person.LAST_NAME).select().then(function(a) {
            expect(a.a).toBeDefined();
            expect(a.a.length).toBe(2);

            expect(a.a[0].lastName).toBe('Bonham');
            expect(a.a[1].lastName).toBe('Young');
            return dao.orderBy(test.dao.generic.Person.FIRST_NAME).select();
          }).then(function(a) {
            expect(a.a).toBeDefined();
            expect(a.a.length).toBe(2);

            expect(a.a[0].firstName).toBe('Angus');
            expect(a.a[1].firstName).toBe('Jon');
          }).then(done);
        });
      });
    });
  });
};
