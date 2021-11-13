import * as rulesHandlerUtility from './rulesHandlerUtility';
describe('rulesHandlerUtility - mergeRules', () => {
    it('runs when new values are undefined', () => {
        const result = rulesHandlerUtility.mergeRules([], undefined);        
        expect(result).toEqual({ merged: [], haschanges: false });
    });
});

