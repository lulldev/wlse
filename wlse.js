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
            storageName: 'wlse',
            schemaPrefix: 'schema-'
        };

        var methods = {
            /**
             * Initialization editor menu in HTML and add control menu to <body>
             * @return {bool} - true - if plugin menu add to <body>
             *                  false - if plugin menu is already exist in <body>
             */
            init: function () {
                $('body').prepend('<div class="wlse">' +
                    '<strong>WLSE</strong> ' +
                    '<a href="#" id="wlseStart">Start edit!</a>  ' +
                    '<a href="#" id="wlseClearStorage">Clear Local Storage!</a> ' +
                    '<a href="#" id="wlseGetLess">Get LESS!</a>  ' +
                    '</div>'
                );

                // add events
                $('#wlseStart').on('click', function () {
                    // get LESS style from Local Storage
                    var lessFromLS = functions.getLessFromLS()
                    if (Object.keys(lessFromLS).length !== 0) {
                        alert('WLES: Local Storage contain LESS code! Apply it..');
                        // apply styles from Local storage
                        functions.applyLessToPage(lessFromLS);
                    }
                    functions.generateControlLabels();
                });

                $('#wlseGetLess').on('click', function () {
                    functions.generateGetLessWindow();
                });

                $('#wlseClearStorage').on('click', function () {
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
                            return "background-image";
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
                var schemaLessArr = Object.keys(schemaLessObject), sorted = {};
                schemaLessArr.sort(function (a, b) {
                    return (a[0] > b[0]) || (Number(a.match(/\d+/)) > Number(b.match(/\d+/))) ? 1 : -1;
                });
                for (var prop in schemaLessArr) sorted[schemaLessArr[prop]] = schemaLessObject[schemaLessArr[prop]];
                return sorted;
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
                    if (schemaProperty.indexOf('opacity') !== -1 && schemaValue == '1') {
                        return true;
                    }
                    else if (schemaProperty.indexOf('radius') !== -1 && schemaValue == '0px') {
                        return true;
                    }
                    else if (schemaProperty.indexOf('end') !== -1 && schemaValue == 'none') {
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

                    var lessFromLS = functions.getLessFromLS();

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
                                // add to json schema
                                schemaJSON[elem_counter] = {
                                    nodeSelectors: selectorShemaClass, // selector name
                                    labels: [] // label name for UI
                                };
                            }

                            // add to less schema
                            var propName = functions.parsePropByClassName(parsedClassName);
                            var propVal = selectorShemaClass.css(propName);

                            if (functions.isPropertyColorable(propName)) {
                                propVal = helpers.rgb2hex(propVal);
                            }

                            if (!(parsedClassName in schemaLESS)) {
                                schemaLESS[parsedClassName] = propVal;
                            }

                            tempSchemaLess[parsedClassName] = propVal;

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

                var selector;

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


                            // if opacity, radius, liniar - test empty values
                            if (functions.isSchemaPropertyUnusable(schemaProperty, schemaPropertyVal)) {
                                schemaPropertyVal = '';
                            }

                            // gradient
                            if (schemaProperty.indexOf('end') !== -1 && schemaPropertyVal !== '') {
                                schemaPropertyVal = schemaLESS[schemaProperty];
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
                                        // if gradient
                                        if (schemaProperty.indexOf('end') && schemaPropertyVal != 'none') {
                                            schemaPropertyVal = schemaLESS[schemaProperty];
                                        }
                                        // console.log(schemaProperty, schemaPropertyVal);
                                        $(labelHtmlElement).val(schemaPropertyVal);
                                    }
                                });

                                controlLabel.tooltipster('content', controlLabelContent);

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
                                        if (parseProperty === "background-image") {
                                            // bg in previes input
                                            var bgColor = $(tooltipInputs[i - 1]),
                                                bgColorVal = $(tooltipInputs[i - 1]).val(),
                                                bgColorEndVal = targetSchemaVal;
                                            $(jQtargetSchemaElement).css(parseProperty, "linear-gradient(to bottom, " + bgColorVal + " 0%, " + bgColorEndVal + " 100%)");
                                            // bg end
                                            targetSchemaVal = bgColorEndVal;
                                        } else {
                                            // other all elements
                                            $(jQtargetSchemaElement).css(parseProperty, targetSchemaVal);
                                        }
                                        // save to schemaLESS
                                        schemaLESS[targetSchemaElement] = targetSchemaVal;

                                        // save to schemaJSON
                                        for (var key in schemaJSON) {
                                            if (schemaJSON[key].schemaClasses.hasOwnProperty(targetSchemaElement)) {
                                                schemaJSON[key].schemaClasses[targetSchemaElement] = targetSchemaVal;
                                            }
                                        }

                                        // save to Local Storage
                                        schemaLESS = functions.hexLessVal(schemaLESS);
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

            /**
             * Open tooltip with textarea. Generating ready LESS code
             **
             */
            generateGetLessWindow: function () {
                var schemaValue, resultLess = "";
                schemaLESS = functions.schemaLessSort(schemaLESS);
                // fix colors rgb to hex
                schemaLESS = functions.hexLessVal(schemaLESS);

                for (var schemaProperty in schemaLESS) {
                    schemaValue = schemaLESS[schemaProperty];
                    // no unusable prop
                    if (!functions.isSchemaPropertyUnusable(schemaProperty, schemaValue) && schemaValue !== '') {
                        resultLess += "@" + schemaProperty + ":      " + schemaValue + ";\n";
                    }
                }

                // save LESS to Local Storage
                functions.saveLessToLS(schemaLESS);

                var tooltipHtml = '<textarea class="result-less">' + resultLess + '</textarea>';

                $('#wlseGetLess').attr("title", tooltipHtml);
                $('#wlseGetLess').tooltipster({
                    contentAsHTML: true,
                    interactive: true,
                    trigger: 'click',
                    functionAfter: function (instance, helper) {
                        // $(instance._$origin[0]).tooltipster('destroy');
                        $('#wlseGetLess').tooltipster('destroy');
                    }
                }).tooltipster('open');

            },

            /**
             * Converting all colorful value from RGB to HEX
             **
             * @param {Object} - schemaLESS
             *
             * @return {Object / bool} - converted schemaLess object, false - if input
             * schemaLess is empty
             */
            hexLessVal: function (schemaLESS) {
                if (Object.keys(schemaLESS).length !== 0) {
                    var fixedLess = {};
                    for (var propName in schemaLESS) {
                        if (functions.isPropertyColorable(propName)) {
                            fixedLess[propName] = helpers.rgb2hex(schemaLESS[propName]);
                        }
                    }
                    return fixedLess;
                }
                return false;
            },

            /**
             * Apply schemaLESS CSS values to page
             **
             * @param {Object} - schemaLESS
             *
             * @return {bool} - true - css is apply, false - schemaLESS is empty
             * schemaLess is empty
             */
            applyLessToPage: function (schemaLESS) {
                if (Object.keys(schemaLESS).length !== 0) {
                    var jQtargetSchemaElement;
                    for (var propName in schemaLESS) {
                        jQtargetSchemaElement = "." + config.schemaPrefix + propName;
                        var parseProperty = functions.parsePropByClassName(propName);

                        // special for gradient
                        if (parseProperty == 'background-image') {
                            if (schemaLESS[propName] !== 'none') {
                                // give prop bg
                                var propNameBg = propName.substr(0, propName.indexOf('-')) + '-color',
                                    propNameBgEnd = propName;
                                // gradient it
                                $(jQtargetSchemaElement).css(parseProperty,
                                    "linear-gradient(to bottom, " + schemaLESS[propNameBg] + " 0%, " + schemaLESS[propNameBgEnd] + " 100%)");
                            }
                        } else {
                            $(jQtargetSchemaElement).css(parseProperty, schemaLESS[propName]);

                        }

                    }
                    return true;
                }
                return false;
            },

            /**
             * Save schemaLESS object to Local Storage with special name
             * (default: wlse) [see config]
             **
             * @param {Object} - schemaLESS
             *
             * @return {bool} - true - schemaLESS save in LS, false - schemaLESS is empty
             */
            saveLessToLS: function (schemaLESS) {
                if (Object.keys(schemaLESS).length !== 0) {
                    localStorage.setItem(config.storageName, JSON.stringify(schemaLESS));
                    return true;
                }
                return false;
            },

            /**
             * Get schemaLESS object from Local Storage
             * (default LS name: wlse) [see config]
             **
             *
             * @return {Object/bool} -  schemaLESS object, false - LS value is not exist
             */
            getLessFromLS: function () {
                var getLess = localStorage.getItem(config.storageName);
                if (getLess !== null) {
                    return JSON.parse(getLess);
                }
                return false;
            },
            /**
             * Clear LS. Delet special param from Local Storage (default name param: wlse)
             **
             */
            clearLessFromLS: function () {
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
             * @param {string} rgbInput - 'rgba(255, 0, 0)'
             * @return {string} HEX value
             * @type {{rgb2hex: helpers.rgb2hex}}
             */
            rgb2hex: function (rgbInput) { // todo
                if (rgbInput != undefined && rgbInput !== '') {
                    if (rgbInput === 'rgba(0, 0, 0, 0)') {
                        return '';
                    }
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