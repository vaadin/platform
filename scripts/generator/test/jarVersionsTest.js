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

    it('should split the packages the jars pin between the two npm packages', function () {
        const result = jarVersions.splitPinnedVersions(
            {
                "@vaadin/text-field": "25.4.0",
                "@vaadin/charts": "25.4.0",
                "date-fns": "4.1.0"
            },
            ["@vaadin/charts", "@vaadin/crud"]
        );

        expect(result).to.deep.equal({
            core: { "@vaadin/text-field": "25.4.0" },
            vaadin: { "@vaadin/charts": "25.4.0" }
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
