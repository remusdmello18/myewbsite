(function() {
	'use strict';

	var scores = [],
	    bars = [],
	    graph = document.getElementById('bar-graph'),
	    selectedCategory = 'average',
	    classToClear,
	    vendors = ['webkit', 'moz', 'ms'],
	    NO_TRANSITIONS = 'no-transitions',
	    transitionEndEvent,
	    barTransitionTime = 0.7,
	    barDelayTime = 0.05,
	    barDrawEffect,
	    easingEffect = 'linear',
	    durationInput;

	/* ====================================================================== *\
	   ==                          HELPER METHODS                          ==
	\* ====================================================================== */
	/**
	* Creates a mock datasource for the graph.
	*/
	function createDataSource() {
		// Determine the number of data points to generate, this will be a
		// number between 1 and 30 (inclusive)
		var count = Math.floor(Math.random() * 30) + 1;
		scores = [];

		// Create as many data points as we just randomly determined
		for (var index = 0; index < count; index++) {
			// Create the data point with randomly generated values between 1
			// and 10 (inclusive). For this demo we will assume there are always
			// 5 team members
			var item = {
				cat1     : (Math.floor(Math.random() * 9)) + 1,
				cat2     : (Math.floor(Math.random() * 9)) + 1,
				cat3     : (Math.floor(Math.random() * 9)) + 1,
				members  : 5
			};
			// Determine a random number of measurements for the data point,
			// this should be between 1 and the number of team members.
			item.measurements = (Math.floor(Math.random() * (item.members)) + 1);
			// Calculate the average score for the data point
			item.average = ((item.cat1 + item.cat2 + item.cat3) / 3).toFixed(1);
			// Add the data point to the array with data points, this will be
			// the source for the graph
			scores.push(item);
		}
	}

	/**
	* This method sets a CSS property. It will set the standard property as
	* well as vender prefixed versions of the property.
	*
	* @param {HTMLElement} element  The element whose property to set
	* @param {string} property      The unprefixed name of the property
	* @param {string} value         The value to assign to the property
	*/
	function setPrefixedProperty(element, property, value) {
		// Capitalize the first letter in the string
		var capitalizedProperty = property[0].toUpperCase() + property.slice(1);
		// Loop over the vendors and set the prefixex property
		for (var index = 0, ubound = vendors.length; index < ubound; index++) {
			element.style[vendors[index] + capitalizedProperty] = value;
		}
		// Set the standard property
		element.style[property] = value;
	}

	/**
	* This method tries to determine the name of the transitionend event, it
	* could be the user's browser is using a prefixed version
	*/
	function transitionEndEventName() {
		// 1: The variable we use to keep track of the current key when
		//    iterating over the transitions object
		// 2: An element we can use to test if a CSS property if known to the
		//    browser
		// 3: The key:value pairs represent CSS-property:Event-name values. By
		//    testing if the browser supports a CSS property we can tell what
		//    name to use for the transitionend event
		var key,                                                       /* [1] */
		    el = document.createElement('div'),                        /* [2] */
		    transitions = {                                            /* [3] */
			    WebkitTransition : 'webkitTransitionEnd',
			    OTransition      : 'otransitionend',  // oTransitionEnd in very old Opera
			    MozTransition    : 'transitionend',
			    transition       : 'transitionend'
		    };

		// Loop over the keys in the transition object
		for (key in transitions) {
			// Check the key is a property of the object and check if the CSS
			// property does not return undefined. If the result is undefined it
			// means the browser doesn't recognize the (un)prefixed property
			if (transitions.hasOwnProperty(key) && el.style[key] !== undefined) {
				// The CSS property exists, this means we know which name of the
				// transitionend event we can use for this browser
				return transitions[key];
			}
		}

		// If the method reaches this line it means that none of the CSS
		// properties were recognized by the browser. It is safe to conclude
		// there is no support for transitions (or at least none that we can use
		// in any meaningful way)
		return NO_TRANSITIONS;
	}
	/* ==========================  HELPER METHODS  ========================== */



	/* ====================================================================== *\
	   ==                         EVENT HANDLERS                           ==
	\* ====================================================================== */

	/**
	* This method handles the transition end event fired when the last bar has
	* been removed from the graph. It is the cue to redraw the graph.
	*/
	function onClearGraphEnded(event) {
		// Remove the event listener, we no longer need it
		bars[0].removeEventListener(transitionEndEvent, onClearGraphEnded);
		// Wait 300ms before redrawing the graph, this has a nicer effect to it
		// than redrawing it immediately.
		setTimeout(drawGraph, 300);
	}

	/**
	* This method handles the change event of the input which the user can use
	* to set the duration for a bar to transition from 0 to 10.
	*/
	function onDurationChange(event) {
		// Try to parse the value to a float
		barTransitionTime = parseFloat(durationInput.value);
		// Check if the value could be parsed
		if (isNaN(barTransitionTime)) {
			// Invalid value, set to the default value
			barTransitionTime = 1;
			durationInput.value = 1;
		} else if (barTransitionTime < parseFloat(durationInput.getAttribute('min'))) {
			barTransitionTime = durationInput.value = parseFloat(durationInput.getAttribute('min'));
		} else if (barTransitionTime > parseFloat(durationInput.getAttribute('max'))) {
			barTransitionTime = durationInput.value = parseFloat(durationInput.getAttribute('max'));
		}
		drawGraph();
	}

	/**
	* This method handles the change in the selected easing method.
	*/
	function onEasingSelect(event) {
		// Copy the selected value for easy usage
		easingEffect = event.target.value;
		// Redraw the graph using the selected easing method
		drawGraph();
	}

	/**
	 * This method handles the click on the button to refresh the graph. It will
	 * generate a new data source and refresh the graph so this source is shown.
	 */
	function onRefreshGraph() {
		createDataSource();
		redrawGraph();
	}

	/**
	* This method handles the change in the selected transition style
	*/
	function onTransitionSelectHandler(event) {
		// Copy the selected value for easy usage
		barDrawEffect = event.target.value;
		// Redraw the graph using the selected easing method
		drawGraph();
	}

	/**
	* This method handels the change in the category to display in the graph.
	* @param {[type]} event [description]
	*/
	function onOptionSelectHandler(event) {
		// Make sure the selected option wasn't already selected
		if (event.target.value !== selectedCategory) {
			// The old class needs to be removed when redrawing the graph,
			// remember which category was selected
			classToClear = selectedCategory;
			// Set the category to show
			selectedCategory = event.target.value;
			// Clear the graph, this in turn will redraw the graph and it will
			// do so with the selected category
			redrawGraph();
		}
	}
	/* ==========================  EVENT HANDLERS  ========================== */

	function drawGraph() {
		// Check if we have the element to show the graph in, if not there is no
		// need to continue
		if (graph == null) {
			return;
		}

		// Make sure all existing elements are removed from the graph before we
		// continue.
		while (graph.firstChild) {
			graph.removeChild(graph.firstChild);
		}

		// A bar in the graph can only be as tall as the graph itself
		var maxHeight = graph.clientHeight;
		// Reset the array with references to the bars
		bars = [];

		// Check if there is a class to clear, this is the case when the visitor
		// has switched between the categories to show in the graph
		if (classToClear !== '') {
			// Remove the class
			graph.classList.remove(classToClear);
			// Reset the class to clear
			classToClear = '';
			// Apply the class for the selected category
			graph.classList.add(selectedCategory);
		}

		// Loop over all generated data points
		for (var index = 0, ubound = scores.length; index < ubound; index++) {
			// 1: Create an element to represent the current data point
			// 2: Calculate how long it should take the bar to reach the height
			//    necessary to show the score represented by the bar. A score of
			//    10 would take the full transition time, lower scores use a
			//    percentage of that time. We can determine the percentage by
			//    dividing the score by 10.
			// 3: Initialize the delay time for the bar
			var bar = document.createElement('div'),                                      /* [1] */
 			   duration = (scores[index][selectedCategory] / 10) * barTransitionTime,    /* [2] */
			    delay = 0;                                                                /* [3] */

			// Check if the effect is height or combined
			if (barDrawEffect === 'height' || barDrawEffect === 'combined') {
				// No need to correct for anything, the duration we calculated
				// is already taking care that the shorter bars are shown
				// quicker than the larger bars. This is already the effect we
				// wanted
				delay += 0;
			}
			// Check if the effect is wave or combined
			if (barDrawEffect === 'wave' || barDrawEffect === 'combined') {
				// Each bar should wait a little longer than the bar before it
				// before it starts to animate to its desired height
				delay += barDelayTime * index;
			}
			// Specify the unit for the delay time, in this case it is seconds
			delay += 's';

			// Set the width, this is 3%. For the left position we use 3 1/3
			// which will create a nice gap in between bars
			bar.style.width = '3%';
			// Calculate the left position, this is simply the total width per
			// bar multiplied by its index
			bar.style.left = (3.333333333 * index) + '%';
			// The opacity is determined by the percentage of team members who
			// entered a score for tha day
			bar.style.opacity = scores[index].measurements / scores[index].members;
			// Set the title attribute to show some information when the user
			// hovers the mouse over the bar
			bar.setAttribute('title', 'Score: ' + scores[index][selectedCategory] + ', ' + scores[index].measurements + ' meting(en) van in totaal ' + scores[index].members + ' teamleden');
			// Set an attribute to remember the time we set for this bar to
			// transition to its specified height. We will need this information
			// when removing the bars. Storing it in an attribute is easier than
			// recalculating it later
			bar.setAttribute('data-duration', duration);
			// Set the transition property, we need to use the duration we've
			// calculated and the easing effect selected by the user
			setPrefixedProperty(bar, 'transition', 'height ' + duration + 's ' + easingEffect + ', background-image .3s ease-out, opacity .3s ease-out');
			// Set the transition delays, only the delay for the height
			// transition is variable, the others are fixed
			setPrefixedProperty(bar, 'transitionDelay', delay + ', 0, 0');
			// Place a reference to the bar in the array, this way we can easily
			// manipulate them later on
			bars.push(bar);
			// Place the bar in the graph
			graph.appendChild(bar);
		}

		// We will set a timeout of 10ms before we set the height for the bars
		// to their desired height. We need to wait a little while or else the
		// transition won't trigger.
		setTimeout(function() {
			// We know how many bars there are, we need to loop over all of them
			for (index = 0; index < ubound; index++) {
				// Set the height of the bar to show the score it represents
				bars[index].style.height = (maxHeight * (scores[index][selectedCategory] / 10)) + 'px';
			}
		}, 10);
	}

	/**
	* Removes all the bars from the graph and repopulates the graph with the
	* same datasource
	*/
	function redrawGraph() {
		var ubound = bars.length - 1,
		index = ubound;

		if (transitionEndEvent !== NO_TRANSITIONS) {
			// Listen to the transition end event of the first bar in the graph,
			// this the bar which will be removed from the view as last and once
			// it has been removed it is time to redraw the graph
			bars[0].addEventListener(transitionEndEvent, onClearGraphEnded);
		}

		// Loop over all the bars in the graph from the last item to the first
		// item and set the delay. The bar representing the most recent
		// measurement will be removed first.
		for (; index >= 0; index--) {
			var delay = 0;
			// Calculate the delay for the bar before it is removed from view.
			// 1: We know in what time the bar was shown through the
			//    data-duration attribute. By substracting this value from 1 we
			//    can let the shorter bars wait longer to remove themselves than
			//    the longer bars. It will have the visual effect of the shorter
			//    bars waiting until the longer bars have caught up to their
			//    position
			// 2: By adding an additional wait time per bar based on how many
			//    bars came before it we introduce a sort of wave effect. The
			//    first bar in the graph will start its removal later than the
			//    bar representing the most recent date
			// 3: Now all the is left to do is specifying the unit, in this case
			//    the delay is specified in seconds
			if (barDrawEffect === 'height' || barDrawEffect === 'combined') {
				delay += (barTransitionTime - parseFloat(bars[index].getAttribute('data-duration')));   /* [1] */
			}
			if (barDrawEffect === 'wave' || barDrawEffect === 'combined') {
				delay += (barDelayTime * (ubound - index));                                             /* [2] */
			}
			delay += 's';                                                                               /* [3] */
			// Set the transition delay to what we've calculated
			setPrefixedProperty(bars[index], 'transitionDelay', delay);
			// Set the height of the bar to 0 to remove it from view
			bars[index].style.height = 0;
		}
	}

	function init() {
		// Determine the transition end event name
		transitionEndEvent = transitionEndEventName();

		// Get the refresh button and attach a click handler so we know when to
		// refresh the graph
		var element = document.getElementById('btnRefresh');
		if (element != null) {
			element.addEventListener('click', onRefreshGraph);
		}

		// Get the element where to user can specify the time it should take a
		// bar to go from 0 to 10 and attach a change handler so we know when
		// this value has changed
		durationInput = document.getElementById('input-duration');
		if (durationInput != null) {
			durationInput.addEventListener('change', onDurationChange);
		}

		// Get the element where the user can specify which easing method to use
		// when manipulating the height of the bars. Attach a change hanlder so
		// we know when the user has selected a different easing method
		element = document.getElementById('select-easing');
		if (element != null) {
			element.addEventListener('change', onEasingSelect);
		}

		// Get all the inputs belonging the the group to change which category
		// is shown in the graph. Attach click handlers so we know when we need
		// to show a different category
		var options = document.getElementsByName('score-select');
		for (var index = 0, ubound = options.length; index < ubound; index++) {
			options[index].addEventListener('click', onOptionSelectHandler);
		}

		// Get all the input elements belonging to the group to change which
		// effect is used when drawing the graph. Attach click handlers so we
		// know when we need to use a different effect
		options = document.getElementsByName('transition-select');
		for (index = 0, ubound = options.length; index < ubound; index++) {
			options[index].addEventListener('click', onTransitionSelectHandler);
			if (options[index].checked) {
				barDrawEffect = options[index].value;
			}
		}

		// Create a data source
		createDataSource();
		// Draw a graph for the created data source
		drawGraph();
	}

	init();
})();