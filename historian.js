/**
 * Exports class for handling command history
 *
 * @module historian
 */
(function(name, context, definition) {
    if(typeof module !== 'undefined' && module.exports) module.exports = definition();
    else if(typeof define === 'function' && define.amd) define(definition);
    else context[name] = definition();
})('Historian', this, function() {
    function isArray(o) {
        return Object.prototype.toString.call(o) === "[object Array]";
    }

    /**
     * Simple history manager.
     *
     *      // NOTE: this class was designed to work with functions that 
     *      // modify instance, global, or static variable within the
     *      // function body.  For example:
     *
     *      var h = new Historian(window);
     *
     *      var x = 2;
     *      function doublex() { x = x * 2; }
     *
     *      // To make this undoable, register the opposite operation within
     *      // the function body:
     *      function halvex() { h.register(doublex); x = x / 2; }
     *
     *      // Now you can undo the halvex() operation:
     *      halvex(); // x == 1
     *      h.undo(); // x == 2 (applies doublex() as the registered operation)
     *
     *      // BUT: historian won't really work if you try using it like this:
     *      function add(a, b) { 
     *          h.register(sub, [a, b]);
     *          return a + b; 
     *      }
     *      function sub(a, b) {
     *          h.register(add, [a, b]);
     *          return a - b;
     *      }
     *      x = add(a, b); // can't undo this!
     *
     *      // MORAL: the undoable value must be set within the function (for now)
     *
     * @class Historian
     * @constructor
     * @param {Object} context Context for commands
     * @param {Number} [size] Size of undo/redo stack
     * @example
     *      function Ops() {
     *          this.x = 1;
     *          this.h = new Historian(this);
     *      }
     *      Ops.prototype.add = function() {
     *          this.h.register(this.sub);
     *          this.x++;
     *      }
     *      Ops.prototype.sub = function() {
     *          this.h.register(this.add);
     *          this.x--;
     *      }
     *
     *      // try it!
     *      var o = new Ops();
     *      o.add();      // o.x == 2
     *      o.h.undo();   // o.x == 1
     *      o.sub();      // o.x == 0
     *      o.add();      // o.x == 1
     *      o.add();      // o.x == 2
     *      o.h.undo(2);  // o.x == 0
     *      o.h.redo();   // o.x == 1
     *      // etc...
     */
    function Historian(context, size) {
        /**
         * Object which historian tracks
         * @property context
         * @private
         */
        this._context = context || window;
        /**
         * Number of undo/redo levels
         * @property size
         * @private
         */
        this._size = size || 10;

        /**
         * History stacks
         * @property history
         * @private
         */
        this._history = {
            undo: [],
            redo: []
        };

        /**
         * Next stack
         * @property _next
         * @private
         */
        this._next = 'undo';
    }

    Historian.prototype = {
        /**
         * Register a function with the historian
         *
         * @method register
         * @chainable
         * @param {Function} cmd Command
         * @param {Array} [args] Command arguments
         * @example
         *      // use register() within the function you want to make undo- or
         *      // redo-able:
         *      var x = 1;
         *      function doSomething() {
         *          // register the inverse operation...
         *          historianInstance.register(function() {
         *              // and register the inverse of the inverse as well
         *              // to allow redo...
         *              historianInstance.register(doSomething);
         *              x = 1;
         *          });
         *
         *          // and this is the function's operation
         *          x = 5 * 10 * 20;
         *      }
         */
        register: function(cmd, args) {
            if(!isArray(args)) args = [args];
            var type = this._next;
            if(this._history[type].length >= this._size) this._history[type].unshift();
            this._history[type].push({ command: cmd, args: args });
            this._next = 'undo';
            return this;
        },

        /**
         * Undo the last command(s)
         *
         * @method undo
         * @chainable
         * @param {Number} [n] Levels to undo
         */
        undo: function(n) {
            n = n || 1;
            if(n > this._history.undo.length) n = this._history.undo.length;
            if(this._history.undo.length < this._size) {
                for(var i = 0; i < n; i++) {
                    var entry = this._history.undo.pop();
                    this._next = 'redo';
                    entry.command.apply(this._context, entry.args);
                }
            }
            return this;
        },

        /**
         * Redo the last command(s)
         *
         * @method redo
         * @chainable
         * @param {Number} [n] Levels to redo
         */
        redo: function(n) {
            n = n || 1;
            if(n > this._history.redo.length) n = this._history.redo.length;
            if(this._history.redo.length < this._size) {
                for(var i = 0; i < n; i++) {
                    var entry = this._history.redo.pop();
                    this._next = 'undo';
                    entry.command.apply(this._context, entry.args);
                }
            }
            return this;
        }
    };

    return Historian;
});
