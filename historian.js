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
     * @class Historian
     * @constructor
     * @param {object} context - Context for commands
     * @param {number} [size] - Size of undo/redo stack
     */
    function Historian(context, size) {
        /**
         * Object which historian tracks
         * @property context
         * @private
         */
        this.context = context;
        /**
         * Number of undo/redo levels
         * @property size
         * @private
         */
        this.size    = size || 10;

        /**
         * History stacks
         * @property history
         * @private
         */
        this.history = {
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
         * @param {function} cmd - Command
         * @param {array} [args] - Command argument array
         * @return {Historian} Historian instance
         */
        register: function(cmd, args) {
            if(!isArray(args)) args = [args];
            var type = this._next;
            if(this.history[type].length >= this.size) this.history[type].unshift();
            this.history[type].push({ command: cmd, args: args });
            this._next = 'undo';
            return this;
        },

        /**
         * Undo the last command(s)
         *
         * @method undo
         * @chainable
         * @param {number} [n] - Levels to undo
         * @return {Historian} Historian instance
         */
        undo: function(n) {
            n = n || 1;
            if(n > this.history.undo.length) n = this.history.undo.length;
            if(this.history.undo.length < this.size) {
                for(var i = 0; i < n; i++) {
                    var entry = this.history.undo.pop();
                    this._next = 'redo';
                    entry.command.apply(this.context, entry.args);
                }
            }
            return this;
        },

        /**
         * Redo the last command(s)
         *
         * @method redo
         * @chainable
         * @param {number} [n] - Levels to redo
         * @return {Historian} Historian instance
         */
        redo: function(n) {
            n = n || 1;
            if(n > this.history.redo.length) n = this.history.redo.length;
            if(this.history.redo.length < this.size) {
                for(var i = 0; i < n; i++) {
                    var entry = this.history.redo.pop();
                    this._next = 'undo';
                    entry.command.apply(this.context, entry.args);
                }
            }
            return this;
        }
    };

    return Historian;
});
