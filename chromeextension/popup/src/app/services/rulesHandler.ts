import { Injectable, NgZone } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { ScriptChromeMessagingWithPort } from "../../../../src/Messaging/ScriptChromeMessagingPort";
import { IRule } from "../../../../src/Shared/RuleModels";
import {v4 as uuidv4} from 'uuid';

@Injectable({
    providedIn: 'root',
})
export class RulesHandler {
    private messaging: ScriptChromeMessagingWithPort;
    rules : BehaviorSubject<Array<IRule>>  = new BehaviorSubject<Array<IRule>>([]);   
    constructor(private ngZone: NgZone) {
        this.messaging = ScriptChromeMessagingWithPort.getInstance('popup');
        this.messaging.messageHandlers.set('rules', (message, port) => {
            ngZone.run(() => {
                this.rules.next(message.payload);
            });
        });
        this.messaging.sendMessage({
            type: 'getrules'    
        });                
    }
    addRule(rule: IRule) {
        rule.id = rule.id || uuidv4();
        rule.updated = Date.now();
        const newRules = this.rules.value;
        newRules.push(rule);
        this.messaging.sendMessage({
            type: 'rules',
            payload: newRules
        });
    }

    // deleteRule(idx: number) {
    //     const newRules = this.rules.value;
    //     newRules.splice(idx, 1);
    //     this.messaging.sendMessage({
    //         type: 'rules',
    //         payload: newRules
    //     });
    // }
    deleteRule(rule: IRule) {
        const newRules = this.rules.value;
        //newRules.splice(newRules.indexOf(rule), 1);
        rule.deleted = true;
        this.messaging.sendMessage({
            type: 'rules',
            payload: newRules
        });
    }

    changeRule(oldrule: IRule, rule: IRule) {
        //const newRules = this.rules.value;
        oldrule.regex = rule.regex;
        oldrule.targetUserprofile = rule.targetUserprofile;
        oldrule.updated = Date.now();        
        this.messaging.sendMessage({
            type: 'rules',
            payload: this.rules.value
        });
    }
}