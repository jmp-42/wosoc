// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
/******************************************************************************
 * Constants and Configurations
 *****************************************************************************/

// NOTE: This script uses the Cache script (https://github.com/yaylinda/scriptable/blob/main/Cache.js)
// Make sure to add the Cache script in Scriptable as well!

// Cache keys and default location
const CACHE_KEY_LAST_UPDATED = 'last_updated';

// Font name and size
const FONT_NAME = 'Menlo-Bold';
const FONT_SIZE = 11;

const DEBUG_USER_PREFERENCES = false

// NWSL/CC/World Cup:
const TEXT_CELL_WIDTH_MULTI = 280
const LOGO_CELL_WIDTH_MULTI = 25

// Single Team:
const TEXT_CELL_WIDTH_SINGLE = 200
const LOGO_CELL_WIDTH_SINGLE = 35
const MAIN_LOGO_CELL_WIDTH_SINGLE = 90

// Colors
const COLORS = {
  bg0:  '#85C8F2',      //'#ece98a',
  bg1: '#97B099',//'#2678BF',//'#9f9d5d',
  NWSLCalendar: '#FFFFFF',//'#374955',//'#b16d90', //'#D21F25',
  NWSLCCCalendar: '#FFFFFF',//'#374955',//'#32867B', //'#7b4c64', //'#1E2d54',
  WorldCupCalendar: '#FFFFFF',//'#374955',//'#004639' //#3b2530' //'#019645'
};

// TODO: PLEASE SET THESE VALUES
const CALENDAR1_NAME = 'NWSL Regular Season';
const CALENDAR2_NAME = 'NWSL Challenge Cup';
const CALENDAR3_NAME = 'World Cup 2023';

// icon file paths
const dirpath = 'wosocWidget/images/'
const nwslpath = dirpath + 'nwslcolor.png'
const nwslbwpath = dirpath + 'nwslbw.png'
const ccpath = dirpath + 'challengecupcolor.png'
const ccbwpath = dirpath + 'challengecupbw.png'
const wcpath = dirpath + 'fifacolor.png'
const wcbwpath = dirpath + 'fifabw.png'
const backgroundpath = dirpath + 'BlueClaw_BG.jpeg'
const reignpath = dirpath + 'RGN.png'
const reignbwpath = dirpath + 'rgn_white.png'

const cache_userinput_path = Script.name() + "_userinput.json"

let saved_preferences = 
{
  "widgetType" : "",
  "targetTeam" : "",
  "teamImage" : reignpath,
  "teamLockScreenImage" : reignbwpath,
  "NWSL Calendar" : CALENDAR1_NAME,
  "Challenge Cup Calendar" : CALENDAR2_NAME,
  "World Cup Calendar" : CALENDAR3_NAME
}

const emoji_substitutes = 
{
  "Canada" : "🇨🇦",
  "United States" : "🇺🇸",
  "Ireland" : "🇮🇪",
  //"OL Reign" : "👑"
}

// Whether or not to use a background image for the widget (if false, use gradient color)
const USE_BACKGROUND_IMAGE = true;

const USE_LOGOS = true; // if true, tries to put in images

let requested_exit = false

const teamsList = [
  "Angel City",
  "Chicago Red Stars",
  "Gotham FC",
  "Houston Dash",
  "Kansas City Current",
  "North Carolina Courage",
  "OL Reign",
  "Orlando Pride",
  "Portland Thorns",
  "Racing Louisville",
  "San Diego Wave",
  "Washington Spirit"
]

const widgetTypes = [
  "NWSL/Challenge Cup/Fifa World Cup Weekly Preview",
  "Single NWSL Team"
]
/******************************************************************************
 * Initial Setups
 *****************************************************************************/

/**
 * Convenience function to add days to a Date.
 * 
 * @param {*} days The number of days to add
 */ 
Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

// Import and setup Cache
const Cache = importModule('Cache');
const cache = new Cache('wosocWidget');
const fileManageriCloud = FileManager.iCloud();

// Fetch data and create widget
await presentMenu()
if(!requested_exit) {
  log("NAME:" + Script.name())
  const data = await fetchData();
  const widget = createWidget(data);

  // Set background image of widget, if flag is true
  if (USE_BACKGROUND_IMAGE) {
    // Determine if our image exists and when it was saved.
    //const files = FileManager.iCloud();
    const path = fileManageriCloud.joinPath(fileManageriCloud.documentsDirectory(), backgroundpath);
    const exists = fileManageriCloud.fileExists(path);
    log(exists)

    // If it exists and we're running in the widget, use photo from cache
    if (exists ) {
      fileManageriCloud.downloadFileFromiCloud(path)
      let img = fileManageriCloud.readImage(path)
      widget.backgroundImage = img

    // If it's missing when running in the widget, use a gradient black/dark-gray background.
    } else if (!exists) {
      const bgColor = new LinearGradient();
      bgColor.colors = [new Color("#29323c"), new Color("#1c1c1c")];
      bgColor.locations = [0.0, 1.0];
      widget.backgroundGradient = bgColor;

    // But if we're running in app, prompt the user for the image.
    } else if (config.runsInApp){
      const img = await Photos.fromLibrary();
      widget.backgroundImage = img;
      fileManageriCloud.writeImage(path, img);
    }
  }

  if (config.runsInApp) {  
    widget.presentMedium();
  }

  Script.setWidget(widget);
  Script.complete();
}
/******************************************************************************
 * Main Functions (Widget and Data-Fetching)
 *****************************************************************************/

/**
 * Main widget function.
 * 
 * @param {} data The data for the widget to display
 */
function createWidget(data) 
{
  switch(saved_preferences["widgetType"])
  {
    case widgetTypes[0]:
      return createWeeklySoccerWidget(data)
    case widgetTypes[1]:
      return createSingleTeamWidget(data, saved_preferences["targetTeam"])
      default:
        log("unexpected case " + saved_preferences["widgetType"])
        return createWeeklySoccerWidget(data)
  }
}
function createSingleTeamWidget(data, targetTeam)
{
  log("creating single team widget")

  /** SETUP WIDGET */
  const widget = new ListWidget();
  if(args.widgetParameter != 'showschedule' && !config.runsInApp)
  {
    mainStack = widget.addStack()
    addIcon(mainStack, saved_preferences["teamLockScreenImage"], targetTeam, 50)
    return widget
  }
  if  (!USE_BACKGROUND_IMAGE) {
  const bgColor = new LinearGradient();
  bgColor.colors = [new Color(COLORS.bg0), new Color(COLORS.bg1)];
  bgColor.locations = [0.0, 1.0];
  widget.backgroundGradient = bgColor;
  }
  widget.setPadding(10, 0, 10, 20);

  mainStack = widget.addStack()
  mainStack.layoutHorizontally()
  mainStack.spacing = 6;

  ReignLogoStack = mainStack.addStack()
  ReignLogoStack.centerAlignContent()
  ReignLogoStack.layoutVertically()
  ReignLogoStack.addSpacer()
  teamNameText = ReignLogoStack.addText(targetTeam)
  teamNameText.textColor = new Color(COLORS.NWSLCalendar);
  teamNameText.font = new Font(FONT_NAME, FONT_SIZE);
  addIcon(ReignLogoStack, saved_preferences["teamImage"], targetTeam, 100)
  ReignLogoStack.size = new Size(MAIN_LOGO_CELL_WIDTH_SINGLE, 0);
  ReignLogoStack.addSpacer()


  GamesStack = mainStack.addStack()
  GamesStack.spacing = 6;

  GamesStack.layoutVertically()

  /** NWSL STACK */
  NWSLStack = GamesStack.addStack()
  NWSLStack.layoutHorizontally()

  NWSLLogo = NWSLStack.addStack()
  NWSLLogo.layoutVertically()
  NWSLLogo.size = new Size(LOGO_CELL_WIDTH_SINGLE, 0);
  //NWSLStack.addSpacer()
  NWSLText = NWSLStack.addStack()
  NWSLText.size = new Size(TEXT_CELL_WIDTH_SINGLE, 0);
  NWSLText.layoutVertically()
 //NWSLStack.addSpacer()
  

  /** CHALLENGE CUP STACK */

  CCStack = GamesStack.addStack()
  CCStack.layoutHorizontally()

  CCLogo = CCStack.addStack()
  CCLogo.layoutVertically()
  CCLogo.size = new Size(LOGO_CELL_WIDTH_SINGLE, 0);
 //CCStack.addSpacer()
  CCText = CCStack.addStack()
  CCText.layoutVertically()
  CCText.size = new Size(TEXT_CELL_WIDTH_SINGLE, 0);
  //CCStack.addSpacer()
  /** GAME INFO */
  if(data.nextNWSLEvent && data.nextNWSLEvent.length > 0){
    addIcon(NWSLLogo, nwslpath, '⚽️', 25)//'soccerball.inverse')//'⚽️')

    let nextNWSLRegularGames = NWSLText.addText(`${getAllEvents(data.nextNWSLEvent, 'NWSL')}`);
    nextNWSLRegularGames.textColor = new Color(COLORS.NWSLCalendar);
    nextNWSLRegularGames.font = new Font(FONT_NAME, FONT_SIZE);
  }

  if(data.nextNWSLCCEvent && data.nextNWSLCCEvent.length > 0){
    addIcon(CCLogo, ccpath, '🏆', 25)//'trophy.circle')//'🏆')

    let nextNWSLChallengeCupGame = CCText.addText(`${getAllEvents(data.nextNWSLCCEvent, 'Challenge Cup')}`);
    nextNWSLChallengeCupGame.textColor = new Color(COLORS.NWSLCCCalendar);
    nextNWSLChallengeCupGame.font = new Font(FONT_NAME, FONT_SIZE);
  }
  return widget;
}

function createWeeklySoccerWidget(data) {
  log("creating weekly widget")
  /** SETUP WIDGET */
  const widget = new ListWidget();
  if  (!USE_BACKGROUND_IMAGE) {
  const bgColor = new LinearGradient();
  bgColor.colors = [new Color(COLORS.bg0), new Color(COLORS.bg1)];
  bgColor.locations = [0.0, 1.0];
  widget.backgroundGradient = bgColor;
  }
  widget.setPadding(2, 20, 2, 8);

  mainStack = widget.addStack()
  mainStack.layoutVertically()
  mainStack.spacing = 4;

  /** NWSL STACK */
  NWSLStack = mainStack.addStack()
  NWSLStack.layoutHorizontally()

  NWSLLogo = NWSLStack.addStack()
  NWSLLogo.layoutVertically()
  NWSLLogo.size = new Size(LOGO_CELL_WIDTH_MULTI, 0);
  NWSLStack.addSpacer()
  NWSLText = NWSLStack.addStack()
  NWSLText.size = new Size(TEXT_CELL_WIDTH_MULTI, 0);
  NWSLText.layoutVertically()
  NWSLStack.addSpacer()
  

  /** CHALLENGE CUP STACK */

  CCStack = mainStack.addStack()
  CCStack.layoutHorizontally()

  CCLogo = CCStack.addStack()
  CCLogo.layoutVertically()
  CCLogo.size = new Size(LOGO_CELL_WIDTH_MULTI, 0);
  CCStack.addSpacer()
  CCText = CCStack.addStack()
  CCText.layoutVertically()
  CCText.size = new Size(TEXT_CELL_WIDTH_MULTI, 0);
  CCStack.addSpacer()


  /** WORLD CUP STACK */
  WCStack = mainStack.addStack()
  WCStack.layoutHorizontally()

  WCLogo = WCStack.addStack()
  WCLogo.layoutVertically()
  WCLogo.size = new Size(LOGO_CELL_WIDTH_MULTI, 0);
  WCStack.addSpacer()
  WCText = WCStack.addStack()
  WCText.layoutVertically()
  WCText.size = new Size(TEXT_CELL_WIDTH_MULTI, 0);
  WCStack.addSpacer()
  
  
  addIcon(NWSLLogo, nwslpath, 'soccerball.inverse')//'⚽️')
  addIcon(CCLogo, ccpath, 'trophy.circle')//'🏆')
  addIcon(WCLogo, wcpath, 'globe.americas.fill')//'🌎')

  /** GAME INFO */
  const NWSLEvents = getAllEvents(data.nextNWSLEvent, 'NWSL')
  const nextNWSLRegularGames = NWSLText.addText(`${NWSLEvents}`);
  nextNWSLRegularGames.textColor = new Color(COLORS.NWSLCalendar);
  nextNWSLRegularGames.font = new Font(FONT_NAME, FONT_SIZE);

  const CCEvents = getAllEvents(data.nextNWSLCCEvent, 'Challenge Cup')
  const nextNWSLChallengeCupGame = CCText.addText(`${CCEvents}`);
  nextNWSLChallengeCupGame.textColor = new Color(COLORS.NWSLCCCalendar);
  nextNWSLChallengeCupGame.font = new Font(FONT_NAME, FONT_SIZE);

  const WCEvents = getAllEvents(data.nextWorldCupEvent, 'World Cup')
  const nextWorldCupCupGame = WCText.addText(`${WCEvents}`);
  nextWorldCupCupGame.textColor = new Color(COLORS.WorldCupCalendar);
  nextWorldCupCupGame.font = new Font(FONT_NAME, FONT_SIZE);

  return widget;
}

/**
 * Fetch pieces of data for the widget.
 */
async function fetchData() {

  // Get next work/personal calendar events
  const nextNWSLEvent = await fetchNextCalendarEvent(saved_preferences["NWSL Calendar"]);
  const nextNWSLCCEvent = await fetchNextCalendarEvent(saved_preferences["Challenge Cup Calendar"]);
  const nextWorldCupEvent = await fetchNextCalendarEvent(saved_preferences["World Cup Calendar"]);

  // Get last data update time (and set)
  const lastUpdated = await getLastUpdated();
  cache.write(CACHE_KEY_LAST_UPDATED, new Date().getTime());

  return {
    nextNWSLEvent,
    nextNWSLCCEvent,
    nextWorldCupEvent,
    lastUpdated
  };
}

/******************************************************************************
 * Helper Functions
 *****************************************************************************/

//-------------------------------------
// Calendar Helper Functions
//-------------------------------------

/**
 * Fetch the next "accepted" calendar event from the given calendar
 * 
 * @param {*} calendarName The calendar to get events from
 */
async function fetchNextCalendarEvent(calendarName) {
  if(calendarName == "") return ""
  const bSingleTeam = saved_preferences["widgetType"] == widgetTypes[1]
  if (bSingleTeam && calendarName == saved_preferences["World Cup Calendar"])
    return ""

  const calendar = await Calendar.forEventsByTitle(calendarName);

  let today = new Date();
  var end_date = bSingleTeam ? new Date("12/31/2023") : new Date(today.valueOf());
  if (!bSingleTeam){
    end_date.setDate(end_date.getDate() + 6);
  }

  const events = await CalendarEvent.between(today, end_date, [calendar]);

  console.log(`Got ${events.length} events for ${calendarName} week`);

  return events ? events : null;
}

function getAllEvents(calendarEvents, gameType)
{
  log("get all events")
  if (!calendarEvents || calendarEvents.length == 0) {

    return `No upcoming ${gameType} games :(`;
  }
  AllEvents = '';
  numEvents = 0
  for (let i = 0; i < calendarEvents.length; i++) {
      
      let event = getCalendarEventTitle(calendarEvents[i], gameType);
      if(event.length > 0)
      {
          if(numEvents > 0){
            log("inner")
              AllEvents += '\n'
          }
          AllEvents += event;
          numEvents += 1
      }
  }
  log(numEvents)
  return AllEvents;
}

/**
 * Given a calendar event, return the display text with title and time.
 * 
 * @param {*} calendarEvent The calendar event
 * @param {*} isWorkEvent Is this a work event?
 */
function getCalendarEventTitle(calendarEvent, gameType) {
  if (!calendarEvent) {
    return `No upcoming ${gameType} games`;
  }
  const bSingleTeam = saved_preferences["widgetType"] == widgetTypes[1]
  const timeFormatter = new DateFormatter();
  timeFormatter.locale = 'en';
  timeFormatter.dateFormat = bSingleTeam ? 'MM/dd hh:mm' : 'E dd hh:mm';
  if(gameType == 'World Cup')
  {
    timeFormatter.dateFormat ='MM/dd hh:mma';
  }

  const eventTime = new Date(calendarEvent.startDate);
  let eventName = calendarEvent.title;
  let splitName = calendarEvent.title.split(" vs ");
  let home = ''
  let away = ''
  if(splitName.length > 1)
  {
    if(bSingleTeam)
    {
      home = getShortTeamName(splitName[0])
      away = getShortTeamName(splitName[1])
      targetTeam = getShortTeamName(saved_preferences["targetTeam"])
      log("home: " + home + " away: " + away + " target: " + targetTeam)
      if(!(home == targetTeam || away == targetTeam))
          return ''
  
      if(home == targetTeam)
      {
          eventName = `🏠 ${away}`
      }
      else{
          eventName = `✈️ ${home}`
      }

    }
    else{
      eventName = `${getShortTeamName(splitName[0])} vs ${getShortTeamName(splitName[1])}`
    }
  }

  eventName = eventName.replace(' (Women) - ', " vs ");
  eventName = eventName.replace('(Women)', "");

  for ([key, value] of Object.entries(emoji_substitutes)) {
    eventName = eventName.replace(key, value)
  }

  return `[${timeFormatter.string(eventTime)}] ${eventName}`;
}




//-------------------------------------
// Misc. Helper Functions
//-------------------------------------
function closeApp()
{
  //App.close()
  requested_exit = true
  Script.complete()
  //throw new FatalError("App requested close")
}
async function promptWidgetType()
{
  log("requesting data from user. valid data: " + bIsDataValid)
  selectedWidgetType = 0
  selectedTargetTeam = 0
  selectedPhotoPath = ""
  /** USER SELECT WIDGET TYPE */
  let alert_widgetType = new Alert(Script.name() + "0")
  alert_widgetType.title = "What kind of widget do you want?"
  for (let i = 0; i < widgetTypes.length; i++){
    alert_widgetType.addAction(widgetTypes[i])
  }
  alert_widgetType.addCancelAction("Cancel")
  let idx = await alert_widgetType.presentSheet(Script.name() + "0")
  if(idx == -1)  {
    log("requested cancel")
    closeApp()
  }
  let widgetType = widgetTypes[idx]
  selectedWidgetType = idx
  switch(widgetType)
  {
    case widgetTypes[0]: // all preview
      break
    case widgetTypes[1]: // single team preview
      await promptTargetTeam()
    default:
      break
  }
  saved_preferences["widgetType"] = widgetType
}
async function promptTargetTeam()
{
  let alert = new Alert(Script.name() + "1")
  alert.title = "Select your team"    
  for (let i = 0; i < teamsList.length; i++)
  {
    alert.addAction(teamsList[i])
  }
  alert.addCancelAction("Cancel")

  idx = await alert.presentSheet(Script.name() + "1")
  if(idx == teamsList.length + 1) {
    fileManagerLocal.writeString(path, "cancelled operation")
    closeApp()
  }
  saved_preferences["targetTeam"] = teamsList[idx]
  saved_preferences["teamImage"] = dirpath + "teams/" + getTeamFileName(getShortTeamName(saved_preferences["targetTeam"]))
}
function promptImage()
{

}
function promptCalendars()
{

}
async function loadSavedData()
{
  /** Check if the app has already been configured */
  //const fileManageriCloud = FileManager.iCloud();
  const path = fileManageriCloud.joinPath(fileManageriCloud.documentsDirectory(), cache_userinput_path);
  const exists = fileManageriCloud.fileExists(path);
  let bIsDataValid = false
  if(exists)
  {

    log("using saved data from" + path)
    user_data = fileManageriCloud.readString(path)
    try{
      user_data_json = JSON.parse(user_data)
      try{
        for ([key, value] of Object.entries(user_data_json)) {
          saved_preferences[key] = value
        }
        log("successfully retrieved cached user data: " + JSON.stringify(saved_preferences))
        {
          if(args.widgetParameter   == "showschedule")
          {
            log("found data, widget requested show schedule")
            return
          }
          let alert_overwritedata = new Alert(Script.name() + "0")
          alert_overwritedata.title = "Would you like to start over and set new preferences, or continue with saved data?"
          alert_overwritedata.addAction("Start Over")
          alert_overwritedata.addAction("Continue")
          alert_overwritedata.addCancelAction("Cancel")
          let idx = await alert_overwritedata.presentSheet(Script.name() + "3")
          switch(idx)
          {
            case 0:
              bIsDataValid = false
              break
            case 1:
              bIsDataValid = true
              break
            default:
              closeApp()
              return
          }
        }
      }
      catch(err)
      {
        log("mismatch with cached vs. expected user data, re-prompting user. " + err)
        bIsDataValid = false
      }
    }
    catch(err){
      log("invalid json data, requesting again from user. " + err)
      bIsDataValid = false
    }
  }
  return bIsDataValid
}
async function presentMenu() 
{
  bIsDataValid = await loadSavedData()

  if(requested_exit) return

  if(!bIsDataValid || DEBUG_USER_PREFERENCES)
  {
    await promptWidgetType()
    if(requested_exit) return

    let preferences = JSON.stringify(saved_preferences)
    path = fileManageriCloud.joinPath(fileManageriCloud.documentsDirectory(), cache_userinput_path)
    // cache user preferences
    log("saving " + preferences + " to " + path)
    fileManageriCloud.writeString(path, preferences)
  }

}

function addIcon(wstack, iconName, fallbackStr)
{
  if(USE_LOGOS)
  {
    //const files = FileManager.iCloud();
    const path = fileManageriCloud.joinPath(fileManageriCloud.documentsDirectory(), iconName);
    const exists = fileManageriCloud.fileExists(path);
    // If it exists and we're running in the widget, use photo from cache
    if (exists ){
      fileManageriCloud.downloadFileFromiCloud(path)
      let img = fileManageriCloud.readImage(path);
      if(img)
        wstack.addImage(img)
    }
  }
  else
  {
    let sym = SFSymbol.named(fallbackStr)
    wstack.addImage(sym.image)
    //wstack.addText(fallbackStr)
  }
}

function getShortTeamName(longName)
{
  switch(longName)
  {
    case 'Racing Louisville':
      return 'Racing Lou'
    case 'Racing Louisville FC':
      return 'Racing Lou'
    case 'Gotham FC': 
      return 'Gotham'
    case 'NJ/NY Gotham FC': 
      return 'Gotham'
    case 'Chicago Red Stars': 
      return 'Red Stars'
    case 'Portland Thorns': 
      return 'Thorns'
    case 'Portland Thorns FC': 
      return 'Thorns'
    case 'Kansas City Current': 
      return 'KC Current'
    case 'Washington Spirit': 
      return 'Spirit'
    case 'North Carolina Courage': 
      return 'NC Courage'
    case 'Orlando Pride': 
      return 'Orl Pride'
    case 'San Diego Wave FC': 
      return 'SD Wave'
    case 'San Diego Wave': 
      return 'SD Wave'
    case 'Angel City FC': 
      return 'Angel City'
    case 'Houston Dash': 
      return 'Hou Dash'
    case 'OL Reign': 
      return 'OL Reign'
    default:
      return longName
  }
}


function getTeamFileName(longName)
{
  switch(longName)
  {
    case 'Racing Lou':
      return 'LOU.png'
    case 'Gotham': 
      return 'NJY.png'
    case 'Red Stars': 
      return 'CHI.png'
    case 'Thorns': 
      return 'POR.png'
    case 'KC Current': 
      return 'KCC.png'
    case 'Spirit': 
      return 'WAS.png'
    case 'NC Courage': 
      return 'NCC.png'
    case 'Orl Pride': 
      return 'ORL.png'
    case 'SD Wave': 
      return 'SD.png'
    case 'Angel City': 
      return 'LA.png'
    case 'Hou Dash': 
      return 'HOU.png'
    case 'OL Reign': 
      return 'RGN.png' 
  }
  return 'nwslcolor.png'
}
/**
 * Make a REST request and return the response
 * 
 * @param {*} url URL to make the request to
 * @param {*} headers Headers for the request
 */
async function fetchJson(url, headers) {
  try {
    console.log(`Fetching url: ${url}`);
    const req = new Request(url);
    req.headers = headers;
    const resp = await req.loadJSON();
    return resp;
  } catch (error) {
    console.error(`Error fetching from url: ${url}, error: ${JSON.stringify(error)}`);
  }
}

/**
 * Get the last updated timestamp from the Cache.
 */
async function getLastUpdated() {
  let cachedLastUpdated = await cache.read(CACHE_KEY_LAST_UPDATED);

  if (!cachedLastUpdated) {
    cachedLastUpdated = new Date().getTime();
    cache.write(CACHE_KEY_LAST_UPDATED, cachedLastUpdated);
  }

  return cachedLastUpdated;
}