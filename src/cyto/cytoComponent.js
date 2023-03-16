import React, { useEffect, useRef, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';



function updateNodeOpacity(cy, zoomLevel) {
    console.log('updateNodeOpacity', arguments);
    /*
    - User Zooms in
    - Nodes at depth 1 start to disappear
    - Nodes at depth 2 start to appear
        - Size of nodes is inversely proportional to depth
    */

    const depth1Nodes = cy.nodes().filter((node) => node.data('depth') === 1);
    const depth2Nodes = cy.nodes().filter((node) => node.data('depth') === 2);
    const depth3Nodes = cy.nodes().filter((node) => node.data('depth') === 3);

    if (zoomLevel > 1.5) {
        depth1Nodes.style('opacity', 0);
        depth2Nodes.style('opacity', 1);
        depth3Nodes.style('opacity', 0);
    } else if (zoomLevel > 1) {
        depth1Nodes.style('opacity', 1);
        depth2Nodes.style('opacity', 0);
        depth3Nodes.style('opacity', 0);
    } else {
        depth1Nodes.style('opacity', 1);
        depth2Nodes.style('opacity', 0);
        depth3Nodes.style('opacity', 0);
    }
}

// debouce function 
function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};


function CytoComponent() {
    const cyRef = useRef(null);

    const initialElements = [
        { data: { id: 'node1', label: 'Node 1', depth: 1} },
        { data: { id: 'node2', label: 'Node 2', depth: 1} },
        { data: { id: 'node3', label: 'Node 3', depth: 2} },
        { data: { id: 'node4', label: 'Node ', depth: 3} },
        { data: { id: 'edge1', source: 'node1', target: 'node2' } },
        { data: { id: 'edge2', source: 'node1', target: 'node3' } },
        { data: { id: 'edge3', source: 'node4', target: 'node3' } },
    ];

    const [elements, setElements] = useState(initialElements);

    const layout = {
        name: 'breadthfirst',
    };

    const style = [
        {
            selector: 'node',
            style: {
                'background-color': '#0074D9',
                'label': 'data(label)',
                'color': '#fff',
            },
        },
        {
            selector: 'edge',
            style: {
                'width': 3,
                'line-color': '#7FDBFF',
                'target-arrow-color': '#7FDBFF',
                'target-arrow-shape': 'triangle',
            },
        },
    ];

    function zoomHandler(event) {
        console.log('zoomHandler', arguments);
        const cy = event.cy;
        const zoomLevel = cy.zoom();
        debounce(updateNodeOpacity(cy, zoomLevel), 1000);
    }

    useEffect(() => {
        if (cyRef.current) {
            cyRef.current.on('zoom', zoomHandler);
            // cyRef.current.on('zoom', (event) => {
            //     const cy = event.cy;
            //     const zoomLevel = cy.zoom();
            //     if (zoomLevel > 1.5) {
            //         const newNodeId = 'node' + (elements.length + 1);
            //         const newEdgeId = 'edge' + (elements.length + 1);
            //         const newElements = [
            //             ...elements,
            //             { data: { id: newNodeId, label: `Node ${elements.length + 1}` } },
            //             { data: { id: newEdgeId, source: 'node1', target: newNodeId } },
            //         ];
            //         setElements(newElements);
            //     }
            // });
        }
    }, [elements, cyRef]);

    useEffect(() => {
        if (cyRef.current) {
            cyRef.current.on('tap', 'node', (evt) => {
                const node = evt.target;
                alert(`Tapped on node with ID: ${node.id()}`);
            });
        }
    }, [cyRef]);

    return (
        <CytoscapeComponent
            elements={elements}
            layout={layout}
            stylesheet={style}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            cy={(cy) => {
                cyRef.current = cy;
            }}
        />
    );
}

export default CytoComponent;