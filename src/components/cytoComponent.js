import React, { useEffect, useRef, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

import dagre from 'cytoscape-dagre';
import Cytoscape from 'cytoscape';
import debounce from 'lodash.debounce';
import cola from 'cytoscape-cola';

import DataLoader from '../utils/DataLoader';
import { throttle } from 'lodash';
import popper from 'cytoscape-popper';

import tippy from 'tippy.js';
window.tippy = tippy;

const _ = require("lodash");
window._ = _;

Cytoscape.use( cola )
Cytoscape.use( popper );

var SCALE = 100
var maxSimulationTime = 10000
window.RUNNING = false

// let dataPath = '/knowledge-tree/topic=electrocardiography.json'
// const dataPath = '/knowledge-tree/all-knowledge.json'
// const dataPath = '/knowledge-tree/all-knowledge-nest.json'
const rootPath = '/knowledge_atlas/'
const dataPath = rootPath + 'All Knowledge/data.json'

const layout = {
    name: 'cola',
    // infinite: true,
    animate: true,
    randomize: false,
    convergenceThreshold: 0.00001,
    avoidOverlap: false,
    nodeSpacing: SCALE * 100,
    nodeRepulsion: 0.5,
    // nodeRepulsion: function( node ){ return SCALE / (10 * 1.8 ** (node.data('depth')))},
    // edgeElasticity: 1e12,
    maxSimulationTime: maxSimulationTime,
    nestingFactor: 0.001,
    // idealEdgeLength: 6000,
    // idealEdgeLength: function( edge ){ return 60000 / (2 ** (avgValue('depth', edge)))},
    // idealEdgeLength: function( edge ){ return 60000 / (2 ** (avgValue('depth', edge)))},
    edgeLength: function( edge ){ return SCALE * 300 / (1.8 ** (avgValue('depth', edge)))},
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
    const zoomRoot = Math.sqrt(zoom) + 1
    const zoomDiff = Math.abs(zoomRoot - depth) 
    // console.log(zoomDiff)
    // const opacity = (0.5/zoomDiff + zoom/1.1)/1.2;
    const opacity = (0.5/zoomDiff + zoomRoot/1.1)/2.2;
    return opacity === null ? 0.61 : Math.max(Math.min(opacity, 1), 0);
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
            'opacity': ele => ele.data('op') || 0.61,
            'text-opacity': ele => ele.data('op') || 0.61,
            'font-size': ele => SCALE * 40 / (2 ** (ele.data('depth'))),
        },
    },
    {
        selector: 'edge',
        style: {
            'line-color': '#7FDBFF',
            'target-arrow-color': '#7FDBFF',
            'target-arrow-shape': 'triangle',
            'opacity': ele => avgValue('op', ele),
            'width': ele => {return SCALE * 1 / (2 ** (avgValue('depth', ele)))},
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
    // console.log('CytoComponent', cyRef);

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
            const cytoData = data.getCytoData(resp, 1);
            
            setElements(cytoData);
            if (cyRef.current) { 
                
                cyRef.current.zoom(0.03)
                cyRef.current.center()
                updateNodeOpacity(cyRef.current, 0.03);
                updateNodeClasses(cyRef.current);

                if (cyRef.current.nodes().length == 0) {
                    setTimeout(() => {
                        console.log('STARTING LAYOUT', layout);
                        cyRef.current.layout(layout).run()
                    }, 1000);
                } else {
                    cyRef.current.layout(layout).run()
                    // cyRef.current.zoom(40)
                }
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
            
            // 
            const debouncedZoomHandler = throttle(zoomHandler, 100, { leading: true, trailing: true });
            cyRef.current.on('zoom', debouncedZoomHandler);
            
            // 
            function conditionallyFetchTopis(event) {
                if (window.RUNNING) { return; }
                const cy = event.cy;
                // debugger;
                const nodesInView = nodesInViewPort(cy);
                var nodesToFetch = nodesInView.filter(n => !n.data('fetched'));
                
                if (nodesToFetch.length > 0 && nodesToFetch.length < 10) {
                    nodesToFetch = nodesToFetch.slice(0, 4)
                    // const leaf_topics = window.Data.getSubTopics(cyRef.data).filter(a => a.subtopics?.length == 0).map(a=> a.topic)
                    // nodesToFetch = nodesToFetch.filter(node => leaf_topics.includes(node.data('id')));
                    console.log('nodesToFetch', nodesToFetch.map(node => node.data('id')));
                    var fetchProms = nodesToFetch.map(node => {
                        node.data('fetched', true);
                        return fetchSubTopics(node).then(resp => {
                            console.log('Fetched SubTopics', node, resp)
                            return [node, resp]})
                    })
                    Promise.all(fetchProms).then((resp) => {
                        // debugger
                        const parents = resp.map(a => a[0])
                        const children = resp.flatMap(a => a[1])
                        const parentIds = parents.map(p=>p.id())
                        const childrenOnly = children.filter(c => !parentIds.includes(c.data.id))
                        addNodesToParent(cy, parents, childrenOnly);
                        setTimeout(() => window.RUNNING = false, maxSimulationTime);
                    })
                }
            }
            const debouncedConditionallyFetchTopis = throttle(conditionallyFetchTopis, 1000, { leading: true, trailing: true });
            cyRef.current.on('zoom', debouncedConditionallyFetchTopis);
        }
    }, []);



    // click handler
    useEffect(() => {
        if (cyRef.current) {
            cyRef.current.on('tap', 'node', (evt) => {
                const node = evt.target;
                console.log('tapped on node', node);
                // alert(`Tapped on node with ID: ${node.id()}`);
                // fetchSubTopics(node);
                createHoverForNode(node);
            });
        }
    }, []);

    function createHoverForNode(node) {
        if(document.getElementById('tippyElement')) {
            document.getElementById('tippyElement')?.tippy?.destroy();
            document.getElementById('tippyElement')?.remove();
        }

        // const node = evt.target;
        // console.log('hover on node', node);
        // alert(`Tapped on node with ID: ${node.id()}`);
        let ref = node.popperRef(); // used only for positioning

        // A dummy element must be passed as tippy only accepts dom element(s) as the target
        // https://atomiks.github.io/tippyjs/v6/constructor/#target-types
        let dummyDomEle = document.createElement('div');
        dummyDomEle.id = 'tippyElement';
        dummyDomEle.style.width = '100px';
        document.body.appendChild(dummyDomEle);

        let tip = new tippy(dummyDomEle, { // tippy props:
            getReferenceClientRect: ref.getBoundingClientRect, // https://atomiks.github.io/tippyjs/v6/all-props/#getreferenceclientrect
            trigger: 'manual', // mandatory, we cause the tippy to show programmatically.
            placement: 'bottom',
            interactive: true,
            arrow: true,
            animation: 'scale',

            // your own custom props
            // content prop can be used when the target is a single element https://atomiks.github.io/tippyjs/v6/constructor/#prop
            content: () => {
                let content = document.createElement('div');
                content.style.color = 'white';
                content.style.background = 'rgb(142 142 142 / 24%)';
                content.style.padding = '5px';
                content.style.marginTop = '-15px';
                content.style.textAlign = 'center';
                content.style.borderRadius = '10px';

                content.innerHTML += `<strong style="text-align:center">${node.id()}<strong><br/>`;
                content.innerHTML += `<a target="_blank" href="https://www.google.com/search?q=${node.id()}">Google</a> - `;
                content.innerHTML += `<a target="_blank" href="https://en.wikipedia.org/w/index.php?search=${node.id()}">Wikipedia</a> - `;
                content.innerHTML += `<a target="_blank" href="https://scholar.google.com/scholar?q=${node.id()}">Scholar</a> - `;
                content.innerHTML += `<a target="_blank" href="https://www.youtube.com/results?search_query=${node.id()}">Youtube</a>`;

                return content;
            }
        });

        tip.show();
        dummyDomEle.tippy = tip; // for updating the content

    }


    // hover handler
    useEffect(() => {
        if (cyRef.current) {
            cyRef.current.on('mouseover', 'node', (evt) => {
                createHoverForNode(evt.target);
            })
            cyRef.current.on('mouseout', 'node', (evt) => {
                document.getElementById('tippyElement')?.tippy?.destroy();
                document.getElementById('tippyElement')?.remove();
            })
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

function fetchSubTopicsData(node) {
    var Data = window.Data
    var cy = window.cyRef.current
    // path to url
    // All Knowledge > Social Sciences > Psychology
    const topic_path = node.data('path');
    const url = rootPath + topic_path.split(' > ').join('/') + '/' + node.data('id') + '/data.json';
    // fetchAndAddNodes(window.cyRef.current, url);

    return Data.getData(url).then(res => {
        return res
    })
}
window.fetchSubTopics = fetchSubTopics;

function fetchSubTopics(node) {
    var Data = window.Data
    var cy = window.cyRef.current
    // path to url
    // All Knowledge > Social Sciences > Psychology
    const topic_path = node.data('path');
    const url = rootPath + topic_path.split(' > ').join('/') + '/' + node.data('id') + '/data.json';
    // fetchAndAddNodes(window.cyRef.current, url);

    return fetchSubTopicsData(node).then(res => {
        // cy.nodes().forEach(node => node.lock());

        var newCytoData = Data.getCytoData(res, node.data('depth'));
        
        return newCytoData
    })
}
window.fetchSubTopics = fetchSubTopics;


function addNodesToParent(cy, parents, children) {
    if(parents.length == 0 || children.length == 0) { return ; }
    const bb = parents[0].position();
    const ext = cy.extent()

    children.forEach(n => {
        if(n.target || n.source) { 
            return;
        }
        // n['data']['parent'] = node.data('id');
        // set x and y
        
        // const x = bb.x + (Math.random()*SCALE);
        // const y = bb.y + (Math.random()*SCALE);
        // NOTE : this is a hack to get the nodes to render in the right place - using cola layout..
        n['position'] = { x:bb.x, y:bb.y };
        // n['position'] = { x:(ext.x2 - ext.x1)/2 + ext.x1-10000, y:(ext.y2 - ext.y1)/2 + ext.y1-10000 };
        // n['renderedPosition'] = { x:0, y:0 };
    })
    
    
    // parents.forEach(n => n.lock());        // relock the parent node
    // var childrenOnly = children.filter(c => parents.map(p=>p.id()).includes(c.id))
    if (!window.RUNNING) {
        cy.nodes().forEach(node => node.lock());
    }
    // cy.layout({...layout, ...{name:'preset', fit:false }}).run();
    setTimeout(() => {
        cy.add(children);
        updateNodeOpacity(cy, cy.zoom());
        updateNodeClasses(cy);
    }, 0)
    setTimeout(() => {
        // setTimeout(() => {cy.layout({...layout, ...{idealEdgeLength: 0.1, maxSimulationTime: 3000, nodeRepulsion:0, nodeSpacing:0}}).run();}, 10)
        if (!window.RUNNING) {
            window.RUNNING = true;
            cy.layout({...layout, ...{maxSimulationTime: maxSimulationTime*2}}).run();
        }
        
        setTimeout(() => {parents.forEach(node => node.unlock())}, maxSimulationTime*1);
        setTimeout(() => {
            cy.nodes().forEach(node => node.unlock())
            window.RUNNING = false;
        }, maxSimulationTime*1.5);
        // setTimeout(() => { 
        //     window.RUNNING = false;
        // }, maxSimulationTime*2);
    }, 0)

    // setTimeout(() => {
    //     var childrenIds = children.map(c => c.data.id)
    //     var childrenNodes = cy.nodes().filter(n => childrenIds.includes(n.id))
    //     // childrenNodes.forEach(n => n.position({ 
    //     //     x:(ext.x2 - ext.x1)/2 + ext.x1,
    //     //     y:(ext.y2 - ext.y1)/2 + ext.y1
    //     // }));
    //     // childrenNodes.forEach(n => n.position({ 
    //     //     x:bb.x,
    //     //     y:bb.y,
    //     // }));
    // }, 1000);
    
    
    
}
window.addNodesToParent = addNodesToParent


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
        updateNodeOpacity(window.cyRef.current, window.cyRef.zoom());
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
        updateNodeOpacity(cyRef.current, cyRef.zoom());
        updateNodeClasses(cyRef.current);
        cyRef.current.layout(layout).run();
    });

}


export default CytoComponent;