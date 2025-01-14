/*********************************************************************************************************************
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance        *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://aws.amazon.com/asl/                                                                                    *
 *                                                                                                                    *
 *  or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/
const crypto = require('crypto');

class ImageRequest {

    /**
     * Initializer function for creating a new image request, used by the image
     * handler to perform image modifications.
     * @param {Object} event - Lambda request body.
     */
    async setup(event) {
        try {
            // this.parseHash(event);
            this.bucket = process.env.SOURCE_BUCKET;
            this.key = this.parseImageKey(event);
            this.edits = this.decodeRequest(event);

            this.originalImage = await this.getOriginalImage(this.bucket, this.key);
            return Promise.resolve(this);
        } catch (err) {
            return Promise.reject(err);
        }
    }

    /**
     * Gets the original image from an Amazon S3 bucket.
     * @param {String} bucket - The name of the bucket containing the image.
     * @param {String} key - The key name corresponding to the image.
     * @return {Promise} - The original image or an error.
     */
    async getOriginalImage(bucket, key) {
        const S3 = require('aws-sdk/clients/s3');
        const s3 = new S3();
        const imageLocation = { Bucket: bucket, Key: key };
        const request = s3.getObject(imageLocation).promise();
        try {
            const originalImage = await request;
            return Promise.resolve(originalImage);
        }
        catch(err) {
            return Promise.reject({
                status: 500,
                code: err.code,
                message: err.message
            })
        }
    }

    /**
     * Parses the edits to be made to the original image.
     * @param {String} event - Lambda request body.
     */
    parseImageEdits(event) {
        const decoded = this.decodeRequest(event);
        return decoded.edits;
    }

    /**
     * Parses the name of the appropriate Amazon S3 key corresponding to the
     * original image.
     * @param {String} event - Lambda request body.
     */
    parseImageKey(event) {
        // Decode the image request and return the image key
        // Ensure the path starts with our prefix
        let key = event["path"];
        if (!key.startsWith('/' + process.env.OBJECT_PREFIX)) {
            key = '/' + process.env.OBJECT_PREFIX + key;
        }
        if(key.startsWith('/')) {
            key = key.substr(1);
        }
        return key;
    }

    /**
     * Parses the name of the appropriate Amazon S3 key corresponding to the
     * original image.
     * @param {String} event - Lambda request body.
     */
    parseHash(event) {
        const {pathParameters, path} = event;
        if (!pathParameters || pathParameters['s'] === undefined)  {
            throw {
                status: 400,
                code: 'RequestTypeError',
                message: 'Security hash not present'
            };
        }
        const hash = pathParameters['s'];
        const splitPath = path.split("/");
        const encoded = splitPath[splitPath.length - 1];
        const toBuffer = new Buffer(encoded, 'base64');
        const decoded = toBuffer.toString('ascii');
        const source = decoded + process.env.SECURITY_KEY;
        const parsed = crypto.createHash('md5').update(source).digest("hex");
        if (parsed !== hash) {
            throw {
                status: 401,
                code: 'RequestTypeError',
                message: 'Invalid security hash ' + parsed + ' != ' + hash
            };
        }
        return parsed;
    }

    /**
     * Decodes the image request path associated with default
     * image requests. Provides error handling for invalid or undefined path values.
     * @param {Object} event - The proxied request object.
     */
    decodeRequest(event) {
        let qp = event["queryStringParameters"];
        if (!qp) {
            qp = {};
        }

        // We need an output format immediately
        // if (!qp["fm"]) {
        //     qp.fm = 'jpeg';
        // }

        return qp;
    }
}

// Exports
module.exports = ImageRequest;
