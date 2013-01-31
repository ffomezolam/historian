define( function(require) {
    /**
     * Exports class for handling command history
     *
     * @module historian
     */

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
        this.context = context;
        this.size = size || 10;

        this.history = {
            undo: [],
            redo: []
        };

        this.registerTo = 'undo';
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
            var type = this.registerTo;
            if(this.history[type].length >= this.size) this.history[type].unshift();
            this.history[type].push({ command: cmd, args: args });
            this.registerTo = 'undo';
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
                    this.registerTo = 'redo';
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
                    this.registerTo = 'undo';
                    entry.command.apply(this.context, entry.args);
                }
            }
            return this;
        }
    };

    return Historian;
});