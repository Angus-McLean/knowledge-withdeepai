import React, { useEffect, useRef, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

import dagre from 'cytoscape-dagre';
import Cytoscape from 'cytoscape';
import debounce from 'lodash.debounce';
import cola from 'cytoscape-cola';

import DataLoader from '../utils/DataLoader';
import { throttle } from 'lodash';

const _ = require("lodash");
window._ = _;

Cytoscape.use( cola )

var SCALE = 10

// let dataPath = '/knowledge-tree/topic=electrocardiography.json'
// const dataPath = '/knowledge-tree/all-knowledge.json'
// const dataPath = '/knowledge-tree/all-knowledge-nest.json'
const dataPath = '/knowledge_atlas/All Knowledge/data.json'

const layout = {
    name: 'cola',
    // infinite: true,
    animate: true,
    randomize: true,
    convergenceThreshold: 0.00001,
    avoidOverlap: false,
    nodeSpacing: SCALE * 100,
    nodeRepulsion: 1,
    edgeElasticity: 1e9,
    maxSimulationTime: 10000,
    nestingFactor: 5,
    // idealEdgeLength: 6000,
    // idealEdgeLength: function( edge ){ return 60000 / (2 ** (avgValue('depth', edge)))},
    // idealEdgeLength: function( edge ){ return 60000 / (2 ** (avgValue('depth', edge)))},
    edgeLength: function( edge ){ return SCALE * 500 / (2 ** (avgValue('depth', edge)))},
    centerGraph: true,
    fit: false,
};
window.layout = layout;

function avgValue(prop, edge) {
    // const sourceSize = ;
    const targetSize = edge.target().data(prop);
    const edgeWidth = edge.target() ? edge.target().data(prop) : edge.source().data(prop);
    return edgeWidth;
}

function calcOpacity(depth, zoom) {
    // const zoomRoot = Math.log2(zoom) + 1;
    const zoomRoot = Math.sqrt(zoom) + 2
    const zoomDiff = Math.abs(zoomRoot - depth);
    // console.log(zoomDiff)
    const opacity = Math.min(1 / zoomDiff, 1);
    return opacity === null ? 0 : opacity;
}
window.calcOpacity = calcOpacity;

const style = [
    {
        selector: 'node',
        style: {
            'background-color': '#0074D9',
            'label': 'data(label)',
            'color': '#fff',
            'width': ele => SCALE * 150 / (2 ** (ele.data('depth'))),
            'height': ele => SCALE * 150 / (2 ** (ele.data('depth'))),
            'opacity': ele => ele.data('op') || 0,
            'text-opacity': ele => ele.data('op') || 0,
            'font-size': ele => SCALE * 50 / (2 ** (ele.data('depth'))),
        },
    },
    {
        selector: 'edge',
        style: {
            'line-color': '#7FDBFF',
            'target-arrow-color': '#7FDBFF',
            'target-arrow-shape': 'triangle',
            'opacity': ele => avgValue('op', ele),
            'width': ele => {return 10 / (2 ** (avgValue('depth', ele)))},
        },
    },

    {
        selector: '.multi-line-label',
        style: {
            'text-wrap': 'wrap',
            'text-max-width': '100px',
            // 'text-valign': 'center',
            'text-halign': 'center',
        },
    }
];

function updateNodeOpacity(cy, zoomLevel) {
    // console.log('zoomLevel', zoomLevel);

    cy.nodes().forEach(node =>{
        const opacity = calcOpacity(node.data('depth'), zoomLevel);
        node.data('op', opacity);
    })
}
window.updateNodeOpacity = updateNodeOpacity;

function updateNodeClasses(cy) {
    cy.nodes().forEach(node =>{
        node.addClass('multi-line-label');
    })
}
window.updateNodeClasses = updateNodeClasses;

function CytoComponent() {
    const cyRef = useRef(null);
    window.cyRef = cyRef;
    window.cyRef.fetch_and_update = fetch_and_update;
    console.log('CytoComponent', cyRef);

    const arrNodes = [
        // { data: { id: 'node1', label: 'Node 1', depth: 1 } },
        // { data: { id: 'node2', label: 'Node 2', depth: 1 } },
        // { data: { id: 'node3', label: 'Node 3', depth: 2 } },
    ]
    const arrEdges = [
        // { data: { id: 'edge1', source: 'node1', target: 'node2' } },
        // { data: { id: 'edge2', source: 'node1', target: 'node3' } },
    ]
    const initialElements = [...arrNodes, ...arrEdges];

    const [elements, setElements] = useState(initialElements);

    useEffect(() => {
        const data = new DataLoader()
        window.Data = data;
        data.getData(dataPath).then((resp) => {
            console.log(`data.getData(${dataPath})`, resp)
            cyRef.data = resp;
            const cytoData = data.getCytoData(resp, 2);
            
            setElements(cytoData);
            if (cyRef.current) { 
                
                updateNodeOpacity(cyRef.current, 1);
                updateNodeClasses(cyRef.current);

                cyRef.current.layout(layout).run() 
            }
        });
    }, []);

    function zoomHandler(event) {
        // console.log('zoomHandler', arguments);
        const cy = event.cy;
        const zoomLevel = cy.zoom();
        updateNodeOpacity(cy, zoomLevel);
        // fetch additional nodes if needed

    }

    function nodesInViewPort(cy) {
        const ext = cy.extent()
        const nodesInView = cy.nodes().filter(n => {
            const bb = n.boundingBox()
            return bb.x1 > ext.x1 && bb.x2 < ext.x2 && bb.y1 > ext.y1 && bb.y2 < ext.y2
        })
        return nodesInView
    }

    // zoom handler
    useEffect(() => {
        if (cyRef.current) {
            console.log('useEffect', arguments);
            // const debouncedZoomHandler = debounce(zoomHandler, 100, { leading: true, trailing: true });
            const debouncedZoomHandler = throttle(zoomHandler, 100, { leading: true, trailing: true });
            cyRef.current.on('zoom', debouncedZoomHandler);
        }
    }, []);

    // click handler
    useEffect(() => {
        if (cyRef.current) {
            cyRef.current.on('tap', 'node', (evt) => {
                const node = evt.target;
                alert(`Tapped on node with ID: ${node.id()}`);
            });
        }
    }, []);

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


function fetchAndAddNodes(cy, topic_url='/knowledge_atlas/All Knowledge/Social Sciences/Psychology/Industrial-Organizational Psychology/data.json') {
    var Data = window.Data
    var cy = window.cyRef.current
    
    Data.getData(topic_url).then(res => {
        cy.add(Data.getCytoData(res, 5));
        updateNodeOpacity(cy, 1);
        updateNodeClasses(cy);
        cy.layout(layout).run();
        return res
    })
    
    
    // Data.getData(topic_url).then(res => {
    //     console.log('fetchAndAddNodes', res)
    //     cy.nodes().forEach(node => node.lock());
        
    //     cy.add(Data.getCytoData(res, 5));
    //     updateNodeOpacity(cy, 1);
    //     updateNodeClasses(cy);
    //     cy.layout(layout).run();
        
    //     cy.nodes().forEach(node => node.unlock());
    // })
}
window.fetchAndAddNodes = fetchAndAddNodes;


/*
// HOW TO FETCH NEXT TOPICS
const getMembers = (member)=>{
  if(!member.subtopics || !member.subtopics.length){
    return member;
  }
  return [member, _.flatMapDeep(member.subtopics, getMembers)];
}

var unnest = _.flatMapDeep(cyRef.data, getMembers).filter(a => a.subtopics_path && !a.subtopics)

// let parentTopic = unnest[0]
var proms = unnest.map(parentTopic => {
    return Data.getData("/knowledge-tree/" + parentTopic.subtopics_path).then(res => {
        if(res[0].topic == parentTopic.topic) {
            return res[0].subtopics
        } else { return res }
    }).then(s => parentTopic.subtopics = s)    
})
// var proms = Data.getData("/knowledge-tree/" + unnest[0].subtopics_path).then(res => {
//     if(res[0].topic == parentTopic.topic) {
//         return res[0].subtopics
//     } else { return res }
// }).then(s => parentTopic.subtopics = s)
Promise.all(proms).then(() => {
    

    cyRef.current.elements().remove();
    cyRef.current.add(Data.getCytoData(cyRef.data, 2));
    updateNodeOpacity(cyRef.current, 1);
    updateNodeClasses(cyRef.current);
    cyRef.current.layout(layout).run();
})
*/


function fetch_subtopics(subTopic) {
    const Data = window.Data;
    // const cyRef = window.cyRef;
    if (subTopic.subtopics_path) {
        console.log('subTopic', subTopic);
        // return Promise.resolve(subTopic);
        const prom = Data.getData(
            "/knowledge-tree/"+subTopic.subtopics_path
        ).then((subTopicData) => {
            if (Array.isArray(subTopicData) && subTopicData.length === 1) {
                subTopic.subtopics = subTopicData[0].subtopics;
            } else if (Array.isArray(subTopicData) && subTopicData.length > 1) {
                subTopic.subtopics = subTopicData;
            } else {
                subTopic.subtopics = subTopicData.subtopics;
            }
            // subTopic.subtopics = (Array.isArray(subTopic) && subTopic.length == 1) ?  subTopicData[0].subtopics : subTopicData;
        });
        return prom;
    }
    return Promise.resolve([]);
}

function fetch_and_update_new() {
    fetch_subtopics(window.cyRef.data).then((resp) => {
        const Data = window.Data;
        const cyRef = window.cyRef;
        const cytoData = Data.getCytoData(cyRef.data, 2);
        console.log('cytoData', cytoData);
        window.cyRef.current.elements().remove();
        window.cyRef.current.add(cytoData);
        updateNodeOpacity(window.cyRef.current, 1);
        updateNodeClasses(window.cyRef.current);
        window.cyRef.current.layout(layout).run();
    })
}

function fetch_and_update() {
    const Data = window.Data;
    const cyRef = window.cyRef;
    const subTopics = Data.getSubTopics(cyRef.data);
    // // debugger
    // // // for subTopics if subtopics_path, fetch subtopics with getData, update subtopics accordingly
    const allProms = subTopics.map((subTopic, i) => {
        if (subTopic.subtopics_path) {
            console.log('subTopic', subTopic);
            // return Promise.resolve(subTopic);
            const prom = Data.getData(
                "/knowledge-tree/"+subTopic.subtopics_path
            ).then((subTopicData) => {
                if (Array.isArray(subTopicData) && subTopicData.length === 1) {
                    subTopic.subtopics = subTopicData[0].subtopics;
                } else if (Array.isArray(subTopicData) && subTopicData.length > 1) {
                    subTopic.subtopics = subTopicData;
                } else {
                    subTopic.subtopics = subTopicData.subtopics;
                }
                // subTopic.subtopics = (Array.isArray(subTopic) && subTopic.length == 1) ?  subTopicData[0].subtopics : subTopicData;
            });
            return prom;
        }
    });
    Promise.all(allProms).then(() => {
        const cytoData = Data.getCytoData(cyRef.data, 2);
        cyRef.current.elements().remove();
        cyRef.current.add(cytoData);
        updateNodeOpacity(cyRef.current, 1);
        updateNodeClasses(cyRef.current);
        cyRef.current.layout(layout).run();
    });

}


export default CytoComponent;