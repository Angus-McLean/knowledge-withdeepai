// import lodash
import _ from 'lodash';

function convertNestedObjectToChildren(datanew) {
    if (!(_.isObject(datanew))) {
        return datanew;
    }
    var subtopicsArr = Object.values({...datanew, ...{path:undefined, topic:undefined},}).filter(a => _.isObject(a))
    subtopicsArr = subtopicsArr.map(function (d) {
        return convertNestedObjectToChildren(d);
    });
    datanew = {
        "topic": datanew['name'],
        "path": datanew['path'] || '_',
        "subtopics": subtopicsArr
    }
    return datanew;
}

// class to import data from json file
class DataLoader {

    // lodash fetch all nested objects
    getSubTopics(data) {
        const subTopics = []
        data.forEach((d) => {
            if (d.subtopics) {
                subTopics.push(...d.subtopics);
                subTopics.push(...this.getSubTopics(d.subtopics));
            }
        });
        return subTopics
    };

    getData(path) {
        if (path.includes('data.json')) {
            return this.getData_raw(path).then(raw => {
                // rename 'children' to 'subtopics' deeply iterate with lodash
                // var data_transformed = replaceKeysDeep(raw, { children: 'subtopics', name: 'topic' });
                var data_transformed = [convertNestedObjectToChildren(raw)]
                this.data = data_transformed;
                return data_transformed
            });
        } else {
            return this.getData_raw(path);
        }
    }

    

    getData_raw(path) {
        return fetch(path)
            .then((response) => response.json())
            .then(async (data) => {
                // this.data = data;
                
                
                // // const allProm = Promise.all(subTopics);
                // await Promise.all(allProms);
                return data;
            });
    }

    getCytoData(data, depth = 1) {
        const elements = this.toCytoElements(data, depth);
        // elements.nodes.forEach(ele => {
        //     ele.size = Math.max(150 / (2 ** (ele.data('depth')||99)), 3)
        // })
        return [...elements.nodes, ...elements.edges];
    }

    

    toCytoElements(data, depth = 1) {
        // create nodes at current level. And create edges from current to sub nodes
        const arrNodes = [];
        const arrEdges = [];

        data.forEach((d) => {
            // if (d.path === '_') return;
            arrNodes.push({ data: { 
                id: dataToId(d), name: d.topic, 
                depth: depth,
                path: d.path
            } });
            let edges = (d.subtopics||[]).map(a => {
                return {data:{
                    id:dataToId(d)+'-'+dataToId(a), 
                    source:dataToId(d), 
                    target:dataToId(a)
                }}
            })
            arrEdges.push(...edges);
            let subElems = this.toCytoElements(d.subtopics||[], depth + 1)
            arrNodes.push(...subElems.nodes);
            arrEdges.push(...subElems.edges);
        });

        return {
            nodes: arrNodes,
            edges: arrEdges
        }
    }
}

function dataToId(data) {
    return data.path + ' > ' + data.topic
}

window.DataLoader = DataLoader;
export default DataLoader;