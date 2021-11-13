import * as userprofileHandlerUtility from './userprofileHandlerUtility';
import {v4 as uuidv4} from 'uuid';
import { IUserProfileStatus } from '../Shared/UserprofileModels';

describe('rulesHandlerUtility - mergeRules', () => {
    const currentprofileid = uuidv4();
    const fourMonthsAgo = Date.now() - (4 * 30 * 24 * 60 * 60 * 1000);
    describe('existing array is empty', () => {
        it('runs when new values are undefined', () => {
            const result = userprofileHandlerUtility.mergeUserprofiles(currentprofileid, [], undefined);        
            expect(result).toEqual({ merged: [], haschanges: false });
        });
        it('yields an empty array when new values are empty', () => {
            const result = userprofileHandlerUtility.mergeUserprofiles(currentprofileid, [], []);        
            expect(result).toEqual({ merged: [], haschanges: false });
        });
        it('yields the new item', () => {
            const newItem : IUserProfileStatus = {
                chromeInstanceId: uuidv4(),
                updated: Date.now()
            };
            const result = userprofileHandlerUtility.mergeUserprofiles(currentprofileid, [], [newItem]);            
            expect(result).toEqual({ merged: [newItem], haschanges: false });
        });
        it('provided new item without update value, yields the new item with update value', () => {
            const newItem : IUserProfileStatus = {
                chromeInstanceId: uuidv4()                
            };
            const result = userprofileHandlerUtility.mergeUserprofiles(currentprofileid, [], [newItem]);            
            expect(result.merged[0].updated).toBeDefined();
        });
        it('provided outdated deleted item, is not added to the result', () =>{
            const newItem : IUserProfileStatus = {
                chromeInstanceId: uuidv4() ,
                updated: fourMonthsAgo,
                deleted: true
            };
            const result = userprofileHandlerUtility.mergeUserprofiles(currentprofileid, [], [newItem]);            
            expect(result.merged).toEqual([]);
        });
        it('provided current profile as deleted, is reverted', () => {
            const newItem : IUserProfileStatus = {
                chromeInstanceId: currentprofileid,                
                deleted: true
            };
            const result = userprofileHandlerUtility.mergeUserprofiles(currentprofileid, [], [newItem]);            
            expect(result.merged[0].deleted).toBeFalsy();
        });
        it('provided some profile as deleted, is added to the result', () => {
            const newItem : IUserProfileStatus = {
                chromeInstanceId: uuidv4(),
                deleted: true
            };
            const result = userprofileHandlerUtility.mergeUserprofiles(currentprofileid, [], [newItem]);            
            expect(result.merged[0].deleted).toBeTruthy();
        });
    }); // describe empty array
    describe('existing array contains one user profile', () => {
        it('with item not having an updated timestamp, is provided a fresh update value', () => {
            const existingItem : IUserProfileStatus = {
                chromeInstanceId: uuidv4()                
            };
            const result = userprofileHandlerUtility.mergeUserprofiles(currentprofileid, [existingItem], []);            
            expect(result.merged[0].updated).toBeDefined();
        });
        it('with old item which is not deleted, is not removed from the result', () => {
            const existingItem : IUserProfileStatus = {
                chromeInstanceId: uuidv4(),
                updated: fourMonthsAgo
            };
            const result = userprofileHandlerUtility.mergeUserprofiles(currentprofileid, [existingItem], []);
            expect(result.merged[0]).toEqual(existingItem);
        });
        it('with outdated deleted item, is removed', () => {
            const existingItem : IUserProfileStatus = {
                chromeInstanceId: uuidv4() ,
                updated: fourMonthsAgo,
                deleted: true
            };
            const result = userprofileHandlerUtility.mergeUserprofiles(currentprofileid, [existingItem], []);            
            expect(result.merged).toEqual([]);
        });
        it('same user profile with newer update timestamp is added, deemed no changes', () => {
            const existingItem : IUserProfileStatus = {
                chromeInstanceId: currentprofileid,
                updated: Date.now()                
            };
            const newItem : IUserProfileStatus = {
                chromeInstanceId: currentprofileid,
                updated: existingItem.updated! + 1000
            };
            const result = userprofileHandlerUtility.mergeUserprofiles(currentprofileid, [existingItem], [newItem]);            
            expect(result.merged).toEqual([newItem]);
            expect(result.haschanges).toBeFalsy();
        });
        it('same user profile with older update timestamp is added, deemed having changes', () => {
            const existingItem : IUserProfileStatus = {
                chromeInstanceId: currentprofileid,
                updated: Date.now()                
            };
            const newItem : IUserProfileStatus = {
                chromeInstanceId: currentprofileid,
                updated: existingItem.updated! - 1000
            };
            const result = userprofileHandlerUtility.mergeUserprofiles(currentprofileid, [existingItem], [newItem]);            
            expect(result.merged).toEqual([newItem]);
            expect(result.haschanges).toBeTruthy();
        });
        it('a new other user profile is added', () => {
            const existingItem : IUserProfileStatus = {
                chromeInstanceId: uuidv4()                
            };
            const newItem : IUserProfileStatus = {
                chromeInstanceId: uuidv4()                
            };
            const result = userprofileHandlerUtility.mergeUserprofiles(currentprofileid, [existingItem], [newItem]);            
            expect(result.merged.length).toEqual(2);
            expect(result.haschanges).toBeTruthy();
        });
    });    
}); // describe mergeUserprofiles