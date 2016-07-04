/*!
 * RouteJs by Daniel Lo Nigro (Daniel15) - http://dl.vc/routejs
 * Version 1.1.9 (build 3128a22)
 * Released under the BSD license.
 */
(function (window) {
	'use strict';
	
	// Helper methods
	function merge (first, second) {
		///<summary>
		/// Return a new object that contains the properties from both of these objects. If a property
		/// exists in both objects, the property in `second` will override the property in `first`.
		///</summary>
		var result = {},
			key;
		
		for (key in first) {
			if (first.hasOwnProperty(key)) {
				result[key] = first[key];
			}
		}
		
		for (key in second) {
			if (second.hasOwnProperty(key)) {
				result[key] = second[key];
			}
		}		
		
		return result;
	}

	var arrayIndexOf;
	
	// Check for native Array.indexOf support
	if (Array.prototype.indexOf) {
		arrayIndexOf = function (array, searchElement) {
			return array.indexOf(searchElement);
		};
	} else {
		arrayIndexOf = function (array, searchElement) {
			for (var i = 0, count = array.length; i < count; i++) {
				if (array[i] === searchElement) {
					return i;
				}
			}
			return -1;
		};		
	}

	function escapeRegExp(string) {
		/// <summary>
		/// Escapes a string for usage in a regular expression
		/// </summary>
		/// <param name="string">Input string</param>
		/// <returns type="string">String suitable for inserting in a regex</returns>

		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
	
	////////////////////////////////////////////////////////////////////////////////////////////////
	
	var Route = function (route) {
		///<summary>Handles route processing</summary>
		///<param name="route">Route information</param>
		
		var paramRegex = /\{(\w+)\}/g,
			matches;
			
		if (!route.optional) {
			route.optional = [];
		}
		
		this.route = route;
		this._params = [];
		
		// Grab all the parameters from the URL
		while ((matches = paramRegex.exec(this.route.url)) !== null) {
			this._params.push(matches[1].toLowerCase());
		}
	};

	Route.prototype = {
		build: function (routeValues) {
			///<summary>
			/// Build a URL using this route, based on the passed route values. Returns null if the
			/// route values provided are not sufficent to build a URL using this route.
			///</summary>
			///<param name="routeValues">Route values</param>
			///<returns type="String">URL, or null when building a URL is not possible</returns>

			// Keys of values are case insensitive and are converted to lowercase server-side.
			// Convert keys of input to lowercase too.
			var routeValuesLowercase = {};
			for (var key in routeValues) {
				if (routeValues.hasOwnProperty(key)) {
					routeValuesLowercase[key.toLowerCase()] = routeValues[key];
				}
			}

			var finalValues = merge(this.route.defaults, routeValuesLowercase),
				processedParams = { controller: true, action: true },
				finalUrl;
			
			
			// Ensure area matches, if provided
			if (
				this.route.defaults.area &&
				this.route.defaults.area.toLowerCase() !== (routeValuesLowercase.area || '').toLowerCase()
			) {
				return null;
			}
			
			if (!this._checkConstraints(finalValues) || !this._checkNonDefaultValues(finalValues, processedParams)) {
				return null;
			}
		
			// Try to merge all URL parameters
			// If null, this means a required parameters was not specified.
			finalUrl = this._merge(finalValues, processedParams);
			if (!finalUrl) {
				return null;
			}
			
			finalUrl = this._trimOptional(finalUrl) + this._extraParams(routeValues, processedParams, finalUrl.indexOf('?') > -1);
			return finalUrl;
		},
		
		_checkNonDefaultValues: function (finalValues, processedParams) {
			///<summary>Checks that any values using a non-default value have a matching merge field in the URL.</summary>
			///<param name="finalValues">Route values merged with defaults</param>
			///<param name="processedParams">Array of parameters that have already been processed</param>
			///<returns type="Boolean">true if all non-default parameters have a matching merge field, otherwise false.</returns>
			
			for (var key in this.route.defaults) {
				if (!this.route.defaults.hasOwnProperty(key)) {
					continue;
				}
				// We don't care about case when comparing defaults.
				if (
					(this.route.defaults[key] + '').toLowerCase() !== (finalValues[key] + '').toLowerCase() &&
					arrayIndexOf(this._params, key) === -1
				) {
					return false;
				} else {
					// Any defaults don't need to be explicitly specified in the querystring
					processedParams[key] = true;
				}
			}

			return true;
		},
		
		_merge: function (finalValues, processedParams) {
			///<summary>
			/// Merges parameters into the URL, keeping track of which parameters have been added and
			/// ensuring that all required parameters are specified.
			///</summary>
			///<param name="finalValues">Route values merged with defaults</param>
			///<param name="processedParams">Array of parameters that have already been processed</param>
			///<returns type="String">URL with parameters merged in, or null if not all parameters were specified</returns>
			
			var finalUrl = this.route.url;
			
			for (var i = 0, count = this._params.length; i < count; i++) {
				var paramName = this._params[i],
					isProvided = finalValues[paramName] !== undefined,
					isOptional = arrayIndexOf(this.route.optional, paramName) > -1;
				
				if (!isProvided && !isOptional) {
					return null;				
				}
				
				if (isProvided) {
					var paramRegex = new RegExp('\{' + escapeRegExp(paramName) + '}', 'i');
					finalUrl = finalUrl.replace(paramRegex, encodeURIComponent(finalValues[paramName]));
				}
				
				processedParams[paramName] = true;
			}

			return finalUrl;
		},
		
		_trimOptional: function (finalUrl) {
			///<summary>Trims any unused optional parameter segments from the end of the URL</summary>
			///<param name="finalUrl">URL with used parameters merged in</param>
			///<returns type="String">URL with unused optional parameters removed</returns>
			var urlPieces = finalUrl.split('/');
			for (var i = urlPieces.length - 1; i >= 0; i--) {
				// If it has a parameter, assume it's an ignored one (otherwise it would have been merged above)
				if (urlPieces[i].indexOf('{') > -1) {
					urlPieces.splice(i, 1);
				}
			}
			return urlPieces.join('/');
		},
		
		_extraParams: function (routeValues, processedParams, alreadyHasParams) {
			///<summary>Add any additional parameters not specified in the URL as querystring parameters</summary>
			///<param name="routeValues">Route values</param>
			///<param name="processedParams">Array of parameters that have already been processed</param>
			///<param name="alreadyHasParams">Whether this URL already has querystring parameters in it</param>
			///<returns type="String">URL encoded querystring parameters</returns>
			
			var params = '';
			
			// Add all other parameters to the querystring
			for (var key in routeValues) {
				if (!processedParams[key.toLowerCase()]) {
					params += (alreadyHasParams ? '&' : '?') + encodeURIComponent(key) + '=' + encodeURIComponent(routeValues[key]);
					alreadyHasParams = true;
				}
			}

			return params;
		},
		
		_checkConstraints: function (routeValues) {
			///<summary>Validate that the route constraints match the specified route values</summary>
			///<param name="routeValues">Route values</param>
			///<returns type="Boolean"><c>true</c> if the route validation succeeds, otherwise <c>false</c>.</returns>
			
			// Bail out early if there's no constraints on this route
			if (!this.route.constraints) {
				return true;
			}
			
			if (!this._parsedConstraints) {
				this._parsedConstraints = this._parseConstraints();
			}
			
			// Check every constraint matches
			for (var key in this._parsedConstraints) {
				if (this._parsedConstraints.hasOwnProperty(key) && !this._parsedConstraints[key].test(routeValues[key])) {
					return false;
				}
			}

			return true;
		},
		
		_parseConstraints: function () {
			///<summary>Parse the string constraints into regular expressions</summary>
			
			var parsedConstraints = {};
			
			for (var key in this.route.constraints) {
				if (this.route.constraints.hasOwnProperty(key)) {
					parsedConstraints[key.toLowerCase()] =
						new RegExp('^(' + this.route.constraints[key].replace(/\\/g, '\\') + ')');
				}
			}

			return parsedConstraints;
		}
	};

	var RouteManager = function (settings) {
		///<summary>Manages routes and selecting the correct route to use when routing URLs</summary>
		///<param name="routes">Raw route information</param>

		this.baseUrl = settings.baseUrl;
		this.routes = [];
		for (var i = 0, count = settings.routes.length; i < count; i++) {
			this.routes.push(new Route(settings.routes[i]));
		}
	};

	RouteManager.prototype = {
		action: function (controller, action, routeValues) {
			///<summary>Generate a URL to an action</summary>
			///<param name="controller">Name of the controller</param>
			///<param name="action">Name of the action</param>
			///<param name="routeValues">Route values</param>
			///<returns type="String">URL for the specified action</returns>
			
			routeValues = routeValues || { };
			routeValues.controller = controller;
			routeValues.action = action;
			return this.route(routeValues);
		},
		
		route: function (routeValues) {
			///<summary>Generate a URL to an action</summary>
			///<param name="routeValues">Route values</param>
			///<returns type="String">URL for the specified action</returns>
			
			for (var i = 0, count = this.routes.length; i < count; i++) {
				var url = this.routes[i].build(routeValues);
				if (url) {
					return this.baseUrl + url;
				}
			}

			throw new Error('No route could be matched to route values: ' + routeValues);
		}
	};

	// Public API
	window.RouteJs = {
		version: '1.1.9 (build 3128a22)',
		Route: Route,
		RouteManager: RouteManager
	};
}(window));window.Router = new RouteJs.RouteManager({"routes":[{"url":"pt/agencia/{agencyPrettyName}/{businessUnitId}","defaults":{"controller":"SearchEngine","businessunitid":"00000000-0000-0000-0000-000000000000","page":"SearchResultAgencyNew","action":"InAgency","language":"pt","agencyprettyname":""},"constraints":{},"optional":[]},{"url":"zh/agency/{agencyPrettyName}/{businessUnitId}","defaults":{"page":"SearchResultAgencyNew","controller":"SearchEngine","agencyprettyname":"","businessunitid":"00000000-0000-0000-0000-000000000000","language":"zh","action":"InAgency"},"constraints":{},"optional":[]},{"url":"it/agenzia/{agencyPrettyName}/{businessUnitId}","defaults":{"language":"it","page":"SearchResultAgencyNew","businessunitid":"00000000-0000-0000-0000-000000000000","controller":"SearchEngine","agencyprettyname":"","action":"InAgency"},"constraints":{},"optional":[]},{"url":"de/makler/{agencyPrettyName}/{businessUnitId}","defaults":{"page":"SearchResultAgencyNew","language":"de","businessunitid":"00000000-0000-0000-0000-000000000000","agencyprettyname":"","action":"InAgency","controller":"SearchEngine"},"constraints":{},"optional":[]},{"url":"sk/agentura/{agencyPrettyName}/{businessUnitId}","defaults":{"action":"InAgency","language":"sk","businessunitid":"00000000-0000-0000-0000-000000000000","agencyprettyname":"","controller":"SearchEngine","page":"SearchResultAgencyNew"},"constraints":{},"optional":[]},{"url":"hr/agencija/{agencyPrettyName}/{businessUnitId}","defaults":{"action":"InAgency","agencyprettyname":"","controller":"SearchEngine","language":"hr","businessunitid":"00000000-0000-0000-0000-000000000000","page":"SearchResultAgencyNew"},"constraints":{},"optional":[]},{"url":"el/agency/{agencyPrettyName}/{businessUnitId}","defaults":{"businessunitid":"00000000-0000-0000-0000-000000000000","agencyprettyname":"","language":"el","page":"SearchResultAgencyNew","controller":"SearchEngine","action":"InAgency"},"constraints":{},"optional":[]},{"url":"fr/agence/{agencyPrettyName}/{businessUnitId}","defaults":{"action":"InAgency","language":"fr","controller":"SearchEngine","agencyprettyname":"","businessunitid":"00000000-0000-0000-0000-000000000000","page":"SearchResultAgencyNew"},"constraints":{},"optional":[]},{"url":"es/agencia/{agencyPrettyName}/{businessUnitId}","defaults":{"page":"SearchResultAgencyNew","agencyprettyname":"","language":"es","controller":"SearchEngine","businessunitid":"00000000-0000-0000-0000-000000000000","action":"InAgency"},"constraints":{},"optional":[]},{"url":"ru/agency/{agencyPrettyName}/{businessUnitId}","defaults":{"action":"InAgency","language":"ru","controller":"SearchEngine","businessunitid":"00000000-0000-0000-0000-000000000000","agencyprettyname":"","page":"SearchResultAgencyNew"},"constraints":{},"optional":[]},{"url":"en/agency/{agencyPrettyName}/{businessUnitId}","defaults":{"page":"SearchResultAgencyNew","agencyprettyname":"","language":"en","businessunitid":"00000000-0000-0000-0000-000000000000","action":"InAgency","controller":"SearchEngine"},"constraints":{},"optional":[]},{"url":"ar/agency/{agencyPrettyName}/{businessUnitId}","defaults":{"agencyprettyname":"","page":"SearchResultAgencyNew","language":"ar","businessunitid":"00000000-0000-0000-0000-000000000000","action":"InAgency","controller":"SearchEngine"},"constraints":{},"optional":[]},{"url":"en/TestStaticPage","defaults":{"language":"en","page":"ViewDocumentSimple","action":"Index","somepageid":"TestStaticPage","controller":"HtmlContent"},"constraints":{},"optional":[]},{"url":"de/immobilien-inserate/immobilien-von-privat","defaults":{"controller":"HtmlContent","action":"Index","page":"ViewDocumentSimple","somepageid":"immobilien-von-privat","language":"de"},"constraints":{},"optional":[]},{"url":"it/annunci-immobiliari/privato-a-privato","defaults":{"action":"Index","controller":"HtmlContent","page":"ViewDocumentSimple","language":"it","somepageid":"privato-a-privato"},"constraints":{},"optional":[]},{"url":"en/realestate-listings/private-classifieds","defaults":{"somepageid":"private-classifieds","language":"en","controller":"HtmlContent","page":"ViewDocumentSimple","action":"Index"},"constraints":{},"optional":[]},{"url":"fr/annonces-immobilier/particulier-a-particulier","defaults":{"action":"Index","page":"ViewDocumentSimple","language":"fr","controller":"HtmlContent","somepageid":"particulier-a-particulier"},"constraints":{},"optional":[]},{"url":"en/contact","defaults":{"language":"en","page":"ContactRequestForm","controller":"Account","action":"ContactRequest"},"constraints":{},"optional":[]},{"url":"it/contatto","defaults":{"controller":"Account","action":"ContactRequest","page":"ContactRequestForm","language":"it"},"constraints":{},"optional":[]},{"url":"fr/contact","defaults":{"action":"ContactRequest","language":"fr","controller":"Account","page":"ContactRequestForm"},"constraints":{},"optional":[]},{"url":"de/kontakt","defaults":{"language":"de","action":"ContactRequest","controller":"Account","page":"ContactRequestForm"},"constraints":{},"optional":[]},{"url":"translations/{locale}","defaults":{"controller":"Account","action":"GetTranslations"},"constraints":{},"optional":[]},{"url":"Account/CreateProfile","defaults":{"action":"CreateProfile","controller":"Account"},"constraints":{},"optional":[]},{"url":"cache/{action}","defaults":{"controller":"Cache"},"constraints":{},"optional":[]},{"url":"cache/{action}/{id}","defaults":{"controller":"Cache"},"constraints":{},"optional":[]},{"url":"cache/{action}/{portalid}/{name}","defaults":{"controller":"Cache"},"constraints":{},"optional":[]},{"url":"cache/content/{portalid}/{name}/{language}/{localizedName}","defaults":{"controller":"Cache","action":"Content"},"constraints":{},"optional":[]},{"url":"service/{action}/{id}","defaults":{"id":"00000000-0000-0000-0000-000000000000","controller":"Service"},"constraints":{},"optional":[]},{"url":"service/{action}","defaults":{"controller":"Service"},"constraints":{},"optional":[]},{"url":"service/GenerateStressTestUrls/{branch}","defaults":{"controller":"service","action":"GenerateStressTestUrls"},"constraints":{},"optional":[]},{"url":"{language}/SearchEngine/MarkSearchChangesAsRead/{type}/{id}","defaults":{"action":"MarkSearchChangesAsRead","type":"","controller":"SearchEngine","id":"00000000-0000-0000-0000-000000000000"},"constraints":{},"optional":[]},{"url":"{language}/SearchEngine/LookupGuids/{searchCriteriaImmoId}/{firstItem}/{lastItem}/{sorting}","defaults":{"firstitem":0,"sorting":"","action":"LookupGuids","searchcriteriaimmoid":"00000000-0000-0000-0000-000000000000","controller":"SearchEngine","lastitem":10},"constraints":{},"optional":[]},{"url":"{language}/SearchEngine/LookupGuidsNewDev/{newDevGroupId}/{firstItem}/{lastItem}/{sorting}","defaults":{"firstitem":0,"sorting":"","controller":"SearchEngine","newdevgroupid":"00000000-0000-0000-0000-000000000000","lastitem":10,"action":"LookupGuidsNewDev"},"constraints":{},"optional":[]},{"url":"{language}/SearchEngine/LookupGuidsAgency/{businessUnitId}/{firstItem}/{lastItem}/{sorting}","defaults":{"controller":"SearchEngine","sorting":"","action":"LookupGuidsAgency","firstitem":0,"businessunitid":"00000000-0000-0000-0000-000000000000","lastitem":10},"constraints":{},"optional":[]},{"url":"{language}/SearchEngine/GetSearchResultCount/{searchCriteriaImmoId}/{since}","defaults":{"controller":"SearchEngine","searchcriteriaimmoid":"00000000-0000-0000-0000-000000000000","action":"GetSearchResultCount"},"constraints":{},"optional":["since"]},{"url":"{language}/SearchEngine/AutoCompleteLocationsJQuery/{id}","defaults":{"text":"","count":10,"controller":"SearchEngine","id":"00000000-0000-0000-0000-000000000000","action":"AutoCompleteLocationsJQuery"},"constraints":{},"optional":[]},{"url":"{language}/SearchEngine/AutoCompleteLocationsKendo/{id}/{count}","defaults":{"count":10,"controller":"SearchEngine","action":"AutoCompleteLocationsKendo","id":"00000000-0000-0000-0000-000000000000"},"constraints":{},"optional":[]},{"url":"{language}/SearchEngine/AutoCompleteICLocationsICKendo/{id}/{count}","defaults":{"id":"00000000-0000-0000-0000-000000000000","controller":"SearchEngine","count":10,"action":"AutoCompleteLocationsICKendo"},"constraints":{},"optional":[]},{"url":"{language}/SearchEngine/Index/{page}/{topCountries}","defaults":{"controller":"SearchEngine","page":"HomePage","action":"Index"},"constraints":{},"optional":["topcountries"]},{"url":"{language}/SearchEngine/InNewDev/{campaignId}/{newDevGroupId}/{sorting}","defaults":{"campaignid":"00000000-0000-0000-0000-000000000000","controller":"SearchEngine","page":"NewDevDetails","newdevgroupid":"00000000-0000-0000-0000-000000000000","action":"InNewDev"},"constraints":{},"optional":["sorting"]},{"url":"{language}/SearchEngine/InAgency/{businessUnitId}","defaults":{"action":"InAgency","controller":"SearchEngine","businessunitid":"00000000-0000-0000-0000-000000000000","page":"SearchResultAgencyNew","agencyprettyname":""},"constraints":{},"optional":[]},{"url":"{language}/SearchEngine/CodeId/{codeID}/{sorting}","defaults":{"action":"CodeId","codeid":"","controller":"SearchEngine","page":"SearchResultCodeIdNew"},"constraints":{},"optional":["sorting"]},{"url":"{language}/SearchEngine/LookupGuidsCodeId/{codeID}/{firstItem}/{lastItem}/{sorting}","defaults":{"firstitem":0,"lastitem":10,"sorting":"","action":"LookupGuidsCodeId","codeid":"00000000-0000-0000-0000-000000000000","controller":"SearchEngine"},"constraints":{},"optional":[]},{"url":"{language}/SearchEngine/HasOrdersForSearchCriteria/{searchCriteriaImmoId}","defaults":{"controller":"SearchEngine","searchcriteriaimmoid":"00000000-0000-0000-0000-000000000000","action":"HasOrdersForSearchCriteria"},"constraints":{},"optional":[]},{"url":"{language}/SearchEngine/TopSpot/{searchGroupName}/{searchSubGroupName}/{searchName}/{allowedSubTypeGroups}","defaults":{"action":"TopSpot","page":"SearchResultNew","controller":"SearchEngine"},"constraints":{},"optional":["searchgroupname","searchsubgroupname","searchname","allowedsubtypegroups"]},{"url":"{language}/SearchEngine/RefineSearchSearchResults/{searchGroupName}/{searchConfigName}","defaults":{"action":"RefineSearchSearchResults","page":"SearchResultNew","searchsubgroupname":"World","controller":"SearchEngine"},"constraints":{},"optional":["searchconfigname","searchgroupname"]},{"url":"{language}/SearchEngine/RefineSearchHomePage/{searchGroupName}/{searchConfigName}","defaults":{"searchsubgroupname":"World","page":"HomePage","controller":"SearchEngine","action":"RefineSearchHomePage"},"constraints":{},"optional":["searchconfigname","searchgroupname"]},{"url":"{language}/search","defaults":{"action":"Search","controller":"SearchEngine","page":"SearchResultNew","searchsubgroupname":"World"},"constraints":{},"optional":[]},{"url":"{language}/RecentSearch/UnsubscribeAlert/{alertId}","defaults":{"alertid":"","action":"UnsubscribeAlert","page":"Alerts","controller":"RecentSearch"},"constraints":{},"optional":[]},{"url":"{language}/RecentSearch/UnsubscribeNewsletter/{endUserProfileId}","defaults":{"action":"UnsubscribeNewsletter","controller":"RecentSearch","enduserprofileid":"","page":"Alerts"},"constraints":{},"optional":[]},{"url":"{language}/RecentSearch/RecentSearches","defaults":{"page":"RecentSearches","action":"RecentSearches","controller":"RecentSearch"},"constraints":{},"optional":[]},{"url":"{language}/RecentSearch/Alerts","defaults":{"controller":"RecentSearch","action":"Alerts","page":"Alerts"},"constraints":{},"optional":[]},{"url":"{language}/RecentSearch/GetRecentSearchesAndAlerts/{recentSearchCount}/{alertCount}","defaults":{"controller":"RecentSearch","action":"GetRecentSearchesAndAlerts"},"constraints":{},"optional":["recentsearchcount","alertcount"]},{"url":"{language}/SearchEngineMapMode/{searchGroupName}/{searchSubGroupName}/{searchName}/{sorting}/{zoom}","defaults":{"page":"SearchResultMapModeNew","action":"Search","controller":"SearchEngineMapMode"},"constraints":{},"optional":["sorting","searchname","searchgroupname","searchsubgroupname","zoom"]},{"url":"{language}/HomePage/UnsubscribeAlert/{alertId}","defaults":{"controller":"HomePage","action":"UnsubscribeAlert","page":"HomePage","alertid":""},"constraints":{},"optional":[]},{"url":"{language}/HomePage/UnsubscribeNewsletter/{endUserProfileId}","defaults":{"action":"UnsubscribeNewsletter","page":"HomePage","controller":"HomePage","newsletterid":""},"constraints":{},"optional":[]},{"url":"{language}/UnsubscribeNewsletter/{endUserProfileId}","defaults":{"controller":"UnsubscribeNewsletter","page":"HomePage","action":"Index","enduserprofileid":""},"constraints":{},"optional":[]},{"url":"{language}/HomePage","defaults":{"searchconfigname":"Flat-House","controller":"SearchEngine","page":"HomePage","action":"Index","searchsubgroupname":"World","searchgroupname":"Buy"},"constraints":{},"optional":["topcountries"]},{"url":"{language}/ContactForms/Mortgage/{campaignId}","defaults":{"controller":"Account","page":"MortgageForm","campaignid":"00000000-0000-0000-0000-000000000000","action":"Mortgage"},"constraints":{},"optional":[]},{"url":"{language}/Account/ItemDetailsContactForm","defaults":{"controller":"Account","action":"ItemDetailsContactForm"},"constraints":{},"optional":[]},{"url":"{language}/Account/MortgageFormCalculate","defaults":{"action":"MortgageFormCalculate","controller":"Account","page":"MortgageForm"},"constraints":{},"optional":[]},{"url":"{language}/Account/EditProfile","defaults":{"action":"EditProfile","controller":"Account","page":"EditProfile"},"constraints":{},"optional":[]},{"url":"{language}/Account/EditProfileSubmit","defaults":{"controller":"Account","action":"EditProfileSubmit"},"constraints":{},"optional":[]},{"url":"{language}/Account/ChangePassword","defaults":{"page":"ChangePassword","controller":"Account","action":"ChangePassword"},"constraints":{},"optional":[]},{"url":"{language}/Account/Index","defaults":{"controller":"Account","page":"Account","action":"Index"},"constraints":{},"optional":[]},{"url":"{language}/Account/Logon","defaults":{"controller":"Account","action":"Logon","page":"Account"},"constraints":{},"optional":[]},{"url":"{language}/Account/Register","defaults":{"controller":"Account","action":"Register"},"constraints":{},"optional":[]},{"url":"{language}/Account/SendRequest/{campaignId}","defaults":{"action":"SendRequest","controller":"Account"},"constraints":{},"optional":[]},{"url":"{language}/Account/SendContactFormRequest","defaults":{"controller":"Account","action":"SendContactFormRequest"},"constraints":{},"optional":[]},{"url":"{language}/Account/Banner/{campaignId}","defaults":{"controller":"Account","action":"Banner"},"constraints":{},"optional":[]},{"url":"{language}/Account/SwissCautionBanner/{campaignId}","defaults":{"action":"SwissCautionBanner","controller":"Account"},"constraints":{},"optional":[]},{"url":"{language}/Account/AlertSubscribe","defaults":{"action":"AlertSubscribe","controller":"Account","page":"SearchResultNew"},"constraints":{},"optional":[]},{"url":"{language}/Account/AlertSubscribePane","defaults":{"action":"AlertSubscribePane","page":"SearchResultNew","controller":"Account"},"constraints":{},"optional":[]},{"url":"{language}/Account/CampaignSubscribe","defaults":{"controller":"Account","page":"ItemDetails","action":"CampaignSubscribe"},"constraints":{},"optional":[]},{"url":"{language}/Account/CreateAlertFromDetails","defaults":{"controller":"Account","page":"Alerts","action":"CreateAlertFromDetails"},"constraints":{},"optional":[]},{"url":"{language}/Account/DrawSendToFriend/{message}/{sendToFriendTitle}/{campaignId}","defaults":{"sendtofriendtitle":"","page":"ItemDetails","action":"DrawSendToFriend","message":"","controller":"Account","campaignid":"00000000-0000-0000-0000-000000000000"},"constraints":{},"optional":[]},{"url":"{language}/Account/SendToFriend","defaults":{"action":"SendToFriend","page":"ItemDetails","controller":"Account"},"constraints":{},"optional":[]},{"url":"{language}/Account/RegisterFromSocial","defaults":{"page":"RegisterFromSocial","controller":"Account","action":"RegisterFromSocial"},"constraints":{},"optional":[]},{"url":"{language}/Account/UnlinkSocialAccount","defaults":{"action":"UnlinkSocialAccount","controller":"Account"},"constraints":{},"optional":[]},{"url":"{language}/Account/GetSocialNetworkInfo/{socialNetworkType}","defaults":{"action":"GetSocialNetworkInfo","socialnetworktype":"","controller":"Account"},"constraints":{},"optional":[]},{"url":"{language}/Account/AutoLoginViaSocialNetwork","defaults":{"controller":"Account","action":"AutoLoginViaSocialNetwork"},"constraints":{},"optional":[]},{"url":"{language}/Account/Login","defaults":{"action":"Login","controller":"Account"},"constraints":{},"optional":[]},{"url":"{language}/Account/GetAccessToken","defaults":{"controller":"Account","action":"GetAccessToken"},"constraints":{},"optional":[]},{"url":"{language}/Account/Logout","defaults":{"action":"Logout","controller":"Account"},"constraints":{},"optional":[]},{"url":"{language}/Account/{action}","defaults":{"controller":"Account","action":"Index"},"constraints":{},"optional":[]},{"url":"{language}/TermsAndConditions/{action}","defaults":{"page":"TermsAndConditions","controller":"TermsAndConditions","action":"Index"},"constraints":{},"optional":[]},{"url":"{language}/News/{action}","defaults":{"page":"HomePage","action":"Index","controller":"News"},"constraints":{},"optional":[]},{"url":"{language}/Search/GetLocationByZipCodeAndCountry/{id}","defaults":{"controller":"SearchEngine","id":"00000000-0000-0000-0000-000000000000","action":"GetLocationByZipCodeAndCountry"},"constraints":{},"optional":[]},{"url":"{language}/GoogleMap/Index/{searchCriteriaImmoId}/{initialZoom}","defaults":{"searchcriteriaimmoid":"00000000-0000-0000-0000-000000000000","controller":"GoogleMap","page":"ItemDetails","initialzoom":"null","action":"Index"},"constraints":{},"optional":[]},{"url":"{language}/ItemDetails/Source/{source}/{sourceId}","defaults":{"controller":"ItemDetails","source":"ListGlobally","action":"Source","sourceid":"string","page":"ItemDetails"},"constraints":{},"optional":[]},{"url":"{language}/ItemDetails/Campaign/{campaignId}","defaults":{"controller":"ItemDetails","action":"Campaign","page":"ItemDetails","campaignid":"00000000-0000-0000-0000-000000000000"},"constraints":{},"optional":[]},{"url":"{language}/ItemDetails/CampaignPopUp/{campaignId}","defaults":{"controller":"ItemDetails","campaignid":"00000000-0000-0000-0000-000000000000","page":"ItemDetailsPopUp","action":"CampaignPopUp"},"constraints":{},"optional":[]},{"url":"{language}/ItemDetails/NewDev/{campaignId}/{newDevGroupId}","defaults":{"controller":"ItemDetails","campaignid":"00000000-0000-0000-0000-000000000000","page":"NewDevDetails","action":"NewDev"},"constraints":{},"optional":["newdevgroupid"]},{"url":"{language}/ItemDetails/BuDetails/{campaignId}","defaults":{"controller":"ItemDetails","action":"BuDetails","page":"ItemDetails"},"constraints":{},"optional":[]},{"url":"{language}/ItemDetails/GetFullBuPhone/{campaignId}","defaults":{"page":"ItemDetails","action":"GetFullBuPhone","controller":"ItemDetails"},"constraints":{},"optional":[]},{"url":"{language}/ItemDetails/GetCampaignUrlByCodeId/{codeId}","defaults":{"page":"ItemDetails","controller":"ItemDetails","action":"GetCampaignUrlByCodeId","codeid":""},"constraints":{},"optional":[]},{"url":"{language}/ItemDetails/{action}/{campaignId}","defaults":{"campaignid":"00000000-0000-0000-0000-000000000000","controller":"ItemDetails","action":"Campaign"},"constraints":{},"optional":[]},{"url":"{language}/Offer/ViewOffer/{adMaterialId}","defaults":{"admaterialid":"","page":"ViewOffer","controller":"Offer","action":"ViewOffer"},"constraints":{},"optional":[]},{"url":"{language}/Offer/BillingOffer/{adMaterialId}","defaults":{"page":"OfferBillingSummary","controller":"Offer","admaterialid":"","action":"BillingOffer"},"constraints":{},"optional":[]},{"url":"{language}/Offer/DeleteOffer/{stateStatus}/{offerId}","defaults":{"action":"DeleteOffer","statestatus":"","controller":"Offer","offerid":""},"constraints":{},"optional":[]},{"url":"{language}/Offer/StopOffer/{offerId}","defaults":{"action":"StopOffer","offerid":"","controller":"Offer"},"constraints":{},"optional":[]},{"url":"{language}/Offer/Step0/{campaignId}","defaults":{"campaignid":"","page":"AddAnOfferStep0","action":"Step0","controller":"Offer"},"constraints":{},"optional":[]},{"url":"{language}/Offer/LogOfferError/{errorMessage}","defaults":{"errormessage":"","controller":"Offer","action":"LogOfferError"},"constraints":{},"optional":[]},{"url":"{language}/HtmlContent/Participate","defaults":{"page":"ViewDocumentSimple","controller":"HtmlContent","action":"Participate"},"constraints":{},"optional":[]},{"url":"{language}/HtmlContent/SaveFacebookUser","defaults":{"page":"ViewDocumentSimple","controller":"HtmlContent","action":"SaveFacebookUser"},"constraints":{},"optional":[]},{"url":"{language}/HtmlContent/SaveFacebookSharingPerson","defaults":{"page":"ViewDocumentSimple","action":"SaveFacebookSharingPerson","controller":"HtmlContent"},"constraints":{},"optional":[]},{"url":"{language}/404","defaults":{"page":"ViewDocumentSimple","controller":"HtmlContent","somepageid":404,"action":"Index"},"constraints":{},"optional":[]},{"url":"{language}/HtmlContent/{somePageId}","defaults":{"page":"ViewDocumentSimple","somepageid":"private-classifieds","controller":"HtmlContent","action":"Index"},"constraints":{},"optional":[]},{"url":"{language}/Offer/Step1/{immoId}","defaults":{"action":"Step1","immoid":"","page":"AddAnOfferStep1","controller":"Offer"},"constraints":{},"optional":[]},{"url":"{language}/Offer/Step2/{immoId}","defaults":{"immoid":"","page":"AddAnOfferStep2","action":"Step2","controller":"Offer"},"constraints":{},"optional":[]},{"url":"{language}/Offer/Step4/{immoId}","defaults":{"action":"Step4","immoid":"","controller":"Offer","page":"AddAnOfferStep4"},"constraints":{},"optional":[]},{"url":"{language}/Offer/Step5/{immoId}","defaults":{"page":"AddAnOfferStep5","controller":"Offer","action":"Step5","immoid":""},"constraints":{},"optional":[]},{"url":"{language}/Offer/SwitchLayout/{id}","defaults":{"controller":"Offer","id":"toPreview","action":"SwitchLayout"},"constraints":{},"optional":[]},{"url":"{language}/Offer/RemoveResource/{immoId}/{resourceId}","defaults":{"controller":"Offer","page":"AddAnOfferStep2","action":"RemoveResource","resourceid":"00000000-0000-0000-0000-000000000000","immoid":"00000000-0000-0000-0000-000000000000"},"constraints":{},"optional":[]},{"url":"{language}/Offer/EditOffer/{immoId}","defaults":{"immoid":"","controller":"Offer","page":"AddAnOfferStep2","action":"EditOffer"},"constraints":{},"optional":[]},{"url":"{language}/Offer/SaveModifiedOffer/{immoId}","defaults":{"action":"SaveModifiedOffer","immoid":"","controller":"Offer"},"constraints":{},"optional":[]},{"url":"{language}/IC/CheckPromotionCode","defaults":{"action":"CheckPromotionCode","controller":"IC"},"constraints":{},"optional":[]},{"url":"{language}/IC/GetImmoProductById/{productId}","defaults":{"controller":"IC","action":"GetImmoProductById","productid":""},"constraints":{},"optional":[]},{"url":"{language}/IC/GetImmoProductsByCriterias","defaults":{"action":"GetImmoProductsByCriterias","controller":"IC"},"constraints":{},"optional":[]},{"url":"{language}/IC/GetPriceForImmoProducts/{productId}","defaults":{"productid":"","action":"GetPriceForImmoProducts","controller":"IC"},"constraints":{},"optional":[]},{"url":"{language}/DynamicMenu/Index","defaults":{"action":"Index","page":"ViewDynamicMenu","controller":"DynamicMenu"},"constraints":{},"optional":[]},{"url":"{language}/ExtendOffer/Step0/{immoId}","defaults":{"controller":"ExtendOffer","page":"AddAnOfferStep4","action":"Step0","immoid":""},"constraints":{},"optional":[]},{"url":"{language}/ExtendOffer/Step2/{immoId}","defaults":{"page":"AddAnOfferStep5","immoid":"","controller":"ExtendOffer","action":"Step2"},"constraints":{},"optional":[]},{"url":"{language}/StartOffer/Step0/{immoId}","defaults":{"immoid":"","controller":"StartOffer","action":"Step0","page":"AddAnOfferStep2"},"constraints":{},"optional":[]},{"url":"{language}/StartOffer/Step1/{immoId}","defaults":{"immoid":"","controller":"StartOffer","page":"AddAnOfferStep2","action":"Step0"},"constraints":{},"optional":[]},{"url":"{language}/StartOffer/Step2/{immoId}","defaults":{"action":"Step2","immoid":"","page":"AddAnOfferStep4","controller":"StartOffer"},"constraints":{},"optional":[]},{"url":"{language}/StartOffer/Step3/{immoId}","defaults":{"immoid":"","controller":"StartOffer","action":"Step3","page":"AddAnOfferStep5"},"constraints":{},"optional":[]},{"url":"{language}/BoOffer/List/{orderState}","defaults":{"orderstate":"All","page":"Offers","action":"List","controller":"BoOffer"},"constraints":{},"optional":[]},{"url":"{language}/BoOffer/Export/{state}/{orderBy}/{filter}","defaults":{"filter":"","orderby":"date-desc","controller":"BoOffer","state":"All","page":"Offers","action":"Export"},"constraints":{},"optional":[]},{"url":"{language}/BoOffer/SaveOffer/{immoId}","defaults":{"action":"SaveOffer","controller":"BoOffer","immoid":""},"constraints":{},"optional":[]},{"url":"{language}/BoOffer/SwapResources/{immoId}/{resourceIndex1}/{resourceIndex2}","defaults":{"controller":"BoOffer","resourceindex2":"","action":"SwapResources","resourceindex1":"","immoid":""},"constraints":{},"optional":[]},{"url":"{language}/BoOffer/RemoveResource/{immoId}/{resourceId}","defaults":{"page":"OfferDetails","immoid":"00000000-0000-0000-0000-000000000000","resourceid":"00000000-0000-0000-0000-000000000000","controller":"BoOffer","action":"RemoveResource"},"constraints":{},"optional":[]},{"url":"{language}/BoOffer/UpdateResourcesAfterResorting","defaults":{"controller":"BoOffer","action":"UpdateResourcesAfterResorting"},"constraints":{},"optional":[]},{"url":"{language}/BoOffer/Details/{adMaterialId}","defaults":{"page":"OfferDetails","admaterialid":"","controller":"BoOffer","action":"Details"},"constraints":{},"optional":[]},{"url":"{language}/BoOffer/GetOfferHistory/{immoId}","defaults":{"controller":"BoOffer","action":"GetOfferHistory","immoid":""},"constraints":{},"optional":[]},{"url":"{language}/BoOffer/{action}","defaults":{"orderstate":"All","controller":"BoOffer","action":"List","page":"Offers"},"constraints":{},"optional":[]},{"url":"{language}/BoUser/Export/{orderBy}/{filter}","defaults":{"action":"Export","filter":"","orderby":"LastVisitDate-desc","controller":"BoUser"},"constraints":{},"optional":[]},{"url":"{language}/BoUser/SetUserArchivedState/{endUserPortalProfileId}/{isArchived}","defaults":{"isarchived":"","enduserportalprofileid":"","controller":"BoUser","action":"SetUserArchivedState"},"constraints":{},"optional":[]},{"url":"{language}/BoUser/{action}","defaults":{"page":"Users","controller":"BoUser","action":"List"},"constraints":{},"optional":[]},{"url":"{language}/BoUser/{action}/{userId}","defaults":{"controller":"BoUser","page":"MyImmoBox","action":"Details","userid":""},"constraints":{},"optional":[]},{"url":"{language}/BoReport/GenerateReport/startDate/endDate","defaults":{"enddate":"","action":"GenerateReport","controller":"BoReport","page":"Reports","startdate":""},"constraints":{},"optional":[]},{"url":"{language}/BoReport/GenerateBillingReport/BillingDateFrom/BillingDateTo/ReportUrl","defaults":{"billingdateto":"","billingdatefrom":"","page":"Reports","controller":"BoReport","reporturl":"","action":"GenerateBillingReport"},"constraints":{},"optional":[]},{"url":"{language}/BoReport/{action}","defaults":{"controller":"BoReport","action":"Reports","page":"Reports"},"constraints":{},"optional":[]},{"url":"{language}/SendPassword/ForgotMyPasswordForm","defaults":{"action":"ForgotMyPasswordForm","controller":"SendPassword"},"constraints":{},"optional":[]},{"url":"{language}/SendPassword/ForgotMyPassword","defaults":{"action":"ForgotMyPassword","controller":"SendPassword"},"constraints":{},"optional":[]},{"url":"{language}/SendPassword/ForgotMyPasswordOnTheSeparatePage","defaults":{"controller":"SendPassword","page":"SendPassword","action":"ForgotMyPasswordOnTheSeparatePage"},"constraints":{},"optional":[]},{"url":"{language}/DoubleClickAddition/{action}","defaults":{"controller":"AdvertizerAndStatistics","action":"Index"},"constraints":{},"optional":[]},{"url":"{language}/AdvertizerAndStatistics/{action}","defaults":{"controller":"AdvertizerAndStatistics","action":"Index"},"constraints":{},"optional":[]},{"url":"{language}/ComparisConfirmation/{codeID}","defaults":{"controller":"SearchEngine","action":"ComparisConfirmation","codeid":""},"constraints":{},"optional":[]},{"url":"{language}/ContactForms/ContactRequest","defaults":{"page":"ContactRequestForm","action":"ContactRequest","controller":"Account"},"constraints":{},"optional":[]},{"url":"{language}/GIS/GetCampaignInterests","defaults":{"centerlatitude":"","controller":"GIS","distancearoundcenter":"","page":"SearchResult","centerlongitude":"","interesttypeid":"","action":"GetCampaignInterests"},"constraints":{},"optional":[]},{"url":"{language}/GIS/GetAdMaterialsLocationFromRectangle","defaults":{"controller":"GIS","searchcriteriaimmoid":"00000000-0000-0000-0000-000000000000","firstlocationlatitude":"","firstlocationlongitude":"","secondlocationlongitude":"","areatype":"","secondlocationlatitude":"","xmlcriteria":"","page":"SearchResult","arealiststring":"","action":"GetAdMaterialsLocationFromRectangle"},"constraints":{},"optional":["typeofsearch"]},{"url":"{language}/GIS/GetAdMaterialsAreaFromRectangle","defaults":{"secondlocationlongitude":"","xmlcriteria":"","arealiststring":"","firstlocationlongitude":"","searchcriteriaimmoid":"00000000-0000-0000-0000-000000000000","page":"SearchResult","areatype":"","secondlocationlatitude":"","controller":"GIS","firstlocationlatitude":"","action":"GetAdMaterialsAreaFromRectangle"},"constraints":{},"optional":["typeofsearch"]},{"url":"{language}/GIS/GetLocationCoordinates","defaults":{"prefix":"","controller":"GIS","contextkey":"446931c9-7efe-440d-b674-24b8659087a7","count":10,"action":"GetLocationCoordinates","page":"SearchResult"},"constraints":{},"optional":[]},{"url":"{language}/GIS/GetAreasFromName","defaults":{"action":"GetAreasFromName","controller":"GIS"},"constraints":{},"optional":[]},{"url":"{language}/GISNew/GetAdMaterialsLocationFromRectangle","defaults":{"secondlocationlongitude":"","areatype":"","action":"GetAdMaterialsLocationFromRectangle","controller":"GISNew","page":"SearchResultNew","firstlocationlongitude":"","searchcriteriaimmoid":"00000000-0000-0000-0000-000000000000","arealiststring":"","secondlocationlatitude":"","firstlocationlatitude":""},"constraints":{},"optional":["typeofsearch"]},{"url":"{language}/GISNew/GetAdMaterialsAreaFromRectangle","defaults":{"firstlocationlongitude":"","secondlocationlatitude":"","arealiststring":"","areatype":"","searchcriteriaimmoid":"00000000-0000-0000-0000-000000000000","action":"GetAdMaterialsAreaFromRectangle","page":"SearchResultNew","firstlocationlatitude":"","controller":"GISNew","secondlocationlongitude":""},"constraints":{},"optional":["typeofsearch"]},{"url":"{language}/GISNew/GetLocationCoordinates","defaults":{"prefix":"","contextkey":"446931c9-7efe-440d-b674-24b8659087a7","count":10,"action":"GetLocationCoordinates","controller":"GISNew","page":"SearchResultNew"},"constraints":{},"optional":[]},{"url":"{language}/page/{page}","defaults":{"action":"Index","controller":"DynamicPage"},"constraints":{},"optional":[]},{"url":"Mobile/{somePageId}","defaults":{"action":"Mobile","controller":"HtmlContent"},"constraints":{},"optional":[]},{"url":"{language}/{somePageId}","defaults":{"controller":"HtmlContent","page":"ViewDocumentSimple","action":"Index"},"constraints":{},"optional":[]},{"url":"{language}/SearchTitle/Index","defaults":{"controller":"SearchTitle","action":"Index"},"constraints":{},"optional":[]},{"url":"{language}/Gis/GetCoordinateByParameters","defaults":{"action":"GetCoordinateByParameters","controller":"Gis"},"constraints":{},"optional":[]},{"url":"{language}","defaults":{"action":"Index","searchgroupname":"Buy","searchconfigname":"Flat-House","controller":"SearchEngine","searchsubgroupname":"World","page":"HomePage"},"constraints":{},"optional":["topcountries"]}],"baseUrl":"/"});