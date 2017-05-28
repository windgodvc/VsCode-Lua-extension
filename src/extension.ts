/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import { 
	ExtensionContext, 
	StatusBarAlignment, 
	window, StatusBarItem, 
	Selection, 
	// workspace, 
	// TextEditor, 
	commands,
	Position ,
	TextEditorRevealType 
} from 'vscode';

export function activate(context: ExtensionContext) {
	const status = window.createStatusBarItem(StatusBarAlignment.Right, 100);
	status.command = 'extension.searchLuaFun';
	status.text = '$(search)' + "搜索Lua函数";
	status.show()
	context.subscriptions.push(status);

	const statusTime = window.createStatusBarItem(StatusBarAlignment.Left, 300);
	statusTime.show()
	context.subscriptions.push(statusTime);
	
	

	// context.subscriptions.push(window.onDidChangeActiveTextEditor(e => updateStatus(status)));
	// context.subscriptions.push(window.onDidChangeTextEditorSelection(e => updateStatus(status)));
	// context.subscriptions.push(window.onDidChangeTextEditorViewColumn(e => updateStatus(status)));
	// context.subscriptions.push(workspace.onDidOpenTextDocument(e => updateStatus(status)));
	// context.subscriptions.push(workspace.onDidCloseTextDocument(e => updateStatus(status)));

	let curDate = new Date();
	curDate.setSeconds(0);

	statusTime.text = getRunTotalTime(curDate);
	setInterval(()=>{
		var t = new Date();
		 statusTime.text = getRunTotalTime(curDate);
	},1000)


	context.subscriptions.push(commands.registerCommand('extension.searchLuaFun', () => {
		if (window.activeTextEditor) {
			//var funList = getLuaFunctionList();
			var funMap = getFunListEx();
			if (funMap) {
				var funList = MapToList(funMap);
				window.showQuickPick(funList).then(function (selected) {
					if(selected){
						if (funMap.has(selected)) {
							var it = funMap.get(selected);
							goToLine(it);
						}
					}
				});
			}
			
			
		}

		//

	}));

	//updateStatus(status);
}

	
function getLuaFunctionList():string[] {
	var re = window.activeTextEditor.document.getText();
	return re.match(/function .*(\w*)/g);
}

function getLuaFunctionLine(list:string[]):any{
	//  把内容  split \n
	//  for 循环寻找 此函数 找到就是这个行数.
	var content = window.activeTextEditor.document.getText().split("\n");
	var retMap = new Map();

	list.forEach(itor => {
		var index = findVecIndex(content,itor.trim());
		if (index != -1) {
			retMap.set(itor.trim(),index)
		}
	});
	return retMap;
}

function findVecIndex(params:string[],data:string):number{
	for (var index = 0; index < params.length; index++) {
		var element = params[index].trim();
		if (element.indexOf(data) >= 0) {
			return index + 1;
		}
	}
	return -1;
}

function goToLine(params:number):void {
	window.activeTextEditor.selection = new Selection(new Position(params - 1,0),new Position(params - 1,0))
	window.activeTextEditor.revealRange(window.activeTextEditor.selection, TextEditorRevealType.InCenter);
}

function getRunTotalTime(oldTime:Date):string {

	var t = new Date();
	var retTime = "";
	var hours = (t.getHours() - oldTime.getHours());
	var minutes = (t.getMinutes() - oldTime.getMinutes());
	var seconds = (t.getSeconds() - oldTime.getSeconds());
	retTime += "$(clock)当前已运行:";

	if (hours > 0) {
		retTime += hours + "小时";
	}
	if (minutes > 0) {
		retTime += minutes + "分钟";
	}
	if (seconds > 0) {
		retTime += seconds + "秒";
	}
	
	return retTime;
}

function updateStatus(status: StatusBarItem): void {
	let text = getSelectedLines();
	if (text) {
		status.text = '$(search) ' + text;
	}

	if (text) {
		status.show();
	} else {
		status.hide();
	}
}

function getSelectedLines(): string {
	const editor = window.activeTextEditor;
	let text: string;

	if (editor) {
		let lines = 0;
		editor.selections.forEach(selection => {
			lines += (selection.end.line - selection.start.line + 1);
		});
		

		if (lines > 0) {
			text = `${lines} line(s) selected`;
		}
	}

	return text;
}

function getFunListEx():any {
	var retMap = new Map();

	if (window.activeTextEditor) {
		var edit = window.activeTextEditor;
		var maxLine = edit.document.lineCount;
		
		for (var index = 0; index < maxLine; index++) {
			var element = edit.document.lineAt(index).text;
			var funlist = element.match(/function .*(\w*)/g);
			if (funlist) {
				retMap.set(funlist[0],index + 1);
			}
		}
	}

	return retMap;
}

function MapToList(params:any):string[] {
	var array:any[]=[];
	params.forEach((key,value) => {
		array.push(value)
	});
	return array;
}
