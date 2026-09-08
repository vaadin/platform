const expect = require('chai').expect;
const jarVersions = require('../src/jarVersions.js');

describe('Jar pinned versions', function () {
    it('should add the packages the jars pin', function () {
        const versions = {
            "text-area": {
                "jsVersion": "25.4.0",
                "mode": "lit",
                "npmName": "@vaadin/text-area"
            }
        };

        const result = jarVersions.withPinnedVersions(versions, {
            "@vaadin/text-field": "25.4.1",
            "@vaadin/text-area": "25.4.1"
        });

        expect(result).to.deep.equal({
            "text-area": {
                "jsVersion": "25.4.0",
                "mode": "lit",
                "npmName": "@vaadin/text-area"
            },
            "text-field": {
                "jsVersion": "25.4.1",
                "npmName": "@vaadin/text-field"
            }
        });
    });

    it('should leave the versions alone when no jar pins a package', function () {
        const versions = {
            "text-field": {
                "jsVersion": "25.4.0",
                "mode": "lit",
                "npmName": "@vaadin/text-field"
            }
        };

        const result = jarVersions.withPinnedVersions(versions, {});

        expect(result).to.deep.equal(versions);
    });
});
