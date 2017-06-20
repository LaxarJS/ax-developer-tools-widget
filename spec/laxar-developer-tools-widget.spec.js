/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://www.laxarjs.org
 */

import * as axMocks from 'laxar-mocks';

describe( 'The laxar-developer-tools-widget', () => {

   let windowOpenSpy;
   let windowState;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   afterEach( () => {
      if( windowState ) {
         windowState.closed = true;
      }
   } );

   afterEach( axMocks.tearDown );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with feature "open"', () => {

      beforeEach( axMocks.setupForWidget() );

      beforeEach( () => {
         axMocks.widget.configure( {
            open: {
               onActions: [ 'develop' ],
               onGlobalMethod: 'axOpenDevTools'
            }
         } );

         windowState = {
            closed: false,
            focus: jasmine.createSpy( 'focus' )
         };

         windowOpenSpy = spyOn( window, 'open' ).and.callFake( () => {
            return windowState;
         } );
      } );

      beforeEach( axMocks.widget.load );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'allows to configure an action for opening the developer tools window (R1.1)', () => {
         expect( axMocks.widget.axEventBus.subscribe ).toHaveBeenCalledWith(
            'takeActionRequest.develop', jasmine.any( Function ) );
         axMocks.eventBus.publish( 'takeActionRequest.develop', { action: 'develop' } );
         axMocks.eventBus.flush();
         expect( windowOpenSpy ).toHaveBeenCalled();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'allows to configure a global javascript method that opens the window directly (R1.2)', () => {
         window.axOpenDevTools();
         expect( windowOpenSpy ).toHaveBeenCalled();
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'disabled by application-wide configuration', () => {
      const configPath = 'widgets.laxar-developer-tools-widget.enabled';

      beforeEach( axMocks.setupForWidget() );

      beforeEach( () => {
         axMocks.widget.configure( {} );

         axMocks.widget.whenServicesAvailable( services => {
            services.axConfiguration.get
               .and.callFake( ( key, fallback ) => {
                  if( key === configPath ) {
                     expect( fallback ).toEqual( true );
                     return false;
                  }
                  return fallback;
               } );
         } );
      } );

      beforeEach( axMocks.widget.load );

      let widgetDom;
      beforeEach( () => { widgetDom = axMocks.widget.render(); } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'does not subscribe to action requests (R3.1)', () => {
         expect( axMocks.widget.axEventBus.subscribe ).not.toHaveBeenCalled();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'does not add a configured global method (R3.2)', () => {
         expect( window.axOpenDevTools ).not.toBeDefined();
         expect( window.laxarShowDeveloperTools ).not.toBeDefined();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'does not add a button (R3.3)', () => {
         expect( widgetDom.querySelector( 'button' ) ).toBe( null );
      } );

   } );

} );
