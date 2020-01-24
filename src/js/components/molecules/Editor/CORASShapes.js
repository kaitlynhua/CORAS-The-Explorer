import { riskSymbol } from "./svg//CorasSymbolsBase64.js";

function AddCorasShapes(joint) {
    joint.dia.Element.define("coras.unboxedElement", {
        attrs: {
            linkHandler: {
                refWidth: "225%",
                refHeight: "100%",
                fill: "#FFF",
                fillOpacity: 0,
                refX: "-75%",
                refY: "0",
                magnet: true
            },
            text: {
                text: "Asset",
                refX: "50%",
                refY: "55%",
                textAnchor: "middle",
                textVerticalAnchor: "top"
            },
        }
    }, {
        markup: [
            {
                tagName: "rect",
                selector: "linkHandler"
            },
            {
                tagName: "image",
                selector: "icon",
            },
            {
                tagName: "text",
                selector: "text"
            }
        ]
    });
    joint.dia.Element.define("coras.ellipseElement", {
        attrs: {
            body: {
                refCx: "50%",
                refCy: "50%",
                refRx: "50%",
                refRy: "50%",
                fill: "#fff",
                stroke: "#000",
                magnet: true
            },
            innerBody: {
                refCx: "50%",
                refCy: "50%",
                refRx: "45%",
                refRy: "45%",
                fill: "#FFF",
            },
            text: {
                refX: "50%",
                refY: "50%",
                textVerticalAnchor: 'middle',
                textAnchor: 'middle'
            },
            icon: {
                refWidth: "40%",
                refHeight: "40%",
                refX: "30%",
                refY: "-25%",
            }
        }
    }, {
        markup: [
            {
                tagName: "ellipse",
                selector: "body"
            },
            {
                tagName: "ellipse",
                selector: "innerBody"
            },
            {
                tagName: "image",
                selector: "icon"
            },
            {
                tagName: "text",
                selector: "text"
            }
        ]
    });
    joint.dia.Element.define("coras.rectElement", {
        attrs: {
            body: {
                refX: "0",
                refY: "0",
                refWidth: "100%",
                refHeight: "100%",
                fill: "#FFF",
                stroke: "#000",
                magnet: true
            },
            innerBody: {
                refX: "5%",
                refY: "5%",
                refWidth: "90%",
                refHeight: "90%",
                fill: "#FFF"
            },
            icon: {
                refWidth: "50%",
                refHeight: "50%",
                refX: "75%",
                refY: "-25%"
            },
            text: {
                refX: "50%",
                refY: "50%",
                textVerticalAnchor: "middle",
                textAnchor: "middle"
            }
        }
    }, {
        markup: [
            {
                tagName: "rect",
                selector: "body"
            },
            {
                tagName: "rect",
                selector: "innerBody"
            },
            {
                tagName: "image",
                selector: "icon"
            },
            {
                tagName: "text",
                selector: "text"
            }
        ]
    });
    joint.dia.Element.define("coras.roundRectElement", {
        attrs: {
            body: {
                rx: 15,
                ry: 15,
                refX: "0",
                refY: "0",
                refWidth: "100%",
                refHeight: "100%",
                fill: "#FFF",
                stroke: "#000",
            },
            cornerBox: {
                refX: "0%",
                refY: "0%",
                //refWidth: "20%",
                ///refHeight: "20%",
                width: 90,
                height: 90,
                fill: "#FFF",
                stroke: "#000000"
            },/*
            icon: {
                visibility: 'hidden',
                width: 15,
                height: 15,
                refX: "99%",
                refY: "99%"
            }, */
            sizeSelectorUL: {
                event: 'element:sizeSelector:pointerdown',
                visibility: 'hidden',
                r: 7,
                opacity: 0.5,
                refX: "1%",
                refY: "1%"
            },
            sizeSelectorUR: {
                event: 'element:sizeSelector:pointerdown',
                visibility: 'hidden',
                r: 7,
                opacity: 0.5,
                refX: "99%",
                refY: "1%"
            },
            sizeSelectorLL: {
                event: 'element:sizeSelector:pointerdown',
                visibility: 'hidden',
                r: 7,
                opacity: 0.5,
                refX: "1%",
                refY: "99%"
            },
            sizeSelectorLR: {
                event: 'element:sizeSelector:pointerdown',
                visibility: 'hidden',
                r: 7,
                opacity: 0.5,
                refX: "99%",
                refY: "99%"
            }
        }
    }, {
        markup: [
            {
                tagName: "rect",
                selector: "body"
            },
            {
                tagName: "rect",
                selector: "cornerBox"
            },/*
            {
                tagName: "image",
                selector: "icon"
            },*/
            {
                tagName: "circle",
                selector: "sizeSelectorUL",
                groupSelector: "corners"
            },
            {
                tagName: "circle",
                selector: "sizeSelectorUR",
                groupSelector: "corners"
            },
            {
                tagName: "circle",
                selector: "sizeSelectorLL",
                groupSelector: "corners"
            },
            {
                tagName: "circle",
                selector: "sizeSelectorLR",
                groupSelector: "corners"
            }
        ]
    });
}

export default AddCorasShapes;
