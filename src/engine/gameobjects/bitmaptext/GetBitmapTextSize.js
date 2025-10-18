var GetBitmapTextSize = function (src, round, updateOrigin, out)
{
    if (updateOrigin === undefined) { updateOrigin = false; }

    if (out === undefined)
    {
        out = {
            local: {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            },
            global: {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            },
            lines: {
                shortest: 0,
                longest: 0,
                lengths: null,
                height: 0
            },
            wrappedText: '',
            words: [],
            characters: [],
            scaleX: 0,
            scaleY: 0
        };

        return out;
    }

    var text = src.text;
    var textLength = text.length;
    var maxWidth = src.maxWidth;
    var wordWrapCharCode = src.wordWrapCharCode;

    var bx = Number.MAX_VALUE;
    var by = Number.MAX_VALUE;
    var bw = 0;
    var bh = 0;

    var chars = src.fontData.chars;
    var lineHeight = src.fontData.lineHeight;
    var letterSpacing = src.letterSpacing;
    var lineSpacing = src.lineSpacing;

    var xAdvance = 0;
    var yAdvance = 0;

    var charCode = 0;

    var glyph = null;

    var align = src._align;

    var x = 0;
    var y = 0;

    var scale = (src.fontSize / src.fontData.size);
    var sx = scale * src.scaleX;
    var sy = scale * src.scaleY;

    var lastGlyph = null;
    var lastCharCode = 0;
    var lineWidths = [];
    var shortestLine = Number.MAX_VALUE;
    var longestLine = 0;
    var currentLine = 0;
    var currentLineWidth = 0;

    var i;
    var j;
    var lines;
    var words = [];
    var characters = [];
    var current = null;

    var measureTextWidth = function (text, fontData)
    {
        var width = 0;

        for (var i = 0; i < text.length; i++)
        {
            var charCode = text.charCodeAt(i);
            var glyph = fontData.chars[charCode];

            if (glyph)
            {
                width += glyph.xAdvance;
            }
        }

        return width * sx;
    };

    if (maxWidth > 0)
    {

        lines = text.split('\n');
        var wrappedLines = [];

        for (i = 0; i < lines.length; i++)
        {
            var line = lines[i];
            var word = '';
            var wrappedLine = '';
            var lineToCheck = '';
            var lineWithWord = '';

            for (j = 0; j < line.length; j++)
            {
                charCode = line.charCodeAt(j);

                word += line[j];

                if (charCode === wordWrapCharCode || j === line.length - 1)
                {
                    lineWithWord = lineToCheck + word;

                    var textWidth = measureTextWidth(lineWithWord, src.fontData);

                    if (textWidth <= maxWidth)
                    {
                        lineToCheck = lineWithWord;
                    }
                    else
                    {

                        wrappedLine = wrappedLine.slice(0, -1);
                        wrappedLine += (wrappedLine ? '\n' : '') + lineToCheck;
                        lineToCheck = word;
                    }

                    word = '';
                }
            }

            wrappedLine = wrappedLine.slice(0, -1);
            wrappedLine += (wrappedLine ? '\n' : '') + lineToCheck;
            wrappedLines.push(wrappedLine);
        }

        text = wrappedLines.join('\n');

        out.wrappedText = text;

        textLength = text.length;
    }

    var charIndex = 0;

    for (i = 0; i < textLength; i++)
    {
        charCode = text.charCodeAt(i);

        if (charCode === 10)
        {
            if (current !== null)
            {
                words.push({
                    word: current.word,
                    i: current.i,
                    x: current.x * sx,
                    y: current.y * sy,
                    w: current.w * sx,
                    h: current.h * sy
                });

                current = null;
            }

            lastGlyph = null;

            lineWidths[currentLine] = currentLineWidth;

            if (currentLineWidth > longestLine)
            {
                longestLine = currentLineWidth;
            }

            if (currentLineWidth < shortestLine)
            {
                shortestLine = currentLineWidth;
            }

            currentLine++;
            currentLineWidth = 0;

            xAdvance = 0;
            yAdvance = (lineHeight + lineSpacing) * currentLine;

            continue;
        }

        glyph = chars[charCode];

        if (!glyph)
        {
            continue;
        }

        x = xAdvance;
        y = yAdvance;

        if (lastGlyph !== null)
        {
            var kerningOffset = glyph.kerning[lastCharCode];

            x += (kerningOffset !== undefined) ? kerningOffset : 0;
        }

        if (bx > x)
        {
            bx = x;
        }

        if (by > y)
        {
            by = y;
        }

        var gw = x + glyph.xAdvance;
        var gh = y + lineHeight;

        if (bw < gw)
        {
            bw = gw;
        }

        if (bh < gh)
        {
            bh = gh;
        }

        var charWidth = glyph.xOffset + glyph.xAdvance + ((kerningOffset !== undefined) ? kerningOffset : 0);

        if (charCode === wordWrapCharCode)
        {
            if (current !== null)
            {
                words.push({
                    word: current.word,
                    i: current.i,
                    x: current.x * sx,
                    y: current.y * sy,
                    w: current.w * sx,
                    h: current.h * sy
                });

                current = null;
            }
        }
        else
        {
            if (current === null)
            {

                current = { word: '', i: charIndex, x: xAdvance, y: yAdvance, w: 0, h: lineHeight };
            }

            current.word = current.word.concat(text[i]);
            current.w += charWidth;
        }

        characters.push({
            i: charIndex,
            idx: i,
            char: text[i],
            code: charCode,
            x: (glyph.xOffset + x) * scale,
            y: (glyph.yOffset + yAdvance) * scale,
            w: glyph.width * scale,
            h: glyph.height * scale,
            t: yAdvance * scale,
            r: gw * scale,
            b: lineHeight * scale,
            line: currentLine,
            glyph: glyph
        });

        xAdvance += glyph.xAdvance + letterSpacing + ((kerningOffset !== undefined) ? kerningOffset : 0);
        lastGlyph = glyph;
        lastCharCode = charCode;
        currentLineWidth = gw * scale;
        charIndex++;
    }

    if (current !== null)
    {
        words.push({
            word: current.word,
            i: current.i,
            x: current.x * sx,
            y: current.y * sy,
            w: current.w * sx,
            h: current.h * sy
        });
    }

    lineWidths[currentLine] = currentLineWidth;

    if (currentLineWidth > longestLine)
    {
        longestLine = currentLineWidth;
    }

    if (currentLineWidth < shortestLine)
    {
        shortestLine = currentLineWidth;
    }

    if (align > 0)
    {
        for (var c = 0; c < characters.length; c++)
        {
            var currentChar = characters[c];

            if (align === 1)
            {
                var ax1 = ((longestLine - lineWidths[currentChar.line]) / 2);

                currentChar.x += ax1;
                currentChar.r += ax1;
            }
            else if (align === 2)
            {
                var ax2 = (longestLine - lineWidths[currentChar.line]);

                currentChar.x += ax2;
                currentChar.r += ax2;
            }
        }
    }

    var local = out.local;
    var global = out.global;

    lines = out.lines;

    local.x = bx * scale;
    local.y = by * scale;
    local.width = bw * scale;
    local.height = bh * scale;

    global.x = (src.x - src._displayOriginX) + (bx * sx);
    global.y = (src.y - src._displayOriginY) + (by * sy);

    global.width = bw * sx;
    global.height = bh * sy;

    lines.shortest = shortestLine;
    lines.longest = longestLine;
    lines.lengths = lineWidths;

    if (round)
    {
        local.x = Math.ceil(local.x);
        local.y = Math.ceil(local.y);
        local.width = Math.ceil(local.width);
        local.height = Math.ceil(local.height);

        global.x = Math.ceil(global.x);
        global.y = Math.ceil(global.y);
        global.width = Math.ceil(global.width);
        global.height = Math.ceil(global.height);

        lines.shortest = Math.ceil(shortestLine);
        lines.longest = Math.ceil(longestLine);
    }

    if (updateOrigin)
    {
        src._displayOriginX = (src.originX * local.width);
        src._displayOriginY = (src.originY * local.height);

        global.x = src.x - (src._displayOriginX * src.scaleX);
        global.y = src.y - (src._displayOriginY * src.scaleY);

        if (round)
        {
            global.x = Math.ceil(global.x);
            global.y = Math.ceil(global.y);
        }
    }

    out.words = words;
    out.characters = characters;
    out.lines.height = lineHeight;
    out.scale = scale;
    out.scaleX = src.scaleX;
    out.scaleY = src.scaleY;

    return out;
};

module.exports = GetBitmapTextSize;
