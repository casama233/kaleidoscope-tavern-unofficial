import {createBreakFeedback} from '../core/break-feedback-engine.js';
import {BREAK_FEEDBACK} from '../data/break-feedback.js';
import {externalBreakFeedback} from '../core/extension-content.js';
export const breakProfile=id=>BREAK_FEEDBACK[id]??externalBreakFeedback(id);
export const feedback=createBreakFeedback(breakProfile);
