import { IRule } from "../Shared/RuleModels";
import {v4 as uuidv4} from 'uuid';

export function mergeRules(oldValue: IRule[], newValue: IRule[]|undefined) {
    const mergedMap = new Map<string, IRule>();  
  
    const threeMonthsAgo = Date.now() - (3 * 30 * 24 * 60 * 60 * 1000);
    newValue?.forEach(u => {
      if (!u.updated) {
        u.updated = Date.now();
      }
      if (!u.deleted || u.updated > threeMonthsAgo) {
        if (!u.id) {
          u.id = uuidv4();
        }
        mergedMap.set(u.id, u); 
      }
    });
    let haschanges = false;
    oldValue.forEach(u => {
      if (!u.id) {
        u.id = uuidv4();
      }
      if (mergedMap.has(u.id)) {
        const found = mergedMap.get(u.id)!;            
        if (u?.updated && (!found.updated || found.updated < u.updated)) {
            haschanges = true;
            found.regex = u.regex;
            found.targetUserprofile = u.targetUserprofile;
            found.deleted = u.deleted;
        }
      }
      else {
        // ensure updated property is set for existing records:
        if (!u.updated) {
          u.updated = Date.now();
        }
        // ensure deleted record is fresh:
        if (!u.deleted || u.updated > threeMonthsAgo) {
          haschanges = true;
          mergedMap.set(u.id, u);
        }
      }        
    });
  
    const merged = Array.from(mergedMap, ([_, value]) => value);
    return {
      merged: merged,
      haschanges: haschanges
    };
  }