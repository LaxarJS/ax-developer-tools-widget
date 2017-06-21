/**
 * Copyright 2015-2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

import * as ng from 'angular';
import * as ax from 'laxar';

const BUFFER_SIZE = 2500;

// To capture navigation and lifecycle events, the event log persists across LaxarJS navigation.
let contentWindow;
let cleanupInspector;
let hasLogChannel;

let developerHooks = {};
let enabled;

///////////////////////////////////////////////////////////////////////////////////////////////////////////

export const injections = [ 'axWithDom', 'axFeatures', 'axEventBus', 'axConfiguration', 'axLog' ];
export function create( withDom, features, eventBus, configuration, log ) {
   // $scope.enabled = enabled;
   // if( !$scope.enabled ) {
   //    return;
   // }

   // Needed for inspection to work with laxar-mocks (run-block is run too early).
   //ensureEventBusInspection( eventBus );

   features.open.onActions.forEach( action => {
      eventBus.subscribe( `takeActionRequest.${action}`, event => {
         openContentWindow();
         eventBus.publish( `didTakeAction.${event.action}`, { action: event.action } );
      } );
   } );

   if( features.open.onGlobalMethod ) {
      window[ features.open.onGlobalMethod ] = openContentWindow;
   }

   developerHooks.gridSettings = configuration.get( 'tooling.grid', undefined );
   if( developerHooks.gridSettings === undefined && Object.keys( features.grid ).length > 0 ) {
      developerHooks.gridSettings = features.grid;
   }

   //$scope.$on( '$destroy', cleanup );


   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   // function cleanup() {
   //    if( $scope.features.open.onGlobalMethod ) {
   //       delete window[ $scope.features.open.onGlobalMethod ];
   //    }
   // }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function openContentWindow( mode ) {
      // const contentUrl = `${require.toUrl( './content/' ) +
      //    ( mode || ( $scope.features.develop.enabled ? 'debug' : 'index' ) )}.html`;

      let contentUrl =
         `./content/${( mode || ( features.develop.enabled ? 'debug' : 'index' ) )}.html`;
      contentUrl = 'http://localhost:8080/' +
                   'application/widgets/laxar/laxar-developer-tools-widget/content/#!/tools/';

      const settings = {
         resizable: 'yes',
         scrollbars: 'yes',
         status: 'yes',
         width: 1280,
         height: 700
      };

      const settingsString = Object.keys( settings ).map( key => {
         return `${key}=${settings[ key ]}`;
      } ).join( ',' );

      if( !contentWindow || contentWindow.closed ) {
         contentWindow = window.open( contentUrl, 'axDeveloperTools', settingsString );
      }

      try {
         contentWindow.focus();
      }
      catch( e ) {
         log.warn(
            'AxDeveloperToolsWidget: Popup was blocked. Unblock in browser, or use the "button" feature.'
         );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function handleButtonClicked() {
      return openContentWindow;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function renderButton( element ) {
      const developerButton = document.createElement( 'BUTTON' );
      developerButton.onclick = handleButtonClicked();
      developerButton.type = 'button';
      developerButton.className = 'btn btn-warning';
      developerButton.innerHTML = features.button.htmlLabel;
      element.appendChild( developerButton );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function render() {
      withDom( dom => {
         if( features.button.enabled ) { renderButton( dom ); }
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return { onDomAvailable: render };
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

// startCapturingEvents.$inject = [ 'axEventBus', 'axConfiguration', 'axLog' ];
//
// function startCapturingEvents( eventBus, configuration, log ) {
//    enabled = configuration.get( 'widgets.laxar-developer-tools-widget.enabled', true );
//    if( !enabled ) {
//       return;
//    }
//
//    ax._tooling.pages.addListener( onPageChange );
//
//    developerHooks = window.axDeveloperTools = ( window.axDeveloperTools || {} );
//    developerHooks.buffers = ( developerHooks.buffers || { events: [], log: [] } );
//    developerHooks.eventCounter = developerHooks.eventCounter || Date.now();
//    developerHooks.logCounter = developerHooks.logCounter || Date.now();
//    developerHooks.pageInfo = developerHooks.pageInfo || ax._tooling.pages.current();
//    developerHooks.pageInfoVersion = developerHooks.pageInfoVersion || 1;
//
//    if( !hasLogChannel ) {
//       log.addLogChannel( logChannel );
//       hasLogChannel = true;
//    }
//
//    ensureEventBusInspection( eventBus );
//
//    window.addEventListener( 'beforeunload', () => {
//       if( hasLogChannel ) {
//          log.removeLogChannel( logChannel );
//          hasLogChannel = false;
//       }
//       if( cleanupInspector ) {
//          cleanupInspector();
//          cleanupInspector = null;
//       }
//    } );
//
//    ////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    function logChannel( messageObject ) {
//       const index = developerHooks.logCounter++;
//       const jsonItem = JSON.stringify( messageObject );
//       pushIntoStore( 'log', { index, json: jsonItem } );
//    }
// }

// ///////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// function ensureEventBusInspection( globalEventBus ) {
//    if( cleanupInspector ) {
//       cleanupInspector();
//    }
//
//    cleanupInspector = globalEventBus.addInspector( item => {
//       const index = developerHooks.eventCounter++;
//       const jsonItem = JSON.stringify( ax.object.options( { time: Date.now() }, item ) );
//
//       pushIntoStore( 'events', {
//          index,
//          json: jsonItem
//       } );
//    } );
// }
//
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// function onPageChange( pageInfo ) {
//    if( ng.equals( developerHooks.pageInfo, pageInfo ) ) {
//       return;
//    }
//    developerHooks.pageInfo = pageInfo;
//    ++developerHooks.pageInfoVersion;
// }
//
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// function pushIntoStore( storeName, item ) {
//    const buffer = developerHooks.buffers[ storeName ];
//    while( buffer.length >= BUFFER_SIZE ) {
//       buffer.shift();
//    }
//    buffer.push( item );
// }

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//
// export const name = ng.module( 'axDeveloperToolsWidget', [] )
//    .run( [ 'axGlobalEventBus', startCapturingEvents ] )
//    .controller( 'AxDeveloperToolsWidgetController', Controller ).name;
