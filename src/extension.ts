/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import { 
	ExtensionContext, 
	StatusBarAlignment, 
	window, StatusBarItem, 
	Selection, 
	workspace, 
	TextEditor, 
	TextDocument,
	SnippetString,
	commands,
	Position ,
	TextEditorRevealType 
} from 'vscode';

//import vscode = require('vscode');

export function activate(context: ExtensionContext) {
	const status = window.createStatusBarItem(StatusBarAlignment.Right, 100);
	status.command = 'extension.searchLuaFun';
	status.text = '$(search)' + "搜索Lua函数";
	status.show()
	context.subscriptions.push(status);

	const statusTime = window.createStatusBarItem(StatusBarAlignment.Left, 300);
	statusTime.show()
	context.subscriptions.push(statusTime);
	

	//  创建  setXX getXX 模板 .
	const statusCreateSetGetTemplate = window.createStatusBarItem(StatusBarAlignment.Right, 300);
	statusCreateSetGetTemplate.command = 'extension.createTemplate';
	statusCreateSetGetTemplate.text = '$(rocket)' + "智能创建模板";
	statusCreateSetGetTemplate.show()
	context.subscriptions.push(statusCreateSetGetTemplate);



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



	context.subscriptions.push(commands.registerCommand('extension.createTemplate', () => {
		var language = window.activeTextEditor.document.languageId;
		if (language != "lua") {
			return window.showErrorMessage("当前还未支持此语言 请等待更新加入!");
		}

		showInputBox("请输入变量前缀(_ or m or m_) 变量此值不可为空,否则无法定位.", "_").then(function (prefix){
			if (prefix == "") {
				return window.showErrorMessage("错误此值不可为空,否则无法准确定位成员变量.");
			}else{

				showInputBox("是否需要首字母大写.(true or false)", "true").then(function(value){
					var upper = false;
					if (value == "true") {
						upper = true;
					}else if(value == "false"){
						upper = false;
					}else{
						return window.showErrorMessage("错误请准确输入true or false.");
					}
					showInputBox("请输入类名(可为空 为空则)","").then(function(classname){
						showInputBox("请输入此类当前是否为全局或数据结构类型.(true or false)","false").then(function(global){
							var bglobal = false;
							if (global == "") {
								return window.showErrorMessage("错误请准确输入true or false.");
							}else{
								bglobal = (global == "true" ? true:false);
							}
							
							

							var maxLine = window.activeTextEditor.document.lineCount;
							goToLine(maxLine);
							window.activeTextEditor.insertSnippet(new SnippetString(createTemplateSetAndget(
								getMemberVariant(".",prefix),
								classname,
								prefix,
								".",
								upper,
								bglobal
							)));

							
						});
					});
				});

			}
		});



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

// 1 变量链接方式 . ? ->
function getMemberVariant(linkWay:string,prefix:string) {
	var re = window.activeTextEditor.document.getText();
	console.log(re.match(RegExp(linkWay + prefix + "(.*?)\\s+",'g')));
	return re.match(RegExp(linkWay + prefix + "(.*?)\\s+",'g'));
}

function createTemplateSetAndget(
variantArray:any,
className:string,
prefix:string,
linkWay:string,
iSUpper:any,
iSglobal:any) {
	
	if (variantArray) {
		
		var retText = "\n\n--此代码由VsCode Windgod 插件自动生成 如有些变量不需要可自行删除.\n\n\n";
		var language = window.activeTextEditor.document.languageId;
		var tclassName = "";
		var backupVariant = "";
		variantArray.forEach(element => {
			element = element.trim();
			element = element.replace(linkWay + prefix,"");
			element = element.replace(";","");
			backupVariant = element;
			if (iSUpper) {
				element = element[0].toLocaleUpperCase() + element.substring(1,element.length);
			}

			

			if (language == "lua") {
				if (iSglobal) {
					tclassName = (className == "" ? "self":className);
				}else{
					tclassName = "self";
				}
				//  set
				retText += "--  set" + element + "()\nfunction " + 
				(className == ""?"":className + ":") + "set" + element + "(element)\n\t" + tclassName + linkWay + prefix + backupVariant + " = element;" + "\nend\n\n";
				
				retText += "--  get" + element + "()\nfunction " + 
				(className == ""?"":className + ":") + "get" + element + "()\n\treturn " + tclassName + linkWay + prefix + backupVariant + ";\nend\n\n";

			}


		});

		return retText;
	}
	return "";
}

function showInputBox(hintText:string,defaultv:string) {
	return window.showInputBox({ prompt: hintText, value: defaultv })
}