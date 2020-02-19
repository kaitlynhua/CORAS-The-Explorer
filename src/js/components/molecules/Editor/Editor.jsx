import React from 'react';
import joint from 'jointjs';
import { connect } from 'react-redux';
import _ from 'lodash';
import {
    ElementRightClicked,
    ElementDoubleClicked,
    ElementEditorCancel,
    ElementEditorSave,
    ElementEditorDelete,
    ElementLabelEdit,
    ElementChangeX,
    ElementChangeY,
    ElementChangeType,
    ToolElementRelease,
    MenuClearClicked,
    MenuClearConfirmed,
    CellClicked,
    CellHandleClicked,
    CellHandleRelased,
    CellHandleMoved,
    SetGraph,
    SetCurrGraph,
    SetPaper,
    SetCellResizing,
    SetElementPosition,
    SetMovingLinks
} from '../../../store/Actions';

import Modal from '../../atoms/Modal/Modal';

import ElementEditor from './ElementEditor';
import EditorTool from './EditorTool';
import DiagramSelector from './DiagramSelector';
import CellTool from './CellTool';

import "../../../../../node_modules/jointjs/dist/joint.css";
import './editor.css';

import AddCorasShapes from './CORASShapes.js';
import ToolDefinitions from './ToolDefinitions';

AddCorasShapes(joint);

class EditorView extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (<div></div>);
    }
}

class Editor extends React.Component {
    constructor(props) {
        super(props);

        this.graph = new joint.dia.Graph();

        this.saveToLocalStorage = this.saveToLocalStorage.bind(this);
        this.getFromLocalStorage = this.getFromLocalStorage.bind(this);

        this.handleScroll = this.handleScroll.bind(this);
        this.handleScrollBlank = this.handleScrollBlank.bind(this);
        this.beginMovePaper = this.beginMovePaper.bind(this);
        this.movePaper = this.movePaper.bind(this);
        this.endMovePaper = this.endMovePaper.bind(this);
        this.updatePaperSize = this.updatePaperSize.bind(this);
        this.removeLink = this.removeLink.bind(this);
        this.cellToolHandleMoved = this.cellToolHandleMoved.bind(this);
        this.unembedElement = this.unembedElement.bind(this);
        this.embedElement = this.embedElement.bind(this);
        this.resizeElement = this.resizeElement.bind(this);

        this.paperOnMouseUp = this.paperOnMouseUp.bind(this);

        this.saveGraphToFile = this.saveGraphToFile.bind(this);
        this.loadGraphFromFile = this.loadGraphFromFile.bind(this);
        this.clearGraph = this.clearGraph.bind(this);
        this.downloadSvg = this.downloadSvg.bind(this);
        this.changeGraph = this.changeGraph.bind(this);

        this.paperId = this.props.paperId || 'paper-holder';
        this.paperWrapperId = `${this.paperId}-wrapper`;

        this.loadRef = React.createRef();
        this.paperRef = React.createRef();

        this.testEvent = this.testEvent.bind(this);
        this.beginElementResize = this.beginElementResize.bind(this);
        this.onHover = this.onHover.bind(this);
        this.exitHover = this.exitHover.bind(this);
    }

    saveToLocalStorage() {
        // might want to update redux state here, or update store more frequently
        window.localStorage.setItem(this.paperId + "graph_" + this.props.currGraph.label, JSON.stringify(this.graph.toJSON()));
    }

    getFromLocalStorage() {
        console.log(this.props.currGraph.label);
        var storedGraph = null;
        this.props.diagramTypes.map((type, i) => {
            storedGraph = window.localStorage.getItem(this.paperId + "graph_" + type);
            if (storedGraph) {
                this.props.setGraph(type, JSON.parse(storedGraph));
            }
        });
        // a bit hardcoded, return general graph if it exists
        return window.localStorage.getItem(this.paperId + "graph_" + this.props.diagramTypes[0]);
    }

    componentDidMount() {
        const arrowheadShape = 'M 10 0 L 0 5 L 10 10 z';

        var graph = new joint.dia.Graph();
        this.paper = new joint.dia.Paper({
            el: document.getElementById(this.paperId),
            model: this.graph, // change
            width: document.getElementById(this.paperWrapperId).offsetWidth - 10,
            height: document.getElementById(this.paperWrapperId).offsetHeight - 10,
            gridSize: 1,
            background: {
                color: 'rgba(255, 255, 255, 1)',
            },
            interactive: this.props.interactive === undefined ? true : this.props.interactive,
            defaultLink: new joint.shapes.devs.Link({
                attrs: {
                    '.marker-target': {
                        d: arrowheadShape
                    }
                }
            })
        });

        // Load graph from localStorage or props
        this.getFromLocalStorage();
        // always present general at reload
        if (this.getFromLocalStorage()) this.graph.fromJSON(JSON.parse(this.getFromLocalStorage()));
        else if (this.props.initialDiagram) this.graph.fromJSON(this.props.initialDiagram);

        // Save in localStorage on change (or rather, every second currently)
        this.periodicalSave = setInterval(this.saveToLocalStorage, 1000);

        window.addEventListener('resize', this.updatePaperSize);

        if (this.props.interactive === undefined ? true : this.props.interactive) {
            this.paper.on('cell:contextmenu', (elementView, e, x, y) => this.props.elementDoubleClicked(elementView.model, e));
            this.paper.on('cell:pointerdblclick', (elementView, e, x, y) => this.props.elementDoubleClicked(elementView.model, e));
            this.paper.on('cell:pointerup', this.embedElement);
            this.paper.on('cell:pointerdown', this.unembedElement);
            this.paper.on('cell:pointermove', this.resizeElement);
            this.paper.on('cell:mouseenter', this.onHover);
            this.paper.on('cell:mouseleave', this.exitHover);

            this.paper.on('cell:mousewheel', this.handleScroll);
            this.paper.on('blank:mousewheel', this.handleScrollBlank);

            this.paper.on('blank:pointerdown', this.beginMovePaper);
            this.paper.on('blank:pointermove', this.movePaper);
            this.paper.on('blank:pointerup', this.endMovePaper);
            this.paper.on('element:sizeSelector:pointerdown', this.beginElementResize);
        }
        this.props.setCurrGraph('asset', this.graph.toJSON()); //TODO
    }

    testEvent(cellView, e, x, y) {
        console.log("Event triggered");
        console.log(cellView);
        console.log(e);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updatePaperSize);
        clearInterval(this.periodicalSave);
    }

    handleScroll(cellView, e, x, y, delta) {
        const scaleFactor = 1.1;
        const currentScale = this.paper.scale();

        if (delta > 0) {
            const newX = currentScale.sx * scaleFactor > 5 ? currentScale.sx : currentScale.sx * scaleFactor;
            const newY = currentScale.sy * scaleFactor > 5 ? currentScale.sy : currentScale.sy * scaleFactor;
            this.paper.scale(newX, newY);
        } else if (delta < 0) {
            const newX = currentScale.sx / scaleFactor < 0.52 ? currentScale.sx : currentScale.sx / scaleFactor;
            const newY = currentScale.sy / scaleFactor < 0.52 ? currentScale.sy : currentScale.sy / scaleFactor;
            this.paper.scale(newX, newY);
        }
    }

    handleScrollBlank(e, x, y, delta) {
        this.handleScroll(null, e, x, y, delta);
    }

    unembedElement(cellView, evt, x, y) {
        var cell = cellView.model;

        this.setState({ elementPosition: cell.attributes.position });

        if (!cell.get('embeds') || cell.get('embeds').length === 0) {
            cell.toFront();
        } else {
            // is a parent cell,  store related links
            if (!this.state.movingLinks) {
                var arr = [];
                console.log("CALCULATION");
                _.each(cellView.model.getEmbeddedCells(), child => {
                    // find connected links and add them to array
                    var temp = this.graph.getConnectedLinks(child);

                    for (let i = 0; i < temp.length; i++) {
                        if (arr.findIndex(element => element.cid === temp[i].cid) === -1) {
                            arr.push(temp[i]);
                        }
                    }
                });

                this.setState({ movingLinks: arr });
            }
        }

        if (cell.get('parent')) {
            this.graph.getCell(cell.get('parent')).unembed(cell);
        }
    }

    embedElement(cellView, evt, x, y) {
        var cell = cellView.model;

        if (cell.attributes.type === 'devs.Link') {
            //link dropped
            console.log("link");
            console.log(cell);
            var source = cell.getSourceElement().attributes.role;
            var target;
            if (cell.getTargetElement()) {
                target = cell.getTargetElement().attributes.role;
            }
            console.log(source);
            console.log(target);
            var result = 'delet';

            switch (source) {
                case "threat_source":
                    switch (target) {
                        case "threat_scenario":
                        case "unwanted_incident":
                        case "risk":
                            result = "inititates";
                            break;
                        default:
                            cell.remove();
                    }
                    break;
                case "threat_scenario":
                    if (target === "threat_scenario" || target === "unwanted_incident") {
                        result = "leads_to";
                    } else { cell.remove() }
                    break;
                case "unwanted_incident":
                    if (target === "threat_scenario" || target === "unwanted_incident") {
                        result = "leads_to";
                    } else if (target === "direct_asset") {
                        result = "impacts";
                    } else { cell.remove() }
                    break;
                case "direct_asset":
                case "indirect_asset":
                    if (target === "direct_asset" || target === "indirect_asset") {
                        result = "affects";
                    } else { cell.remove() }
                    break;
                case "treatment":
                    switch (target) {
                        case "vulnerability":
                        case "threat_source":
                        case "risk":
                        case "threat_scenario":
                            result = "treats";
                            break;
                        default:
                            cell.remove();
                       
                    }
                    break;
                default:
                    result = 'delet';
                    cell.remove();
            }
            console.log("The result is: " + result + "!");


            return;
        }

        this.setState({ movingLinks: null });

        // May need more guards, but for now just check for non falsy selectedCellView
        if (this.props.cellResizing) {
            cellView.options.interactive = true;
            this.props.setCellResizing(false);
            cellView.unhighlight();
            return;
        }

        var cellViewsBelow = this.paper.findViewsFromPoint(cell.getBBox().center());

        if (cellViewsBelow.length) {
            var cellViewBelow = _.find(cellViewsBelow, function (c) { return c.model.id !== cell.id });
            if (cellViewBelow && cellViewBelow.model.get('parent') !== cell.id) {
                cellViewBelow.model.embed(cell);
            }
        }
    }

    beginElementResize(cellView, e, x, y) {
        cellView.options.interactive = false;
        this.props.setCellResizing(true);

        // store minimum values of X and Y in state
        // to avoid parent visually excluding child.
        // get pos and size of all children
        var currPos = cellView.model.attributes.position;
        var currSize = cellView.model.attributes.size;

        //var minWidth = 100 + currPos.x;
        //var minHeight = 100 + currPos.y;

        //maybe init as null or 0 or falsy instead
        var maxULX = currPos.x + currSize.width; //max Upper Left X
        var maxULY = currPos.y + currSize.height; //max Upper Left Y

        var minLRX = currPos.x; //min Lower Right X
        var minLRY = currPos.y; //min Lower Right Y

        _.each(cellView.model.getEmbeddedCells(), child => {
            //console.log(child);
            let childPosX = child.attributes.position.x;
            let childPosY = child.attributes.position.y;

            if (childPosX < maxULX) {
                maxULX = childPosX;
            }
            if (childPosY < maxULY) {
                maxULY = childPosY;
            }

            let cX = child.attributes.position.x + child.attributes.size.width;
            let cY = child.attributes.position.y + child.attributes.size.height;

            if (cX > minLRX) {
                minLRX = cX;
            }
            if (cY > minLRY) {
                minLRY = cY;
            }
        });

        let marginOfError = 20;
 
        this.setState({
            maxULX: maxULX,
            maxULY: maxULY,
            minLRX: minLRX,
            minLRY: minLRY,
            changeXPos: x < cellView.model.attributes.position.x + marginOfError,
            changeYPos: y < cellView.model.attributes.position.y + marginOfError
        });
    }

    resizeElement(cellView, e, x, y) {
        if (!this.props.cellResizing) {

            // if not parent return. 
            if (!cellView.model.get('embeds') || !cellView.model.get('embeds').length) {
                return;
            }

            // If no links or vertices return
            if (!this.state.movingLinks) {
                return;
            }

            var currPos = cellView.model.attributes.position;

            var prevPos = this.state.elementPosition;

            this.setState({ elementPosition: currPos });
            var dx = currPos.x - prevPos.x;
            var dy = currPos.y - prevPos.y;

            var arr = this.state.movingLinks;

            for (let i = 0; i < arr.length; i++) {
                var vertices = arr[i].get('vertices');
                if (vertices && vertices.length) {
                    var newVertices = [];

                    for (let j = 0; j < vertices.length; j++) {
                        newVertices.push({ x: vertices[j].x + dx, y: vertices[j].y + dy });
                    }
                    arr[i].set('vertices', newVertices);
                }
            }
            return;
        }

        var pos = cellView.model.attributes.position;
        var size = cellView.model.attributes.size;

        let newPosX = pos.x;
        let newPosY = pos.y;

        let minSize = 100; 

        let newWidth = x - pos.x;
        let newHeight = y - pos.y;

        //console.log(this.state.maxULX + "  " + pos.x);
        
        if (this.state.changeXPos) {
            // needs fix
            if (x > this.state.maxULX) {
                newPosX = this.state.maxULX;
                newWidth = size.width - (this.state.maxULX -pos.x);
            } else {
                newPosX = x;
                newWidth = size.width - (x - pos.x);
            }
        } else {
            if (x < this.state.minLRX) {
                newWidth = this.state.minLRX - pos.x;
            }   
        }
        if (this.state.changeYPos) {
            if (y > this.state.maxULY) {
                newPosY = this.state.maxULY
                newHeight = size.height + (pos.y - this.state.maxULY);
            } else {
                newPosY = y;
                newHeight = size.height + (pos.y - y);
            }
        } else {
            if (y < this.state.minLRY) {
                newHeight = this.state.minLRY - pos.y;

            } 
        }

        newWidth = (newWidth < minSize) ? minSize : newWidth;
        newHeight = (newHeight < minSize) ? minSize : newHeight;

        console.log(newWidth + "  " + newHeight);
        cellView.model.set({
            position: { x: newPosX, y: newPosY },
            size: { width: newWidth, height: newHeight }
        });

        // To make the highlight follow the actual border
        cellView.unhighlight();
        cellView.highlight();
    }

    beginMovePaper(e, x, y) {
        this.setState({ paperMove: { moving: true, x, y } });
    }
    
    movePaper(e, x, y) {
        if (this.state.paperMove.moving) {
            const { tx, ty } = this.paper.translate();
            this.paper.translate(tx + (x - this.state.paperMove.x), ty + (y - this.state.paperMove.y));
        }
    }

    endMovePaper(e, x, y) {
        if (this.state.paperMove.moving) {
            this.setState({ paperMove: { moving: false } })
        }
    }

    onHover(cellView, evt) {
        console.log(cellView);
        if (cellView.model.attributes.type !== 'coras.roundRectElement') {
            return;
        }

        var cell = cellView.model;

        cellView.highlight();
        // show subelement of rect
        //cell.attr('corners/visibility', 'visible');
        //groupselector not working for some reason
        cell.attr({
            sizeSelectorUL: { visibility: 'visible' },
            sizeSelectorUR: { visibility: 'visible' },
            sizeSelectorLL: { visibility: 'visible' },
            sizeSelectorLR: { visibility: 'visible' }
        });
    }

    exitHover(cellView, evt) {
        var cell = cellView.model;
        if (cellView.model.attributes.type !== 'coras.roundRectElement') {
            return;
        }

        var cell = cellView.model;

        cellView.unhighlight();
        //cell.attr('corners/visibility', 'hidden');
        cell.attr({
            sizeSelectorUL: { visibility: 'hidden' },
            sizeSelectorUR: { visibility: 'hidden' },
            sizeSelectorLL: { visibility: 'hidden' },
            sizeSelectorLR: { visibility: 'hidden' }
        });
    }

    updatePaperSize() {
        this.paper.setDimensions(
            document.getElementById(this.paperWrapperId).offsetWidth - 10,
            document.getElementById(this.paperWrapperId).offsetHeight - 10);
    }

    removeLink(elementView, e, x, y) {
        if (!this.state.linkToRemove) this.setState({ linkToRemove: elementView });
        else if (this.state.linkToRemove === elementView) {
            this.setState({ linkToRemove: null });
            elementView.model.remove();
        } else this.setState({ linkToRemove: null });
    }

    paperOnMouseUp(e) {
        e.preventDefault();
        const localPoint = this.paper.pageToLocalPoint(e.pageX, e.pageY);
        this.props.elementDropped(this.paper.model, localPoint.x, localPoint.y);
        var cellView = this.paper.findViewByModel(this.props.newElement);
        //console.log(cellView);
        this.embedElement(cellView);
    }



    saveGraphToFile(e) {
        e.preventDefault();
        const a = document.createElement('a');
        const graphContent = new Blob([JSON.stringify(this.graph.toJSON(), null, 2)], { type: 'text/plain' });
        a.href = URL.createObjectURL(graphContent);
        a.download = "CORASDiagram.json";
        a.click();
        a.remove();
    }

    loadGraphFromFile(e) {
        const filePath = e.target;
        const reader = new FileReader();
        if (filePath.files && filePath.files[0]) {
            reader.addEventListener('load', (e) => this.graph.fromJSON(JSON.parse(e.target.result)), { once: true });
            reader.readAsText(filePath.files[0]);
            filePath.value = "";
        }
    }

    clearGraph(e) {
        this.graph.clear();
        window.localStorage.removeItem(this.paperId + "graph_" + this.props.currGraph.label);
        if (this.props.initialDiagram) this.graph.fromJSON(this.props.initialDiagram);
        this.props.clearConfirmed();
    }

    downloadSvg() {
        let svgElement = this.paper.svg;
        const toolElems = svgElement.getElementsByClassName("link-tools");
        const arrowElems = svgElement.getElementsByClassName("marker-arrowhead");

        const toolArray = Array.from(toolElems);
        const arrowArray = Array.from(arrowElems);

        toolArray.forEach((elem) => elem.remove());
        arrowArray.forEach((elem) => elem.remove());

        // Add other standard font
        svgElement.style.fontFamily = "Oswald, sans-serif";

        //get svg source.
        let serializer = new XMLSerializer();
        let source = serializer.serializeToString(svgElement);

        //add name spaces.
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        // Fix svg size
        let search = /(<svg xmlns="\S*" xmlns:xlink="\S*" version="\S*" id="\S*" width=)\S*( height=)\S*(>)/gm;
        let replace = `$1"${this.paperRef.current.offsetWidth}px"$2"${this.paperRef.current.offsetHeight}px"$3`
        source = source.replace(search, replace);

        //add xml declaration
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

        //convert svg source to URI data scheme.
        let url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

        let a = document.createElement('a');
        a.href = url;
        a.download = 'CORASDiagram.svg';
        a.click();
        a.remove();
    }

    cellToolHandleMoved(e) {
        console.log('Celltoolhandlemoved');
        const { pageX, pageY } = e;

        const newHeight = pageY - (this.props.cellTool.position.y + this.props.cellToolHeight) + this.props.cellToolHeight;

        if(this.props.cellTool.handleHeld) this.props.cellHandleMoved(this.props.cellToolWidth, newHeight);
    }

    // not sure how to do through redux
    changeGraph(label, graph) {
        //assume that graph is JSONgraph
        this.props.setGraph(this.props.currGraph.label, this.graph.toJSON());
        this.props.setCurrGraph(label, graph.toJSON());
        //this.paper.model = graph; 
        this.graph.fromJSON(graph.toJSON());
        console.log(graph);
    }

    render() {
        return (
            <div className="editor-wrapper">
                <EditorMenu
                    loadStartFn={() => this.loadRef.current.click()}
                    loadFn={this.loadGraphFromFile}
                    loadRef={this.loadRef}
                    saveFn={this.saveGraphToFile}
                    clearFn={this.clearGraph}
                    showClearModal={this.props.showClearModal}
                    clearPosition={this.props.clearPosition}
                    clearClicked={this.props.clearClicked}
                    downloadFn={this.downloadSvg}
                    currDiagram={this.props.currGraph.label} />
                <DiagramSelector
                    paperId={this.paperId}
                    paperWrapperId={this.paperWrapperId}
                    isInteractive={this.props.interactive}
                    handleScroll={this.handleScroll}
                    handleScrollBlank={this.handleScrollBlank}
                    beginMovePaper={this.beginMovePaper}
                    movePaper={this.movePaper}
                    endMovePaper={this.endMovePaper}
                    updatePaperSize={this.updatePaperSize}
                    changeGraph={this.changeGraph}
                />
                {this.props.elementEditor.visible ? <ElementEditor
                    {...this.props.elementEditor.data}
                    cancel={this.props.elementEditorCancel}
                    save={this.props.elementEditorSave}
                    delete={this.props.elementEditorDelete}
                    labelOnChange={this.props.elementEditorLabelEdit}
                    xOnChange={this.props.elementEditorChangeX}
                    yOnChange={this.props.elementEditorChangeY}
                    typeOnChange={this.props.elementEditorChangeType} /> : null}
                <div
                    id={this.paperWrapperId}
                    className="editor-paper"
                    onDragEnter={(e) => e.preventDefault()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={this.paperOnMouseUp}
                    style={{ width: `${this.props.width}px`, height: `${this.props.height}px` }}
                    ref={this.paperRef} >
                    <div id={this.paperId}></div>
                </div>
                {this.props.interactive || this.props.interactive === undefined ?
                    <EditorTool toolDefinitions={ToolDefinitions} paper={this.paper} /> : null}
            </div>);
    }
}



const EditorMenu = ({ loadStartFn, loadRef, loadFn, saveFn, clearFn, showClearModal, clearClicked, clearPosition, downloadFn, currDiagram }) =>
    <div className="editor-menu">
        <button className="editor-menu__button" onClick={loadStartFn}>Load</button>
        <input type="file" name="loadFile" label="Load" className="editor-menu__hidden" onChange={loadFn} ref={loadRef} />
        <button className="editor-menu__button" onClick={saveFn}>Save</button>
        <button className="editor-menu__button" onClick={clearClicked}>Clear</button>
        <Modal isOpen={showClearModal} noBackground={true} position={clearPosition}>
            <div className="editor-clear-modal">
                <div className="editor-clear-modal__description">Are you sure you want to clear the {currDiagram} diagram?</div>
                <button className="editor-clear-modal__button editor-clear-modal__button--danger" onClick={clearFn}>Yes, clear</button>
                <button className="editor-clear-modal__button editor-clear-modal__button" onClick={clearClicked}>No, cancel</button>
            </div>
        </Modal>
        <button className="editor-menu__button" onClick={downloadFn}>Download (SVG)</button>
    </div>;

export default connect((state) => ({
    elementEditor: state.editor.elementEditor,
    showClearModal: state.editor.editorMenu.showClearModal,
    clearPosition: state.editor.editorMenu.clearPosition,
    cellTool: state.editor.cellTool,
    cellToolWidth: state.editor.cellTool.size.width,
    cellToolHeight: state.editor.cellTool.size.height,
    currGraph: state.editor.currGraph,
    diagramTypes: state.editor.diagramTypes,
    cellResizing: state.editor.cellResizing,
    elementPosition: state.editor.elementPosition,
    movingLinks: state.editor.movingLinks,
    newElement: state.editor.movement.element

}), (dispatch) => ({
    elementRightClicked: (element, graph) => dispatch(ElementRightClicked(element, graph)),
    elementDoubleClicked: (element, event) => dispatch(ElementDoubleClicked(element, event)),
    elementEditorCancel: () => dispatch(ElementEditorCancel()),
    elementEditorSave: () => dispatch(ElementEditorSave()),
    elementEditorDelete: () => dispatch(ElementEditorDelete()),
    elementEditorLabelEdit: (label) => dispatch(ElementLabelEdit(label)),
    elementEditorChangeX: (x) => dispatch(ElementChangeX(x)),
    elementEditorChangeY: (y) => dispatch(ElementChangeY(y)),
    elementEditorChangeType: (type) => dispatch(ElementChangeType(type)),
    elementDropped: (graph, pageX, pageY) => dispatch(ToolElementRelease(graph, pageX, pageY)),
    clearClicked: (e) => dispatch(MenuClearClicked(e)),
    clearConfirmed: () => dispatch(MenuClearConfirmed()),
    cellClicked: (x, y, width, height) => dispatch(CellClicked(x, y, width, height)),
    cellHandleClicked: (handle) => dispatch(CellHandleClicked(handle)),
    cellHandleReleased: () => dispatch(CellHandleRelased()),
    cellHandleMoved: (width, height) => dispatch(CellHandleMoved(width, height)),
    clearGraph: (label) => dispatch(ClearGraph(label)),
    setGraph: (label, graph) => dispatch(SetGraph(label, graph)),
    setCurrGraph: (label, graph) => dispatch(SetCurrGraph(label, graph)),
    setPaper: (paper) => dispatch(SetPaper(paper)),
    setCellResizing: (boolean) => dispatch(SetCellResizing(boolean)),
    setElementPosition: (pos) => dispatch(SetElementPosition(pos)),
    setMovingLinks: (arr) => dispatch(SetMovingLinks(arr))
}))(Editor);
