/**
 * @name White Label Scheme Editor
 * @description White Label Scheme Editor help production team
 * on the fly to pick the styles for site templates and generate LESS
 * @version 0.1
 * @author Kalagin Ivan (lulldev)
 * @link http://lulldev.ru/
 *
 */
(function ($) {
    /**
     * @constructor
     * @returns {Object}
     */
    $.wlse = function () {

        var schemaLESS = {};
        var schemaJSON = [];

        var config = {
            storageName:  'wlse',
            schemaPrefix: 'schema-',
            sortLessPattern: [
                "bg1_color", "bg1_color_end", "bg1_border", "bg1_opacity", "bg1_radius",
                "bg2_color", "bg2_color_end", "bg2_border", "bg2_opacity", "bg2_radius",
                "bg3_color", "bg3_color_end", "bg3_border", "bg3_opacity", "bg3_radius",
                "bg4_color", "bg4_color_end", "bg4_border", "bg4_opacity", "bg4_radius",
                "bg5_color", "bg5_color_end", "bg5_border", "bg5_opacity", "bg5_radius",
                "bg6_color", "bg6_color_end", "bg6_border", "bg6_opacity", "bg6_radius",
                "bg7_color", "bg7_color_end", "bg7_border", "bg7_opacity", "bg7_radius",
                "bg8_color", "bg8_color_end", "bg8_border", "bg8_opacity", "bg8_radius",
                "bg9_color", "bg9_color_end", "bg9_border", "bg9_opacity", "bg9_radius",
                "bg10_color", "bg10_color_end", "bg10_border", "bg10_opacity", "bg10_radius",
                "bg11_color", "bg11_color_end", "bg11_border", "bg11_opacity", "bg11_radius",
                "bg12_color", "bg12_color_end", "bg12_border", "bg12_opacity", "bg12_radius",
                "bg13_color", "bg13_color_end", "bg13_border", "bg13_opacity", "bg13_radius",
                "bg14_color", "bg14_color_end", "bg14_border", "bg14_opacity", "bg14_radius",
                "bg15_color", "bg15_color_end", "bg15_border", "bg15_opacity", "bg15_radius",
                "bg16_color", "bg16_color_end", "bg16_border", "bg16_opacity", "bg16_radius",
                "bg17_color", "bg17_color_end", "bg17_border", "bg17_opacity", "bg17_radius",
                "bg18_color", "bg18_color_end", "bg18_border", "bg18_opacity", "bg18_radius",
                "bg19_color", "bg19_color_end", "bg19_border", "bg19_opacity", "bg19_radius",
                "bg20_color", "bg20_color_end", "bg20_border", "bg20_opacity", "bg20_radius",
                "bg21_color", "bg21_color_end", "bg21_border", "bg21_opacity", "bg21_radius",
                "bg22_color", "bg22_color_end", "bg22_border", "bg22_opacity", "bg22_radius",
                "bg23_color", "bg23_color_end", "bg23_border", "bg23_opacity", "bg23_radius",
                "bg24_color", "bg24_color_end", "bg24_border", "bg24_opacity", "bg24_radius",
                "bg25_color", "bg25_color_end", "bg25_border", "bg25_opacity", "bg25_radius",
                "bg26_color", "bg26_color_end", "bg26_border", "bg26_opacity", "bg26_radius",
                "bg27_color", "bg27_color_end", "bg27_border", "bg27_opacity", "bg27_radius",
                "font1_color", "font1_size",
                "font2_color", "font2_size",
                "font3_color", "font3_size",
                "font4_color", "font4_size",
                "font5_color", "font5_size",
                "font6_color", "font6_size",
                "font7_color", "font7_size",
                "font8_color", "font8_size",
                "font9_color", "font9_size",
                "font10_color", "font10_size",
                "font11_color", "font11_size",
                "font12_color", "font12_size",
                "font13_color", "font13_size",
                "font14_color", "font14_size",
                "font15_color", "font15_size",
                "font16_color", "font16_size",
                "font17_color", "font17_size",
                "font18_color", "font18_size",
                "font19_color", "font19_size",
                "font20_color", "font20_size",
                "font21_color", "font21_size",
                "font22_color", "font22_size",
                "font23_color", "font23_size",
                "font24_color", "font24_size",
                "font25_color", "font25_size",
                "font26_color", "font26_size",
                "font27_color", "font27_size",
                "font28_color", "font28_size"
            ]
        };

        var methods = {
            /**
             * Initialization editor menu in HTML and add control menu to <body>
             * @return {bool} - true - if plugin menu add to <body>
             *                  false - if plugin menu is already exist in <body>
             */
            init: function () {
                $('body').prepend('<div class="wlse">' +
                    '<a href="#" id="wlseStart">Start edit!</a> |  ' +
                    '<a href="#" id="wlseClearStorage">Clear Local Storage!</a> | ' +
                    '<a href="#" id="wlseGetLess">Get LESS!</a>  ' +
                    '</div>'
                );

                // add events
                $('#wlseStart').on('click', function() {
                    // get LESS style from Local Storage
                    var lessFromLS = functions.getLessFromLS()
                    if (Object.keys(lessFromLS).length !== 0) {
                        alert('WLES: Local Storage contain LESS code! Apply it..');
                        // apply styles from Local storage
                        functions.applyLessToPage(lessFromLS);
                    }
                    functions.generateControlLabels();
                });

                $('#wlseGetLess').on('click', function() {
                    functions.generateGetLessWindow();
                });

                $('#wlseClearStorage').on('click', function() {
                    // clear LESS style from Local Storage
                    functions.clearLessFromLS();
                    alert('WLES: Local storage is clear!');
                    // apply styles
                    location.reload();
                });

                return false;
            },

            generateControlLabels: function () {
                functions.generateControlLabels();
            },

            generateLessCode: function () {
                functions.generateGetLessWindow();
            },

            /**
             * Delete control menu from <body>, control labels, clear main property
             * @return {void}
             */
            destroy: function () {
                $('body').find('.wlse').remove();
                $('body').find('.control-label').remove();
                schemaLESS = {};
                schemaJSON = [];
            }
        };

        var functions = {
            /**
             * Get CSS property by class name
             *
             * @param {string} className - class name.
             * @return {string} css property
             * @private
             */
            parsePropByClassName: function (className) {
                if (className.indexOf('bg') !== -1) {
                    if (className.indexOf('color') !== -1) {
                        if (className.indexOf('end') !== -1) {
                            return "background";
                        }
                        return "background-color";
                    }
                    else if (className.indexOf('border') !== -1) {
                        return "border-color";
                    }
                    else if (className.indexOf('opacity') !== -1) {
                        return "opacity";
                    }
                    else if (className.indexOf('radius') !== -1) {
                        return "border-radius";
                    }
                }
                else if (className.indexOf('font') !== -1) {
                    if (className.indexOf('color') !== -1) {
                        return "color";
                    }
                    else if (className.indexOf('size') !== -1) {
                        return "font-size";
                    }
                }
            },

            /**
             * Get short label by class name
             *
             * @param {string} className - class name.
             * @return {string} - short name [fc, fs, bg]
             * @private
             */
            parseLabelByClassName: function (className) {
                if (className.indexOf("font") !== -1) {
                    var classNum = className.substr(4, className.indexOf('-') - 4);
                    if (className.indexOf("color") !== -1) {
                        return "fc" + classNum;
                    }
                    else if (className.indexOf("size") !== -1) {
                        return "fs" + classNum;
                    }
                }
                else if (className.indexOf("bg") !== -1) {
                    return "bg" + className.substr(2, className.indexOf('-') - 2);
                }
            },

            /**
             * Sorting schemaLess object propertys by pattern
             *
             * @param {object} schemaLess object
             * @return {object} - sorted schemaLess object
             * @private
             */
            schemaLessSort: function (schemaLessObject) {
                var result = {};
                config.sortLessPattern.forEach(function (prop, index) {
                    prop = prop.replace('_', '-');
                    if (schemaLessObject.hasOwnProperty(prop)) {
                        result[prop] = schemaLessObject[prop];
                    }
                });
                return result;
            },

            /**
             * Return true if schema property have default value
             *
             * @description Special for opacity, radius and bg gradient
             *
             * @param {string} schemaProperty - CSS property
             * @param {string} schemaValue - CSS value
             *
             * @return {bool} - true / false - schema property have default value
             * @private
             */
            isSchemaPropertyUnusable: function (schemaProperty, schemaValue) {
                if (schemaValue !== '' && schemaValue !== undefined) {
                    if (schemaProperty.indexOf('opacity') !== -1 && schemaValue === '1') {
                        return true;
                    }
                    else if (schemaProperty.indexOf('radius') !== -1 && schemaValue === '0px') {
                        return true;
                    }
                    else if (schemaProperty.indexOf('end') !== -1 && schemaValue.indexOf('linear-gradient') === -1) {
                        return true;
                    }
                }

                return false;
            },

            /**
             * Return true if the property is amenable to staining
             **
             * @param {string} schemaProperty - CSS property
             *
             * @return {bool} - true / false - property is amenable to staining
             * @private
             */
            isPropertyColorable: function (schemaProperty) {
                if (schemaProperty.indexOf('color') !== -1 || schemaProperty.indexOf('border') !== -1) {
                    return true;
                }
                return false;
            },

            /**
             * Add to page control-label.
             *
             */
            generateControlLabels: function () {
                
                $('#wlseGetLess').show();

                // search all elements with schema-
                var schema = $("*[class*=" + config.schemaPrefix + "]");
                var parsedClassName;

                schema.each(function (elem_counter, schemaElem) {

                    // find sister schema classes
                    var classList = $(schemaElem).attr('class').split(/\s+/);
                    // increment it if found sister classes
                    var foundCounter = 0;
                    // sister count
                    var classListCount = classList.length;
                    // temp var
                    var tempSchemaLess = {};

                    $.each(classList, function (index, shemaClassName) {
                        // jquery selector
                        var selectorShemaClass = $('.' + shemaClassName), labelName;
                        // only schema classes
                        if (shemaClassName.indexOf(config.schemaPrefix) !== -1) {

                            // parsedClassName - class name without prefix
                            parsedClassName = shemaClassName.substr(
                                shemaClassName.indexOf('-') + 1,
                                shemaClassName.length
                            );

                            // if first schemaClassName - generate label name (parent)
                            if (foundCounter == 0) {
                                // generate parent
                                var parentClassName = parsedClassName.substr(
                                    0,
                                    parsedClassName.indexOf('-')
                                );
                                // add to json schema
                                schemaJSON[elem_counter] = {
                                    nodeSelectors: selectorShemaClass, // selector name
                                    labels: [] // label name for UI
                                };
                            }

                            // add to less schema
                            var shemaProp = selectorShemaClass.css(functions.parsePropByClassName(parsedClassName));

                            if (!(parsedClassName in schemaLESS)) {
                                schemaLESS[parsedClassName] = shemaProp;
                            }

                            tempSchemaLess[parsedClassName] = shemaProp;

                            // add labels
                            labelName = functions.parseLabelByClassName(parsedClassName);
                            if (schemaJSON[elem_counter].labels.indexOf(labelName) == -1) {
                                schemaJSON[elem_counter].labels.push(labelName);
                            }

                            // if last iteration - add schemaLESS into schemaJSON
                            if (index + foundCounter >= classListCount - 1) {
                                schemaJSON[elem_counter].schemaClasses = tempSchemaLess;
                            }

                            foundCounter++;
                        }
                    });

                    // clear temp schema less
                    tempSchemaLess = {};
                });

                var selector, labels;

                function instanceSchema() {
                    schemaJSON.forEach(function (i, c) {
                        var k = 0;
                        while (k <= schemaJSON[c].nodeSelectors.length) {

                            selector = $(schemaJSON[c].nodeSelectors[k])[0];

                            var newControl = $('<span class="control-label">' + schemaJSON[c].labels.join('<br>') + '</span>')
                                .css('left', parseInt($(selector).css('width')) - 30)
                                .css('top', 0);

                            //if ($(selector).children('.control-label').length === 0) {

                            // generate inputs by labels array
                            var tooltipHtml = '', val;
                            for (var key in schemaJSON[c].schemaClasses) {
                                val = schemaJSON[c].schemaClasses[key];

                                // rgb to hex (if color)
                                if (functions.isPropertyColorable(key)) {
                                    val = helpers.rgb2hex(val);
                                }

                                tooltipHtml += "<label>" + key + "</label><br>" +
                                    "<input type='text' data-target='" + key + "' value='" + val + "' class='tooltip-input'/><br>";
                            }

                            tooltipHtml += '<button class="tooltip-set-btn">Set</button>';

                            // set form to tooltip
                            newControl.attr("title", tooltipHtml);
                            k++;
                        }
                    });
                }

                schemaJSON.forEach(function (i, c) {
                    var k = 0;
                    while (k <= schemaJSON[c].nodeSelectors.length) {

                        selector = $(schemaJSON[c].nodeSelectors[k])[0];

                        var newControl = $('<span class="control-label">' + schemaJSON[c].labels.join('<br>') + '</span>')
                            .css('left', parseInt($(selector).css('width')) - 30)
                            .css('top', 0);

                        //if ($(selector).children('.control-label').length === 0) {

                        // generate inputs by labels array
                        var tooltipHtml = '', schemaPropertyVal;
                        for (var schemaProperty in schemaJSON[c].schemaClasses) {
                            schemaPropertyVal = schemaJSON[c].schemaClasses[schemaProperty];

                            // rgb to hex (if color)
                            if (functions.isPropertyColorable(schemaProperty)) {
                                schemaPropertyVal = helpers.rgb2hex(schemaPropertyVal);
                            }

                            // if opacity, radius, liniar
                            if (functions.isSchemaPropertyUnusable(schemaProperty, schemaPropertyVal)) {
                                schemaPropertyVal = '';
                            }

                            tooltipHtml += "<label>" + schemaProperty + "</label><br>" +
                                "<input type='text' data-target='" + schemaProperty + "' value='" + schemaPropertyVal + "' class='tooltip-input'/><br>";

                        }

                        tooltipHtml += '<button class="tooltip-set-btn">Set</button>';

                        // set form to tooltip
                        newControl.attr("title", tooltipHtml);

                        newControl.tooltipster({
                            contentAsHTML: true,
                            interactive: true,
                            // trigger: 'click',
                            functionReady: function (instance, helper) {

                                // updating tooltip input
                                var controlLabel = $(instance._$origin[0]),
                                    controlLabelContent = $(instance.__Content);
                                controlLabelContent.each(function (i, labelHtmlElement) {
                                    var schemaProperty = $(labelHtmlElement).attr('data-target'),
                                        schemaPropertyVal = schemaLESS[schemaProperty];
                                    if (schemaProperty !== undefined) {
                                        if (functions.isSchemaPropertyUnusable(schemaProperty, schemaPropertyVal)) {
                                            schemaPropertyVal = '';
                                        }
                                        // convert color to HEX
                                        if (functions.isPropertyColorable(schemaProperty)) {
                                            schemaPropertyVal = helpers.rgb2hex(schemaPropertyVal);
                                        }
                                        $(labelHtmlElement).val(schemaPropertyVal);
                                    }
                                });
                                controlLabel.tooltipster('content', controlLabelContent);

                                // todo localstorage save on
                                $('#' + instance.__namespace).find('.tooltip-set-btn').on('click', function () {
                                    var tooltipContent = $(this).parent(),
                                        tooltipInputs = tooltipContent.find('input[data-target]'),
                                        targetSchemaElement, targetSchemaVal, jQtargetSchemaElement;

                                    tooltipInputs.each(function (i, input) {
                                        targetSchemaElement = $(input).data('target');
                                        targetSchemaVal = $(input).val();

                                        // set style
                                        jQtargetSchemaElement = "." + config.schemaPrefix + targetSchemaElement;
                                        var parseProperty = functions.parsePropByClassName(targetSchemaElement);

                                        // special for background linear
                                        if (parseProperty === "background") {
                                            // bg in previes input
                                            var bgColor = $(tooltipInputs[i - 1]).val(),
                                                bgColorEnd = targetSchemaVal;
                                            targetSchemaVal = "linear-gradient(141deg, " + bgColor + ", 0%, " + bgColorEnd + " 100%)";
                                        }

                                        $(jQtargetSchemaElement).css(parseProperty, targetSchemaVal);

                                        // save to schemaLESS
                                        schemaLESS[targetSchemaElement] = targetSchemaVal;

                                        // save to schemaJSON
                                        for (var key in schemaJSON) {
                                            if (schemaJSON[key].schemaClasses.hasOwnProperty(targetSchemaElement)) {
                                                schemaJSON[key].schemaClasses[targetSchemaElement] = targetSchemaVal;
                                            }
                                        }

                                        // save to Local Storage
                                        functions.saveLessToLS(schemaLESS);
                                    });
                                });
                            }
                        });

                        if ($(selector).children('.control-label').length === 0) {
                            // if children has schema elements
                            if ($(selector).find("*[class*=" + config.schemaPrefix + "]").length > 0) {
                                // offset for control label
                                var k = 10;
                                //newControl
                                newControl.css('left', parseInt($(selector).css('left')));
                            }
                            $(selector).append(newControl);
                        }
                        k++;
                    }
                });
            },

            generateGetLessWindow: function () {
                var schemaValue, resultLess = "";
                schemaLESS = functions.schemaLessSort(schemaLESS);
                console.log('sorted', schemaLESS);
                // fix colors rgb to hex
                schemaLESS = functions.hexLessVal(schemaLESS);
                console.log('hexed', schemaLESS);

                for (var schemaProperty in schemaLESS) {
                    schemaValue = schemaLESS[schemaProperty];
                    // no unusable prop
                    if (!functions.isSchemaPropertyUnusable(schemaProperty, schemaValue) && schemaValue !== '') {
                        resultLess += "@" + schemaProperty + ":      " + schemaValue + ";\n";
                    }
                }



                functions.applyLessToPage(schemaLESS);

                functions.saveLessToLS(schemaLESS);

                var tooltipHtml = '<textarea class="result-less">' + resultLess + '</textarea>';

                $('#wlseGetLess').attr("title", tooltipHtml);
                $('#wlseGetLess').tooltipster({
                    contentAsHTML: true,
                    interactive: true,
                    trigger: 'click',
                    functionAfter: function(instance, helper) {
                        // $(instance._$origin[0]).tooltipster('destroy');
                        $('#wlseGetLess').tooltipster('destroy');
                    }
                }).tooltipster('open');

            },

            hexLessVal: function(schemaLESS) {
                if (Object.keys(schemaLESS).length !== 0) {
                    var fixedLess = {};
                    for (var propName in schemaLESS) {
                        if (functions.isPropertyColorable(propName)) {
                            fixedLess[propName] =  helpers.rgb2hex(schemaLESS[propName]);
                        }
                    }
                    return fixedLess;
                }
                return false;
            },

            applyLessToPage: function(schemaLESS) {
                if (Object.keys(schemaLESS).length !== 0) {
                    var jQtargetSchemaElement;
                    for (var propName in schemaLESS) {
                        jQtargetSchemaElement = "." + config.schemaPrefix + propName;
                        var parseProperty = functions.parsePropByClassName(propName);
                        $(jQtargetSchemaElement).css(parseProperty, schemaLESS[propName]);
                    }
                }
                return false;
            },

            saveLessToLS: function(schemaLESS) {
                if (Object.keys(schemaLESS).length !== 0) {
                    localStorage.setItem(config.storageName, JSON.stringify(schemaLESS));
                    return true;
                }
                return false;
            },

            getLessFromLS: function() {
                var getLess = localStorage.getItem(config.storageName);
                if (getLess !== null) {
                    return JSON.parse(getLess);
                }
                return false;
            },

            clearLessFromLS: function() {
                localStorage.removeItem(config.storageName);
            }
        };

        /**
         * Helper functions
         */
        var helpers = {
            /**
             * Convert RGB to HEX
             *
             * @param {string} rgbInput - 'rgba(0, 0, 0, 0)'
             * @return {string} HEX value
             * @type {{rgb2hex: helpers.rgb2hex}}
             */
            rgb2hex: function (rgbInput) {
                if (rgbInput !== undefined && rgbInput !== '') {
                    var rgb = rgbInput.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
                    if (rgb !== null) {
                        return (rgb && rgb.length === 4) ? "#" +
                        ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
                        ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
                        ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : '';
                    }
                }
                return rgbInput;
            }
        };

        return {
            config: config,
            methods: methods,
            helpers: helpers,
        };

    };
})(jQuery);