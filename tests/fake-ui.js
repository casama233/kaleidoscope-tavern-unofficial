export const ui={responses:[],forms:[]};
class Form{constructor(){this.type=this.constructor.name;this.buttons=[];this.fields=[];}title(v){this.heading=v;return this;}body(v){this.content=v;return this;}button(v,icon){this.buttons.push({text:v,icon});return this;}textField(...args){this.fields.push({type:'text',args});return this;}dropdown(...args){this.fields.push({type:'dropdown',args});return this;}async show(player){ui.forms.push(this);return ui.responses.shift()??{canceled:true};}}
export class ActionFormData extends Form{}export class ModalFormData extends Form{}
