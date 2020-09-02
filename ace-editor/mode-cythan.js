ace.define("ace/mode/cythan_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var stringEscape = /\\(?:[nrt0'"\\]|x[\da-fA-F]{2}|u\{[\da-fA-F]{6}\})/.source;
    var CythanHighlightRules = function () {

        this.$rules = {
            start:
                [{
                    token: 'support.function.other.source.cythan',
                    regex: '(\'(#)?[a-zA-Z0-9_]+)'
                },
                {
                    token: 'parameter.other.source.cythan',
                    regex: '[a-zA-Z_][a-zA-Z0-9_]*',

                    onMatch: function (value, currentState, stack, line) {
                        while (line.includes("  ")) {
                            line = line.replace("  ", " ");
                        }
                        if (line.includes(value + "(") || line.includes(value + " (")) {
                            return "variable.parameter.other.source.cythan";
                        } else if (line.includes(value + "{") || line.includes(value + " {")) {
                            return "keyword.other.source.cythan";
                        } else {
                            return "variable.other.source.cythan";
                        }
                    }
                },
                {
                    token: 'function.other.source.cythan',
                    regex: '(\'(#)?[a-zA-Z0-9_]+)'
                },
                { token: 'support.constant', regex: '\\b[a-zA-Z_][\\w\\d]*::' },
                {
                    token: 'comment.line.double-dash.source.cythan',
                    regex: '# .*$'
                },

                {
                    token: 'keyword.operator',
                    regex: /\$|[~+\\-\\?=]/
                },
                { token: "punctuation.operator", regex: /[?:,;.]/ },
                { token: "paren.lparen", regex: /[\[({]/ },
                { token: "paren.rparen", regex: /[\])}]/ },
                {
                    token: 'constant.numeric.source.cythan',
                    regex: /\b([0-9])+\b/
                }]
        };

        this.normalizeRules();
    };

    CythanHighlightRules.metaData = {
        fileTypes: ['ct'],
        foldingStartMarker: '^.*\\bfn\\s*(\\w+\\s*)?\\([^\\)]*\\)(\\s*\\{[^\\}]*)?\\s*$',
        foldingStopMarker: '^\\s*\\}',
        name: 'Cythan',
        scopeName: 'source.cythan'
    };


    oop.inherits(CythanHighlightRules, TextHighlightRules);

    exports.CythanHighlightRules = CythanHighlightRules;
});

ace.define("ace/mode/folding/cstyle", ["require", "exports", "module", "ace/lib/oop", "ace/range", "ace/mode/folding/fold_mode"], function (require, exports, module) {
    "use strict";

    var oop = require("../../lib/oop");
    var Range = require("../../range").Range;
    var BaseFoldMode = require("./fold_mode").FoldMode;

    var FoldMode = exports.FoldMode = function (commentRegex) {
        if (commentRegex) {
            this.foldingStartMarker = new RegExp(
                this.foldingStartMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.start)
            );
            this.foldingStopMarker = new RegExp(
                this.foldingStopMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.end)
            );
        }
    };
    oop.inherits(FoldMode, BaseFoldMode);

    (function () {

        this.foldingStartMarker = /([\{\[\(])[^\}\]\)]*$|^\s*(\/\*)/;
        this.foldingStopMarker = /^[^\[\{\(]*([\}\]\)])|^[\s\*]*(\*\/)/;
        this.singleLineBlockCommentRe = /^\s*(\/\*).*\*\/\s*$/;
        this.tripleStarBlockCommentRe = /^\s*(\/\*\*\*).*\*\/\s*$/;
        this.startRegionRe = /^\s*(\/\*|\/\/)#?region\b/;
        this._getFoldWidgetBase = this.getFoldWidget;
        this.getFoldWidget = function (session, foldStyle, row) {
            var line = session.getLine(row);

            if (this.singleLineBlockCommentRe.test(line)) {
                if (!this.startRegionRe.test(line) && !this.tripleStarBlockCommentRe.test(line))
                    return "";
            }

            var fw = this._getFoldWidgetBase(session, foldStyle, row);

            if (!fw && this.startRegionRe.test(line))
                return "start"; // lineCommentRegionStart

            return fw;
        };

        this.getFoldWidgetRange = function (session, foldStyle, row, forceMultiline) {
            var line = session.getLine(row);

            if (this.startRegionRe.test(line))
                return this.getCommentRegionBlock(session, line, row);

            var match = line.match(this.foldingStartMarker);
            if (match) {
                var i = match.index;

                if (match[1])
                    return this.openingBracketBlock(session, match[1], row, i);

                var range = session.getCommentFoldRange(row, i + match[0].length, 1);

                if (range && !range.isMultiLine()) {
                    if (forceMultiline) {
                        range = this.getSectionRange(session, row);
                    } else if (foldStyle != "all")
                        range = null;
                }

                return range;
            }

            if (foldStyle === "markbegin")
                return;

            var match = line.match(this.foldingStopMarker);
            if (match) {
                var i = match.index + match[0].length;

                if (match[1])
                    return this.closingBracketBlock(session, match[1], row, i);

                return session.getCommentFoldRange(row, i, -1);
            }
        };

        this.getSectionRange = function (session, row) {
            var line = session.getLine(row);
            var startIndent = line.search(/\S/);
            var startRow = row;
            var startColumn = line.length;
            row = row + 1;
            var endRow = row;
            var maxRow = session.getLength();
            while (++row < maxRow) {
                line = session.getLine(row);
                var indent = line.search(/\S/);
                if (indent === -1)
                    continue;
                if (startIndent > indent)
                    break;
                var subRange = this.getFoldWidgetRange(session, "all", row);

                if (subRange) {
                    if (subRange.start.row <= startRow) {
                        break;
                    } else if (subRange.isMultiLine()) {
                        row = subRange.end.row;
                    } else if (startIndent == indent) {
                        break;
                    }
                }
                endRow = row;
            }

            return new Range(startRow, startColumn, endRow, session.getLine(endRow).length);
        };
        this.getCommentRegionBlock = function (session, line, row) {
            var startColumn = line.search(/\s*$/);
            var maxRow = session.getLength();
            var startRow = row;

            var re = /^\s*(?:\/\*|\/\/|--)#?(end)?region\b/;
            var depth = 1;
            while (++row < maxRow) {
                line = session.getLine(row);
                var m = re.exec(line);
                if (!m) continue;
                if (m[1]) depth--;
                else depth++;

                if (!depth) break;
            }

            var endRow = row;
            if (endRow > startRow) {
                return new Range(startRow, startColumn, endRow, line.length);
            }
        };

    }).call(FoldMode.prototype);

});

ace.define("ace/mode/cythan", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/cythan_highlight_rules", "ace/mode/folding/cstyle"], function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextMode = require("./text").Mode;
    var CythanHighlightRules = require("./cythan_highlight_rules").CythanHighlightRules;
    var FoldMode = require("./folding/cstyle").FoldMode;

    var Mode = function () {
        this.HighlightRules = CythanHighlightRules;
        this.foldingRules = new FoldMode();
        this.$behaviour = this.$defaultBehaviour;
    };
    oop.inherits(Mode, TextMode);

    (function () {
        this.lineCommentStart = "//";
        this.blockComment = { start: "/*", end: "*/", nestable: true };
        this.$quotes = { '"': '"' };
        this.$id = "ace/mode/cythan";
    }).call(Mode.prototype);

    exports.Mode = Mode;
}); (function () {
    ace.require(["ace/mode/cythan"], function (m) {
        if (typeof module == "object" && typeof exports == "object" && module) {
            module.exports = m;
        }
    });
})();
