import React, { useEffect, useRef, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

import dagre from 'cytoscape-dagre';
import Cytoscape from 'cytoscape';
import debounce from 'lodash.debounce';
import cola from 'cytoscape-cola';
import fcose from 'cytoscape-fcose';

import DataLoader from '../utils/DataLoader';
import { throttle } from 'lodash';
import popper from 'cytoscape-popper';

import tippy from 'tippy.js';
window.tippy = tippy;

const _ = require("lodash");
window._ = _;

Cytoscape.use( popper );

var SCALE = 100
var maxSimulationTime = 10000
var DEFAULT_OPACITY = 0.61
window.RUNNING = true
setTimeout(() => { window.RUNNING = false }, maxSimulationTime/3)

// let dataPath = '/knowledge-tree/topic=electrocardiography.json'
// const dataPath = '/knowledge-tree/all-knowledge.json'
// const dataPath = '/knowledge-tree/all-knowledge-nest.json'
const rootPath = '/knowledge_atlas/'
const dataPath = rootPath + 'All Knowledge/data.json'


// // BREADTH FIRST LAYOUT
// const layout = {
//     name: 'breadthfirst',
//     directed: true,
//     grid: false,
//     circle: true
// }


// COSE LAYOUT
// Cytoscape.use( fcose )
// const layout = {
//     name: 'fcose',
    
//     randomize: true,
//     samplingType: true,
//     sampleSize: 250,
//     numIter: 250000,
//     animationDuration: 2000,
    
//     // idealEdgeLength: edge => 5000,
//     // idealEdgeLength: function( edge ){ return 600 / (2 ** (avgValue('depth', edge)))},
//     edgeElasticity: edge => 0.450,
//     // nodeRepulsion: node => 45000,
//     // nodeSeparation: SCALE * 750,
    
//     nestingFactor: 0.0001,
//     centerGraph: true,
//     fit: false,
// };



// COLA LAYOUT
Cytoscape.use( cola )
const layout = {
    name: 'cola',
    // name: 'cose',
    animate: true,
    randomize: false,
    convergenceThreshold: 0.00001,
    avoidOverlap: false,
    // nodeSpacing: SCALE * 100,
    nodeSpacing: function( n ){ return SCALE * 100 / (3.8 ** (n.data('depth')))},
    // nodeRepulsion: 0.5,
    nodeRepulsion: function( n ){ return SCALE / 100 / (3.8 ** (n.data('depth')))},
    // nodeRepulsion: function( node ){ return SCALE / (10 * 1.8 ** (node.data('depth')))},
    // edgeElasticity: 1e12,
    maxSimulationTime: maxSimulationTime,
    // infinite: true,
    nestingFactor: 0.001,
    // idealEdgeLength: 6000,
    // idealEdgeLength: function( edge ){ return 60000 / (2 ** (avgValue('depth', edge)))},
    // idealEdgeLength: function( edge ){ return 60000 / (2 ** (avgValue('depth', edge)))},
    // idealEdgeLength: function( edge ){ return SCALE * 300 / (1.8 ** (avgValue('depth', edge)))},
    edgeLength: function( edge ){ return SCALE * 400 / (2 ** (avgValue('depth', edge)))},
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
    return opacity === null ? DEFAULT_OPACITY : Math.max(Math.min(opacity, 1), 0);
}
window.calcOpacity = calcOpacity;

const style = [
    {
        selector: 'node',
        style: {
            // 'background-color': '#0074D9',
            // green if fetched
            'background-color': ele => ele.data('fetched') ? '#2ECC40' : '#0074D9', 
            'label': 'data(name)',
            'color': '#fff',
            'width': ele => SCALE * 150 / (2 ** (ele.data('depth'))),
            'height': ele => SCALE * 150 / (2 ** (ele.data('depth'))),
            'opacity': ele => ele.data('op') || DEFAULT_OPACITY,
            'text-opacity': ele => ele.data('op') || DEFAULT_OPACITY,
            'font-size': ele => SCALE * 40 / (2 ** (ele.data('depth'))),
        },
    },
    {
        selector: 'edge',
        style: {
            'line-color': '#7FDBFF',
            'target-arrow-color': '#7FDBFF',
            'target-arrow-shape': 'triangle',
            'opacity': ele => avgValue('op', ele) || DEFAULT_OPACITY,
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
                // nodesToFetch = nodesToFetch.filter(n => !n.children().legnth);           // TODO : fix this.. children elements don't show?
                // nodesToFetch = nodesToFetch.filter(n => n.neighborhood().filter(a=>a).legnth == 1);
                
                if (nodesInView.length < 20 && nodesToFetch.length > 0 && nodesToFetch.length < 10) {
                    nodesToFetch = nodesToFetch.slice(0, 4)
                    // const leaf_topics = window.Data.getSubTopics(cyRef.data).filter(a => a.subtopics?.length == 0).map(a=> a.topic)
                    // nodesToFetch = nodesToFetch.filter(node => leaf_topics.includes(node.data('id')));
                    console.log('nodesToFetch', nodesToFetch.map(node => node.data('name')));
                    var fetchProms = nodesToFetch.map(node => {
                        node.data('fetched', true);
                        return fetchSubTopics(node).then(resp => {
                            if (resp?.length > 1) {console.log('Fetched SubTopics', node, resp)}
                            return [node, resp]})
                    })
                    fetchProms.forEach(function (p){
                        p.then((resp) => {
                            // debugger
                            
                            addNodesToParent(cy, resp[0], resp[1]);
                            
                            // layoutRun.pon('end').then(p => {
                            //     console.log('simulation end - unlocking')
                            //     parentNode.unlock()
                            // })
                            
                        }).catch(p => console.warn('Failed to fetch', p))
                    })

                    // Promise.all(fetchProms).then(() => {
                    //     nodesToFetch.neighbourhood().layout({
                    //         ...layout, 
                    //         ...{
                    //             // animate: false,
                    //             avoidOverlap: true,
                    //             infinite: true,
                    //             // maxSimulationTime: 
                    //             centerGraph: false,
                    //             nestingFactor: layout['nestingFactor']*10
                    //         }
                    //     }).run()
                    // })
                }
            }
            const debouncedConditionallyFetchTopis = throttle(conditionallyFetchTopis, 1000, { leading: true, trailing: true });
            cyRef.current.on('zoom', debouncedConditionallyFetchTopis);
        }
    }, []);



    // click handler & Double Click
    useEffect(() => {
        if (cyRef.current) {
            // cyRef.current.on('tap', 'node', (evt) => {
            //     const node = evt.target;
            //     console.log('tapped on node', node);
            //     // fetchSubTopics(node);
            //     createHoverForNode(node);
            // });

            var tappedBefore;
            var tappedTimeout;
            cyRef.current.on('tap', function(event) {
                var tappedNow = event.target;
                if (tappedTimeout && tappedBefore) {
                    clearTimeout(tappedTimeout);
                }
                if(tappedBefore === tappedNow) {

                    const node = event.target;
                    console.log('double tapped on node', node);
                    // fetchSubTopics(node);
                    // createHoverForNode(node);
                    removeHoverForNode(node);

                    tappedNow.trigger('doubleTap');
                    tappedBefore = null;
                } else {
                    tappedTimeout = setTimeout(function(){ tappedBefore = null; }, 300);
                    tappedBefore = tappedNow;
                    
                    const node = event.target;
                    if(!node.isNode || !node.isNode()) { 
                        removeHighlightFromNodes();
                        // remove modal window if exists
                        document.getElementById('info-modal')?.remove();
                        return; 
                    }
                    console.log('tapped on node', node);
                    createHoverForNode(node);
                    highlightNeighbours(node);

                    if (node.data('fetched')) { return; }
                    node.data('fetched', true)
                    var fetchProm = fetchSubTopics(node).then(resp => {
                        if (resp?.length > 1) {console.log('Fetched SubTopics', node, resp)}
                        return [node, resp]
                    })

                    fetchProm.then((resp) => {
                        addNodesToParent(cyRef.current, resp[0], resp[1]);
                    }).catch(p => console.warn('Failed to fetch', p))
                }
            });

            cyRef.current.on('doubleTap', 'node', (evt) => {
                const node = evt.target;
                console.log('doubleTap on node', node);
                // fetchSubTopics(node);
                // Display modal for 'JavaScript' Wikipedia page
                displayModalWithIntroAndImage(node.data().name);
            });

        }
    }, []);

    // highlight neighbours
    function highlightNeighbours(node) {
        node.neighborhood().forEach(node => toggleHighlightNodeBorder(node));
    }

    // remove highlighting from nodes
    function removeHighlightFromNodes() {
        var highlightedNodes = cyRef.current.nodes().filter(node => node.data('highlighted'));
        highlightedNodes.forEach(node => toggleHighlightNodeBorder(node));
    }

    async function fetchIntroBlurbAndImage(pageTitle) {
        const url = `https://en.wikipedia.org/w/api.php?format=json&origin=*&action=query&prop=extracts|pageimages&exintro&explaintext&redirects=1&titles=${encodeURIComponent(pageTitle)}&piprop=original`;
    
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const json = await response.json();
            const pages = json.query.pages;
            const pageId = Object.keys(pages)[0]; 

            if (pageId == '-1') {
                // return {
                //     text: 'No information found for this topic.',
                //     image: null
                // };
                // if page doesn't existing query wikipedia and return first result
                const url = `https://en.wikipedia.org/w/api.php?format=json&origin=*&action=query&list=search&srsearch=${encodeURIComponent(pageTitle)}`;
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const json = await response.json();
                const pages = json.query.search;
                const pageId = Object.keys(pages)[0];
                const title = pages[pageId].title;
                return fetchIntroBlurbAndImage(title);

            }

            return {
                text: pages[pageId].extract,
                image: pages[pageId].original ? pages[pageId].original.source : null
            };
        } catch (error) {
            console.log(error);
        }
    }
    
    async function displayModalWithIntroAndImage(pageTitle) {
        const { text, image } = await fetchIntroBlurbAndImage(pageTitle);
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'info-modal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.backgroundColor = '#fff';
        modal.style.padding = '20px';
        modal.style.maxWidth = '80%';
        modal.style.maxHeight = '60%';
        modal.style.overflow = 'scroll';
        modal.style.zIndex = '1000';
        
        // Add close button
        const closeButton = document.createElement('div');
        closeButton.textContent = 'X';
        closeButton.style.float = 'right';
        closeButton.addEventListener('click', () => document.body.removeChild(modal));
        modal.appendChild(closeButton);
        
        // add centered title
        const title = document.createElement('h2');
        title.textContent = pageTitle;
        title.style.textAlign = 'center';
        modal.appendChild(title);

        // Add image to modal
        if (image) {
            const img = document.createElement('img');
            img.src = image;
            img.style.width = '50%';
            img.style.height = 'auto';
            img.style.float = 'left';
            img.style.marginRight = '10px';
            modal.appendChild(img);
        }
    
        // Add text to modal
        const p = document.createElement('p');
        p.style.textIndent = "30px"
        p.textContent = text;
        modal.appendChild(p);
    
        // Add modal to page
        document.body.appendChild(modal);
    }
    
    // highlight node border or remove highlight
    function toggleHighlightNodeBorder(node) {
        if (node.data('highlighted')) {
            node.style('border-width', 0);
            node.style('font-weight', 'normal');
            // node.style('opacity', node.data('opacity_pre'))
            node.style('opacity', style[0].style.opacity)
            
            node.data('highlighted', false);
        } else {
            var borderWidth = 100/(node.data('depth')||2);
            node.style('border-width', borderWidth);
            node.style('border-color', 'white');
            node.style('font-weight', 'bold');
            node.data('opacity_pre', node.data('opacity'))
            node.style('opacity', 1);

            node.data('highlighted', true);
        }
    }


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

                content.innerHTML += `<strong style="text-align:center">${node.data('name')}<strong><br/>`;
                
                // take last element from path
                // let lastPath = node.data('path').split(' > ').slice(-1);
                content.innerHTML += `<a target="_blank" href="https://www.google.com/search?q=${node.data('name')}">Google</a> - `;
                content.innerHTML += `<a target="_blank" href="https://en.wikipedia.org/w/index.php?search=${node.data('name')}">Wikipedia</a> - `;
                content.innerHTML += `<a target="_blank" href="https://scholar.google.com/scholar?q=${node.data('name')}">Scholar</a> - `;
                content.innerHTML += `<a target="_blank" href="https://www.youtube.com/results?search_query=${node.data('name')}">Youtube</a>`;

                return content;
            }
        });

        tip.show();
        dummyDomEle.tippy = tip; // for updating the content

    }

    function removeHoverForNode(node) {
        document.getElementById('tippyElement')?.tippy?.destroy();
        document.getElementById('tippyElement')?.remove();
    }

    // hover handler
    useEffect(() => {
        if (cyRef.current) {
            cyRef.current.on('mouseover', 'node', (evt) => {
                // createHoverForNode(evt.target);
                toggleHighlightNodeBorder(evt.target);
            })
            cyRef.current.on('mouseout', 'node', (evt) => {
                toggleHighlightNodeBorder(evt.target);
                // removeHoverForNode(evt.target);
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
    const url = rootPath + topic_path.split(' > ').join('/') + '/' + node.data('name') + '/data.json';
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
    const url = rootPath + topic_path.split(' > ').join('/') + '/' + node.data('name') + '/data.json';
    // fetchAndAddNodes(window.cyRef.current, url);

    return fetchSubTopicsData(node).then(res => {
        // cy.nodes().forEach(node => node.lock());

        var newCytoData = Data.getCytoData(res, node.data('depth')+1);
        
        return newCytoData
    })
}
window.fetchSubTopics = fetchSubTopics;


function addNodesToParent(cy, parent, children) {

    // var parentNode = resp[0]
    // var children = resp[1]
    children = children.filter(c => c.data.id != parent.id())
    if (!parent || children.length == 0) {
        return 
    }
    var bb = parent.position();
    children.forEach(n => {
        if(n.target || n.source) { return;}
        n['position'] = { x:bb.x, y:bb.y };
    })

    var childNodes = cy.add(children);
    parent.lock()
    let layoutRun = childNodes.neighbourhood().neighbourhood().layout({
        ...layout, 
        ...{
            animate: true,
            avoidOverlap: false,
            convergenceThreshold: 0.00001,
            // infinite: true,
            maxSimulationTime: 1e5,
            centerGraph: false,
            nestingFactor: layout['nestingFactor']*10
        }
    }).run()
    setTimeout(() => parent.unlock(), 1000)
}

function addNodesToParent_old(cy, parents, children) {
    if(parents.length == 0 || children.length == 0) { return ; }
    const parent = parents[0]
    const bb = parent.position();
    // const ext = cy.extent()
    // debugger;
    children.forEach(n => {
        if(n.target || n.source) { 
            return;
        }
        // n['data']['parent'] = parent.data('id');
        // set x and y
        
        // const x = bb.x + (Math.random()*SCALE);
        // const y = bb.y + (Math.random()*SCALE);
        // NOTE : this is a hack to get the nodes to render in the right place - using cola layout..
        n['position'] = { x:bb.x, y:bb.y };
        // n['data']['position'] = { x:bb.x, y:bb.y };
        // n['position'] = { x:(ext.x2 - ext.x1)/2 + ext.x1-10000, y:(ext.y2 - ext.y1)/2 + ext.y1-10000 };
        // n['renderedPosition'] = { x:0, y:0 };
    })
    
    
    // if (!window.RUNNING) {
    //     cy.nodes().forEach(node => node.lock());
    // }
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
            // cy.layout({...layout, ...{maxSimulationTime: maxSimulationTime*2, nestingFactor:layout['nestingFactor']/10}}).run();
            // children.layout({...layout, ...{maxSimulationTime: maxSimulationTime*2, nestingFactor:layout['nestingFactor']/10}}).run();
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