/**
 * Copyright 2015-2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

export const injections = [
   'axWithDom', 'axFeatures', 'axEventBus', 'axLog', 'axConfiguration', 'axFlowService' ];
export function create( withDom, features, eventBus, log, configuration, flowService ) {
   const enabled = configuration.get( 'widgets.laxar-developer-tools-widget.enabled', true );
   if( !enabled ) {
      return {};
   }
   let contentWindow;
   features.open.onActions.forEach( action => {
      eventBus.subscribe( `takeActionRequest.${action}`, event => {
         openContentWindow();
         eventBus.publish( `didTakeAction.${event.action}`, { action: event.action } );
      } );
   } );

   if( features.open.onGlobalMethod ) {
      window[ features.open.onGlobalMethod ] = openContentWindow;
   }

   eventBus.subscribe( 'endLifecycleRequest', cleanup );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function cleanup() {
      if( features.open.onGlobalMethod ) {
         delete window[ features.open.onGlobalMethod ];
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function openContentWindow() {

      // const contentUrl = `${require.toUrl( './content/' ) +
      //    ( $scope.features.develop.enabled ? 'debug' : 'index' )}.html`;

      let contentUrl = `./content/${(features.develop.enabled ? 'debug' : 'index')}.html`;

      contentUrl = 'http://localhost:8080/' +
                   'application/widgets/laxar/laxar-developer-tools-widget/content/index.html';

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
         contentWindow = window.open( contentUrl, 'laxarDeveloperTools', settingsString );
      }

      try {
         contentWindow.focus();
      }
      catch( e ) {
         log.warn(
            'LaxarDeveloperToolsWidget: Popup was blocked. Unblock in browser, or use the "button" feature.'
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
