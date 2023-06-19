class Node {
    constructor(data) {
        this.data = data;
        this.size = 1;
        this.left = null;
        this.right = null;
    }
};

function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
}

class ScapegoatTree {
    constructor() {
        this.head = null;
        this.n = 0;
        this.q = 0;
        this.sg_list = [];
    }

    treeToArray(root) {
        let arr = [];

        function inorder(node) {
            if(node == null) return;

            inorder(node.left);

            removeNode(node.data);
            arr.push(node.data);

            inorder(node.right);
        }

        inorder(root);

        return arr;
    }

    async buildTree(arr, pos_x, pos_y, f) {
        if(arr.length == 0) return null;

        let mid = parseInt(arr.length / 2);

        let newNode = new Node(arr[mid]);
        addNode(newNode.data.toString(), pos_x, pos_y);

        changeNotesValue("Subtree nodes list: " + arr, "notes3");
        await changeNotesValueDelayed("Node " + newNode.data + " inserted", "notes4");

        await showActiveNode(newNode.data);

        let left = [], right = [];
        for(let i=0; i<mid; i++) left.push(arr[i]);
        for(let i=mid+1; i<arr.length; i++) right.push(arr[i]);

        newNode.left = await this.buildTree(left, pos_x - f/2, pos_y + 10, f/2);
        newNode.right = await this.buildTree(right, pos_x + f/2, pos_y + 10, f/2);

        if(newNode.left != null) addEdge(newNode.data, newNode.left.data);
        if(newNode.right != null) addEdge(newNode.data, newNode.right.data);

        if(newNode.left == null && newNode.right == null) newNode.size = 1;
        else if(newNode.left == null) newNode.size = 1 + newNode.right.size;
        else if(newNode.right == null) newNode.size = 1 + newNode.left.size;
        else newNode.size = 1 + newNode.left.size + newNode.right.size;

        changeNodeLabel(newNode.data, newNode.data + " (" + newNode.size + ")");

        return newNode;
    }

    async rebuild(root, pos_x, pos_y, d) {
        changeNotesValue("Rebuilding Tree", "notes2");
        let arr = this.treeToArray(root);

        let newRoot = await this.buildTree(arr, pos_x, pos_y, d);

        clearNotes();

        return newRoot;
    }

    async insert(new_data) {
        this.n++, this.q++;
        updateNQ(this.n, this.q);

        let [head, imbalance] = await this.insertHelper(this.head, new_data, 0, null, 100, 10, 100);
        this.head = head;

        this.sg_list = [];
        clearNotes();
        document.getElementById("notes").innerHTML = "";
    }

    async insertHelper(node, new_data, depth, parent, pos_x, pos_y, f) {
        if(node == null) {
            let newNode = new Node(new_data);

            addNode(newNode.data.toString(), pos_x, pos_y);

            if(parent != null) addEdge(parent.data, newNode.data);

            changeNotesValue("Node " + newNode.data + " inserted", "notes2");

            if(depth > getBaseLog(3/2, this.q)) {
                changeNotesValue("For Node " + newNode.data + ", depth(" + newNode.data + ") = " + depth + " > log<sub>3/2</sub>(" + this.q + ")", "notes3");
            } else {
                changeNotesValue("For Node " + newNode.data + ", depth(" + newNode.data + ") = " + depth + " <= log<sub>3/2</sub>(" + this.q + ")", "notes3");
            }

            await showActiveNode(newNode.data);

            clearNotes();

            if(depth > getBaseLog(3/2, this.q)) return [newNode, true];
            else return [newNode, false];
        }

        if(node.data > new_data) {
            changeNotesValue("For Node " + node.data + ", " + new_data + " < " + node.data, "notes2");
            changeNotesValue("go to left subtree", "notes3");
        } else if(node.data < new_data) {
            changeNotesValue("For Node " + node.data + ", " + new_data + " > " + node.data, "notes2");
            changeNotesValue("go to right subtree", "notes3");
        } else {
            changeNotesValue("For Node " + node.data + ", " + new_data + " == " + node.data, "notes2");
            changeNotesValue("reject insertion", "notes3");
        }

        await showActiveNode(node.data);

        clearNotes();

        let child_node = null, imbalance = false, child_size = 0;

        if(node.data > new_data) {
            [child_node, imbalance] = await this.insertHelper(node.left, new_data, depth + 1, node, pos_x - f/2, pos_y + 10, f/2);
            node.left = child_node;

            child_size = node.left.size;

            // if(new_node == true) addEdge(node.data, node.left.data);
        } else if(node.data < new_data) {
            [child_node, imbalance] = await this.insertHelper(node.right, new_data, depth + 1, node, pos_x + f/2, pos_y + 10, f/2);
            node.right = child_node;

            child_size = node.right.size;

            // if(new_node == true) addEdge(node.data, node.right.data);
        } else {
            this.n--, this.q--;
            updateNQ(this.n, this.q);

            return [node, false];
        }

        node.size++;
        changeNodeLabel(node.data, node.data + " (" + node.size + ")");

        s.refresh();

        if(imbalance == false) {
            await showActiveNode(node.data);
            clearNotes();

            return [node, false];
        } else {
            if((3 * child_size) > (2 * node.size)) {
                changeNotesValue("For node " + node.data + ", childsize/nodesize = " + child_size + "/" + node.size + " > 2/3","notes2");
                await showActiveNode(node.data);

                node = await this.rebuild(node, pos_x, pos_y, f);

                if(parent != null) addEdge(parent.data, node.data);

                clearNotes();

                return [node, false];
            } else {
                changeNotesValue("For node " + node.data + ", childsize/nodesize = " + child_size + "/" + node.size + " <= 2/3","notes2");
                await showActiveNode(node.data);

                clearNotes();

                return [node, true];
            }
        }
    }

    async delete(node_id) {
        this.n--;
        updateNQ(this.n, this.q);

        this.head = await this.deleteHelper(this.head, null, node_id, 100, 10, 100);

        if(this.q > 2 * this.n) {
            this.head = await this.rebuild(this.head, 100, 10, 100);

            this.q = this.n;
            updateNQ(this.n, this.q);
        }

        clearNotes();
        document.getElementById("notes").innerHTML = "";
    }

    async deleteHelper(node, parent, del_key, pos_x, pos_y, f) {
        if(node == null) return node;

        if(node.data == del_key) {
            changeNotesValue("Delete Node " + node.data, "notes2");
            await showActiveNode(node.data);

            if(node.left != null && node.right != null) {
                changeNotesValue("Deleting Node " + node.data, "notes2");
                changeNodeColor(node.data, yellow);

                let rightMost = node.left;
                let parent = node;
                let rm_x = pos_x - f/2, rm_y = pos_y + 10, rm_f = f/2;

                while(rightMost.right != null) {
                    changeNotesValue("Rightmost Node " + rightMost.data, "notes3");
                    await showActiveNode(rightMost.data);

                    rightMost.size--;
                    changeNodeLabel(rightMost.data, rightMost.data + " (" + rightMost.size + ")");

                    parent = rightMost;
                    rightMost = rightMost.right;
                    rm_x += rm_f/2, rm_y += 10, rm_f /= 2;
                }

                changeNotesValue("Rightmost Node " + rightMost.data, "notes3");
                await showActiveNode(rightMost.data);

                changeNotesValue("Swap Nodes " + node.data + " and " + rightMost.data, "notes4");
                await swapLables(node.data, rightMost.data);
                removeNode(node.data);
                [node.data, rightMost.data] = [rightMost.data, node.data];

                changeNotesValue("Delete Node " + node.data, "notes4");

                if(parent == node) {
                    parent.left = rightMost.left;
                    if(rightMost.left != null) addEdge(parent.data, rightMost.left.data);
                    this.reposition(rightMost.left, rm_x, rm_y, rm_f);
                } else {
                    parent.right = rightMost.left;
                    if(rightMost.left != null) addEdge(parent.data, rightMost.left.data);
                    this.reposition(rightMost.left, rm_x, rm_y, rm_f);
                }

                changeNodeColor(node.data, blue);
            } else if(node.left != null) {
                removeNode(node.data);

                node = node.left;
                if(parent != null) addEdge(parent.data, node.data);
                this.reposition(node, pos_x, pos_y, f);
            } else if(node.right != null) {
                removeNode(node.data);

                node = node.right;
                if(parent != null) addEdge(parent.data, node.data);
                this.reposition(node, pos_x, pos_y, f);
            } else {
                removeNode(node.data);
                node = null;
            }
        } else if(node.data > del_key) {
            changeNotesValue("For Node " + node.data + ", " + del_key + " < " + node.data, "notes2");
            changeNotesValue("go to left subtree", "notes3");

            await showActiveNode(node.data);
            clearNotes();

            node.left = await this.deleteHelper(node.left, node, del_key, pos_x - f/2, pos_y + 10, f/2);
        } else {
            changeNotesValue("For Node " + node.data + ", " + del_key + " > " + node.data, "notes2");
            changeNotesValue("go to right subtree", "notes3");

            await showActiveNode(node.data);
            clearNotes();

            node.right = await this.deleteHelper(node.right, node, del_key, pos_x + f/2, pos_y + 10, f/2);
        }

        if(node == null) return node;

        if(node.left == null && node.right == null) node.size = 1;
        else if(node.left == null) node.size = 1 + node.right.size;
        else if(node.right == null) node.size = 1 + node.left.size;
        else node.size = 1 + node.left.size + node.right.size;

        changeNodeLabel(node.data, node.data + " (" + node.size + ")");

        return node;
    }

    reposition(node, pos_x, pos_y, f) {
        if(node == null) return;

        changeNodePosition(node.data, pos_x, pos_y);

        this.reposition(node.left, pos_x - f/2, pos_y + 10, f/2);
        this.reposition(node.right, pos_x + f/2, pos_y + 10, f/2);

        if(node.left == null && node.right == null) node.size = 1;
        else if(node.left == null) node.size = 1 + node.right.size;
        else if(node.right == null) node.size = 1 + node.left.size;
        else node.size = 1 + node.left.size + node.right.size;

        changeNodeLabel(node.data, node.data + " (" + node.size + ")");
    }

    async find(find_key) {
        return await this.findHelper(this.head, find_key);
    }

    async findHelper(node, find_key) {
        if(node == null) return false;

        if(node.data > find_key) {
            changeNotesValue("For Node " + node.data + ", " + find_key + " < " + node.data, "notes2");
            changeNotesValue("go to left subtree", "notes3");
        } else if(node.data < find_key) {
            changeNotesValue("For Node " + node.data + ", " + find_key + " > " + node.data, "notes2");
            changeNotesValue("go to right subtree", "notes3");
        } else {
            changeNotesValue("For Node " + node.data + ", " + find_key + " == " + node.data, "notes2");
            changeNotesValue("node found", "notes3");
        }

        await showActiveNode(node.data);

        if(node.data > find_key) return this.findHelper(node.left, find_key);
        else if(node.data < find_key) return this.findHelper(node.right, find_key);
        else return true;
    }
};