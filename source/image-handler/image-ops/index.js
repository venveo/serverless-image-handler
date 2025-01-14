const adjustment = require('./adjustment');
const size = require('./size');

exports.apply = async (image, edits) => {

    // Apply brightness. 0 - 100
    if (edits["bri"]) {
        adjustment.bri(image, Math.round(Number(edits["bri"] / 100)));
    }

    // Sharpen. bool
    if (edits["sharp"]) {
        adjustment.sharp(image)
    }

    const {w, h, fit, crop} = edits;
    if (w || h) {
        switch(fit) {
            case 'clamp':
                throw ({
                    status: 400,
                    code: 'scale::NotImplemented',
                    message: 'Sorry, this transform is not implemented yet. Open a PR!'
                });
                break;
            case 'fill':
                await size.fill(image, Number(w), Number(h), edits["fill-color"]);
                break;
            case 'fillmax':
                throw ({
                    status: 400,
                    code: 'scale::NotImplemented',
                    message: 'Sorry, this transform is not implemented yet. Open a PR!'
                });
                break;
            case 'max':
                throw ({
                    status: 400,
                    code: 'scale::NotImplemented',
                    message: 'Sorry, this transform is not implemented yet. Open a PR!'
                });
                break;
            case 'min':
                throw ({
                    status: 400,
                    code: 'scale::NotImplemented',
                    message: 'Sorry, this transform is not implemented yet. Open a PR!'
                });
                break;
            case 'scale':
                size.scale(image, Number(w), Number(h));
                break;
            case 'crop':
                await size.scaleCrop(image, Number(w), Number(h), crop, Number(edits["fp-x"]), Number(edits["fp-y"]));
                break;
            case 'clip':
            default:
                size.scaleClip(image, Number(w), Number(h));
                break;
        }
    }
};
