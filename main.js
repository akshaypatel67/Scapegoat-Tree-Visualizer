const container = document.getElementById("tree-container");
let sgt = new ScapegoatTree();

const black = "#000000";
const blue = "#2a9d8f";
const yellow = "#b8af09";

const s = new sigma({
    renderer: {
        container: container,
        type: "canvas"
    },
    settings: {
        minNodeSize: 10,
        maxNodeSize: 20,
        minEdgeSize: 2,
        maxEdgeSize: 2,
        edgeColor: "#000000",
        defaultNodeColor: "#2a9d8f",
        labelThreshold: 0,
    }
});

s.cameras[0].goTo({ x: 0, y: 0, angle: 0, ratio: 1.2 });
s.refresh();

function addNode(data, pos_x, pos_y) {
    s.graph.addNode({
        id: data,
        label: data + " (1)",
        x: pos_x,
        y: pos_y,
        size: 10
    });

    s.refresh();
}

function removeNode(id) {
    var edgesToRemove = s.graph.edges().filter(function(edge) {
        return edge.source === id || edge.target === id;
    });

    edgesToRemove.forEach(function(edge) {
        s.graph.dropEdge(edge.id);
    });

    var nodesToRemove = s.graph.nodes(id);

    s.graph.dropNode(nodesToRemove.id);

    s.refresh();
}

function addEdge(from, to) {
    s.graph.addEdge({
        id: `${from}-${to}`,
        source: from,
        target: to
    });

    s.refresh();
}

async function insertBtn() {
    startOperation();
    let data = document.getElementById("txtInput").value;
    await sgt.insert(parseInt(data));
    stopOperation();
}

async function deleteBtn() {
    startOperation();
    let data = document.getElementById("txtInput").value;
    await sgt.delete(parseInt(data));
    stopOperation();
}

async function findBtn() {
    startOperation();
    let data = document.getElementById("txtInput").value;
    if(await sgt.find(parseInt(data)) == true) {
        changeNotesValue("key found", "notes2");
    } else {
        changeNotesValue("key not found", "notes2");
    }
    stopOperation();
}

function del(node_id) {
    sgt.delete(parseInt(node_id));
}

function changeNodeColor(node_id, color) {
    s.graph.nodes(node_id).color = color;
    s.refresh();
}

function changeNodeLabel(node_id, label) {
    s.graph.nodes(node_id).label = label;
    s.refresh();
}

function changeNodePosition(node_id, pos_x, pos_y) {
    s.graph.nodes(node_id).x = pos_x;
    s.graph.nodes(node_id).y = pos_y;
    s.refresh();
}

async function swapLables(node1_id, node2_id) {
    var node1_edges = s.graph.edges().filter(function(edge) {
        return edge.source === node1_id || edge.target === node1_id;
    });

    node1_edges.forEach(function(edge) {
        s.graph.dropEdge(edge.id);
    });

    var node2_edges = s.graph.edges().filter(function(edge) {
        return edge.source === node2_id || edge.target === node2_id;
    });

    node2_edges.forEach(function(edge) {
        s.graph.dropEdge(edge.id);
    });

    node1_edges.forEach(function(edge) {
        if(edge.source == node1_id && edge.target != node2_id) addEdge(node2_id, edge.target);
        else if(edge.source != node2_id) addEdge(edge.source, node2_id);
    });

    node2_edges.forEach(function(edge) {
        if(edge.source == node2_id && edge.target != node1_id) addEdge(node1_id, edge.target);
        else if(edge.source != node1_id) addEdge(edge.source, node1_id);
    });

    [s.graph.nodes(node1_id).x, s.graph.nodes(node2_id).x] = [s.graph.nodes(node2_id).x, s.graph.nodes(node1_id).x];
    [s.graph.nodes(node1_id).y, s.graph.nodes(node2_id).y] = [s.graph.nodes(node2_id).y, s.graph.nodes(node1_id).y];

    s.refresh();

    await new Promise(r => setTimeout(r, 500));
}

async function showActiveNode(node_id) {
    changeNotesValue("Current Node " + node_id, "notes");

    changeNodeColor(node_id, black);
    await waitForNext();
    changeNodeColor(node_id, blue);
}

function changeNotesValue(val, element) {
    document.getElementById(element).innerHTML = val;
}

async function changeNotesValueDelayed(val, element) {
    document.getElementById(element).innerHTML = val;
    await new Promise(r => setTimeout(r, 500));
}

function updateNQ(n, q) {
    document.getElementById("n_val").innerHTML = n.toString();
    document.getElementById("q_val").innerHTML = q.toString();
}

function clearNotes() {
    document.getElementById("notes2").innerHTML = "";
    document.getElementById("notes3").innerHTML = "";
    document.getElementById("notes4").innerHTML = "";
}

function startOperation() {
    document.getElementById("btnNext").removeAttribute("disabled");
    document.getElementById("btnNext").removeAttribute("style");
    document.getElementById("btnNext").style.marginTop = "10px";

    document.getElementById("btnInsert").disabled = true;
    document.getElementById("btnInsert").style.background = "#cccccc";

    document.getElementById("btnDelete").disabled = true;
    document.getElementById("btnDelete").style.background = "#cccccc";

    document.getElementById("btnFind").disabled = true;
    document.getElementById("btnFind").style.background = "#cccccc";
}

function stopOperation() {
    document.getElementById("btnNext").disabled = true;
    document.getElementById("btnNext").style.background = "#cccccc";

    document.getElementById("btnInsert").removeAttribute("disabled");
    document.getElementById("btnInsert").removeAttribute("style");

    document.getElementById("btnDelete").removeAttribute("disabled");
    document.getElementById("btnDelete").removeAttribute("style");

    document.getElementById("btnFind").removeAttribute("disabled");
    document.getElementById("btnFind").removeAttribute("style");
}

stopOperation();

let nextTimeout;
let nextResolve;

function nextBtn() {
    clearTimeout(nextTimeout);
    nextResolve();
}

async function waitForNext() {
    await new Promise(r => {
        nextResolve = r;
        nextTimeout = setTimeout(r, 1000000);
    });
}