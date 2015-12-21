/* jshint ignore:start */
define(['exports', 'wireflow'], function (exports, _wireflow) {'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _slicedToArray = (function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i['return']) _i['return']();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError('Invalid attempt to destructure non-iterable instance');}};})();exports.graph = graph;exports.layout = layout;exports.types = types;exports.filterFromSelection = filterFromSelection;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { 'default': obj };}var _wireflow2 = _interopRequireDefault(_wireflow);


   var TYPE_CONTAINER = 'CONTAINER';var 



   layoutModel = _wireflow2['default'].layout.model;var 


   graphModel = _wireflow2['default'].graph.model;



   var edgeTypes = { 
      RESOURCE: { 
         hidden: false, 
         label: 'Resources' }, 

      FLAG: { 
         label: 'Flags', 
         hidden: false }, 

      ACTION: { 
         label: 'Actions', 
         hidden: false }, 

      CONTAINER: { 
         hidden: false, 
         label: 'Container', 
         owningPort: 'outbound' } };



   /**
    * Create a wireflow graph from a given page/widget information model.
    *
    * @param {Object} pageInfo
    * @param {Boolean=false} withIrrelevantWidgets
    *   If set to `true`, widgets without any relevance to actions/resources/flags are removed.
    *   Containers of widgets (that are relevant by this measure) are kept.
    */
   function graph(pageInfo, options) {var _options$withIrrelevantWidgets = 




      options.withIrrelevantWidgets;var withIrrelevantWidgets = _options$withIrrelevantWidgets === undefined ? false : _options$withIrrelevantWidgets;var _options$withContainers = options.withContainers;var withContainers = _options$withContainers === undefined ? true : _options$withContainers;

      var PAGE_ID = '.';var 
      pageReference = pageInfo.pageReference;var pageDefinitions = pageInfo.pageDefinitions;var widgetDescriptors = pageInfo.widgetDescriptors;
      var page = pageDefinitions[pageReference];

      var vertices = {};
      var edges = {};

      identifyVertices();
      if (withContainers) {
         identifyContainers();}

      if (!withIrrelevantWidgets) {
         pruneIrrelevantWidgets(withContainers);}

      pruneEmptyEdges();

      return graphModel.convert.graph({ 
         vertices: vertices, 
         edges: edges });


      ///////////////////////////////////////////////////////////////////////////////////////////////////////////

      function isWidget(pageAreaItem) {
         return !!pageAreaItem.widget;}


      function isLayout(pageAreaItem) {
         return !!pageAreaItem.layout;}


      function either(f, g) {
         return function () {
            return f.apply(this, arguments) || g.apply(this, arguments);};}



      ///////////////////////////////////////////////////////////////////////////////////////////////////////////

      function identifyVertices() {
         Object.keys(page.areas).forEach(function (areaName) {
            page.areas[areaName].forEach(function (component) {
               if (component.widget) {
                  processWidgetInstance(component, areaName);} else 

               if (component.layout) {
                  processLayoutInstance(component, areaName);}});});}





      ///////////////////////////////////////////////////////////////////////////////////////////////////////////

      function processLayoutInstance(layout, areaName) {
         vertices[layout.id] = { 
            id: layout.id, 
            kind: 'LAYOUT', 
            label: layout.id, 
            ports: { inbound: [], outbound: [] } };}



      ///////////////////////////////////////////////////////////////////////////////////////////////////////////

      function processWidgetInstance(widget, areaName) {
         var descriptor = widgetDescriptors[widget.widget];
         var ports = { inbound: [], outbound: [] };

         var kinds = { 
            widget: 'WIDGET', 
            activity: 'ACTIVITY' };


         identifyPorts(widget.features, descriptor.features, []);
         vertices[widget.id] = { 
            id: widget.id, 
            kind: kinds[descriptor.integration.type], 
            label: widget.id, 
            ports: ports };


         function identifyPorts(value, schema, path) {
            if (!value || !schema) {
               return;}


            if (value.enabled === false) {
               // widget feature can be disabled, and was disabled
               return;}


            if (schema.type === 'string' && schema.axRole && (
            schema.format === 'topic' || schema.format === 'flag-topic')) {
               var type = schema.axPattern ? schema.axPattern.toUpperCase() : inferEdgeType(path);
               if (!type) {return;}
               var edgeId = type + ':' + value;
               var label = path.join('.');
               var id = path.join(':');
               ports[schema.axRole === 'outlet' ? 'outbound' : 'inbound'].push({ 
                  label: label, id: id, type: type, edgeId: edgeId });

               if (edgeId && !edges[edgeId]) {
                  edges[edgeId] = { type: type, id: edgeId, label: value };}}



            if (schema.type === 'object' && schema.properties) {
               Object.keys(schema.properties).forEach(function (key) {
                  var propertySchema = schema.properties[key] || schema.additionalProperties;
                  identifyPorts(value[key], propertySchema, path.concat([key]));});}



            if (schema.type === 'array') {
               value.forEach(function (item, i) {
                  identifyPorts(item, schema.items, path.concat([i]));});}}




         function inferEdgeType(_x) {var _again = true;_function: while (_again) {var path = _x;_again = false;
               if (!path.length) {
                  return null;}

               var lastSegment = path[path.length - 1];
               if (['action', 'flag', 'resource'].indexOf(lastSegment) !== -1) {
                  return lastSegment.toUpperCase();}

               if (lastSegment === 'onActions') {
                  return 'ACTION';}_x = 

               path.slice(0, path.length - 1);_again = true;lastSegment = undefined;continue _function;}}}



      ///////////////////////////////////////////////////////////////////////////////////////////////////////////

      function pruneIrrelevantWidgets(withContainers) {
         var toPrune = [];
         do {
            toPrune.forEach(function (id) {delete vertices[id];});
            pruneEmptyEdges();
            toPrune = mark();} while (
         toPrune.length);

         function mark() {
            var pruneList = [];
            Object.keys(vertices).forEach(function (vId) {
               var ports = vertices[vId].ports;
               if (ports.inbound.length <= withContainers ? 1 : 0) {
                  if (ports.outbound.every(function (_) {return !_.edgeId;})) {
                     pruneList.push(vId);}}});



            return pruneList;}}



      function pruneEmptyEdges() {
         var toPrune = [];
         Object.keys(edges).forEach(function (edgeId) {
            var type = edgeTypes[edges[edgeId].type];
            var sources = Object.keys(vertices).filter(isSourceOf(edgeId));
            var sinks = Object.keys(vertices).filter(isSinkOf(edgeId));
            var hasSources = sources.length > 0;
            var hasSinks = sinks.length > 0;
            var isEmpty = type.owningPort ? !hasSources || !hasSinks : !hasSources && !hasSinks;
            if (!isEmpty) {
               return;}


            toPrune.push(edgeId);
            sources.concat(sinks).forEach(function (vertexId) {
               var ports = vertices[vertexId].ports;
               ports.inbound.concat(ports.outbound).forEach(function (port) {
                  port.edgeId = port.edgeId === edgeId ? null : port.edgeId;});});});



         toPrune.forEach(function (id) {delete edges[id];});

         function isSourceOf(edgeId) {
            return function (vertexId) {
               return vertices[vertexId].ports.inbound.some(function (port) {return port.edgeId === edgeId;});};}



         function isSinkOf(edgeId) {
            return function (vertexId) {
               return vertices[vertexId].ports.outbound.some(function (port) {return port.edgeId === edgeId;});};}}




      ///////////////////////////////////////////////////////////////////////////////////////////////////////////

      function identifyContainers() {
         var type = TYPE_CONTAINER;

         vertices[PAGE_ID] = { 
            PAGE_ID: PAGE_ID, 
            label: 'Page ' + pageReference, 
            kind: 'PAGE', 
            ports: { inbound: [], outbound: [] } };


         Object.keys(page.areas).forEach(function (areaName) {
            insertEdge(areaName);
            var owner = findOwner(areaName);
            if (!owner) {
               return;}


            var containsAnything = false;
            page.areas[areaName].filter(either(isWidget, isLayout)).forEach(function (item) {
               if (vertices[item.id]) {
                  insertUplink(vertices[item.id], areaName);
                  containsAnything = true;}});


            if (containsAnything) {
               insertOwnerPort(owner, areaName);}});



         function findOwner(areaName) {
            if (areaName.indexOf('.') === -1) {
               return vertices[PAGE_ID];}

            var prefix = areaName.slice(0, areaName.lastIndexOf('.'));
            return vertices[prefix];}


         function insertOwnerPort(vertex, areaName) {
            vertex.ports.outbound.unshift({ 
               id: 'CONTAINER:' + areaName, 
               type: TYPE_CONTAINER, 
               edgeId: areaEdgeId(areaName), 
               label: areaName });}



         function insertUplink(vertex, areaName) {
            vertex.ports.inbound.unshift({ 
               id: 'CONTAINER:anchor', 
               type: TYPE_CONTAINER, 
               edgeId: areaEdgeId(areaName), 
               label: 'anchor' });}



         function insertEdge(areaName) {
            var id = areaEdgeId(areaName);
            edges[id] = { id: id, type: type, label: areaName };}


         function areaEdgeId(areaName) {
            return TYPE_CONTAINER + ':' + areaName;}}}





   //////////////////////////////////////////////////////////////////////////////////////////////////////////////

   function layout(graph) {
      return layoutModel.convert.layout({ 
         vertices: {}, 
         edges: {} });}



   //////////////////////////////////////////////////////////////////////////////////////////////////////////////

   function types() {
      return graphModel.convert.types(edgeTypes);}


   //////////////////////////////////////////////////////////////////////////////////////////////////////////////

   function filterFromSelection(selection, graphModel) {
      var topics = selection.edges.flatMap(function (edgeId) {var _edgeId$split = 
         edgeId.split(':');var _edgeId$split2 = _slicedToArray(_edgeId$split, 2);var type = _edgeId$split2[0];var topic = _edgeId$split2[1];
         return type === 'CONTAINER' ? [] : [{ pattern: type, topic: topic }];}).
      toJS();

      var participants = selection.vertices.flatMap(function (vertexId) {var _graphModel$vertices$get = 
         graphModel.vertices.get(vertexId);var id = _graphModel$vertices$get.id;var kind = _graphModel$vertices$get.kind;
         return kind === 'PAGE' || kind === 'LAYOUT' ? [] : [{ kind: kind, participant: vertexId }];});


      return { 
         topics: topics, 
         participants: participants };}});
//# sourceMappingURL=data:application/json;base64,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QUUsR0FBRyxDQUFFLDJEQUFuQyxJQUFJLHlCQUFFLEtBQUs7QUFDbkIsZ0JBQU8sQUFBRSxJQUFJLEtBQUssV0FBVyxHQUFLLEVBQUUsR0FBRyxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUwsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUNwRSxDQUFFO0FBQUMsVUFBSSxFQUFFLENBQUM7O0FBRVgsVUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUUsVUFBQSxRQUFRLEVBQUk7QUFDckMsbUJBQVUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFFLFFBQVEsQ0FBRSxLQUFoRCxFQUFFLDRCQUFGLEVBQUUsS0FBRSxJQUFJLDRCQUFKLElBQUk7QUFDaEIsZ0JBQU8sQUFBRSxJQUFJLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxRQUFRLEdBQUssRUFBRSxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUosSUFBSSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQzNGLENBQUUsQ0FBQzs7O0FBRUosYUFBTztBQUNKLGVBQU0sRUFBTixNQUFNO0FBQ04scUJBQVksRUFBWixZQUFZLEVBQ2QsQ0FBQyxDQUNKIiwiZmlsZSI6ImdyYXBoLWhlbHBlcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCB3aXJlZmxvdyBmcm9tICd3aXJlZmxvdyc7XG5cbmNvbnN0IFRZUEVfQ09OVEFJTkVSID0gJ0NPTlRBSU5FUic7XG5cbmNvbnN0IHtcbiAgbGF5b3V0OiB7XG4gICAgIG1vZGVsOiBsYXlvdXRNb2RlbFxuICB9LFxuICBncmFwaDoge1xuICAgIG1vZGVsOiBncmFwaE1vZGVsXG4gIH1cbn0gPSB3aXJlZmxvdztcblxuY29uc3QgZWRnZVR5cGVzID0ge1xuICAgUkVTT1VSQ0U6IHtcbiAgICAgIGhpZGRlbjogZmFsc2UsXG4gICAgICBsYWJlbDogJ1Jlc291cmNlcydcbiAgIH0sXG4gICBGTEFHOiB7XG4gICAgICBsYWJlbDogJ0ZsYWdzJyxcbiAgICAgIGhpZGRlbjogZmFsc2VcbiAgIH0sXG4gICBBQ1RJT046IHtcbiAgICAgIGxhYmVsOiAnQWN0aW9ucycsXG4gICAgICBoaWRkZW46IGZhbHNlXG4gICB9LFxuICAgQ09OVEFJTkVSOiB7XG4gICAgICBoaWRkZW46IGZhbHNlLFxuICAgICAgbGFiZWw6ICdDb250YWluZXInLFxuICAgICAgb3duaW5nUG9ydDogJ291dGJvdW5kJ1xuICAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGUgYSB3aXJlZmxvdyBncmFwaCBmcm9tIGEgZ2l2ZW4gcGFnZS93aWRnZXQgaW5mb3JtYXRpb24gbW9kZWwuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhZ2VJbmZvXG4gKiBAcGFyYW0ge0Jvb2xlYW49ZmFsc2V9IHdpdGhJcnJlbGV2YW50V2lkZ2V0c1xuICogICBJZiBzZXQgdG8gYHRydWVgLCB3aWRnZXRzIHdpdGhvdXQgYW55IHJlbGV2YW5jZSB0byBhY3Rpb25zL3Jlc291cmNlcy9mbGFncyBhcmUgcmVtb3ZlZC5cbiAqICAgQ29udGFpbmVycyBvZiB3aWRnZXRzICh0aGF0IGFyZSByZWxldmFudCBieSB0aGlzIG1lYXN1cmUpIGFyZSBrZXB0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ3JhcGgoIHBhZ2VJbmZvLCBvcHRpb25zICkge1xuXG4gICBjb25zdCB7XG4gICAgICB3aXRoSXJyZWxldmFudFdpZGdldHMgPSBmYWxzZSxcbiAgICAgIHdpdGhDb250YWluZXJzID0gdHJ1ZVxuICAgfSA9IG9wdGlvbnM7XG5cbiAgIGNvbnN0IFBBR0VfSUQgPSAnLic7XG4gICBjb25zdCB7IHBhZ2VSZWZlcmVuY2UsIHBhZ2VEZWZpbml0aW9ucywgd2lkZ2V0RGVzY3JpcHRvcnMgfSA9IHBhZ2VJbmZvO1xuICAgY29uc3QgcGFnZSA9IHBhZ2VEZWZpbml0aW9uc1sgcGFnZVJlZmVyZW5jZSBdO1xuXG4gICBjb25zdCB2ZXJ0aWNlcyA9IHt9O1xuICAgY29uc3QgZWRnZXMgPSB7fTtcblxuICAgaWRlbnRpZnlWZXJ0aWNlcygpO1xuICAgaWYoIHdpdGhDb250YWluZXJzICkge1xuICAgICAgaWRlbnRpZnlDb250YWluZXJzKCk7XG4gICB9XG4gICBpZiggIXdpdGhJcnJlbGV2YW50V2lkZ2V0cyApIHtcbiAgICAgIHBydW5lSXJyZWxldmFudFdpZGdldHMoIHdpdGhDb250YWluZXJzICk7XG4gICB9XG4gICBwcnVuZUVtcHR5RWRnZXMoKTtcblxuICAgcmV0dXJuIGdyYXBoTW9kZWwuY29udmVydC5ncmFwaCgge1xuICAgICAgdmVydGljZXMsXG4gICAgICBlZGdlc1xuICAgfSApO1xuXG4gICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICBmdW5jdGlvbiBpc1dpZGdldCggcGFnZUFyZWFJdGVtICkge1xuICAgICAgcmV0dXJuICEhcGFnZUFyZWFJdGVtLndpZGdldDtcbiAgIH1cblxuICAgZnVuY3Rpb24gaXNMYXlvdXQoIHBhZ2VBcmVhSXRlbSApIHtcbiAgICAgIHJldHVybiAhIXBhZ2VBcmVhSXRlbS5sYXlvdXQ7XG4gICB9XG5cbiAgIGZ1bmN0aW9uIGVpdGhlciggZiwgZyApIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgIHJldHVybiBmLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKSB8fCBnLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcbiAgICAgIH07XG4gICB9XG5cbiAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgIGZ1bmN0aW9uIGlkZW50aWZ5VmVydGljZXMoKSB7XG4gICAgICBPYmplY3Qua2V5cyggcGFnZS5hcmVhcyApLmZvckVhY2goIGFyZWFOYW1lID0+IHtcbiAgICAgICAgIHBhZ2UuYXJlYXNbIGFyZWFOYW1lIF0uZm9yRWFjaCggY29tcG9uZW50ID0+IHtcbiAgICAgICAgICAgIGlmKCBjb21wb25lbnQud2lkZ2V0ICkge1xuICAgICAgICAgICAgICAgcHJvY2Vzc1dpZGdldEluc3RhbmNlKCBjb21wb25lbnQsIGFyZWFOYW1lICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKCBjb21wb25lbnQubGF5b3V0ICkge1xuICAgICAgICAgICAgICAgcHJvY2Vzc0xheW91dEluc3RhbmNlKCBjb21wb25lbnQsIGFyZWFOYW1lICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICB9ICk7XG4gICAgICB9ICk7XG4gICB9XG5cbiAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgIGZ1bmN0aW9uIHByb2Nlc3NMYXlvdXRJbnN0YW5jZSggbGF5b3V0LCBhcmVhTmFtZSApIHtcbiAgICAgIHZlcnRpY2VzWyBsYXlvdXQuaWQgXSA9IHtcbiAgICAgICAgIGlkOiBsYXlvdXQuaWQsXG4gICAgICAgICBraW5kOiAnTEFZT1VUJyxcbiAgICAgICAgIGxhYmVsOiBsYXlvdXQuaWQsXG4gICAgICAgICBwb3J0czogeyBpbmJvdW5kOiBbXSwgb3V0Ym91bmQ6IFtdIH1cbiAgICAgIH07XG4gICB9XG5cbiAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgIGZ1bmN0aW9uIHByb2Nlc3NXaWRnZXRJbnN0YW5jZSggd2lkZ2V0LCBhcmVhTmFtZSApIHtcbiAgICAgIGNvbnN0IGRlc2NyaXB0b3IgPSB3aWRnZXREZXNjcmlwdG9yc1sgd2lkZ2V0LndpZGdldCBdO1xuICAgICAgY29uc3QgcG9ydHMgPSB7IGluYm91bmQ6IFtdLCBvdXRib3VuZDogW10gfTtcblxuICAgICAgY29uc3Qga2luZHMgPSB7XG4gICAgICAgICB3aWRnZXQ6ICdXSURHRVQnLFxuICAgICAgICAgYWN0aXZpdHk6ICdBQ1RJVklUWSdcbiAgICAgIH07XG5cbiAgICAgIGlkZW50aWZ5UG9ydHMoIHdpZGdldC5mZWF0dXJlcywgZGVzY3JpcHRvci5mZWF0dXJlcywgW10gKTtcbiAgICAgIHZlcnRpY2VzWyB3aWRnZXQuaWQgXSA9IHtcbiAgICAgICAgIGlkOiB3aWRnZXQuaWQsXG4gICAgICAgICBraW5kOiBraW5kc1sgZGVzY3JpcHRvci5pbnRlZ3JhdGlvbi50eXBlIF0sXG4gICAgICAgICBsYWJlbDogd2lkZ2V0LmlkLFxuICAgICAgICAgcG9ydHM6IHBvcnRzXG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiBpZGVudGlmeVBvcnRzKCB2YWx1ZSwgc2NoZW1hLCBwYXRoICkge1xuICAgICAgICAgaWYoICF2YWx1ZSB8fCAhc2NoZW1hICkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgfVxuXG4gICAgICAgICBpZiggdmFsdWUuZW5hYmxlZCA9PT0gZmFsc2UgKSB7XG4gICAgICAgICAgICAvLyB3aWRnZXQgZmVhdHVyZSBjYW4gYmUgZGlzYWJsZWQsIGFuZCB3YXMgZGlzYWJsZWRcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgIH1cblxuICAgICAgICAgaWYoIHNjaGVtYS50eXBlID09PSAnc3RyaW5nJyAmJiBzY2hlbWEuYXhSb2xlICYmXG4gICAgICAgICAgICAgKCBzY2hlbWEuZm9ybWF0ID09PSAndG9waWMnIHx8IHNjaGVtYS5mb3JtYXQgPT09ICdmbGFnLXRvcGljJyApICkge1xuICAgICAgICAgICAgY29uc3QgdHlwZSA9IHNjaGVtYS5heFBhdHRlcm4gPyBzY2hlbWEuYXhQYXR0ZXJuLnRvVXBwZXJDYXNlKCkgOiBpbmZlckVkZ2VUeXBlKCBwYXRoICk7XG4gICAgICAgICAgICBpZiggIXR5cGUgKSB7IHJldHVybjsgfVxuICAgICAgICAgICAgY29uc3QgZWRnZUlkID0gdHlwZSArICc6JyArIHZhbHVlO1xuICAgICAgICAgICAgY29uc3QgbGFiZWwgPSBwYXRoLmpvaW4oICcuJyApO1xuICAgICAgICAgICAgY29uc3QgaWQgPSAgcGF0aC5qb2luKCAnOicgKTtcbiAgICAgICAgICAgIHBvcnRzWyBzY2hlbWEuYXhSb2xlID09PSAnb3V0bGV0JyA/ICdvdXRib3VuZCcgOiAnaW5ib3VuZCcgXS5wdXNoKCB7XG4gICAgICAgICAgICAgICBsYWJlbCwgaWQsIHR5cGUsIGVkZ2VJZFxuICAgICAgICAgICAgfSApO1xuICAgICAgICAgICAgaWYoIGVkZ2VJZCAmJiAhZWRnZXNbIGVkZ2VJZCBdICkge1xuICAgICAgICAgICAgICAgZWRnZXNbIGVkZ2VJZCBdID0geyB0eXBlLCBpZDogZWRnZUlkLCBsYWJlbDogdmFsdWUgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH1cblxuICAgICAgICAgaWYoIHNjaGVtYS50eXBlID09PSAnb2JqZWN0JyAmJiBzY2hlbWEucHJvcGVydGllcyApIHtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKCBzY2hlbWEucHJvcGVydGllcyApLmZvckVhY2goIGtleSA9PiB7XG4gICAgICAgICAgICAgICBjb25zdCBwcm9wZXJ0eVNjaGVtYSA9IHNjaGVtYS5wcm9wZXJ0aWVzWyBrZXkgXSB8fCBzY2hlbWEuYWRkaXRpb25hbFByb3BlcnRpZXM7XG4gICAgICAgICAgICAgICBpZGVudGlmeVBvcnRzKCB2YWx1ZVsga2V5IF0sIHByb3BlcnR5U2NoZW1hLCBwYXRoLmNvbmNhdCggWyBrZXkgXSApICk7XG4gICAgICAgICAgICB9ICk7XG4gICAgICAgICB9XG5cbiAgICAgICAgIGlmKCBzY2hlbWEudHlwZSA9PT0gJ2FycmF5JyApIHtcbiAgICAgICAgICAgIHZhbHVlLmZvckVhY2goIChpdGVtLCBpKSA9PiB7XG4gICAgICAgICAgICAgICBpZGVudGlmeVBvcnRzKCBpdGVtLCBzY2hlbWEuaXRlbXMsIHBhdGguY29uY2F0KCBbIGkgXSApICk7XG4gICAgICAgICAgICB9ICk7XG4gICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGluZmVyRWRnZVR5cGUoIHBhdGggKSB7XG4gICAgICAgICBpZiggIXBhdGgubGVuZ3RoICkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICB9XG4gICAgICAgICBjb25zdCBsYXN0U2VnbWVudCA9IHBhdGhbIHBhdGgubGVuZ3RoIC0gMSBdO1xuICAgICAgICAgaWYoIFsgJ2FjdGlvbicsICdmbGFnJywgJ3Jlc291cmNlJyBdLmluZGV4T2YoIGxhc3RTZWdtZW50ICkgIT09IC0xICkge1xuICAgICAgICAgICAgcmV0dXJuIGxhc3RTZWdtZW50LnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICB9XG4gICAgICAgICBpZiggbGFzdFNlZ21lbnQgPT09ICdvbkFjdGlvbnMnICkge1xuICAgICAgICAgICAgcmV0dXJuICdBQ1RJT04nO1xuICAgICAgICAgfVxuICAgICAgICAgcmV0dXJuIGluZmVyRWRnZVR5cGUoIHBhdGguc2xpY2UoIDAsIHBhdGgubGVuZ3RoIC0gMSApICk7XG4gICAgICB9XG4gICB9XG5cbiAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgIGZ1bmN0aW9uIHBydW5lSXJyZWxldmFudFdpZGdldHMoIHdpdGhDb250YWluZXJzICkge1xuICAgICAgbGV0IHRvUHJ1bmUgPSBbXTtcbiAgICAgIGRvIHtcbiAgICAgICAgIHRvUHJ1bmUuZm9yRWFjaCggaWQgPT4geyBkZWxldGUgdmVydGljZXNbIGlkIF07IH0gKTtcbiAgICAgICAgIHBydW5lRW1wdHlFZGdlcygpO1xuICAgICAgICAgdG9QcnVuZSA9IG1hcmsoKTtcbiAgICAgIH0gd2hpbGUoIHRvUHJ1bmUubGVuZ3RoICk7XG5cbiAgICAgIGZ1bmN0aW9uIG1hcmsoKSB7XG4gICAgICAgICBjb25zdCBwcnVuZUxpc3QgPSBbXTtcbiAgICAgICAgIE9iamVjdC5rZXlzKCB2ZXJ0aWNlcyApLmZvckVhY2goIHZJZCA9PiB7XG4gICAgICAgICAgICBjb25zdCBwb3J0cyA9IHZlcnRpY2VzWyB2SWQgXS5wb3J0cztcbiAgICAgICAgICAgIGlmKCBwb3J0cy5pbmJvdW5kLmxlbmd0aCA8PSB3aXRoQ29udGFpbmVycyA/IDEgOiAwICkge1xuICAgICAgICAgICAgICAgaWYoIHBvcnRzLm91dGJvdW5kLmV2ZXJ5KCBfID0+ICFfLmVkZ2VJZCApICkge1xuICAgICAgICAgICAgICAgICAgcHJ1bmVMaXN0LnB1c2goIHZJZCAgKTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgIH0gKTtcbiAgICAgICAgIHJldHVybiBwcnVuZUxpc3Q7XG4gICAgICB9XG4gICB9XG5cbiAgIGZ1bmN0aW9uIHBydW5lRW1wdHlFZGdlcygpIHtcbiAgICAgIGNvbnN0IHRvUHJ1bmUgPSBbXTtcbiAgICAgIE9iamVjdC5rZXlzKCBlZGdlcyApLmZvckVhY2goIGVkZ2VJZCA9PiB7XG4gICAgICAgICBjb25zdCB0eXBlID0gZWRnZVR5cGVzWyBlZGdlc1sgZWRnZUlkIF0udHlwZSBdO1xuICAgICAgICAgY29uc3Qgc291cmNlcyA9IE9iamVjdC5rZXlzKCB2ZXJ0aWNlcyApLmZpbHRlciggaXNTb3VyY2VPZiggZWRnZUlkICkgKTtcbiAgICAgICAgIGNvbnN0IHNpbmtzID0gT2JqZWN0LmtleXMoIHZlcnRpY2VzICkuZmlsdGVyKCBpc1NpbmtPZiggZWRnZUlkICkgKTtcbiAgICAgICAgIGNvbnN0IGhhc1NvdXJjZXMgPSBzb3VyY2VzLmxlbmd0aCA+IDA7XG4gICAgICAgICBjb25zdCBoYXNTaW5rcyA9IHNpbmtzLmxlbmd0aCA+IDA7XG4gICAgICAgICBjb25zdCBpc0VtcHR5ID0gdHlwZS5vd25pbmdQb3J0ID8gKCFoYXNTb3VyY2VzIHx8ICFoYXNTaW5rcykgOiAoIWhhc1NvdXJjZXMgJiYgIWhhc1NpbmtzKTtcbiAgICAgICAgIGlmKCAhaXNFbXB0eSApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgIH1cblxuICAgICAgICAgdG9QcnVuZS5wdXNoKCBlZGdlSWQgKTtcbiAgICAgICAgIHNvdXJjZXMuY29uY2F0KCBzaW5rcyApLmZvckVhY2goIHZlcnRleElkID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBvcnRzID0gdmVydGljZXNbIHZlcnRleElkIF0ucG9ydHM7XG4gICAgICAgICAgICBwb3J0cy5pbmJvdW5kLmNvbmNhdCggcG9ydHMub3V0Ym91bmQgKS5mb3JFYWNoKCBwb3J0ID0+IHtcbiAgICAgICAgICAgICAgIHBvcnQuZWRnZUlkID0gcG9ydC5lZGdlSWQgPT09IGVkZ2VJZCA/IG51bGwgOiBwb3J0LmVkZ2VJZDtcbiAgICAgICAgICAgIH0gKTtcbiAgICAgICAgIH0gKTtcbiAgICAgIH0gKTtcbiAgICAgIHRvUHJ1bmUuZm9yRWFjaCggaWQgPT4geyBkZWxldGUgZWRnZXNbIGlkIF07IH0gKTtcblxuICAgICAgZnVuY3Rpb24gaXNTb3VyY2VPZiggZWRnZUlkICkge1xuICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCB2ZXJ0ZXhJZCApIHtcbiAgICAgICAgICAgIHJldHVybiB2ZXJ0aWNlc1sgdmVydGV4SWQgXS5wb3J0cy5pbmJvdW5kLnNvbWUoIHBvcnQgPT4gcG9ydC5lZGdlSWQgPT09IGVkZ2VJZCApO1xuICAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gaXNTaW5rT2YoIGVkZ2VJZCApIHtcbiAgICAgICAgIHJldHVybiBmdW5jdGlvbiggdmVydGV4SWQgKSB7XG4gICAgICAgICAgICByZXR1cm4gdmVydGljZXNbIHZlcnRleElkIF0ucG9ydHMub3V0Ym91bmQuc29tZSggcG9ydCA9PiBwb3J0LmVkZ2VJZCA9PT0gZWRnZUlkICk7XG4gICAgICAgICB9O1xuICAgICAgfVxuICAgfVxuXG4gICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4gICBmdW5jdGlvbiBpZGVudGlmeUNvbnRhaW5lcnMoKSB7XG4gICAgICBjb25zdCB0eXBlID0gVFlQRV9DT05UQUlORVI7XG5cbiAgICAgIHZlcnRpY2VzWyBQQUdFX0lEIF0gPSAge1xuICAgICAgICAgUEFHRV9JRCxcbiAgICAgICAgIGxhYmVsOiAnUGFnZSAnICsgcGFnZVJlZmVyZW5jZSxcbiAgICAgICAgIGtpbmQ6ICdQQUdFJyxcbiAgICAgICAgIHBvcnRzOiB7IGluYm91bmQ6IFtdLCBvdXRib3VuZDogW10gfVxuICAgICAgfTtcblxuICAgICAgT2JqZWN0LmtleXMoIHBhZ2UuYXJlYXMgKS5mb3JFYWNoKCBhcmVhTmFtZSA9PiB7XG4gICAgICAgICBpbnNlcnRFZGdlKCBhcmVhTmFtZSApO1xuICAgICAgICAgY29uc3Qgb3duZXIgPSBmaW5kT3duZXIoIGFyZWFOYW1lICk7XG4gICAgICAgICBpZiggIW93bmVyICkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgfVxuXG4gICAgICAgICBsZXQgY29udGFpbnNBbnl0aGluZyA9IGZhbHNlO1xuICAgICAgICAgcGFnZS5hcmVhc1sgYXJlYU5hbWUgXS5maWx0ZXIoIGVpdGhlciggaXNXaWRnZXQsIGlzTGF5b3V0ICkgKS5mb3JFYWNoKCBpdGVtID0+IHtcbiAgICAgICAgICAgIGlmKCB2ZXJ0aWNlc1sgaXRlbS5pZCBdICkge1xuICAgICAgICAgICAgICAgaW5zZXJ0VXBsaW5rKCB2ZXJ0aWNlc1sgaXRlbS5pZCBdLCBhcmVhTmFtZSApO1xuICAgICAgICAgICAgICAgY29udGFpbnNBbnl0aGluZyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICB9ICk7XG4gICAgICAgICBpZiggY29udGFpbnNBbnl0aGluZyApIHtcbiAgICAgICAgICAgIGluc2VydE93bmVyUG9ydCggb3duZXIsIGFyZWFOYW1lICk7XG4gICAgICAgICB9XG4gICAgICB9ICk7XG5cbiAgICAgIGZ1bmN0aW9uIGZpbmRPd25lciggYXJlYU5hbWUgKSB7XG4gICAgICAgICBpZiggYXJlYU5hbWUuaW5kZXhPZiggJy4nICkgPT09IC0xICkge1xuICAgICAgICAgICAgcmV0dXJuIHZlcnRpY2VzWyBQQUdFX0lEIF07XG4gICAgICAgICB9XG4gICAgICAgICBjb25zdCBwcmVmaXggPSBhcmVhTmFtZS5zbGljZSggMCwgYXJlYU5hbWUubGFzdEluZGV4T2YoICcuJyApICk7XG4gICAgICAgICByZXR1cm4gdmVydGljZXNbIHByZWZpeCBdO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBpbnNlcnRPd25lclBvcnQoIHZlcnRleCwgYXJlYU5hbWUgKSB7XG4gICAgICAgICB2ZXJ0ZXgucG9ydHMub3V0Ym91bmQudW5zaGlmdCgge1xuICAgICAgICAgICAgaWQ6ICdDT05UQUlORVI6JyArIGFyZWFOYW1lLFxuICAgICAgICAgICAgdHlwZTogVFlQRV9DT05UQUlORVIsXG4gICAgICAgICAgICBlZGdlSWQ6IGFyZWFFZGdlSWQoIGFyZWFOYW1lICksXG4gICAgICAgICAgICBsYWJlbDogYXJlYU5hbWVcbiAgICAgICAgIH0gKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gaW5zZXJ0VXBsaW5rKCB2ZXJ0ZXgsIGFyZWFOYW1lICkge1xuICAgICAgICAgdmVydGV4LnBvcnRzLmluYm91bmQudW5zaGlmdCgge1xuICAgICAgICAgICAgaWQ6ICdDT05UQUlORVI6YW5jaG9yJyxcbiAgICAgICAgICAgIHR5cGU6IFRZUEVfQ09OVEFJTkVSLFxuICAgICAgICAgICAgZWRnZUlkOiBhcmVhRWRnZUlkKCBhcmVhTmFtZSApLFxuICAgICAgICAgICAgbGFiZWw6ICdhbmNob3InXG4gICAgICAgICB9ICk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGluc2VydEVkZ2UoIGFyZWFOYW1lICkge1xuICAgICAgICAgY29uc3QgaWQgPSBhcmVhRWRnZUlkKCBhcmVhTmFtZSApO1xuICAgICAgICAgZWRnZXNbIGlkIF0gPSB7IGlkLCB0eXBlLCBsYWJlbDogYXJlYU5hbWUgfTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gYXJlYUVkZ2VJZCggYXJlYU5hbWUgKSB7XG4gICAgICAgICByZXR1cm4gVFlQRV9DT05UQUlORVIgKyAnOicgKyBhcmVhTmFtZTtcbiAgICAgIH1cbiAgIH1cblxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZnVuY3Rpb24gbGF5b3V0KCBncmFwaCApIHtcbiAgIHJldHVybiBsYXlvdXRNb2RlbC5jb252ZXJ0LmxheW91dCgge1xuICAgICAgdmVydGljZXM6IHt9LFxuICAgICAgZWRnZXM6IHt9XG4gICB9ICk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBmdW5jdGlvbiB0eXBlcygpIHtcbiAgIHJldHVybiBncmFwaE1vZGVsLmNvbnZlcnQudHlwZXMoIGVkZ2VUeXBlcyApO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyRnJvbVNlbGVjdGlvbiggc2VsZWN0aW9uLCBncmFwaE1vZGVsICkge1xuICAgY29uc3QgdG9waWNzID0gc2VsZWN0aW9uLmVkZ2VzLmZsYXRNYXAoIGVkZ2VJZCA9PiB7XG4gICAgICBjb25zdCBbIHR5cGUsIHRvcGljIF0gPSBlZGdlSWQuc3BsaXQoICc6JyApO1xuICAgICAgcmV0dXJuICggdHlwZSA9PT0gJ0NPTlRBSU5FUicgKSA/IFtdIDogW3sgcGF0dGVybjogdHlwZSwgdG9waWMgfV07XG4gICB9ICkudG9KUygpO1xuXG4gICBjb25zdCBwYXJ0aWNpcGFudHMgPSBzZWxlY3Rpb24udmVydGljZXMuZmxhdE1hcCggdmVydGV4SWQgPT4ge1xuICAgICAgY29uc3QgeyBpZCwga2luZCB9ID0gZ3JhcGhNb2RlbC52ZXJ0aWNlcy5nZXQoIHZlcnRleElkICk7XG4gICAgICByZXR1cm4gKCBraW5kID09PSAnUEFHRScgfHwga2luZCA9PT0gJ0xBWU9VVCcgKSA/IFtdIDogW3sga2luZCwgcGFydGljaXBhbnQ6IHZlcnRleElkIH1dO1xuICAgfSApO1xuXG4gICByZXR1cm4ge1xuICAgICAgdG9waWNzLFxuICAgICAgcGFydGljaXBhbnRzXG4gICB9O1xufVxuIl19