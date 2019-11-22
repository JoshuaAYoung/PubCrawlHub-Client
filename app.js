'use strict';
// KEYS
const MAPBOX_API_KEY = 'pk.eyJ1IjoibWljaGFlbGhwIiwiYSI6ImNrMzF1NjkyODBkMGwzbXBwOWJrcXQxOWwifQ.5VGC7vYD6ckQ2v-MVsIHLw';
mapboxgl.accessToken = MAPBOX_API_KEY;

// STORE
const STORE = {
  state: 'MAIN',
  brewResults: [],
  brewList: [],
  map: new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-104.991531, 39.742043],
    zoom: 11,
  }),
  directions : new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    profile: 'mapbox/walking',
  }),
  addNav: function() {
    STORE.map.addControl(this.directions);
  },
  removeNav: function() {
    STORE.map.removeControl(this.directions);
  },
  nav: null,
  addMarker: function(coordArr) {
    for(let i = 0; i < coordArr.length; i++) {
      // create a HTML element for each feature
      let el = document.createElement('div');
      el.className = 'marker';
    // make a marker for each bar and add to the map
      new mapboxgl.Marker(el)
        .setLngLat([parseFloat(coordArr[i][0]), parseFloat(coordArr[i][1])])
        .addTo(STORE.map);
    }
  },
  recenter: function(latLon) {
    STORE.map.easeTo({
      center: latLon
    })
  },
  removeMarkers: function() {
    $('.marker').remove();
  },
  stateCodes: {
    AK: "Alaska",
    AL: "Alabama",
    AR: "Arkansas",
    AZ:	"Arizona",
    CA:	"California",
    CO:	"Colorado",
    CT:	"Connecticut",
    DC: "Washington DC",
    DE:	"Delaware",
    FL:	"Florida",
    GA:	"Georgia",
    GU:	"Guam",
    HI:	"Hawaii",
    IA:	"Iowa",
    ID:	"Idaho",
    IL:	"Illinois",
    IN:	"Indiana",
    KS:	"Kansas",
    KY:	"Kentucky",
    LA:	"Louisiana",
    MA:	"Massachusetts",
    MD:	"Maryland",
    ME:	"Maine",
    MI:	"Michigan",
    MN:	"Minnesota",
    MO:	"Missouri",
    MS:	"Mississippi",
    MT:	"Montana",
    NC:	"North Carolina",
    ND:	"North Dakota",
    NE:	"Nebraska",
    NH:	"New Hampshire",
    NJ:	"New Jersey",
    NM:	"New Mexico",
    NV:	"Nevada",
    NY:	"New York",
    OH:	"Ohio",
    OK:	"Oklahoma",
    OR:	"Oregon",
    PA:	"Pennsylvania",
    PR:	"Puerto Rico",
    RI:	"Rhode Island",
    SC:	"South Carolina",
    SD:	"South Dakota",
    TN:	"Tennessee",
    TX:	"Texas",
    UT:	"Utah",
    VA:	"Virginia",
    VI:	"Virgin Islands",
    VT:	"Vermont",
    WA:	"Washington",
    WI:	"Wisconsin",
    WV:	"West Virginia",
    WY:	"Wyoming"
  }
}

/////// RANDOM ///////

// sortable jquery code
$(".resultsList").sortable({
  stop: function(event, ui) {
    orderNumber();
    fillBrewList();
    passToMap();
  }
});

//iterates through each of the list items and sets the order number to the .ordernumber div
function orderNumber() {
  $(".resultsList li").each(function (i) {
    let position = i++;
    $(this).find(".orderNumber").html(position + 1);
  })
}


function fillBrewList() {
  STORE.brewList = [];
  $(".resultsList li").each(function() {
    let resultIndex = STORE.brewResults.findIndex(arrayItem => {
      return arrayItem.name === $(this).find(".barName").html();
    }); 
    STORE.brewList.push(STORE.brewResults[resultIndex]);
  })
  console.log("Brew List is Full Up!")
}

// mapbox url
const MAPBOX_URL = 'https://api.mapbox.com/';

// open brewery
function convertAbbrev(input) {
  if (input.length === 2) {
    return STORE.stateCodes[input.toUpperCase()];
  }
  else {
    return input;
  }
}

// DATA HANDLERS
function formatQuery(parameters) {
  //takes parameter keys and makes an array out of them
  const queryItems = Object.keys(parameters)
  //loops through our array and creates a new array made up of strings (encoded for use in url) with the format "key=value"
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`)
  //returns the array object as a single string with & in between each
    return queryItems.join('&');
}

function getBarsFromOB(cityQ, stateQ, limitQ=20) {
  const baseURL = 'https://api.openbrewerydb.org/breweries';
  const params = {
    by_city: cityQ,
    by_state: stateQ,
    per_page: limitQ,
    sort: "city"
  };
  const queryString = formatQuery(params)
  const url = baseURL + '?' + queryString;

  fetch(url)
  .then(response => {
    if (response.ok) {
      STORE.state = "RESULTS";
      return response.json();
    }
    throw new Error(response.statusText)
  })
  .then(responseJson => { 
    let geocodedResults = filterResultsWithoutLatLon(responseJson);
    STORE.brewResults = geocodedResults;
    let missingResults = false;
    if(geocodedResults.length !== responseJson.length) {
      missingResults = true;
    }
    determineView(STORE.state, geocodedResults, missingResults);
  })
  .catch(err => {
    STORE.state = "BAD RESULTS";
    determineView(STORE.state, err)
  })
}

function filterResultsWithoutLatLon(res) {
  return res.filter(bar => bar.longitude !== null || bar.latitude !== null);
}

/////// EVENT LISTENERS ///////
function watchForm() {
  $('.searchForm').on('submit', function(e){
    e.preventDefault();
    $(".listSubmit").show();
    let cityInput = $(this).find('input[name="mainSearch"]').val();
    let stateInput = convertAbbrev($(this).find('input[name="stateSearch"]').val());
    // let zipcodeInput = $(this).find('input[name="zipSearch"]').val();
    let limitInput = $(this).find('input[name="resultsNumber"]').val();
    // let radiusInput = $(this).find('input[name="proximitySearch"]').val();
    getBarsFromOB(cityInput, stateInput, limitInput);
  })
}

function addDirections() {
  $('#addDirections').on('click', e => {
    e.preventDefault();
    if(STORE.nav !== true) {
      STORE.addNav();
      STORE.nav = true;
    }
  })
}

function removeDirections() {
  $('#removeDirections').on('click', e => {
    e.preventDefault();
    if(STORE.nav !== false) {
      STORE.removeNav();
      STORE.nav = false;
    }
  });
}

function slideOutADVSearch() {
  $('.searchForm').on('click', '#advSearchToggle', function(e) {
    e.preventDefault();
    $('.advSearchOptions').slideToggle('slow');
  });
}

//sends brewlist to the map
function passToMap () {
  let startBar = [STORE.brewList[0].longitude, STORE.brewList[0].latitude];
  let otherBars = [];
  STORE.brewList.forEach(bar => {
    otherBars.push([bar.longitude, bar.latitude]);
  });
  STORE.recenter(startBar);
  STORE.addMarker(otherBars);
}

//watch the list of breweries form
function watchUserList() {
  $('.resultsForm').on('submit', function(event) {
    event.preventDefault();
    fillBrewList();

  })
}

function clearMarkers() {
  $('#clearMarkers').on('click', e => {
    e.preventDefault();
    STORE.removeMarkers();
  })
}

//button to remove a result
function removeBar() {
  $(".barCardItem").on("click", ".removeButton", function(event) {
    event.preventDefault();
    $(this).parent().remove();
    orderNumber();
    fillBrewList();
    passToMap();
  })
};


/////// VIEW HANDLERS ///////
function determineView(state, res, missingResults) {
  if (state === 'MAIN') {
    return buildMainView();
  } else if (state === 'RESULTS') {
    return buildResultsView(res, missingResults);
  } else if (state === 'BAD RESULT') {
    return buildBadResults(res);
  }
}

//generate the results html for happy result
function buildResultsView(res, missingResults=false) {
  const bars = res;
  $('.resultsList').html('');
  $('.map').html('');
  let resultView = [];
  for(let i = 0; i < bars.length; i++) {
    resultView.push(`
      <li class="barCardItem" id=List${i+1}>
      <div class="orderNumber">${i + 1}
      </div>
      <div class="barContainer">
      <h3 class="barTitle barLink">
        <a href="${bars[i].website_url}" class="barName" target="_blank">${bars[i].name}</a>
      </h3>
      <p class="barAddress">${bars[i].street}</p>
      <p class="barAddress">${bars[i].city}, ${bars[i].state}, ${bars[i].postal_code}</p>
      <p class="barPhone">${bars[i].phone}</p>
      <button class="animated-button" type="button" id="removeButton" class="removeButton">X</button>
      </li>
      `);
  }
  // TODO - get rid of comma between li's
  resultView.join('');
  if(missingResults) {
    // TODO - fade this out after timeout
    $('.resultsList').html(`<div class="alert">
      Some results were removed do to missing location information.
    </div>
    ${resultView}`);
  } else {
    $('.resultsList').html(resultsView);
  }
  removeBar();
  let mapCenter = [STORE.brewResults[0].longitude, STORE.brewResults[0].latitude];
  STORE.map;
  STORE.addNav();
  STORE.nav = true;
  STORE.recenter(mapCenter);
  let initialBars = [];
  STORE.brewResults.forEach(bar => {
    initialBars.push([bar.longitude, bar.latitude]);
  });
  STORE.addMarker(initialBars);
}

//generate html for unhappy result
function buildBadResults(res) {
  $('.resultsList').html('');
  $('.map').html('');
  let view = `<h2>We've experienced an error</h2>
  <p>${res.message}</p>`;
  $('.resultList').html(view);
}

/////// PAGE READY LISTENER ///////
$(function() {
  watchForm();
  slideOutADVSearch();
  watchUserList();
  removeDirections();
  addDirections();
  clearMarkers();
})