const sharp = require('sharp');
const paramValidators = require('../helpers/paramValidators');

/**
 *
 * @param {Sharp} image
 * @param width
 * @param height
 * @returns {*}
 */
exports.scaleClip = (image, width = null, height = null) => {

    if (!paramValidators.widthOrHeightValid(width, height)) {
        throw ({
            status: 400,
            code: 'size::InvalidDimensions',
            message: 'Either width AND/OR height must be specified and a positive number when using scale-clip'
        });
    }
    image.resize({
        width: width,
        height: height,
        withoutEnlargement: true,
        fit: sharp.fit.inside
    });
};


/**
 *
 * @param {Sharp} image
 * @param width
 * @param height
 * @param color
 * @returns {*}
 */
exports.fill = async (image, width = null, height = null, color = null) => {
    if (!paramValidators.widthOrHeightValid(width, height)) {
        throw ({
            status: 400,
            code: 'size.fill::InvalidDimensions',
            message: 'Either width AND/OR height must be specified and a positive number when using scale-clip'
        });
    }
    let resizeParams = {
        withoutEnlargement: false,
        fit: sharp.fit.contain
    };
    if (width) {
        resizeParams.width = width;
    }
    if (height) {
        resizeParams.height = height;
    }
    // TODO: Validate color more explicitly
    if (color) {
        resizeParams.background = color;
    }
    image.resize(resizeParams);
};

/**
 * Stretch an image to fit the dimensions requested
 * @param {Sharp} image
 * @param width
 * @param height
 * @returns {*}
 */
exports.scale = (image, width, height) => {
    if (!paramValidators.widthAndHeightValid(width, height)) {
        throw ({
            status: 400,
            code: 'size::InvalidDimensions',
            message: 'Width AND height must be specified and a positive number when using fit-scale'
        });
    }
    image.resize({
        width: width,
        height: height,
        withoutEnlargement: true,
        fit: sharp.fit.fill
    });
};

/**
 * Handle cropping modes
 * @param {Sharp} image
 * @param width
 * @param height
 * @param crop
 * @param fpx
 * @param fpy
 * @returns {*}
 */
exports.scaleCrop = async (image, width = null, height = null, crop = null, fpx = null, fpy = null) => {
    // top, bottom, left, right, faces, focalpoint, edges, and entropy
    if (!paramValidators.widthOrHeightValid(width, height)) {
        throw ({
            status: 400,
            code: 'size::InvalidDimensions',
            message: 'Either width AND/OR height must be specified and a positive number when using fit-crop'
        });
    }


    // extract metadata from image to resize
    const metadata = await image.metadata();

    const originalWidth = parseFloat(metadata.width)
    const originalHeight = parseFloat(metadata.height)

    // compute new width & height
    const factor = Math.max(width / originalWidth, height / originalHeight)
    const newWidth = parseInt(originalWidth * factor)
    const newHeight = parseInt(originalHeight * factor)


    // if we don't have a focal point, default to center-center
    if (crop !== 'focalpoint') {
        fpx = 0.5;
        fpy = 0.5;

        // use position arguments to set focal point, if provided
        if (crop !== null) {
            const pos = crop.split(',');
            if (pos.includes('left')) {
                fpx = 0;
            } else if (pos.includes('right')) {
                fpx = 1;
            }
            if (pos.includes('top')) {
                fpy = 0;
            } else if (pos.includes('bottom')) {
                fpy = 1;
            }
        }
    }

    let fpx_left = Math.floor((newWidth * fpx) - (0.5 * width));
    let fpy_top = Math.floor((newHeight * fpy) - (0.5 * height));

    // ensure extracted region doesn't exceed image bounds
    if (width > newWidth) {
        width = newWidth
    }
    if (height > newHeight) {
        height = newHeight
    }

    // adjust focal point x
    if (fpx_left + width > newWidth) {
        fpx_left = newWidth - width
    } else if (fpx_left < 0) {
        fpx_left = 0
    }

    // adjust focal point y
    if (fpy_top + height > newHeight) {
        fpy_top = newHeight - height
    } else if (fpy_top < 0) {
        fpy_top = 0
    }

    image.resize({
        width: newWidth,
        height: newHeight,
        withoutEnlargement: false,
        fit: sharp.fit.fill
    }).extract({
        left: fpx_left,
        top: fpy_top,
        width: width,
        height: height
    });
};
