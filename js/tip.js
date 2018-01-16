const VENMO_URL_BASE = "https://venmo.com/?txn=pay&recipients=scandalsrfc";
const PAYPAL_URL_BASE = "https://paypal.me/dcscandals/";
const TIP_PAGE_URL = "http://www.sequinsandscrums.com/tip.html";
const URL_ENCODED_HASHTAG = "%23sequinsandscrums";
const MAX_INDIVIDUAL_PROGRESS = 0.8;
const OVERALL_GOAL = 2000;

goal = 180;
emptyQueenBox = null;

$(function() {

  $.urlParam = function(name){
      var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
      if (results==null){
         return null;
      }
      else {
         return results[1] || 0;
      }
  }

  paypalMode = false;
  tipAmount = $.urlParam('default-amount');

  if( $.urlParam('payment-method') == 'paypal') {
    paypalMode = true;
  }

  var genesisQueenBox = $(".queen-box");
  emptyQueenBox = genesisQueenBox.clone();
  genesisQueenBox.remove();

  $.get( "https://queenfunder-api.herokuapp.com/queens", function( data ) {
    $(".loading-area").remove();
    initQueensJSON(data);
  });
});

function initQueensJSON(queensJSON) {
  var queenArray = queensJSON;

  queenArray = queenArray.sort(function(a,b) {
    if(a.amountRaised != b.amountRaised) {
      return b.amountRaised - a.amountRaised;
    }
    else {
      return Date.parse(a.updated_at) - Date.parse(b.updated_at);
    }
  });


  var totalRaised = 0;
  var highBar = 0;
  for(q of queenArray) {
    var amountRaised = parseFloat(q.amountRaised);
    totalRaised += amountRaised;
    if(amountRaised > highBar) {
      highBar = amountRaised;
    }
  }

  if(highBar > MAX_INDIVIDUAL_PROGRESS*goal) {
    goal = highBar / MAX_INDIVIDUAL_PROGRESS;
  }

  var overallProgress = Math.floor(100 * totalRaised / OVERALL_GOAL);
  var hasCents = (100 * totalRaised) % 100 != 0;
  var minDec = 0;
  var maxDec = 0;
  if(hasCents) {
    minDec = 2;
    maxDec = 2;
  }

  $("#total-progress-bar").css("width", overallProgress + "%")
  $("#total-progress-bar").attr("aria-valuenow", overallProgress);
  $("#overall-dollar-figure").text(totalRaised.toLocaleString(
    'en-US', {minimumFractionDigits: minDec, maximumFractionDigits: maxDec}));
  $("#overall-goal").text(OVERALL_GOAL.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0}));

  var index = 0;
  var lastQueenBox;
  for(q of queenArray) {
    var nextQueenBox = emptyQueenBox.clone();

    var queenName = q.queenName;
    var fullNameCode = q.fullNameCode;
    var fileName = q.fileName;
    var amountRaised = parseFloat(q.amountRaised);
    var bio = q.bio;
    var tipLink = formTipURL(fullNameCode);

    nextQueenBox.attr("id", "queen-box-" + index);
    nextQueenBox.find(".overlay-queen-name").text("Tip " + queenName);
    nextQueenBox.find(".queen-name").text(queenName);
    nextQueenBox.find(".bio").text(bio);
    nextQueenBox.find(".button").attr("href", tipLink);
    
    nextQueenBox.find(".info").attr("href", tipLink);
    if(paypalMode) {
      nextQueenBox.find(".info").text("Tip her on PayPal");
    }

    nextQueenBox.find(".img-responsive").attr("src", fileName);

    var hasCents = (100 * amountRaised) % 100 != 0;
    var minDec = 0;
    var maxDec = 0;
    if(hasCents) {
      minDec = 2;
      maxDec = 2;
    }

    nextQueenBox.find(".dollar-figure").text(amountRaised.toLocaleString(
      'en-US', {minimumFractionDigits: minDec, maximumFractionDigits: maxDec}));

    var progress = Math.floor(100 * amountRaised/goal);
    nextQueenBox.find(".progress-bar").css("width", progress + "%");
    nextQueenBox.find(".progress-bar").attr("aria-valuenow", progress);

    lastQueenBox=nextQueenBox;
    nextQueenBox.appendTo("#queengrid");
    index++;
  }

  setTimeout(function(){ equalizeQueenBoxes() }, 100);

}

function equalizeQueenBoxes() {
  var queenBoxes = $(".queen-box")

  var maxQueenBoxHeight = 0;
  if($("body").width() >= 768) {
    for(var b=0; b<queenBoxes.length;b++) {
      if(queenBoxes[b].clientHeight > maxQueenBoxHeight) {
        maxQueenBoxHeight = queenBoxes[b].clientHeight;
      }
    }
  }

  maxQueenBoxHeight++;

  $(".queen-box").css("min-height",maxQueenBoxHeight + "px");
}

function formTipURL(queenName) {
  var paramAmount = "";

  if(paypalMode) {
    if(tipAmount != null && !isNaN(parseFloat(tipAmount))) {
      paramAmount = tipAmount;
    }

    var finalURL = PAYPAL_URL_BASE + paramAmount;
  }
  else { //venmo
    if(tipAmount != null && !isNaN(parseFloat(tipAmount))) {
      paramAmount = "&amount=" + tipAmount;
    }

    var withSpace = "&note=TIP " + queenName + " " + URL_ENCODED_HASHTAG + " " + TIP_PAGE_URL;
    var paramNote = withSpace.replace(/ /g, "%20");

    var finalURL = VENMO_URL_BASE + paramAmount + paramNote;
  }

  return finalURL;
}
